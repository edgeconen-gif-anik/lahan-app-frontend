// app/dashboard/contracts/page.tsx
"use client";
import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useApproveContract, useContracts } from "@/hooks/contract/useContracts";
import {
  Plus, Search, Eye, FileText, Flag, Pencil, Trash2, X,
  AlertTriangle, Building2, Users, SlidersHorizontal,
  CalendarClock, BadgeCheck, Clock, Ban, Archive, RefreshCw, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CONTRACT_KEYS } from "@/hooks/contract/useContracts";
import { contractService } from "@/services/contract/contractService";
import { toNepaliDate } from "@/lib/date-utils";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractStatus =
  | "NOT_STARTED"
  | "AGREEMENT"
  | "WORKORDER"
  | "WORKINPROGRESS"
  | "COMPLETED"
  | "ARCHIVED";

type Contract = {
  id: string;
  contractNumber: string;
  contractAmount: number | string;
  startDate?: string;
  // ✅ Correct backend field names
  intendedCompletionDate?: string;
  actualCompletionDate?: string | null;
  status?: ContractStatus;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string;
  project?: { id: string; name: string; sNo?: string };
  // ✅ Both relations — only one will be present per contract
  company?: { id: string; name: string; panNumber?: string };
  userCommittee?: { id: string; name: string };
  user?: { id: string; name: string | null; designation?: string };
  agreement?: { id: string };
  workOrder?: { id: string };
};

type ImplementationFilter = "ALL" | "COMPANY" | "USER_COMMITTEE";
type StatusFilter = "ALL" | ContractStatus;

// ─── Time Health ──────────────────────────────────────────────────────────────
// Derives the "time health" of a contract from dates + workflow status.
//   ongoing   : start passed, intended end is still in the future
//   overdue   : intended end passed and contract is not yet completed/archived
//   completed : actualCompletionDate is set OR status === COMPLETED
//   not_started: start date hasn't arrived yet
//   archived  : status === ARCHIVED

type TimeHealth = "ongoing" | "overdue" | "completed" | "not_started" | "archived";

function getTimeHealth(contract: {
  startDate?: string | null;
  intendedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status?: ContractStatus;
}): TimeHealth {
  const { startDate, intendedCompletionDate, actualCompletionDate, status } = contract;
  if (status === "ARCHIVED") return "archived";
  if (status === "COMPLETED" || actualCompletionDate) return "completed";
  const now      = new Date();
  const start    = startDate    ? new Date(startDate)    : null;
  const intended = intendedCompletionDate ? new Date(intendedCompletionDate) : null;
  if (!start || now < start) return "not_started";
  if (intended && now > intended) return "overdue";
  return "ongoing";
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    icon: <Clock size={11} />,
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
  },
  AGREEMENT: {
    label: "Agreement",
    icon: <FileText size={11} />,
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
  },
  WORKORDER: {
    label: "Work Order",
    icon: <BadgeCheck size={11} />,
    className:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800",
  },
  WORKINPROGRESS: {
    label: "In Progress",
    icon: <RefreshCw size={11} />,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  },
  COMPLETED: {
    label: "Completed",
    icon: <Flag size={11} />,
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
  },
  ARCHIVED: {
    label: "Archived",
    icon: <Archive size={11} />,
    className:
      "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
  },
};

