"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileSignature,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_ORDER,
  ContractStatusBadge,
} from "@/components/contract-status-badge";
import { BulkActionBar } from "@/components/data/bulk-action-bar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FilterBar } from "@/components/data/filter-bar";
import { FilterChips } from "@/components/data/filter-chips";
import { Pagination } from "@/components/data/pagination";
import { RowActions, type RowAction } from "@/components/data/row-actions";
import { SearchInput } from "@/components/data/search-input";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONTRACT_KEYS,
  useBulkApproveContracts,
  useContractsPage,
  useUpdateContractStatus,
} from "@/hooks/contract/useContracts";
import { getApiErrorMessage } from "@/lib/api-error";
import { invalidateCompanyViews } from "@/lib/company-query-invalidation";
import { useRole } from "@/lib/auth/use-role";
import { toNepaliDate } from "@/lib/date-utils";
import { useEffectiveFiscalYear } from "@/lib/fiscal-year-context";
import type { Contract, ContractStatus } from "@/lib/schema/contract/contract";
import { downloadCsv, downloadXlsx, type CsvRow } from "@/lib/report-export";
import { useUrlParams } from "@/lib/use-url-params";
import { cn } from "@/lib/utils";
import { contractService } from "@/services/contract/contractService";

type View = "all" | "pending" | "overdue";
type Implementor = "ALL" | "COMPANY" | "USER_COMMITTEE";

const DEFAULT_LIMIT = 20;

const ACTIVE_CONTRACT_STATUS_ORDER = CONTRACT_STATUS_ORDER.filter(
  (status) => status !== "ARCHIVED",
);

function isContractStatus(value: string): value is ContractStatus {
  return CONTRACT_STATUS_ORDER.includes(value as ContractStatus);
}

function getStatusChangeBlockReason(
  contract: Contract,
  nextStatus: ContractStatus,
) {
  if (contract.status === nextStatus) return null;
  if (contract.status === "ARCHIVED") {
    return "Archived contracts cannot move to another milestone.";
  }
  if (nextStatus === "ARCHIVED") return null;

  const currentIndex = ACTIVE_CONTRACT_STATUS_ORDER.indexOf(contract.status);
  const nextIndex = ACTIVE_CONTRACT_STATUS_ORDER.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    return "This milestone is not supported for this contract.";
  }

  if (nextIndex < currentIndex) {
    return "Contract milestone cannot move backwards.";
  }

  if (nextStatus === "COMPLETED" && contract.finalEvaluatedAmount == null) {
    return "Final evaluated amount is required before marking completed.";
  }

  return null;
}

function getNextStatusBlockReason(contract: Contract) {
  if (contract.status === "ARCHIVED") {
    return getStatusChangeBlockReason(contract, "NOT_STARTED");
  }

  const currentIndex = ACTIVE_CONTRACT_STATUS_ORDER.indexOf(contract.status);
  const nextStatus = ACTIVE_CONTRACT_STATUS_ORDER[currentIndex + 1];

  return nextStatus ? getStatusChangeBlockReason(contract, nextStatus) : null;
}

type TimeHealth =
  "not_started" | "ongoing" | "overdue" | "completed" | "archived";

function getTimeHealth(
  contract: Pick<
    Contract,
    "startDate" | "intendedCompletionDate" | "actualCompletionDate" | "status"
  >,
): TimeHealth {
  if (contract.status === "ARCHIVED") return "archived";
  if (contract.status === "COMPLETED" || contract.actualCompletionDate)
    return "completed";

  const now = new Date();
  const start = contract.startDate ? new Date(contract.startDate) : null;
  const intended = contract.intendedCompletionDate
    ? new Date(contract.intendedCompletionDate)
    : null;

  if (!start || now < start) return "not_started";
  if (intended && now > intended) return "overdue";
  return "ongoing";
}

