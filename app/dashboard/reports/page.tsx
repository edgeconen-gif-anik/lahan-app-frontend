"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CircleDollarSign,
  Download,
  FileBarChart2,
  FileSignature,
  FolderKanban,
  Printer,
  Search,
  Users,
} from "lucide-react";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_ORDER,
  ContractStatusBadge,
} from "@/components/contract-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReportData } from "@/hooks/report/useReports";
import { useFiscalYears, useSystemSetup } from "@/hooks/setup/useSetup";
import { downloadCsv } from "@/lib/report-export";
import type { Project } from "@/lib/schema";
import type { Company } from "@/lib/schema/company.schema";
import type { Contract, ContractStatus } from "@/lib/schema/contract/contract";
import { toNepaliDate } from "@/lib/date-utils";
import {
  deriveProjectStatusFromContracts,
} from "@/lib/project-status";
import type {
  CommitteeOfficial,
  UserCommitteeRecord,
} from "@/services/user-committe/userCommittee.service";

type ReportKey = "companies" | "committees" | "contracts" | "projects";
type ReportValue = string | number;

type ReportColumn = {
  key: string;
  label: string;
  align?: "right" | "center";
};

type ReportRow = {
  id: string;
  href?: string;
  values: Record<string, ReportValue>;
};

type ReportSection = {
  key: ReportKey;
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  filename: string;
  icon: typeof Building2;
};

const DASH = "-";

const PROJECT_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_COMMITTEES: UserCommitteeRecord[] = [];
const EMPTY_CONTRACTS: Contract[] = [];
const EMPTY_PROJECTS: Project[] = [];

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return DASH;
  return String(value);
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatDate(value?: string | Date | null) {
  if (!value) return DASH;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;

  return date.toLocaleDateString("en-CA");
}

function formatBsDate(value?: string | Date | null) {
  if (!value) return DASH;

  const date = toNepaliDate(value);
  return date === "N/A" || date === "Invalid Date" ? DASH : date;
}

