"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileBadge,
  FileSpreadsheet,
  FileText,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BulkActionBar } from "@/components/data/bulk-action-bar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FilterBar } from "@/components/data/filter-bar";
import { FilterChips } from "@/components/data/filter-chips";
import { Pagination } from "@/components/data/pagination";
import { RowActions, type RowAction } from "@/components/data/row-actions";
import { SearchInput } from "@/components/data/search-input";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RegistrationInitiatorCell } from "@/components/registration-initiator-cell";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApproveCompany,
  useBulkApproveCompanies,
  useCompaniesPage,
  useDeleteCompany,
} from "@/hooks/company/useCompany";
import { getApiErrorMessage } from "@/lib/api-error";
import { useRole } from "@/lib/auth/use-role";
import { useEffectiveFiscalYear } from "@/lib/fiscal-year-context";
import { downloadCsv, downloadXlsx, type CsvRow } from "@/lib/report-export";
import { CompanyCategoryEnum, getCompanyIsContracted } from "@/lib/schema/company.schema";
import { isApprovedStatus } from "@/lib/schema/approval";
import { useUrlParams } from "@/lib/use-url-params";
import { cn } from "@/lib/utils";
import {
  companyService,
  type CompanyListItem,
} from "@/services/company/company.service";

type View = "all" | "pending" | "contracted" | "uncontracted";

const DEFAULT_LIMIT = 20;
const VIEWS: View[] = ["all", "pending", "contracted", "uncontracted"];

function toReportRows(companies: CompanyListItem[]): CsvRow[] {
  return companies.map((company, index) => ({
    "S.No": index + 1,
    Company: company.name,
    PAN: company.panNumber,
    "Fiscal Year": company.fiscalYear,
    Category: company.category,
    Approval: company.approvalStatus,
    Contracted: getCompanyIsContracted(company) ? "Yes" : "No",
    "Contact Person": company.contactPerson ?? "",
    Phone: company.phoneNumber ?? "",
    Email: company.email ?? "",
    Address: company.address,
  }));
}

/** Every company matching the filters, fetched page by page (for exports). */
async function fetchAllCompanies(
  filters: Omit<Parameters<typeof companyService.getPage>[0], "page">,
  sortBy: string,
  sortOrder: "asc" | "desc",
) {
  const all: CompanyListItem[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await companyService.getPage({
      ...filters,
      page,
      limit: 100,
      sortBy,
      sortOrder,
    });
    all.push(...result.data);
    lastPage = result.meta.lastPage;
    page += 1;
  } while (page <= lastPage);

  return all;
}

function ContractedBadge({ company }: { company: CompanyListItem }) {
  if (!isApprovedStatus(company.approvalStatus)) {
    const label =
      company.approvalStatus === "PENDING"
        ? "Awaiting approval"
        : "Not available for contracts";
    return <Badge variant="outline">{label}</Badge>;
  }

  return getCompanyIsContracted(company) ? (
    <StatusBadge tone="success" compact>
      Contracted
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" compact>
      Not contracted
    </StatusBadge>
  );
}

function CompaniesLoadingFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function CompanyListContent() {
  const { isAdmin } = useRole();
  const fiscalYear = useEffectiveFiscalYear();
  const { get, getInt, update, clear } = useUrlParams();

  const search = get("q");
  const category = get("category");
  const viewParam = get("view") as View;
  const view: View = VIEWS.includes(viewParam) ? viewParam : "all";
  const sortBy = get("sort", "createdAt");
  const sortOrder = get("order") === "asc" ? "asc" : "desc";
  const page = getInt("page", 1);
  const limit = getInt("limit", DEFAULT_LIMIT);

  const filters = {
    fiscalYear: fiscalYear || undefined,
    search: search || undefined,
    category: category || undefined,
    approvalStatus:
      view === "pending"
        ? ("PENDING" as const)
        : view === "contracted" || view === "uncontracted"
          ? ("APPROVED" as const)
          : undefined,
    contracted:
      view === "contracted"
        ? ("CONTRACTED" as const)
        : view === "uncontracted"
          ? ("NON_CONTRACTED" as const)
          : undefined,
  };

  const { data, isLoading, isFetching, isError, refetch } = useCompaniesPage({
    ...filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  const companies = data?.data ?? [];
  const counts = data?.counts;
  const meta = data?.meta;

  const { mutate: approveCompany } = useApproveCompany();
  const { mutate: bulkApprove, isPending: isBulkApproving } =
    useBulkApproveCompanies();
  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();

  const [companyToDelete, setCompanyToDelete] = useState<CompanyListItem | null>(null);

  // Selection is tied to the current page/filters and drops on any change.
  const scopeKey = JSON.stringify([filters, page, limit, sortBy, sortOrder]);
  const [selection, setSelection] = useState<{ scope: string; ids: Set<string> }>({
    scope: scopeKey,
    ids: new Set(),
  });
  const selectedIds = selection.scope === scopeKey ? selection.ids : new Set<string>();
  const selectedCompanies = companies.filter((company) => selectedIds.has(company.id));
  const selectedPending = selectedCompanies.filter(
    (company) => company.approvalStatus !== "APPROVED",
  );

  const hasActiveFilters = Boolean(search || category || view !== "all");
  const resetFilters = () => clear(["q", "category", "view"]);

  const handleSort = (key: string) => {
    update(
      sortBy === key
        ? { sort: key, order: sortOrder === "asc" ? "desc" : "asc" }
        : { sort: key, order: key === "name" ? "asc" : "desc" },
    );
  };

  const runExport = async (format: "csv" | "xlsx", only?: CompanyListItem[]) => {
    try {
      const source = only ?? (await fetchAllCompanies(filters, sortBy, sortOrder));
      const rows = toReportRows(source);
      if (rows.length === 0) {
        toast.info("Nothing to export for the current filters.");
        return;
      }

      const scope =
        fiscalYear && fiscalYear !== "all"
          ? fiscalYear.replace(/[^\dA-Za-z-]/g, "-")
          : "all-years";
      const fileName = `companies-${scope}.${format}`;

      if (format === "csv") {
        downloadCsv(fileName, rows);
      } else {
        await downloadXlsx(fileName, rows, "Companies");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not prepare the export."));
    }
  };

  const buildActions = (company: CompanyListItem): RowAction[] => [
    { label: "View profile", icon: Eye, href: `/dashboard/companies/${company.id}` },
    {
      label: isApprovedStatus(company.approvalStatus)
        ? "Certificate"
        : "Certificate after approval",
      icon: FileBadge,
      href: `/dashboard/companies/${company.id}/certificate`,
      disabled: !isApprovedStatus(company.approvalStatus),
    },
    { label: "Edit", icon: Pencil, href: `/dashboard/companies/${company.id}/edit` },
    {
      label: "Approve",
      icon: CheckCircle2,
      onSelect: () => approveCompany(company.id),
      hidden: !isAdmin || company.approvalStatus === "APPROVED",
    },
    {
      label: "Delete",
      icon: Trash2,
      onSelect: () => setCompanyToDelete(company),
      destructive: true,
      hidden: !isAdmin,
    },
  ];

  const columns: DataTableColumn<CompanyListItem>[] = [
    {
      id: "index",
      header: "#",
      className: "w-12 text-muted-foreground",
      cell: (_company, index) => (page - 1) * limit + index + 1,
    },
    {
      id: "name",
      header: "Company",
      sortKey: "name",
      cell: (company) => (
        <Link
          href={`/dashboard/companies/${company.id}`}
          className="font-medium text-primary hover:underline"
        >
          {company.name}
        </Link>
      ),
    },
    {
      id: "initiator",
      header: "Initiator",
      cell: (company) => <RegistrationInitiatorCell initiator={company.initiatedBy} />,
    },
    { id: "pan", header: "PAN", cell: (company) => company.panNumber },
    { id: "fy", header: "Fiscal year", cell: (company) => company.fiscalYear },
    {
      id: "category",
      header: "Category",
      cell: (company) => <Badge variant="outline">{company.category}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (company) => <ApprovalStatusBadge status={company.approvalStatus} />,
    },
    {
      id: "contracted",
      header: "Contracted",
      cell: (company) => <ContractedBadge company={company} />,
    },
    {
      id: "contact",
      header: "Contact",
      sortKey: "registrationRequestDate",
      cell: (company) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{company.contactPerson || "N/A"}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" aria-hidden="true" />
            {company.phoneNumber || "N/A"}
          </span>
        </div>
      ),
    },
  ];

  const renderMobileCard = (company: CompanyListItem) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/dashboard/companies/${company.id}`}
            className="font-medium text-primary hover:underline"
          >
            {company.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            PAN {company.panNumber} · {company.fiscalYear}
          </p>
        </div>
        <RowActions actions={buildActions(company)} label={company.name} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{company.category}</Badge>
        <ApprovalStatusBadge status={company.approvalStatus} />
        <ContractedBadge company={company} />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        {company.contactPerson || "N/A"} · {company.phoneNumber || "N/A"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={companyToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCompanyToDelete(null);
        }}
        title="Delete company?"
        description={
          <>
            <span className="font-semibold text-foreground">{companyToDelete?.name}</span>{" "}
            will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete company"
        destructive
        isPending={isDeleting}
        onConfirm={() => {
          if (!companyToDelete) return;
          deleteCompany(companyToDelete.id, {
            onSettled: () => setCompanyToDelete(null),
          });
        }}
      />

      <PageHeader
        title="Companies"
        description="Manage the contractors and suppliers registry."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" disabled={isError || (meta?.total ?? 0) === 0}>
                  <Download />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void runExport("xlsx")}>
                  <FileSpreadsheet />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void runExport("csv")}>
                  <FileText />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/dashboard/companies/new">
                <Plus />
                Register Company
              </Link>
            </Button>
          </>
        }
      />

      <div className={cn("grid gap-4", isAdmin ? "md:grid-cols-4" : "md:grid-cols-3")}>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Registered companies</p>
          <p className="text-2xl font-bold">{counts?.total ?? "–"}</p>
        </div>
        {isAdmin ? (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Pending approval</p>
            <p className="text-2xl font-bold text-amber-600">{counts?.pending ?? "–"}</p>
          </div>
        ) : null}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Contracted</p>
          <p className="text-2xl font-bold text-green-600">{counts?.contracted ?? "–"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Not contracted</p>
          <p className="text-2xl font-bold text-orange-600">{counts?.nonContracted ?? "–"}</p>
        </div>
      </div>

      <FilterChips
        label="Quick views"
        value={view}
        onChange={(next) => update({ view: next === "all" ? null : next })}
        options={[
          { value: "all", label: "All companies", count: counts?.total },
          ...(isAdmin
            ? [
                {
                  value: "pending",
                  label: "Needs approval",
                  count: counts?.pending,
                  tone: "warning" as const,
                },
              ]
            : []),
          { value: "contracted", label: "Contracted", count: counts?.contracted },
          { value: "uncontracted", label: "Not contracted", count: counts?.nonContracted },
        ]}
      />

      <FilterBar hasActiveFilters={hasActiveFilters} onReset={resetFilters}>
        <SearchInput
          label="Search companies"
          placeholder="Search by name, PAN or registration number"
          value={search}
          onChange={(value) => update({ q: value })}
          className="w-full md:w-96"
        />
        <select
          value={category}
          onChange={(event) => update({ category: event.target.value || null })}
          aria-label="Category"
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {CompanyCategoryEnum.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FilterBar>

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
          <p className="font-medium text-destructive">Companies could not be loaded.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {isAdmin ? (
            <BulkActionBar
              count={selectedIds.size}
              onClear={() => setSelection({ scope: scopeKey, ids: new Set() })}
            >
              <Button
                type="button"
                size="sm"
                disabled={selectedPending.length === 0 || isBulkApproving}
                onClick={() => {
                  bulkApprove(selectedPending.map((company) => company.id));
                  setSelection({ scope: scopeKey, ids: new Set() });
                }}
              >
                <CheckCircle2 />
                Approve{selectedPending.length > 0 ? ` (${selectedPending.length})` : ""}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void runExport("xlsx", selectedCompanies)}
              >
                <FileSpreadsheet />
                Export selected
              </Button>
            </BulkActionBar>
          ) : null}

          <div
            className={cn(
              "overflow-hidden rounded-xl border shadow-sm transition-opacity",
              isFetching && !isLoading && "opacity-70",
            )}
          >
            <DataTable
              columns={columns}
              rows={companies}
              getRowId={(company) => company.id}
              isLoading={isLoading}
              minWidth={1000}
              sort={{ key: sortBy, order: sortOrder }}
              onSortChange={handleSort}
              renderMobileCard={renderMobileCard}
              rowActions={(company) => (
                <RowActions actions={buildActions(company)} label={company.name} />
              )}
              selection={
                isAdmin
                  ? {
                      selectedIds,
                      onChange: (ids) => setSelection({ scope: scopeKey, ids }),
                    }
                  : undefined
              }
              empty={
                <EmptyState
                  icon={Building2}
                  title={hasActiveFilters ? "No companies match these filters" : "No companies registered yet"}
                  description={
                    hasActiveFilters
                      ? "Try clearing the search or choosing another fiscal year."
                      : "Register the first company for this fiscal year."
                  }
                  action={
                    hasActiveFilters ? (
                      <Button size="sm" variant="outline" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/dashboard/companies/new">
                          <Plus />
                          Register Company
                        </Link>
                      </Button>
                    )
                  }
                />
              }
            />
            {meta ? (
              <Pagination
                page={meta.page}
                lastPage={meta.lastPage}
                total={meta.total}
                limit={meta.limit}
                onPageChange={(next) => update({ page: next })}
                onLimitChange={(next) =>
                  update({ limit: next === DEFAULT_LIMIT ? null : next })
                }
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyListPage() {
  return (
    <Suspense fallback={<CompaniesLoadingFallback />}>
      <CompanyListContent />
    </Suspense>
  );
}