function StatusBadge({ status }: { status?: ContractStatus }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
        —
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// Time-health badge — shown alongside the workflow status badge in the table
const TIME_HEALTH_CONFIG: Record<TimeHealth, { label: string; icon: React.ReactNode; className: string }> = {
  ongoing: {
    label: "Ongoing",
    icon: <RefreshCw size={10} />,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
  },
  overdue: {
    label: "Overdue",
    icon: <Ban size={10} />,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  },
  completed: {
    label: "Done",
    icon: <Flag size={10} />,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
  },
  not_started: {
    label: "Not Started",
    icon: <Clock size={10} />,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
  },
  archived: {
    label: "Archived",
    icon: <Archive size={10} />,
    className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
  },
};

function TimeHealthBadge({ contract }: { contract: Contract }) {
  const health = getTimeHealth(contract);
  const cfg = TIME_HEALTH_CONFIG[health];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Implementation Badge ─────────────────────────────────────────────────────

function ImplBadge({ contract }: { contract: Contract }) {
  if (contract.company) {
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-blue-500 shrink-0" />
          <span className="text-sm font-medium truncate max-w-[160px]">
            {contract.company.name}
          </span>
        </div>
        {contract.company.panNumber && (
          <span className="text-xs text-muted-foreground pl-[20px]">
            PAN: {contract.company.panNumber}
          </span>
        )}
      </div>
    );
  }
  if (contract.userCommittee) {
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-amber-500 shrink-0" />
          <span className="text-sm font-medium truncate max-w-[160px]">
            {contract.userCommittee.name}
          </span>
        </div>
        <span className="text-xs text-muted-foreground pl-[20px]">
          User Committee
        </span>
      </div>
    );
  }
  return <span className="text-sm text-muted-foreground">—</span>;
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  contract,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  contract: Contract;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-full shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold">Delete Contract</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold text-foreground">
                {contract.contractNumber}
              </span>
              ? This action <span className="text-red-600 dark:text-red-400 font-medium">cannot be undone</span>.
            </p>
            {contract.project && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">
                Project: {contract.project.name}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
        ${active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground"
        }`}
    >
      {children}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <FileText size={22} className="text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {filtered ? "No contracts match your filters" : "No contracts yet"}
            </p>
            {!filtered && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create your first contract to get started.
              </p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SKELETON_ROW_WIDTHS = [
  ["76%", "64%", "85%", "88%", "63%", "72%", "84%", "80%"],
  ["61%", "72%", "81%", "80%", "69%", "74%", "79%", "81%"],
  ["86%", "68%", "86%", "84%", "86%", "63%", "76%", "84%"],
  ["79%", "89%", "82%", "84%", "71%", "68%", "84%", "86%"],
  ["73%", "74%", "65%", "70%", "62%", "79%", "63%", "63%"],
] as const;

function SkeletonRow({ rowIndex }: { rowIndex: number }) {
  const widths = SKELETON_ROW_WIDTHS[rowIndex % SKELETON_ROW_WIDTHS.length];

  return (
    <tr className="border-b">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 rounded bg-muted animate-pulse" style={{ width: widths[i] }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ contracts }: { contracts: Contract[] }) {
  const total = contracts.length;
  const byCompany = contracts.filter((c) => !!c.company).length;
  const byUC = contracts.filter((c) => !!c.userCommittee).length;
  const inProgress = contracts.filter((c) => c.status === "WORKINPROGRESS").length;
  const completed = contracts.filter((c) => c.status === "COMPLETED").length;
  const totalAmount = contracts.reduce((sum, c) => sum + Number(c.contractAmount || 0), 0);

  const stats = [
    { label: "Total Contracts", value: total, sub: null },
    { label: "By Company", value: byCompany, sub: <Building2 size={12} className="text-blue-500" /> },
    { label: "By User Committee", value: byUC, sub: <Users size={12} className="text-amber-500" /> },
    { label: "In Progress", value: inProgress, sub: <RefreshCw size={12} className="text-amber-500" /> },
    { label: "Completed", value: completed, sub: <Flag size={12} className="text-green-500" /> },
    {
      label: "Total Value",
      value: `रू ${totalAmount.toLocaleString()}`,
      sub: null,
      wide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`bg-card border rounded-lg px-4 py-3 space-y-1 ${s.wide ? "lg:col-span-1" : ""}`}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {s.sub}
            {s.label}
          </div>
          <p className="text-lg font-bold tracking-tight">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractLandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [implFilter, setImplFilter] = useState<ImplementationFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: approveContract, isPending: isApprovingContract } = useApproveContract();
  const { data: rawContracts, isLoading } = useContracts();

  // Normalize: ensure we always have an array.
  // Cast through `unknown` first so TS doesn't complain when the hook's
  // inferred return type narrows to `never` in certain error/loading states.
  const contracts: Contract[] = useMemo(() => {
    const raw = rawContracts as unknown;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Contract[];
    if (
      typeof raw === "object" &&
      raw !== null &&
      "data" in raw &&
      Array.isArray((raw as { data: unknown }).data)
    ) {
      return (raw as { data: Contract[] }).data;
    }
    return [];
  }, [rawContracts]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Text search — contract number, project name, company/UC name
      const implementorName = c.company?.name ?? c.userCommittee?.name ?? "";
      const matchesSearch =
        !search ||
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        (c.project?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        implementorName.toLowerCase().includes(search.toLowerCase());

      // Implementation type filter
      const matchesImpl =
        implFilter === "ALL" ||
        (implFilter === "COMPANY" && !!c.company) ||
        (implFilter === "USER_COMMITTEE" && !!c.userCommittee);

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;

      return matchesSearch && matchesImpl && matchesStatus;
    });
  }, [contracts, search, implFilter, statusFilter]);

  const isFiltered = search !== "" || implFilter !== "ALL" || statusFilter !== "ALL";

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    setIsDeleting(true);
    try {
      await contractService.delete(contractToDelete.id);
      await queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() });
      setContractToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete contract. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setImplFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <>
      {contractToDelete && (
        <DeleteConfirmModal
          contract={contractToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setContractToDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="p-6 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Contracts
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and track all registered contracts.
            </p>
          </div>
          <Link
            href="/dashboard/contracts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shrink-0"
          >
            <Plus size={16} />
            New Contract
          </Link>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {!isLoading && contracts.length > 0 && (
          <StatsBar contracts={contracts} />
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by contract no., project or implementor..."
                className="w-full pl-9 pr-4 py-2 h-9 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
              >
                Clear all
              </button>
            )}

            <div className="ml-auto text-xs text-muted-foreground shrink-0">
              {isLoading ? "Loading..." : (
                <>
                  <span className="font-medium text-foreground">{filteredContracts.length}</span>
                  {" "}of {contracts.length} contracts
                </>
              )}
            </div>
          </div>

          {/* Filter pills row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
              <SlidersHorizontal size={12} />
              Filter:
            </span>

            {/* Implementation type */}
            <div className="flex gap-1.5 flex-wrap">
              <FilterPill active={implFilter === "ALL"} onClick={() => setImplFilter("ALL")}>
                All Types
              </FilterPill>
              <FilterPill active={implFilter === "COMPANY"} onClick={() => setImplFilter("COMPANY")}>
                <Building2 size={11} />
                Company
              </FilterPill>
              <FilterPill active={implFilter === "USER_COMMITTEE"} onClick={() => setImplFilter("USER_COMMITTEE")}>
                <Users size={11} />
                User Committee
              </FilterPill>
            </div>

            <div className="w-px h-4 bg-border mx-1 shrink-0" />

            {/* Status */}
            <div className="flex gap-1.5 flex-wrap">
              <FilterPill active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                All Statuses
              </FilterPill>
              {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map((s) => (
                <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {STATUS_CONFIG[s].icon}
                  {STATUS_CONFIG[s].label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Contract No.
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Project
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Implementor
                      <span className="text-[10px] normal-case font-normal opacity-60">(Company / UC)</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Start (BS)
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Intended End (BS)
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} rowIndex={i} />)
                ) : filteredContracts.length === 0 ? (
                  <EmptyState filtered={isFiltered} />
                ) : (
                  filteredContracts.map((contract) => (
                    <ContractRow
                      key={contract.id}
                      contract={contract}
                      isAdmin={isAdmin}
                      isApproving={isApprovingContract}
                      onApprove={() => approveContract(contract.id)}
                      onDelete={() => setContractToDelete(contract)}
                      onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!isLoading && filteredContracts.length > 0 && (
            <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {filteredContracts.length} of {contracts.length} contracts
              </p>
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Contract Row ─────────────────────────────────────────────────────────────

function ContractRow({
  contract,
  isAdmin,
  isApproving,
  onApprove,
  onDelete,
  onClick,
}: {
  contract: Contract;
  isAdmin: boolean;
  isApproving: boolean;
  onApprove: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const hasAgreement = !!contract.agreement;
  const hasWorkOrder = !!contract.workOrder;

  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Contract Number */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-primary text-sm">
            {contract.contractNumber}
          </span>
          {/* Document indicators */}
          <div className="flex gap-1">
            {hasAgreement && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                <FileText size={9} />
                Agr
              </span>
            )}
            {hasWorkOrder && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                <CalendarClock size={9} />
                WO
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Project */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium truncate max-w-[200px]">
            {contract.project?.name ?? <span className="text-muted-foreground">—</span>}
          </span>
          {contract.project?.sNo && (
            <span className="text-xs text-muted-foreground">S.No: {contract.project.sNo}</span>
          )}
        </div>
      </td>

      {/* ✅ Fixed: Implementor — shows Company OR User Committee correctly */}
      <td className="px-4 py-3">
        <ImplBadge contract={contract} />
      </td>

      {/* Amount */}
      <td className="px-4 py-3">
        <span className="text-sm font-mono font-medium">
          रू {Number(contract.contractAmount).toLocaleString()}
        </span>
      </td>

      {/* Start Date — ✅ using correct field name */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {toNepaliDate(contract.startDate) ?? "—"}
      </td>

      {/* Intended Completion — ✅ using correct field name */}
      <td className="px-4 py-3">
        <IntendedDateCell contract={contract} />
      </td>

      {/* Status — workflow stage + time health derived from dates */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <ApprovalStatusBadge status={contract.approvalStatus} />
          <StatusBadge status={contract.status} />
          <TimeHealthBadge contract={contract} />
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div
          className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {isAdmin && contract.approvalStatus !== "APPROVED" && (
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="inline-flex p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50"
              title="Approve"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="inline-flex p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="View"
          >
            <Eye size={15} />
          </Link>
          <Link
            href={`/dashboard/contracts/${contract.id}/edit`}
            className="inline-flex p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </Link>
          {isAdmin && (
            <button
              onClick={onDelete}
              className="inline-flex p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Intended Date Cell ───────────────────────────────────────────────────────
// Shows overdue indicator if past intended date and not completed/archived

function IntendedDateCell({ contract }: { contract: Contract }) {
  const dateStr = contract.intendedCompletionDate;
  if (!dateStr) return <span className="text-sm text-muted-foreground">—</span>;

  const health    = getTimeHealth(contract);
  const isOverdue = health === "overdue";
  const isDone    = health === "completed";

  // Days overdue / remaining
  const now        = new Date();
  const intended   = new Date(dateStr);
  const diffDays   = Math.round(Math.abs(now.getTime() - intended.getTime()) / 86_400_000);

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-sm font-medium ${
        isOverdue ? "text-red-600 dark:text-red-400" :
        isDone    ? "text-green-600 dark:text-green-400" :
        "text-muted-foreground"
      }`}>
        {toNepaliDate(dateStr)}
      </span>

      {isOverdue && (
        <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
          <Ban size={9} />
          {diffDays}d overdue
        </span>
      )}

      {!isOverdue && !isDone && health === "ongoing" && (
        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
          <Clock size={9} />
          {diffDays}d left
        </span>
      )}

      {contract.actualCompletionDate && (
        <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
          <Flag size={9} />
          Done: {toNepaliDate(contract.actualCompletionDate)}
        </span>
      )}
    </div>
  );
}
