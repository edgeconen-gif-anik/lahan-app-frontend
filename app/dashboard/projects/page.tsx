"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileUp,
  FolderKanban,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectStatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/table-skeleton";
import { useContracts } from "@/hooks/contract/useContracts";
import { useProjects } from "@/hooks/project/useProjects";
import { Project } from "@/lib/schema";
import {
  deriveProjectStatusFromContracts,
  type ProjectStatus,
} from "@/lib/project-status";
import { projectService } from "@/services/project/projectService";
import { useFiscalYears, useSystemSetup } from "@/hooks/setup/useSetup";

type SortColumn = "sNo" | "name" | "allocatedBudget" | "createdAt";

function highlightMatch(text: string, query: string) {
  const term = query.trim();
  if (!term) return text;

  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/40">
        {text.slice(index, index + term.length)}
      </mark>
      {text.slice(index + term.length)}
    </>
  );
}

type ImportRowError = {
  row: number;
  issues?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

type ImportReport = {
  fileName: string;
  inserted: number;
  skipped: number;
  failed: number;
  errors: ImportRowError[];
  requestError?: string;
};

function describeRowError(error: ImportRowError) {
  const problems: { field: string; message: string }[] = [];

  for (const [field, messages] of Object.entries(
    error.issues?.fieldErrors ?? {},
  )) {
    for (const message of messages ?? []) {
      problems.push({ field, message });
    }
  }
  for (const message of error.issues?.formErrors ?? []) {
    problems.push({ field: "Row", message });
  }

  return problems.length > 0
    ? problems
    : [{ field: "Row", message: "Invalid data" }];
}

function getRequestErrorMessage(error: unknown) {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  return message ?? "Could not upload the file. Please check your connection and try again.";
}

type DisplayProject = Project & {
  contractCount: number;
  displayStatus: ProjectStatus;
};

export default function ProjectLandingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
    session?.user?.role ?? "",
  );

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortColumn>("sNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { data: setup } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();

  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const effectiveFiscalYear =
    fiscalYearFilter ?? setup?.currentFiscalYear ?? "";

  const { data, isLoading } = useProjects({
    page,
    limit,
    search: debouncedSearch || undefined,
    fiscalYear: effectiveFiscalYear || undefined,
    status: (statusFilter || undefined) as ProjectStatus | undefined,
    sortBy,
    sortOrder,
  });
  const { data: contracts = [] } = useContracts({
    fiscalYear: effectiveFiscalYear || undefined,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportReport(null);

    try {
      const res = await projectService.importCsv(file);
      const report: ImportReport = {
        fileName: file.name,
        inserted: res.inserted ?? 0,
        skipped: res.skipped ?? 0,
        failed: res.failed ?? 0,
        errors: res.errors ?? [],
      };

      if (report.failed > 0 || report.skipped > 0) {
        setImportReport(report);
      }

      if (report.failed > 0) {
        toast.warning(
          `Imported ${report.inserted}, but ${report.failed} row${
            report.failed > 1 ? "s" : ""
          } failed. See details below.`,
        );
      } else {
        toast.success(`Imported ${report.inserted} projects successfully!`);
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      const requestError = getRequestErrorMessage(error);
      setImportReport({
        fileName: file.name,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        requestError,
      });
      toast.error("CSV import failed. See details below.");
    } finally {
      e.target.value = "";
    }
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    Boolean(statusFilter) ||
    (fiscalYearFilter !== null && fiscalYearFilter !== setup?.currentFiscalYear);

  const resetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setFiscalYearFilter(null);
    setPage(1);
  };

  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / limit) : 1;

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setPage(1);
  };

  const handleRowClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) {
      return (
        <ArrowUpDown size={14} className="ml-1 text-muted-foreground/50" />
      );
    }

    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-primary" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-primary" />
    );
  };

  const contractsByProjectId = new Map<string, typeof contracts>();
  for (const contract of contracts) {
    const relatedContracts = contractsByProjectId.get(contract.projectId) ?? [];
    relatedContracts.push(contract);
    contractsByProjectId.set(contract.projectId, relatedContracts);
  }

  const displayedProjects: DisplayProject[] = (data?.data ?? [])
    .map((project: Project) => {
      const relatedContracts = contractsByProjectId.get(project.id) ?? [];
      const displayStatus: ProjectStatus =
        relatedContracts.length > 0
          ? deriveProjectStatusFromContracts(relatedContracts)
          : project.status;

      return {
        ...project,
        contractCount: relatedContracts.length,
        displayStatus,
      };
    });

  const ongoingCount = displayedProjects.filter(
    (project) => project.displayStatus === "ONGOING",
  ).length;
  const completedCount = displayedProjects.filter(
    (project) => project.displayStatus === "COMPLETED",
  ).length;
  const archivedCount = displayedProjects.filter(
    (project) => project.displayStatus === "ARCHIVED",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition">
              <FileUp size={18} />
              <span>Upload CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              <Plus size={18} />
              Create Project
            </Link>
          </div>
        ) : null}
      </div>

      {importReport ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {importReport.requestError
                    ? `"${importReport.fileName}" was not imported`
                    : `Import of "${importReport.fileName}" finished with issues`}
                </p>
                {importReport.requestError ? (
                  <p>{importReport.requestError}</p>
                ) : (
                  <p>
                    Imported: {importReport.inserted} · Skipped (S.No already
                    exists for that fiscal year): {importReport.skipped} ·
                    Failed: {importReport.failed}
                  </p>
                )}
                {importReport.failed > 0 ? (
                  <p>
                    Fix the rows below in your CSV and upload the file again.
                    Rows already imported are skipped automatically.
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss import report"
              onClick={() => setImportReport(null)}
              className="rounded p-1 hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>

          {importReport.errors.length > 0 ? (
            <div className="mt-3 max-h-72 overflow-auto rounded-md border border-amber-200 bg-background text-foreground">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-2 font-medium">CSV line</th>
                    <th className="p-2 font-medium">Column</th>
                    <th className="p-2 font-medium">Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {importReport.errors.flatMap((error) =>
                    describeRowError(error).map((problem, index) => (
                      <tr
                        key={`${error.row}-${problem.field}-${index}`}
                        className="border-t"
                      >
                        <td className="p-2 font-mono">{error.row + 1}</td>
                        <td className="p-2 font-mono">{problem.field}</td>
                        <td className="p-2">{problem.message}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="text-2xl font-bold mt-1">{data?.meta?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Showing {displayedProjects.length} on this page
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ongoing (this page)</p>
          <p className="text-2xl font-bold mt-1 text-blue-700">
            {ongoingCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Completed: {completedCount} · Archived: {archivedCount}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Contracted (this page)</p>
          <p className="text-2xl font-bold mt-1">
            {
              displayedProjects.filter((project) => project.contractCount > 0)
                .length
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Live status comes from related contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-card p-4 rounded-lg border">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            aria-label="Search projects"
            placeholder="Search by project name or S.No..."
            className="w-full pl-10 pr-9 py-2 border rounded-md"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
                setPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <select
          aria-label="Fiscal year"
          className="border rounded-md px-3 py-2 bg-background"
          value={effectiveFiscalYear}
          onChange={(e) => {
            setFiscalYearFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Fiscal Years</option>
          {fiscalYears.map((year) => (
            <option key={year} value={year}>
              {year}
              {year === setup?.currentFiscalYear ? " (Current)" : ""}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className="border rounded-md px-3 py-2 bg-background"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Filter size={16} />
            {data?.meta?.total ?? 0} result{data?.meta?.total === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-muted"
            >
              <RotateCcw size={14} /> Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card flex flex-col">
        <div className="md:hidden divide-y">
          {isLoading ? (
            <TableSkeleton rows={5} columns={2} />
          ) : displayedProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description={
                debouncedSearch
                  ? `No projects match "${debouncedSearch}". Try a different name or S.No.`
                  : "Try changing the fiscal year or status filter."
              }
            />
          ) : (
            displayedProjects.map((project) => (
              <div
                key={project.id}
                className="space-y-3 p-4 active:bg-muted/30"
                onClick={() => handleRowClick(project.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-primary">
                      S.No:{" "}
                      {project.sNo
                        ? highlightMatch(project.sNo, debouncedSearch)
                        : "-"}
                    </p>
                    <p className="font-semibold break-words">
                      {highlightMatch(project.name, debouncedSearch)}
                    </p>
                  </div>
                  <ProjectStatusBadge status={project.displayStatus} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Budget Code</dt>
                  <dd className="font-mono text-right">
                    {project.budgetCode || "-"}
                  </dd>
                  <dt className="text-muted-foreground">Fiscal Year</dt>
                  <dd className="text-right">{project.fiscalYear}</dd>
                  <dt className="text-muted-foreground">Total Budget</dt>
                  <dd className="text-right">
                    Rs. {Number(project.allocatedBudget ?? 0).toLocaleString()}
                  </dd>
                  <dt className="text-muted-foreground">Contracts</dt>
                  <dd className="text-right">{project.contractCount}</dd>
                </dl>
                <div
                  className="flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <Eye size={16} /> View
                  </Link>
                  {isAdmin ? (
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      <Pencil size={16} /> Edit
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th
                  className="p-4 font-medium w-20 cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("sNo")}
                >
                  <div className="flex items-center">
                    S. No. {getSortIcon("sNo")}
                  </div>
                </th>
                <th
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Project Name {getSortIcon("name")}
                  </div>
                </th>
                <th className="p-4 font-medium">Budget Code</th>
                <th className="p-4 font-medium">Fiscal Year</th>
                <th
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("allocatedBudget")}
                >
                  <div className="flex items-center">
                    Total Budget {getSortIcon("allocatedBudget")}
                  </div>
                </th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={6} columns={6} />
                  </td>
                </tr>
              ) : displayedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={FolderKanban}
                      title="No projects found"
                      description={
                        debouncedSearch
                          ? `No projects match "${debouncedSearch}". Try a different name or S.No.`
                          : "Try changing the fiscal year or status filter."
                      }
                    />
                  </td>
                </tr>
              ) : (
                displayedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none transition cursor-pointer"
                    tabIndex={0}
                    onClick={() => handleRowClick(project.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && e.key === "Enter") {
                        handleRowClick(project.id);
                      }
                    }}
                  >
                    <td className="p-4 text-sm font-bold text-primary">
                      {project.sNo ? highlightMatch(project.sNo, debouncedSearch) : "-"}
                    </td>
                    <td className="p-4 font-semibold whitespace-normal min-w-[250px]">
                      <div className="space-y-1">
                        <div>{highlightMatch(project.name, debouncedSearch)}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {project.contractCount > 0
                            ? `${project.contractCount} contract${
                                project.contractCount > 1 ? "s" : ""
                              }`
                            : "No contracts yet"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono">
                      {project.budgetCode || "-"}
                    </td>
                    <td className="p-4 text-sm">{project.fiscalYear}</td>
                    <td className="p-4 text-sm">
                      Rs. {Number(project.allocatedBudget ?? 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <ProjectStatusBadge status={project.displayStatus} />
                    </td>
                    <td
                      className="p-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="inline-flex items-center p-2 hover:bg-muted rounded-full"
                        title="View project"
                        aria-label="View project"
                      >
                        <Eye size={18} />
                      </Link>
                      {isAdmin ? (
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="inline-flex items-center p-2 hover:bg-muted rounded-full"
                          title="Edit project"
                          aria-label="Edit project"
                        >
                          <Pencil size={18} />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (data?.meta?.total || 0) > limit && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <button
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