const TIME_HEALTH: Record<TimeHealth, { label: string; tone: StatusTone }> = {
  not_started: { label: "Timeline not started", tone: "neutral" },
  ongoing: { label: "On track", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  completed: { label: "Delivered", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
};

function TimeHealthBadge({ contract }: { contract: Contract }) {
  const health = TIME_HEALTH[getTimeHealth(contract)];

  return (
    <StatusBadge tone={health.tone} compact>
      {health.label}
    </StatusBadge>
  );
}

function formatUserName(
  user?: { name?: string | null; email?: string | null } | null,
): string {
  return user?.name || user?.email || "Unknown user";
}

function formatAmount(value: unknown) {
  return `Rs. ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function toReportRows(contracts: Contract[]): CsvRow[] {
  return contracts.map((contract, index) => ({
    "S.No": index + 1,
    "Contract No.": contract.contractNumber,
    "Fiscal Year": contract.fiscalYear ?? contract.project?.fiscalYear ?? "",
    Project: contract.project?.name ?? "",
    "Project S.No": contract.project?.sNo ?? "",
    "Implementor Type": contract.company
      ? "Company"
      : contract.userCommittee
        ? "User Committee"
        : "",
    Implementor: contract.company?.name ?? contract.userCommittee?.name ?? "",
    Milestone: CONTRACT_STATUS_LABEL[contract.status],
    Approval: contract.approvalStatus,
    "Contract Amount (Rs.)": Number(contract.contractAmount),
    "Final Evaluated Amount (Rs.)":
      contract.finalEvaluatedAmount == null
        ? ""
        : Number(contract.finalEvaluatedAmount),
    "Start Date (BS)": contract.startDate ? toNepaliDate(contract.startDate) : "",
    "Intended End (BS)": contract.intendedCompletionDate
      ? toNepaliDate(contract.intendedCompletionDate)
      : "",
    "Actual End (BS)": contract.actualCompletionDate
      ? toNepaliDate(contract.actualCompletionDate)
      : "",
    "Site Incharge":
      contract.siteIncharge?.name ?? contract.project?.siteIncharge?.name ?? "",
    Agreement: contract.agreement ? "Yes" : "No",
    "Work Order": contract.workOrder ? "Yes" : "No",
    "Completion Code": contract.completionCode ?? "",
  }));
}

function StatusCard({
  label,
  value,
  isActive,
  onClick,
}: {
  label: string;
  value: number | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "border-primary bg-primary/5 shadow-sm",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className={cn("mt-2 text-2xl font-bold", isActive && "text-primary")}>
        {value ?? <Skeleton className="mt-1 h-7 w-10" />}
      </div>
    </button>
  );
}

function ImplementorCell({ contract }: { contract: Contract }) {
  if (contract.company) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-tone-info-foreground" aria-hidden="true" />
          <span className="font-medium">{contract.company.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          PAN: {contract.company.panNumber ?? "-"}
        </div>
      </div>
    );
  }

  if (contract.userCommittee) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-tone-warning-foreground" aria-hidden="true" />
          <span className="font-medium">{contract.userCommittee.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">User committee</div>
      </div>
    );
  }

  return <span className="text-muted-foreground">Not assigned</span>;
}

function MilestoneCell({
  contract,
  isAdmin,
  isUpdating,
  onChange,
}: {
  contract: Contract;
  isAdmin: boolean;
  isUpdating: boolean;
  onChange: (status: ContractStatus) => void;
}) {
  const canChangeStatus = isAdmin && contract.approvalStatus === "APPROVED";
  const blockReason = canChangeStatus ? getNextStatusBlockReason(contract) : null;

  return (
    <div className="space-y-2">
      {canChangeStatus ? (
        <select
          value={contract.status}
          disabled={isUpdating}
          aria-label={`Milestone for ${contract.contractNumber}`}
          onChange={(event) => onChange(event.target.value as ContractStatus)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          {CONTRACT_STATUS_ORDER.map((status) => (
            <option
              key={status}
              value={status}
              disabled={Boolean(getStatusChangeBlockReason(contract, status))}
            >
              {CONTRACT_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      ) : (
        <ContractStatusBadge status={contract.status} />
      )}
      {blockReason ? (
        <p className="max-w-56 text-xs leading-5 text-muted-foreground">
          {blockReason}
        </p>
      ) : null}
      {isAdmin && contract.approvalStatus !== "APPROVED" ? (
        <p className="text-xs text-muted-foreground">
          Approve first to change milestone.
        </p>
      ) : null}
      <TimeHealthBadge contract={contract} />
    </div>
  );
}

function ContractsLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function ContractLandingContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();
  const fiscalYear = useEffectiveFiscalYear();
  const { get, getInt, update, clear } = useUrlParams();

  // All list state lives in the URL, so refresh / Back / shared links work.
  const search = get("q");
  const statusParam = get("status");
  const status = isContractStatus(statusParam) ? statusParam : undefined;
  const viewParam = get("view");
  const view: View =
    viewParam === "pending" || viewParam === "overdue" ? viewParam : "all";
  const implParam = get("impl");
  const implementor: Implementor =
    implParam === "COMPANY" || implParam === "USER_COMMITTEE" ? implParam : "ALL";
  const sortBy = get("sort", "createdAt");
  const sortOrder = get("order") === "asc" ? "asc" : "desc";
  const page = getInt("page", 1);
  const limit = getInt("limit", DEFAULT_LIMIT);

  const filters = {
    fiscalYear: fiscalYear || undefined,
    search: search || undefined,
    status,
    implementor: implementor === "ALL" ? undefined : implementor,
    approvalStatus: view === "pending" ? ("PENDING" as const) : undefined,
    overdue: view === "overdue" ? true : undefined,
  };

  const { data, isLoading, isFetching, isError, refetch } = useContractsPage({
    ...filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  const contracts = data?.data ?? [];
  const counts = data?.counts;
  const meta = data?.meta;

  const { mutate: updateContractStatus, isPending: isUpdatingStatus } =
    useUpdateContractStatus();
  const { mutate: bulkApprove, isPending: isBulkApproving } =
    useBulkApproveContracts();

  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selection belongs to the page it was made on: any filter, sort or page
  // change drops it, so "N selected" never refers to rows you can't see.
  const scopeKey = JSON.stringify([filters, page, limit, sortBy, sortOrder]);
  const [selection, setSelection] = useState<{ scope: string; ids: Set<string> }>({
    scope: scopeKey,
    ids: new Set(),
  });
  const selectedIds = selection.scope === scopeKey ? selection.ids : new Set<string>();
  const selectedContracts = contracts.filter((contract) => selectedIds.has(contract.id));
  const selectedPending = selectedContracts.filter(
    (contract) => contract.approvalStatus !== "APPROVED",
  );

  const hasActiveFilters = Boolean(
    search || status || implementor !== "ALL" || view !== "all",
  );

  const handleSort = (key: string) => {
    update(
      sortBy === key
        ? { sort: key, order: sortOrder === "asc" ? "desc" : "asc" }
        : { sort: key, order: key === "contractNumber" ? "asc" : "desc" },
    );
  };

  const exportFileName = (extension: string) => {
    const scope =
      fiscalYear && fiscalYear !== "all"
        ? fiscalYear.replace(/[^\dA-Za-z-]/g, "-")
        : "all-years";
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kathmandu",
    });
    return `contract-report-${scope}-${today}.${extension}`;
  };

  const runExport = async (format: "csv" | "xlsx", only?: Contract[]) => {
    try {
      // Exports cover every match, not just the page on screen.
      const rows = toReportRows(only ?? (await contractService.getAll(filters)));
      if (rows.length === 0) {
        toast.info("Nothing to export for the current filters.");
        return;
      }

      if (format === "csv") {
        downloadCsv(exportFileName("csv"), rows);
      } else {
        await downloadXlsx(exportFileName("xlsx"), rows, "Contracts");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not prepare the export."));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    try {
      await contractService.delete(contractToDelete.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() }),
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.details() }),
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumbers() }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        invalidateCompanyViews(queryClient),
      ]);
      setContractToDelete(null);
      toast.success("Contract deleted");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to delete contract. Please try again."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const approveOne = (contract: Contract) => bulkApprove([contract.id]);

  const buildActions = (contract: Contract): RowAction[] => [
    { label: "View", icon: Eye, href: `/dashboard/contracts/${contract.id}` },
    { label: "Edit", icon: Pencil, href: `/dashboard/contracts/${contract.id}/edit` },
    {
      label: "Approve",
      icon: CheckCircle2,
      onSelect: () => approveOne(contract),
      hidden: !isAdmin || contract.approvalStatus === "APPROVED",
      disabled: isBulkApproving,
    },
    {
      label: "Delete",
      icon: Trash2,
      onSelect: () => setContractToDelete(contract),
      destructive: true,
      hidden: !isAdmin,
    },
  ];

  const columns: DataTableColumn<Contract>[] = [
    {
      id: "contract",
      header: "Contract",
      sortKey: "contractNumber",
      cell: (contract) => (
        <div className="space-y-2">
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="block font-mono text-sm font-semibold text-primary hover:underline"
          >
            {contract.contractNumber}
          </Link>
          <div className="flex flex-wrap gap-1.5">
            {contract.agreement ? (
              <StatusBadge tone="info" icon={FileText} compact>
                Agreement
              </StatusBadge>
            ) : null}
            {contract.workOrder ? (
              <StatusBadge tone="accent" icon={CalendarClock} compact>
                Work order
              </StatusBadge>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "project",
      header: "Project",
      cell: (contract) => {
        const siteIncharge = contract.siteIncharge ?? contract.project?.siteIncharge;

        return (
          <div className="space-y-1">
            <div className="font-medium">
              {contract.project?.name ?? "Unlinked project"}
            </div>
            {contract.project?.sNo ? (
              <div className="text-xs text-muted-foreground">
                S.No: {contract.project.sNo}
              </div>
            ) : null}
            {siteIncharge ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" aria-hidden="true" />
                <span>
                  Site incharge:{" "}
                  <span className="font-medium text-foreground">
                    {siteIncharge.name}
                  </span>
                  {siteIncharge.designation ? ` (${siteIncharge.designation})` : ""}
                </span>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "implementor",
      header: "Implementor",
      cell: (contract) => <ImplementorCell contract={contract} />,
    },
    {
      id: "milestone",
      header: "Milestone",
      cell: (contract) => (
        <MilestoneCell
          contract={contract}
          isAdmin={isAdmin}
          isUpdating={isUpdatingStatus}
          onChange={(next) =>
            updateContractStatus({ id: contract.id, status: next })
          }
        />
      ),
    },
    {
      id: "approval",
      header: "Approval",
      cell: (contract) => (
        <div className="space-y-1.5">
          <ApprovalStatusBadge status={contract.approvalStatus} />
          {isAdmin && contract.approvalStatus !== "APPROVED" ? (
            <p className="max-w-48 text-xs leading-5 text-muted-foreground">
              Submitted by{" "}
              <span className="font-medium text-foreground">
                {contract.initiatedBy
                  ? formatUserName(contract.initiatedBy)
                  : (contract.initiatedById ?? "unknown user")}
              </span>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "timeline",
      header: "Timeline",
      sortKey: "startDate",
      cell: (contract) => (
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Start:</span>{" "}
            {toNepaliDate(contract.startDate) ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Intended end:</span>{" "}
            {toNepaliDate(contract.intendedCompletionDate) ?? "-"}
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      sortKey: "contractAmount",
      align: "right",
      cell: (contract) => (
        <span className="whitespace-nowrap font-medium">
          {formatAmount(contract.contractAmount)}
        </span>
      ),
    },
  ];

  const renderMobileCard = (contract: Contract) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {contract.contractNumber}
          </Link>
          <p className="mt-1 wrap-break-word font-medium">
            {contract.project?.name ?? "Unlinked project"}
          </p>
        </div>
        <RowActions actions={buildActions(contract)} label={contract.contractNumber} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ContractStatusBadge status={contract.status} />
        <ApprovalStatusBadge status={contract.approvalStatus} />
        <TimeHealthBadge contract={contract} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Implementor</dt>
        <dd className="text-right">
          {contract.company?.name ?? contract.userCommittee?.name ?? "Not assigned"}
        </dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right font-medium">{formatAmount(contract.contractAmount)}</dd>
        <dt className="text-muted-foreground">Intended end</dt>
        <dd className="text-right">{toNepaliDate(contract.intendedCompletionDate) ?? "-"}</dd>
      </dl>
    </div>
  );

  const statusCardItems: { label: string; value?: ContractStatus }[] = [
    { label: "Total" },
    ...CONTRACT_STATUS_ORDER.map((value) => ({
      label: CONTRACT_STATUS_LABEL[value],
      value,
    })),
  ];

  return (
    <>
      <ConfirmDialog
        open={contractToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setContractToDelete(null);
        }}
        title="Delete contract?"
        description={
          <>
            <span className="font-mono font-semibold text-foreground">
              {contractToDelete?.contractNumber}
            </span>{" "}
            will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete contract"
        destructive
        isPending={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      <div className="space-y-6">
        <PageHeader
          title="Contracts"
          description="Track every contract from agreement to completion, in sync with its project, company and committee."
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
              <Button type="button" onClick={() => router.push("/dashboard/contracts/new")}>
                <Plus />
                New Contract
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {statusCardItems.map((item) => (
            <StatusCard
              key={item.label}
              label={item.label}
              value={
                item.value ? counts?.byStatus[item.value] : counts?.total
              }
              isActive={(status ?? undefined) === item.value}
              onClick={() => update({ status: item.value ?? null })}
            />
          ))}
        </div>

        <FilterChips
          label="Quick views"
          value={view}
          onChange={(next) => update({ view: next === "all" ? null : next })}
          options={[
            { value: "all", label: "All contracts" },
            ...(isAdmin
              ? [
                  {
                    value: "pending",
                    label: "Needs approval",
                    count: counts?.pendingApprovals,
                    tone: "warning" as const,
                  },
                ]
              : []),
            {
              value: "overdue",
              label: "Overdue",
              count: counts?.overdue,
              tone: "warning" as const,
            },
          ]}
        />

        <FilterBar
          hasActiveFilters={hasActiveFilters}
          onReset={() => clear(["q", "status", "view", "impl"])}
        >
          <SearchInput
            label="Search contracts"
            placeholder="Contract no., project, company or committee"
            value={search}
            onChange={(value) => update({ q: value })}
            className="w-full md:w-96"
          />
          <select
            value={implementor}
            onChange={(event) =>
              update({ impl: event.target.value === "ALL" ? null : event.target.value })
            }
            aria-label="Implementor type"
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">All implementors</option>
            <option value="COMPANY">Company</option>
            <option value="USER_COMMITTEE">User committee</option>
          </select>
        </FilterBar>

        {isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
            <p className="font-medium text-destructive">Contracts could not be loaded.</p>
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
                    bulkApprove(selectedPending.map((contract) => contract.id));
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
                  onClick={() => void runExport("xlsx", selectedContracts)}
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
                rows={contracts}
                getRowId={(contract) => contract.id}
                isLoading={isLoading}
                minWidth={1100}
                sort={{ key: sortBy, order: sortOrder }}
                onSortChange={handleSort}
                onRowClick={(contract) =>
                  router.push(`/dashboard/contracts/${contract.id}`)
                }
                renderMobileCard={renderMobileCard}
                rowActions={(contract) => (
                  <RowActions
                    actions={buildActions(contract)}
                    label={contract.contractNumber}
                  />
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
                    icon={FileSignature}
                    title={hasActiveFilters ? "No contracts match these filters" : "No contracts yet"}
                    description={
                      hasActiveFilters
                        ? "Try clearing the search or choosing another fiscal year."
                        : "Create the first contract for this fiscal year."
                    }
                    action={
                      hasActiveFilters ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clear(["q", "status", "view", "impl"])}
                        >
                          Reset filters
                        </Button>
                      ) : (
                        <Button asChild size="sm">
                          <Link href="/dashboard/contracts/new">
                            <Plus />
                            New Contract
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
    </>
  );
}

export default function ContractLandingPage() {
  return (
    <Suspense fallback={<ContractsLoadingFallback />}>
      <ContractLandingContent />
    </Suspense>
  );
}
