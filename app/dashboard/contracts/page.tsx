"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { CONTRACT_KEYS, useApproveContract, useContracts, useUpdateContractStatus } from "@/hooks/contract/useContracts";
import { contractService } from "@/services/contract/contractService";
import type { Contract, ContractStatus } from "@/lib/schema/contract/contract";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import {
  ContractStatusBadge,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_ORDER,
} from "@/components/contract-status-badge";
import { toNepaliDate } from "@/lib/date-utils";
import { useFiscalYears, useSystemSetup } from "@/hooks/setup/useSetup";

type ImplementationFilter = "ALL" | "COMPANY" | "USER_COMMITTEE";
type StatusFilter = "ALL" | ContractStatus;

type TimeHealth = "not_started" | "ongoing" | "overdue" | "completed" | "archived";

const ACTIVE_CONTRACT_STATUS_ORDER = CONTRACT_STATUS_ORDER.filter(
  (status) => status !== "ARCHIVED"
);

function isContractStatus(value: string | null): value is ContractStatus {
  return CONTRACT_STATUS_ORDER.includes(value as ContractStatus);
}

function getStatusChangeBlockReason(contract: Contract, nextStatus: ContractStatus) {
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

function getTimeHealth(contract: Pick<Contract, "startDate" | "intendedCompletionDate" | "actualCompletionDate" | "status">): TimeHealth {
  if (contract.status === "ARCHIVED") return "archived";
  if (contract.status === "COMPLETED" || contract.actualCompletionDate) return "completed";

  const now = new Date();
  const start = contract.startDate ? new Date(contract.startDate) : null;
  const intended = contract.intendedCompletionDate ? new Date(contract.intendedCompletionDate) : null;

  if (!start || now < start) return "not_started";
  if (intended && now > intended) return "overdue";
  return "ongoing";
}

function formatUserName(user?: { name?: string | null; email?: string | null } | null): string {
  return user?.name || user?.email || "Unknown user";
}

function TimeHealthBadge({ contract }: { contract: Contract }) {
  const health = getTimeHealth(contract);

  const content: Record<TimeHealth, { label: string; className: string }> = {
    not_started: {
      label: "Timeline Not Started",
      className: "bg-slate-100 text-slate-700",
    },
    ongoing: {
      label: "On Track",
      className: "bg-emerald-100 text-emerald-700",
    },
    overdue: {
      label: "Overdue",
      className: "bg-rose-100 text-rose-700",
    },
    completed: {
      label: "Delivered",
      className: "bg-green-100 text-green-700",
    },
    archived: {
      label: "Archived",
      className: "bg-zinc-100 text-zinc-700",
    },
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${content[health].className}`}>
      {content[health].label}
    </span>
  );
}

function DeleteConfirmModal({
  contract,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  contract: Contract;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Delete Contract</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete <span className="font-mono font-semibold text-foreground">{contract.contractNumber}</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  accent,
  isActive,
  onClick,
}: {
  label: string;
  value: number;
  accent?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive ? "border-primary bg-primary/5 shadow-sm" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${isActive ? "text-primary" : (accent ?? "")}`}>
        {value}
      </p>
    </button>
  );
}

