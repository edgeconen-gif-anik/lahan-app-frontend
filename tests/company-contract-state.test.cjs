/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Run the real TypeScript service with a mocked HTTP boundary, without Next/auth.
function createServices(responses) {
  const root = path.resolve(__dirname, "..");
  const cache = new Map();
  const requests = [];
  const api = { get: async (url, options) => {
    requests.push({ url, ...options });
    if (typeof responses === "function") return { data: await responses(url, options) };
    assert.ok(responses.length, "Unexpected additional API request");
    return { data: responses.shift() };
  } };
  function load(file) {
    if (file === path.join(root, "lib/api.ts")) return { default: api };
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = (name) => {
      if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
      const target = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(target + ".ts");
    };
    vm.runInThisContext("(function(require,module,exports){" + code + "\n})", { filename: file })(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return {
    ...load(path.join(root, "services/company/company.service.ts")),
    ...load(path.join(root, "lib/schema/company.schema.ts")),
    ...load(path.join(root, "lib/legacy-list-pages.ts")),
    ...load(path.join(root, "lib/company-query-invalidation.ts")),
    ...load(path.join(root, "services/report/report.service.ts")),
    requests,
  };
}

const companies = [
  { id: "a", name: "Alpha", approvalStatus: "APPROVED", isContracted: false, createdAt: "2026-01-01" },
  { id: "b", name: "Beta", approvalStatus: "APPROVED", isContracted: false, _count: { contracts: 1 }, createdAt: "2026-02-01" },
  { id: "c", name: "Pending", approvalStatus: "PENDING", isContracted: false, createdAt: "2026-03-01" },
];
const contracts = [
  { companyId: "a", approvalStatus: "APPROVED", status: "WORKINPROGRESS" },
  { companyId: "b", approvalStatus: "PENDING" },
  { companyId: "b", approvalStatus: "REJECTED" },
];

test("legacy company rows derive engagement from approved contracts in one bulk request", async () => {
  const { companyService, requests } = createServices([companies, contracts]);
  const page = await companyService.getPage({ fiscalYear: "2083/84", page: 1 });
  assert.equal(page.data.find(row => row.id === "a").hasApprovedContract, true);
  assert.equal(page.data.find(row => row.id === "b").hasApprovedContract, false);
  assert.deepEqual(page.counts, { total: 3, pending: 1, contracted: 1, nonContracted: 1 });
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1], { url: "/contracts", params: { fiscalYear: "all", approvalStatus: "APPROVED" } });
});

test("legacy quick views match their summary counts and preserve fiscal scope", async () => {
  const { companyService, requests } = createServices([companies.slice(0, 2), companies, contracts]);
  const page = await companyService.getPage({ page: 1, fiscalYear: "2083/84", approvalStatus: "APPROVED", contracted: "CONTRACTED" });
  assert.deepEqual(page.data.map(row => row.id), ["a"]);
  assert.equal(page.counts.pending, 1);
  assert.equal(requests[1].params.fiscalYear, "2083/84");
  assert.equal(requests[1].params.approvalStatus, undefined);
});

test("current paged responses need no extra contract request", async () => {
  const payload = { data: [{ ...companies[0], hasApprovedContract: true }], meta: { total: 1, page: 1, limit: 20, lastPage: 1 }, counts: { total: 1 } };
  const { companyService, requests } = createServices([payload]);
  assert.equal(await companyService.getPage({ page: 1 }), payload);
  assert.equal(requests.length, 1);
});

test("current array responses and empty results need no contract lookup", async () => {
  const rows = [{ ...companies[0], approvedContractCount: 1, hasApprovedContract: true }];
  const { companyService, requests } = createServices([rows, []]);
  assert.deepEqual(await companyService.getAll(), rows);
  assert.deepEqual(await companyService.getAll(), []);
  assert.equal(requests.length, 2);
});

test("exports receive derived engagement from legacy arrays", async () => {
  const { companyService, getCompanyIsContracted } = createServices([companies, contracts]);
  const rows = await companyService.getAll({ fiscalYear: "2083/84" });
  assert.equal(getCompanyIsContracted(rows[0]), true);
  assert.equal(getCompanyIsContracted(rows[1]), false);
});

test("shared engagement rule excludes pending counts and retains legacy explicit engagement", () => {
  const { getCompanyIsContracted } = createServices([]);
  assert.equal(getCompanyIsContracted(companies[1]), false);
  assert.equal(getCompanyIsContracted(companies[0], 1), true);
  assert.equal(getCompanyIsContracted({ ...companies[0], isContracted: true }), true);
  assert.equal(getCompanyIsContracted({ ...companies[0], approvedContractCount: 1 }), true);
});

test("legacy pagination clamps stale pages and quick views do not use array indexes as counts", () => {
  const { legacyCompanyPage } = createServices([]);
  const rows = companies.map(company => ({ ...company, hasApprovedContract: company.id === "a" }));
  const result = legacyCompanyPage(rows, { page: 5, limit: 1, approvalStatus: "APPROVED", contracted: "NON_CONTRACTED" });
  assert.deepEqual(result.data.map(row => row.id), ["b"]);
  assert.equal(result.meta.page, 1);
  assert.equal(result.counts.contracted, 1);
  assert.equal(result.counts.nonContracted, 1);
});

test("engagement mutations invalidate company details, reports and dashboards", async () => {
  const { invalidateCompanyViews } = createServices([]);
  const keys = [];
  await invalidateCompanyViews({ invalidateQueries: async ({ queryKey }) => { keys.push(queryKey); } });
  assert.deepEqual(keys, [["companies"], ["reports"], ["dashboard"]]);
});

test("reports fetch every committee page and limit concurrent project requests", async () => {
  let activeProjectRequests = 0;
  let maxProjectRequests = 0;
  const { reportService, requests } = createServices(async (url, options) => {
    if (url === "/companies") return [{ ...companies[0], hasApprovedContract: true }];
    if (url === "/contracts") return contracts;
    if (url === "/user-committees") {
      const page = options.params.page;
      return { data: [{ id: `committee-${page}` }], meta: { total: 2, page, lastPage: 2 } };
    }
    assert.ok(url.startsWith("/projects?"));
    const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
    activeProjectRequests += 1;
    maxProjectRequests = Math.max(maxProjectRequests, activeProjectRequests);
    await new Promise(resolve => setImmediate(resolve));
    activeProjectRequests -= 1;
    return { data: [{ id: `project-${page}` }], meta: { total: 700, page } };
  });
  const result = await reportService.getData({ fiscalYear: "2083/84" });
  assert.equal(result.committees.length, 2);
  assert.equal(result.projects.length, 7);
  assert.ok(maxProjectRequests <= 5);
  assert.equal(requests.filter(request => request.url === "/contracts").length, 1);
});
