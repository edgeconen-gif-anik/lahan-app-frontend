"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRight, Archive, Building2, CalendarDays, CheckCircle2,
  CheckSquare, ClipboardList, Edit, FileText, Hash, Loader2, MoreHorizontal,
  Pencil, ReceiptText, RefreshCw, User, Users, Wallet,
} from "lucide-react";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ContractTimeline } from "@/components/contracts/detail/contract-timeline";
import { DocumentPanel } from "@/components/contracts/detail/document-panel";
import { StatusStepper } from "@/components/contracts/detail/status-stepper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/lib/auth/use-role";
import {
  buildAgreementDraftFromContract,
  buildWorkOrderDraftFromContract,
  formatContractCurrency,
  getContractDocumentVariant,
  getDocumentPartyLabel,
  getDocumentSignatoryLabel,
  hasCustomDocumentText,
} from "@/lib/contract-documents";
import {
  STATUS_CONFIG, daysBetween, formatBsDate, formatRelativeTime, formatUserName,
  getNextMilestone, getTimeHealth, type ContractStatus,
} from "@/lib/contract-detail-utils";
import { useApproveContract, useContract, useUpdateContract } from "@/hooks/contract/useContracts";
import { useProject } from "@/hooks/project/useProjects";

// ─── Small building blocks ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContractStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