function ContractRow({
  contract,
  isAdmin,
  isUpdatingStatus,
  isApproving,
  onApprove,
  onDelete,
  onStatusChange,
}: {
  contract: Contract;
  isAdmin: boolean;
  isUpdatingStatus: boolean;
  isApproving: boolean;
  onApprove: () => void;
  onDelete: () => void;
  onStatusChange: (status: ContractStatus) => void;
}) {
  const canChangeStatus = isAdmin && contract.approvalStatus === "APPROVED";
  const statusBlockReason = canChangeStatus ? getNextStatusBlockReason(contract) : null;
  const implementor = contract.company
    ? {
        icon: <Building2 className="h-4 w-4 text-blue-500" />,
        label: contract.company.name,
        sublabel: `PAN: ${contract.company.panNumber ?? "-"}`,
      }
    : contract.userCommittee
      ? {
          icon: <Users className="h-4 w-4 text-amber-500" />,
          label: contract.userCommittee.name,
          sublabel: "User Committee",
        }
      : null;

  return (
    <tr className="border-b align-top">
      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="font-mono text-sm font-semibold text-primary">
            {contract.contractNumber}
          </div>
          <div className="flex flex-wrap gap-2">
            {contract.agreement && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                <FileText className="h-3 w-3" />
                Agreement
              </span>
            )}
            {contract.workOrder && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
                <CalendarClock className="h-3 w-3" />
                Work Order
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="font-medium">{contract.project?.name ?? "Unlinked Project"}</div>
          {contract.project?.sNo && (
            <div className="text-xs text-muted-foreground">S.No: {contract.project.sNo}</div>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        {implementor ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {implementor.icon}
              <span className="font-medium">{implementor.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">{implementor.sublabel}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not assigned</span>
        )}
      </td>

      <td className="px-4 py-4">
        <div className="space-y-2">
          {canChangeStatus ? (
            <select
              value={contract.status}
              disabled={isUpdatingStatus}
              onChange={(event) => onStatusChange(event.target.value as ContractStatus)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {CONTRACT_STATUS_ORDER.map((status) => {
                const blockReason = getStatusChangeBlockReason(contract, status);

                return (
                  <option key={status} value={status} disabled={Boolean(blockReason)}>
                    {CONTRACT_STATUS_LABEL[status]}
                  </option>
                );
              })}
            </select>
          ) : (
            <ContractStatusBadge status={contract.status} />
          )}
          {statusBlockReason && (
            <p className="max-w-56 text-xs leading-5 text-muted-foreground">
              {statusBlockReason}
            </p>
          )}
          {!canChangeStatus && isAdmin && contract.approvalStatus !== "APPROVED" && (
            <p className="text-xs text-muted-foreground">Approve first to change milestone.</p>
          )}
          <TimeHealthBadge contract={contract} />
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-1.5">
          <ApprovalStatusBadge status={contract.approvalStatus} />
          {isAdmin && contract.approvalStatus !== "APPROVED" && (
            <p className="max-w-48 text-xs leading-5 text-muted-foreground">
              Submitted by{" "}
              <span className="font-medium text-foreground">
                {contract.initiatedBy
                  ? formatUserName(contract.initiatedBy)
                  : contract.initiatedById ?? "unknown user"}
              </span>
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Start:</span>{" "}
            {toNepaliDate(contract.startDate) ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Intended End:</span>{" "}
            {toNepaliDate(contract.intendedCompletionDate) ?? "-"}
          </div>
          <div className="font-medium">
            Rs. {Number(contract.contractAmount ?? 0).toLocaleString()}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          {isAdmin && contract.approvalStatus !== "APPROVED" && (
            <button
              type="button"
              onClick={onApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
          )}
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          <Link
            href={`/dashboard/contracts/${contract.id}/edit`}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowRight className="h-4 w-4" />
            Edit
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ContractsLoadingFallback() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="h-9 w-72 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-5 w-[32rem] max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-32 animate-pulse rounded-xl border bg-card" />
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}

function ContractLandingContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: setup } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string | null>(null);
  const effectiveFiscalYear = fiscalYearFilter ?? setup?.currentFiscalYear ?? "";
  const { data: contracts = [], isLoading } = useContracts({
    fiscalYear: effectiveFiscalYear || undefined,
  });
  const { mutate: approveContract, isPending: isApprovingContract } = useApproveContract();
  const { mutate: updateContractStatus, isPending: isUpdatingStatus } = useUpdateContractStatus();

  const [search, setSearch] = useState("");
  const [implementationFilter, setImplementationFilter] =
    useState<ImplementationFilter>("ALL");
  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter = isContractStatus(statusParam) ? statusParam : "ALL";
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const setStatusFilter = (nextStatus: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextStatus === "ALL") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const baseFilteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const implementorName = contract.company?.name ?? contract.userCommittee?.name ?? "";
      const matchesSearch =
        !search ||
        contract.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        (contract.project?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        implementorName.toLowerCase().includes(search.toLowerCase());

      const matchesImplementation =
        implementationFilter === "ALL" ||
        (implementationFilter === "COMPANY" && Boolean(contract.company)) ||
        (implementationFilter === "USER_COMMITTEE" && Boolean(contract.userCommittee));

      return matchesSearch && matchesImplementation;
    });
  }, [contracts, implementationFilter, search]);

  const filteredContracts = useMemo(() => {
    return baseFilteredContracts.filter((contract) => {
      return statusFilter === "ALL" || contract.status === statusFilter;
    });
  }, [baseFilteredContracts, statusFilter]);

  const totalsByStatus = useMemo(
    () =>
      CONTRACT_STATUS_ORDER.reduce<Record<ContractStatus, number>>(
        (acc, status) => {
          acc[status] = baseFilteredContracts.filter(
            (contract) => contract.status === status
          ).length;
          return acc;
        },
        {
          NOT_STARTED: 0,
          AGREEMENT: 0,
          WORKORDER: 0,
          WORKINPROGRESS: 0,
          COMPLETED: 0,
          ARCHIVED: 0,
        }
      ),
    [baseFilteredContracts]
  );

  const pendingApprovals = contracts.filter(
    (contract) => contract.approvalStatus === "PENDING"
  ).length;

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    try {
      await contractService.delete(contractToDelete.id);
      await queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() });
      setContractToDelete(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete contract. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {contractToDelete && (
        <DeleteConfirmModal
          contract={contractToDelete}
          isDeleting={isDeleting}
          onCancel={() => setContractToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contract Milestones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage contract milestones in one place and keep project, company, and user views in sync.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/contracts/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Contract
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <StatusCard
            label="Total"
            value={baseFilteredContracts.length}
            isActive={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          />
          {CONTRACT_STATUS_ORDER.map((status) => (
            <StatusCard
              key={status}
              label={CONTRACT_STATUS_LABEL[status]}
              value={totalsByStatus[status]}
              isActive={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="rounded-xl border bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Pending approvals: <span className="font-semibold">{pendingApprovals}</span>
          </div>
        )}

        <div className="grid gap-3 rounded-xl border bg-card p-4 lg:grid-cols-[minmax(0,1fr),180px,180px,180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by contract no., project, company, or committee"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </div>

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

          <select
            value={implementationFilter}
            onChange={(event) =>
              setImplementationFilter(event.target.value as ImplementationFilter)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">All Implementors</option>
            <option value="COMPANY">Company</option>
            <option value="USER_COMMITTEE">User Committee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | ContractStatus)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">All Milestones</option>
            {CONTRACT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {CONTRACT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contract
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Project
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Implementor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Milestone
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Timeline / Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Loading contracts...
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No contracts match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <ContractRow
                      key={contract.id}
                      contract={contract}
                      isAdmin={isAdmin}
                      isUpdatingStatus={isUpdatingStatus}
                      isApproving={isApprovingContract}
                      onApprove={() => approveContract(contract.id)}
                      onDelete={() => setContractToDelete(contract)}
                      onStatusChange={(status) =>
                        updateContractStatus({ id: contract.id, status })
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredContracts.length > 0 && (
            <div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              Showing {filteredContracts.length} of {contracts.length} contracts
            </div>
          )}
        </div>
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
