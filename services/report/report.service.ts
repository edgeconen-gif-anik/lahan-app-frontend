import { companyService } from "@/services/company/company.service";
import { contractService } from "@/services/contract/contractService";
import { projectService } from "@/services/project/projectService";
import { userCommitteeService } from "@/services/user-committe/userCommittee.service";
import type { Company } from "@/lib/schema/company.schema";
import type { Project, ProjectQueryParams, ProjectResponse } from "@/lib/schema";
import type { Contract } from "@/lib/schema/contract/contract";
import type { UserCommitteeRecord } from "@/services/user-committe/userCommittee.service";

export type ReportData = {
  companies: Company[];
  committees: UserCommitteeRecord[];
  contracts: Contract[];
  projects: Project[];
};

export type ReportDataParams = {
  fiscalYear?: string;
};

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;

    seen.add(item.id);
    return true;
  });
}

async function fetchAllProjects(params: ProjectQueryParams = {}) {
  const limit = 100;
  const firstPage = (await projectService.getAll({
    ...params,
    page: 1,
    limit,
  })) as ProjectResponse;

  const totalPages = Math.max(
    1,
    Math.ceil((firstPage.meta?.total ?? firstPage.data.length) / limit),
  );

  if (totalPages === 1) {
    return uniqueById(firstPage.data);
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      projectService.getAll({
        ...params,
        page: index + 2,
        limit,
      }) as Promise<ProjectResponse>,
    ),
  );

  return uniqueById([
    ...firstPage.data,
    ...remainingPages.flatMap((page) => page.data),
  ]);
}

export const reportService = {
  getData: async ({ fiscalYear }: ReportDataParams = {}): Promise<ReportData> => {
    const scopedParams = fiscalYear ? { fiscalYear } : undefined;

    const [companies, committeesResponse, contracts, projects] =
      await Promise.all([
        companyService.getAll(),
        userCommitteeService.getAll({
          ...(scopedParams ?? {}),
          page: 1,
          limit: 10000,
        }),
        contractService.getAll(scopedParams),
        fetchAllProjects({
          ...(scopedParams ?? {}),
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ]);

    return {
      companies: uniqueById(companies),
      committees: uniqueById(committeesResponse.data),
      contracts: uniqueById(contracts),
      projects: uniqueById(projects),
    };
  },
};