function Card({ title, icon, children, action }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon && <span className="text-primary" aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {action}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, accent }: { label: string; value?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 text-sm font-medium sm:text-right ${accent ? "text-primary" : ""}`}>{value ?? "—"}</dd>
    </div>
  );
}

function Kpi({ label, value, hint, tone = "neutral", icon }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode;
  tone?: "neutral" | "good" | "bad"; icon: React.ReactNode;
}) {
  const toneCls = {
    neutral: "text-foreground",
    good: "text-emerald-700 dark:text-emerald-400",
    bad: "text-red-600 dark:text-red-400",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span aria-hidden="true">{icon}</span>{label}
      </p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-xs italic text-muted-foreground">{children}</span>;
}

function FinalEvaluatedAmountControl({ amount, canEdit, contractId }: {
  amount?: number | null; canEdit: boolean; contractId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: updateContract, isPending } = useUpdateContract();

  const display = amount != null ? formatContractCurrency(amount) : <Empty>Not recorded yet</Empty>;
  if (!canEdit) return <>{display}</>;

  if (!isEditing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 sm:justify-end">
        {display}
        <button
          type="button"
          onClick={() => { setValue(amount != null ? String(Number(amount)) : ""); setError(null); setIsEditing(true); }}
          className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          <Pencil size={12} aria-hidden="true" />Correct
        </button>
      </span>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = Number(value);
    if (!value.trim() || Number.isNaN(next) || next <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    try {
      await updateContract({ id: contractId, data: { finalEvaluatedAmount: next } });
      setIsEditing(false);
    } catch (e) {
      // The hook already toasts the backend message; keep the form open and say so inline.
      setError(e instanceof Error && e.message ? e.message : "Could not update amount.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <input
          type="number" min="1" step="0.01" autoFocus aria-label="Final evaluated amount"
          value={value} onChange={(e) => setValue(e.target.value)} disabled={isPending}
          className="w-36 rounded-md border bg-background px-2 py-1 text-right font-mono text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}Save
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const contractId = id as string;
  const { isAdmin } = useRole();

  const { mutate: approveContract, isPending: isApproving } = useApproveContract();
  const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();
  const { data: contract, isLoading, error, refetch, isFetching } = useContract(contractId);
  const { data: project, isLoading: projectLoading } = useProject(contract?.projectId ?? "");

  const [confirm, setConfirm] = useState<"approve" | "advance" | "archive" | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <Skeleton className="h-32 rounded-xl" /><Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    const notFound = (error as { response?: { status?: number } } | null)?.response?.status === 404;
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">
            {notFound ? "This contract does not exist or was removed." : "Failed to load contract."}
          </span>
        </div>
        <div className="flex gap-2">
          {!notFound && (
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />Retry
            </Button>
          )}
          <Button variant="outline" asChild><Link href="/dashboard/contracts">Back to contracts</Link></Button>
        </div>
      </div>
    );
  }

  // ── Derived state ──
  const status = contract.status as ContractStatus;
  const isCompleted = status === "COMPLETED";
  const isArchived = status === "ARCHIVED";
  const isApproved = contract.approvalStatus === "APPROVED";
  const health = getTimeHealth({ ...contract, status });
  const isOverdue = health === "overdue";

  const base = `/dashboard/contracts/${contractId}`;
  const printDoc = (path: string) => window.open(`${path}?print=1`, "_blank", "noopener,noreferrer");

  const variant = getContractDocumentVariant(contract);
  const partyLabel = getDocumentPartyLabel(variant);
  const contractorRole = getDocumentSignatoryLabel(variant);
  const agreementDraft = buildAgreementDraftFromContract(contract);
  const workOrderDraft = buildWorkOrderDraftFromContract(contract);
  const agreementCustom = contract.agreement ? hasCustomDocumentText(contract.agreement.content, agreementDraft) : false;
  const workOrderCustom = contract.workOrder ? hasCustomDocumentText(contract.workOrder.content, workOrderDraft) : false;
  const agreementAmount = contract.agreement?.amount ?? contract.contractAmount;
  const workOrderCompletion = contract.workOrder?.workCompletionDate ?? contract.intendedCompletionDate;

  const allocated = project?.allocatedBudget;
  const contractAmount = Number(contract.contractAmount);
  const budgetPct = allocated && allocated > 0 && !Number.isNaN(contractAmount)
    ? Math.round((contractAmount / allocated) * 100) : null;

  const remainingDays = contract.intendedCompletionDate
    ? daysBetween(new Date(), new Date(contract.intendedCompletionDate)) : null;

  const implementor = contract.company
    ? { type: "company" as const, name: contract.company.name, sub: contract.company.panNumber ? `PAN: ${contract.company.panNumber}` : undefined }
    : contract.userCommittee
      ? { type: "committee" as const, name: contract.userCommittee.name, sub: "User Committee" }
      : null;

  const nextMilestone = getNextMilestone(status);
  const canProgress = isAdmin && isApproved && !isArchived && nextMilestone !== null;
  const progressBlockedReason = isArchived ? null
    : !isAdmin ? "Only admins can move the contract to the next milestone."
    : !isApproved ? "Approve this contract before changing its milestone."
    : null;

  const handleAdvance = () => {
    if (!nextMilestone) return;
    if (nextMilestone === "COMPLETED") { router.push(`${base}/contract-update`); return; }
    setConfirm("advance");
  };
  const runStatusUpdate = (next: ContractStatus) =>
    updateContract({ id: contractId, data: { status: next } }, { onSuccess: () => setConfirm(null) });

  // One state-driven primary action; everything else goes in the "More" menu.
  const primary: { label: string; icon: React.ReactNode; onClick: () => void; pending?: boolean } | null =
    !isApproved && isAdmin
      ? { label: "Approve contract", icon: <CheckCircle2 size={14} />, onClick: () => setConfirm("approve"), pending: isApproving }
      : isApproved && !isCompleted && !isArchived
        ? { label: "Record completion", icon: <CheckSquare size={14} />, onClick: () => router.push(`${base}/contract-update`) }
        : isCompleted && contract.completionCode
          ? { label: "Payment form", icon: <ReceiptText size={14} />, onClick: () => router.push(`${base}/payment-form`) }
          : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-16 sm:p-6">
      <Breadcrumbs items={[
        { label: "Contracts", href: "/dashboard/contracts" },
        { label: contract.contractNumber },
      ]} />

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contract</p>
          <h1 className="mt-0.5 wrap-break-word text-xl font-bold tracking-tight sm:text-2xl">
            {contract.project?.name ?? contract.contractNumber}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="font-mono">{contract.contractNumber}</span>
            {implementor && <><span aria-hidden="true">·</span><span>{implementor.name}</span></>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <ApprovalStatusBadge status={contract.approvalStatus} />
            {isOverdue && remainingDays !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                <AlertTriangle size={12} aria-hidden="true" />Overdue by {Math.abs(remainingDays)}d
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {primary && (
            <Button onClick={primary.onClick} disabled={primary.pending}>
              {primary.pending ? <Loader2 size={14} className="animate-spin" /> : primary.icon}
              {primary.label}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`${base}/edit`)}>
            <Edit size={14} />Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => router.push(`${base}/agreement`)}>
                <FileText size={14} />Agreement document
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`${base}/work-order`)}>
                <ClipboardList size={14} />Work order document
              </DropdownMenuItem>
              {isCompleted && contract.completionCode && (
                <DropdownMenuItem onSelect={() => router.push(`${base}/payment-form`)}>
                  <ReceiptText size={14} />Payment form
                </DropdownMenuItem>
              )}
              {(isApproved || isAdmin) && (!isCompleted || isAdmin) && (
                <DropdownMenuItem onSelect={() => router.push(`${base}/contract-update`)}>
                  <CheckSquare size={14} />{isCompleted ? "Edit completion details" : "Contract update"}
                </DropdownMenuItem>
              )}
              {isAdmin && isApproved && !isArchived && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("archive")}>
                    <Archive size={14} />Archive contract
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Approval banner (blocking, so it sits at the top) ── */}
      {!isApproved && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold">
                {contract.approvalStatus === "REJECTED" ? "This contract was rejected" : "Awaiting admin approval"}
              </p>
              <p className="opacity-80">
                Milestone changes and completion are locked until an admin approves this contract.
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setConfirm("approve")} disabled={isApproving} className="shrink-0">
              {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </Button>
          )}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Wallet size={13} />} label="Contract amount" value={formatContractCurrency(contract.contractAmount)}
          hint={budgetPct !== null ? `${budgetPct}% of project budget` : projectLoading ? "Loading budget…" : undefined} />
        <Kpi icon={<Wallet size={13} />} label="Project budget"
          value={allocated != null ? formatContractCurrency(allocated) : projectLoading ? "…" : "—"} />
        <Kpi icon={<CalendarDays size={13} />}
          label={isCompleted ? "Completed" : isOverdue ? "Overdue" : "Time left"}
          tone={isOverdue ? "bad" : isCompleted ? "good" : "neutral"}
          value={isCompleted
            ? formatBsDate(contract.actualCompletionDate)
            : remainingDays === null ? "—"
            : isOverdue ? `${Math.abs(remainingDays)} days` : `${Math.max(0, remainingDays)} days`}
          hint={`Due ${formatBsDate(contract.intendedCompletionDate)}`} />
        <Kpi icon={<CheckCircle2 size={13} />} label="Final evaluated amount"
          tone={contract.finalEvaluatedAmount != null ? "good" : "neutral"}
          value={contract.finalEvaluatedAmount != null ? formatContractCurrency(contract.finalEvaluatedAmount) : "—"}
          hint={contract.finalEvaluatedAmount != null ? undefined : "Recorded on completion"} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── Main column ── */}
        <div className="space-y-5">
          <Card
            title="Progress"
            icon={<CalendarDays size={16} />}
            action={canProgress && nextMilestone ? (
              <Button size="sm" onClick={handleAdvance} disabled={isUpdating}>
                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                {nextMilestone === "COMPLETED" ? "Complete contract" : `Move to ${STATUS_CONFIG[nextMilestone].label}`}
              </Button>
            ) : undefined}
          >
            <div className="space-y-5">
              <StatusStepper status={status} />
              {progressBlockedReason && !isCompleted && (
                <p className="text-xs text-muted-foreground">{progressBlockedReason}</p>
              )}
              <div className="border-t pt-4">
                <ContractTimeline contract={contract} />
              </div>
            </div>
          </Card>

          <Card title="Contract details" icon={<Hash size={16} />}>
            <dl>
              <InfoRow label="Contract number" accent value={<span className="font-mono">{contract.contractNumber}</span>} />
              <InfoRow label="Contract amount" accent value={<span className="tabular-nums">{formatContractCurrency(contract.contractAmount)}</span>} />
              <InfoRow
                label="Final evaluated amount"
                value={<FinalEvaluatedAmountControl amount={contract.finalEvaluatedAmount}
                  canEdit={isAdmin && isCompleted} contractId={contract.id} />}
              />
              <InfoRow label="Start date (BS)" value={formatBsDate(contract.startDate)} />
              <InfoRow label="Intended completion (BS)" value={
                <span className={isOverdue ? "font-semibold text-red-600 dark:text-red-400" : ""}>
                  {formatBsDate(contract.intendedCompletionDate)}
                </span>
              } />
              <InfoRow label="Actual completion (BS)" value={
                contract.actualCompletionDate
                  ? <span className="text-green-600 dark:text-green-400">{formatBsDate(contract.actualCompletionDate)}</span>
                  : <Empty>Not yet completed</Empty>
              } />
              <InfoRow label="Completion code" value={
                contract.completionCode
                  ? <span className="font-mono text-emerald-700 dark:text-emerald-400">{contract.completionCode}</span>
                  : isApproved && !isArchived
                    ? <Link href={`${base}/contract-update`} className="text-xs text-primary underline-offset-2 hover:underline">
                        Generated after contract update →
                      </Link>
                    : <Empty>Not generated</Empty>
              } />
            </dl>
            {contract.remarks && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">Remarks</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{contract.remarks}</p>
              </div>
            )}
          </Card>

          <Card title="Documents" icon={<CheckSquare size={16} />}>
            <div className="space-y-4">
              <DocumentPanel
                accent="blue"
                icon={<FileText size={18} />}
                title="Agreement"
                badge={contract.agreement
                  ? { label: agreementCustom ? "Custom terms" : "Recorded", tone: agreementCustom ? "custom" : "ready" }
                  : { label: "Auto-generated", tone: "muted" }}
                summary={`${partyLabel} agreement, generated from the live contract details.`}
                meta={`Date ${formatBsDate(contract.agreement?.agreementDate ?? contract.startDate)} · ${formatContractCurrency(agreementAmount)}`}
                onOpen={() => router.push(`${base}/agreement`)}
                onPrint={() => printDoc(`${base}/agreement`)}
                printedText={agreementDraft}
                recordedLabel="Recorded terms"
                recordedText={agreementCustom ? contract.agreement?.content : null}
                signatories={[
                  { role: "Office signatory", name: contract.agreement?.officeSignatory },
                  { role: contractorRole, name: contract.agreement?.contractorSignatory },
                  { role: "Witness", name: contract.agreement?.witnessName },
                ]}
                signatoriesEmptyHint="No signatories recorded. Add them from Open → agreement page."
              />
              <DocumentPanel
                accent="violet"
                icon={<ClipboardList size={18} />}
                title="Work order"
                badge={contract.workOrder
                  ? { label: workOrderCustom ? "Custom scope" : "Recorded", tone: workOrderCustom ? "custom" : "ready" }
                  : { label: "Auto-generated", tone: "muted" }}
                summary={`${partyLabel} work order, generated from the live contract details.`}
                meta={`Completion target ${formatBsDate(workOrderCompletion)}`}
                onOpen={() => router.push(`${base}/work-order`)}
                onPrint={() => printDoc(`${base}/work-order`)}
                printedText={workOrderDraft}
                recordedLabel="Recorded scope"
                recordedText={workOrderCustom ? contract.workOrder?.content : null}
                signatories={[
                  { role: "Office signatory", name: contract.workOrder?.officeSignatory },
                  { role: contractorRole, name: contract.workOrder?.contractorSignatory },
                  { role: "Witness", name: contract.workOrder?.witnessName },
                ]}
                signatoriesEmptyHint="No signatories recorded. Add them from Open → work order page."
              />
              <DocumentPanel
                accent="emerald"
                icon={<ReceiptText size={18} />}
                title="Payment recommendation"
                badge={isCompleted && contract.completionCode
                  ? { label: "Ready", tone: "ready" } : { label: "Not available yet", tone: "muted" }}
                summary="Ma. Le. Pa. Form 202 payment recommendation."
                meta={`Completion code: ${contract.completionCode ?? "not generated"}`}
                onOpen={() => router.push(`${base}/payment-form`)}
                onPrint={() => printDoc(`${base}/payment-form`)}
                disabledReason={isCompleted && contract.completionCode
                  ? undefined : "Available once the contract is completed and a completion code is generated."}
              />
            </div>
          </Card>
        </div>

        {/* ── Side column ── */}
        <aside className="space-y-5 lg:sticky lg:top-4">
          <Card title="Approval" icon={<CheckCircle2 size={16} />}>
            <dl>
              <InfoRow label="Status" value={<ApprovalStatusBadge status={contract.approvalStatus} />} />
              <InfoRow label="Approved" value={contract.approvedAt ? formatBsDate(contract.approvedAt) : <Empty>Not approved yet</Empty>} />
              <InfoRow label="Submitted by" value={
                contract.initiatedBy ? (
                  <span className="flex min-w-0 flex-col sm:items-end">
                    <span className="inline-flex items-center gap-1.5">
                      <User size={12} className="text-muted-foreground" aria-hidden="true" />
                      {formatUserName(contract.initiatedBy)}
                    </span>
                    {contract.initiatedBy.email && contract.initiatedBy.name && (
                      <span className="break-all text-xs font-normal text-muted-foreground">{contract.initiatedBy.email}</span>
                    )}
                  </span>
                ) : contract.initiatedById ? (
                  <span className="break-all font-mono text-xs">{contract.initiatedById}</span>
                ) : <Empty>Not recorded</Empty>
              } />
            </dl>
          </Card>

          {contract.project && (
            <Card title="Project" icon={<FileText size={16} />}>
              <dl>
                <InfoRow label="Name" value={
                  <Link href={`/dashboard/projects/${contract.projectId}`} className="text-primary underline-offset-2 hover:underline">
                    {contract.project.name}
                  </Link>
                } />
                {contract.project.sNo && <InfoRow label="S.No." value={contract.project.sNo} />}
              </dl>
            </Card>
          )}

          {implementor && (
            <Card title="Implementation" icon={implementor.type === "company" ? <Building2 size={16} /> : <Users size={16} />}>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  implementor.type === "company"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                  {implementor.type === "company" ? <Building2 size={16} /> : <Users size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-semibold">{implementor.name}</p>
                  {implementor.sub && <p className="text-xs text-muted-foreground">{implementor.sub}</p>}
                </div>
              </div>
              <dl className="mt-3 border-t pt-1">
                <InfoRow label="Document format" value={partyLabel} />
                {contract.user && (
                  <InfoRow label="Site incharge" value={
                    <span className="flex flex-col sm:items-end">
                      <span>{contract.user.name ?? "—"}</span>
                      {contract.user.designation && (
                        <span className="text-xs font-normal text-muted-foreground">{contract.user.designation}</span>
                      )}
                    </span>
                  } />
                )}
              </dl>
            </Card>
          )}

          <p className="px-1 text-xs text-muted-foreground">
            <span title={new Date(contract.createdAt).toLocaleString()}>Created {formatRelativeTime(contract.createdAt)}</span>
            {" · "}
            <span title={new Date(contract.updatedAt).toLocaleString()}>Updated {formatRelativeTime(contract.updatedAt)}</span>
          </p>
        </aside>
      </div>

      {/* ── Confirmations ── */}
      <ConfirmDialog
        open={confirm === "approve"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Approve this contract?"
        description="Approval unlocks milestone changes and completion for this contract. This cannot be undone from this page."
        confirmLabel="Approve"
        isPending={isApproving}
        onConfirm={() => approveContract(contract.id, { onSuccess: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === "advance"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={nextMilestone ? `Move to ${STATUS_CONFIG[nextMilestone].label}?` : "Move to next milestone?"}
        description="Milestones only move forward; you cannot go back to an earlier one."
        confirmLabel="Move forward"
        isPending={isUpdating}
        onConfirm={() => nextMilestone && runStatusUpdate(nextMilestone)}
      />
      <ConfirmDialog
        open={confirm === "archive"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Archive this contract?"
        description="Archived contracts cannot move to another milestone."
        confirmLabel="Archive"
        destructive
        isPending={isUpdating}
        onConfirm={() => runStatusUpdate("ARCHIVED")}
      />
    </div>
  );
}