function formatAmount(value?: number | string | null) {
  const amount = Number(value ?? 0);

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatMoney(value?: number | string | null) {
  return `Rs. ${formatAmount(value)}`;
}

function getOfficial(
  officials: CommitteeOfficial[] | undefined,
  role: CommitteeOfficial["role"],
) {
  return officials?.find((official) => official.role === role);
}

function officialText(
  officials: CommitteeOfficial[] | undefined,
  role: CommitteeOfficial["role"],
) {
  const official = getOfficial(officials, role);
  if (!official) return DASH;

  return [official.name, official.phoneNumber].filter(Boolean).join(" / ");
}

function buildSearchText(row: ReportRow) {
  return Object.values(row.values).join(" ").toLowerCase();
}

function toCsvRows(section: ReportSection, rows: ReportRow[]) {
  return rows.map((row) =>
    Object.fromEntries(
      section.columns.map((column) => [
        column.label,
        row.values[column.key] ?? "",
      ]),
    ),
  );
}

function reportFilename(base: string, fiscalYear: string) {
  const scope = fiscalYear ? fiscalYear.replace(/[^\dA-Za-z-]/g, "-") : "all-years";
  const date = new Date().toISOString().slice(0, 10);

  return `${base}-${scope}-${date}.csv`;
}

function buildCompanyRows(
  companies: Company[],
  contracts: Contract[],
): ReportRow[] {
  const contractCountsByCompany = new Map<string, number>();

  contracts.forEach((contract) => {
    if (!contract.companyId) return;

    contractCountsByCompany.set(
      contract.companyId,
      (contractCountsByCompany.get(contract.companyId) ?? 0) + 1,
    );
  });

  return companies.map((company, index) => {
    const contractCount = contractCountsByCompany.get(company.id) ?? 0;

    return {
      id: company.id,
      href: `/dashboard/companies/${company.id}`,
      values: {
        sn: index + 1,
        name: text(company.name),
        panNumber: text(company.panNumber),
        category: text(company.category),
        address: text(company.address),
        contactPerson: text(company.contactPerson),
        phoneNumber: text(company.phoneNumber),
        email: text(company.email),
        registrationRequestDate: formatDate(company.registrationRequestDate),
        registrationDate: formatDate(company.registrationDate),
        approvalStatus: text(company.approvalStatus),
        contracted: yesNo(company.isContracted || contractCount > 0),
        contractCount,
        voucherNo: text(company.voucherNo),
        remarks: text(company.remarks),
      },
    };
  });
}

function buildCommitteeRows(committees: UserCommitteeRecord[]): ReportRow[] {
  return committees.map((committee, index) => ({
    id: committee.id,
    href: `/dashboard/committees/${committee.id}`,
    values: {
      sn: index + 1,
      name: text(committee.name),
      fiscalYear: text(committee.fiscalYear),
      address: text(committee.address),
      formedDate: formatBsDate(committee.formedDate),
      president: officialText(committee.officials, "PRESIDENT"),
      secretary: officialText(committee.officials, "SECRETARY"),
      treasurer: officialText(committee.officials, "TREASURER"),
      memberCount: committee.officials?.length ?? 0,
      bankName: text(committee.bankName),
      accountNumber: text(committee.accountNumber),
      approvalStatus: text(committee.approvalStatus),
      approvedAt: formatDate(committee.approvedAt),
    },
  }));
}

function getContractImplementor(contract: Contract) {
  if (contract.company) {
    return {
      type: "Company",
      name: contract.company.name,
    };
  }

  if (contract.userCommittee) {
    return {
      type: "User Committee",
      name: contract.userCommittee.name,
    };
  }

  return {
    type: DASH,
    name: DASH,
  };
}

function buildContractRows(contracts: Contract[]): ReportRow[] {
  return contracts.map((contract, index) => {
    const implementor = getContractImplementor(contract);
    const siteIncharge =
      contract.siteIncharge?.name ?? contract.project?.siteIncharge?.name ?? DASH;

    return {
      id: contract.id,
      href: `/dashboard/contracts/${contract.id}`,
      values: {
        sn: index + 1,
        contractNumber: text(contract.contractNumber),
        fiscalYear: text(contract.fiscalYear ?? contract.project?.fiscalYear),
        project: text(contract.project?.name),
        projectSNo: text(contract.project?.sNo),
        implementorType: implementor.type,
        implementorName: text(implementor.name),
        status: CONTRACT_STATUS_LABEL[contract.status],
        approvalStatus: text(contract.approvalStatus),
        contractAmount: formatMoney(contract.contractAmount),
        finalEvaluatedAmount: contract.finalEvaluatedAmount
          ? formatMoney(contract.finalEvaluatedAmount)
          : DASH,
        startDate: formatBsDate(contract.startDate),
        intendedCompletionDate: formatBsDate(contract.intendedCompletionDate),
        actualCompletionDate: formatBsDate(contract.actualCompletionDate),
        siteIncharge: text(siteIncharge),
        agreement: yesNo(Boolean(contract.agreement)),
        workOrder: yesNo(Boolean(contract.workOrder)),
        completionCode: text(contract.completionCode),
      },
    };
  });
}

function buildProjectRows(input: {
  projects: Project[];
  contracts: Contract[];
}): ReportRow[] {
  const contractsByProject = new Map<string, Contract[]>();

  input.contracts.forEach((contract) => {
    const projectContracts = contractsByProject.get(contract.projectId) ?? [];
    projectContracts.push(contract);
    contractsByProject.set(contract.projectId, projectContracts);
  });

  return input.projects.map((project, index) => {
    const projectContracts = contractsByProject.get(project.id) ?? [];
    const displayStatus =
      projectContracts.length > 0
        ? deriveProjectStatusFromContracts(projectContracts)
        : project.status;
    const implementor =
      project.company?.name ?? project.userCommittee?.name ?? DASH;
    const implementationType =
      project.implantedThrough === "COMP"
        ? "Company"
        : project.implantedThrough === "USER_COMMITTEE"
          ? "User Committee"
          : DASH;
    const contractValue = projectContracts.reduce(
      (sum, contract) => sum + Number(contract.contractAmount ?? 0),
      0,
    );

    return {
      id: project.id,
      href: `/dashboard/projects/${project.id}`,
      values: {
        sn: index + 1,
        sNo: text(project.sNo),
        name: text(project.name),
        type: text(project.type),
        budgetCode: text(project.budgetCode),
        fiscalYear: text(project.fiscalYear),
        source: text(project.source),
        allocatedBudget: formatMoney(project.allocatedBudget),
        internalBudget: formatMoney(project.internalBudget),
        centralBudget: formatMoney(project.centralBudget),
        provinceBudget: formatMoney(project.provinceBudget),
        status:
          PROJECT_STATUS_LABEL[displayStatus] ??
          text(displayStatus),
        implementationType,
        implementor: text(implementor),
        siteIncharge: text(project.siteIncharge?.name),
        contractCount: projectContracts.length,
        contractValue: formatMoney(contractValue),
      },
    };
  });
}

function StatusCell({ value }: { value: ReportValue }) {
  const status = String(value);

  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    return <ApprovalStatusBadge status={status} />;
  }

  const contractStatus = CONTRACT_STATUS_ORDER.find(
    (candidate) => CONTRACT_STATUS_LABEL[candidate] === status,
  );

  if (contractStatus) {
    return <ContractStatusBadge status={contractStatus as ContractStatus} compact />;
  }

  if (status === "Completed") {
    return <Badge className="bg-emerald-100 text-emerald-800">{status}</Badge>;
  }

  if (status === "Ongoing") {
    return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
  }

  if (status === "Archived") {
    return <Badge className="bg-zinc-100 text-zinc-800">{status}</Badge>;
  }

  if (status === "Not Started") {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return <>{status}</>;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Building2;
  accent: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportKey>("companies");
  const [search, setSearch] = useState("");
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string | null>(null);
  const { data: setup } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const effectiveFiscalYear = fiscalYearFilter ?? setup?.currentFiscalYear ?? "";
  const { data, isLoading, isError } = useReportData(
    effectiveFiscalYear || undefined,
  );

  const companies = data?.companies ?? EMPTY_COMPANIES;
  const committees = data?.committees ?? EMPTY_COMMITTEES;
  const contracts = data?.contracts ?? EMPTY_CONTRACTS;
  const projects = data?.projects ?? EMPTY_PROJECTS;

  const sections = useMemo<ReportSection[]>(() => {
    return [
      {
        key: "companies",
        title: "Registered Companies",
        description: "Company registry with contacts, PAN, approval, and contract usage.",
        filename: "registered-companies",
        icon: Building2,
        columns: [
          { key: "sn", label: "S.No", align: "center" },
          { key: "name", label: "Company" },
          { key: "panNumber", label: "PAN" },
          { key: "category", label: "Category" },
          { key: "address", label: "Address" },
          { key: "contactPerson", label: "Contact Person" },
          { key: "phoneNumber", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "registrationRequestDate", label: "Request Date" },
          { key: "registrationDate", label: "Registration Date" },
          { key: "approvalStatus", label: "Approval" },
          { key: "contracted", label: "Contracted", align: "center" },
          { key: "contractCount", label: "Contracts", align: "right" },
          { key: "voucherNo", label: "Voucher No." },
          { key: "remarks", label: "Remarks" },
        ],
        rows: buildCompanyRows(companies, contracts),
      },
      {
        key: "committees",
        title: "User Committees",
        description: "Committee registration, officials, banking, and approval details.",
        filename: "user-committees",
        icon: Users,
        columns: [
          { key: "sn", label: "S.No", align: "center" },
          { key: "name", label: "Committee" },
          { key: "fiscalYear", label: "Fiscal Year" },
          { key: "address", label: "Address" },
          { key: "formedDate", label: "Formed Date (BS)" },
          { key: "president", label: "President" },
          { key: "secretary", label: "Secretary" },
          { key: "treasurer", label: "Treasurer" },
          { key: "memberCount", label: "Members", align: "right" },
          { key: "bankName", label: "Bank" },
          { key: "accountNumber", label: "Account No." },
          { key: "approvalStatus", label: "Approval" },
          { key: "approvedAt", label: "Approved At" },
        ],
        rows: buildCommitteeRows(committees),
      },
      {
        key: "contracts",
        title: "Contract Details",
        description: "Contract milestones, amounts, implementors, and document readiness.",
        filename: "contract-details",
        icon: FileSignature,
        columns: [
          { key: "sn", label: "S.No", align: "center" },
          { key: "contractNumber", label: "Contract No." },
          { key: "fiscalYear", label: "Fiscal Year" },
          { key: "project", label: "Project" },
          { key: "projectSNo", label: "Project S.No" },
          { key: "implementorType", label: "Implementor Type" },
          { key: "implementorName", label: "Implementor" },
          { key: "status", label: "Milestone" },
          { key: "approvalStatus", label: "Approval" },
          { key: "contractAmount", label: "Contract Amount", align: "right" },
          { key: "finalEvaluatedAmount", label: "Final Amount", align: "right" },
          { key: "startDate", label: "Start Date (BS)" },
          { key: "intendedCompletionDate", label: "Intended End (BS)" },
          { key: "actualCompletionDate", label: "Actual End (BS)" },
          { key: "siteIncharge", label: "Site Incharge" },
          { key: "agreement", label: "Agreement", align: "center" },
          { key: "workOrder", label: "Work Order", align: "center" },
          { key: "completionCode", label: "Completion Code" },
        ],
        rows: buildContractRows(contracts),
      },
      {
        key: "projects",
        title: "Project Management",
        description: "Project budgets, implementation mode, contract count, and live status.",
        filename: "project-management",
        icon: FolderKanban,
        columns: [
          { key: "sn", label: "S.No", align: "center" },
          { key: "sNo", label: "Project S.No" },
          { key: "name", label: "Project" },
          { key: "type", label: "Type" },
          { key: "budgetCode", label: "Budget Code" },
          { key: "fiscalYear", label: "Fiscal Year" },
          { key: "source", label: "Source" },
          { key: "allocatedBudget", label: "Allocated Budget", align: "right" },
          { key: "internalBudget", label: "Internal Budget", align: "right" },
          { key: "centralBudget", label: "Central Budget", align: "right" },
          { key: "provinceBudget", label: "Province Budget", align: "right" },
          { key: "status", label: "Status" },
          { key: "implementationType", label: "Implementation" },
          { key: "implementor", label: "Implementor" },
          { key: "siteIncharge", label: "Site Incharge" },
          { key: "contractCount", label: "Contracts", align: "right" },
          { key: "contractValue", label: "Contract Value", align: "right" },
        ],
        rows: buildProjectRows({ projects, contracts }),
      },
    ];
  }, [companies, committees, contracts, projects]);

  const activeSection =
    sections.find((section) => section.key === activeReport) ?? sections[0];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return activeSection.rows;

    return activeSection.rows.filter((row) =>
      buildSearchText(row).includes(normalizedSearch),
    );
  }, [activeSection, normalizedSearch]);

  const totalContractValue = contracts.reduce(
    (sum, contract) => sum + Number(contract.contractAmount ?? 0),
    0,
  );
  const pendingApprovals =
    companies.filter((company) => company.approvalStatus === "PENDING").length +
    committees.filter((committee) => committee.approvalStatus === "PENDING").length +
    contracts.filter((contract) => contract.approvalStatus === "PENDING").length;

  const handleDownloadActive = () => {
    downloadCsv(
      reportFilename(activeSection.filename, effectiveFiscalYear),
      toCsvRows(activeSection, filteredRows),
    );
  };

  const handleDownloadAll = () => {
    sections.forEach((section, index) => {
      if (section.rows.length === 0) return;

      window.setTimeout(() => {
        downloadCsv(
          reportFilename(section.filename, effectiveFiscalYear),
          toCsvRows(section, section.rows),
        );
      }, index * 250);
    });
  };

  return (
    <div className="space-y-6 p-6">
      <style jsx global>{`
        @media print {
          aside,
          header,
          .report-actions,
          .report-controls,
          .report-tabs {
            display: none !important;
          }

          main {
            padding: 0 !important;
            overflow: visible !important;
          }

          body {
            background: #fff !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileBarChart2 className="h-4 w-4" />
            Report Module
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registry and project management records for the selected fiscal year.
          </p>
        </div>

        <div className="report-actions flex flex-col gap-2 sm:flex-row">
          <select
            value={effectiveFiscalYear}
            onChange={(event) => setFiscalYearFilter(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Fiscal Years</option>
            {fiscalYears.map((year) => (
              <option key={year} value={year}>
                {year}
                {year === setup?.currentFiscalYear ? " (Current)" : ""}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadAll}
            disabled={isLoading || sections.every((section) => section.rows.length === 0)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
          <Button
            type="button"
            onClick={handleDownloadActive}
            disabled={isLoading || filteredRows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Companies"
          value={companies.length}
          icon={Building2}
          accent="text-blue-600"
        />
        <SummaryCard
          label="Committees"
          value={committees.length}
          icon={Users}
          accent="text-amber-600"
        />
        <SummaryCard
          label="Projects"
          value={projects.length}
          icon={FolderKanban}
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Contract Value"
          value={formatMoney(totalContractValue)}
          icon={CircleDollarSign}
          accent="text-violet-600"
        />
        <SummaryCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={FileSignature}
          accent="text-rose-600"
        />
      </div>

      <div className="report-tabs grid gap-2 rounded-lg border bg-card p-2 md:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeReport === section.key;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveReport(section.key)}
              className={`flex items-center justify-between rounded-md px-3 py-3 text-left text-sm transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">{section.title}</span>
              </span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-white/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {section.rows.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="report-controls grid gap-3 rounded-lg border bg-card p-4 lg:grid-cols-[minmax(0,1fr),auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${activeSection.title.toLowerCase()}`}
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
          Showing {filteredRows.length} of {activeSection.rows.length}
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeSection.title}</h2>
              <p className="text-sm text-muted-foreground">
                {activeSection.description}
              </p>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Scope: {effectiveFiscalYear ? `FY ${effectiveFiscalYear}` : "All fiscal years"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow>
                {activeSection.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`whitespace-nowrap ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : ""
                    }`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {activeSection.columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={activeSection.columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Unable to load reports.
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeSection.columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    {activeSection.columns.map((column) => {
                      const value = row.values[column.key] ?? DASH;
                      const isStatusColumn =
                        column.key === "status" || column.key === "approvalStatus";

                      return (
                        <TableCell
                          key={column.key}
                          className={`whitespace-nowrap ${
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : ""
                          } ${
                            column.key === "name" ||
                            column.key === "project" ||
                            column.key === "contractNumber"
                              ? "font-medium"
                              : ""
                          }`}
                        >
                          {isStatusColumn ? (
                            <StatusCell value={value} />
                          ) : column.key === "name" && row.href ? (
                            <Link href={row.href} className="text-primary hover:underline">
                              {value}
                            </Link>
                          ) : column.key === "contractNumber" && row.href ? (
                            <Link href={row.href} className="text-primary hover:underline">
                              {value}
                            </Link>
                          ) : (
                            value
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
