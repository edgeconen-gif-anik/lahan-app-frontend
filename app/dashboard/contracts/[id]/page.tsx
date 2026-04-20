"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, FileText, ClipboardList, CheckSquare,
  Building2, Users, User, Hash, AlertTriangle,
  CheckCircle2, Clock, BadgeCheck, Loader2,
  ChevronDown, Pencil, Ban, Printer,
  CalendarDays, TrendingUp, Archive,
} from "lucide-react";
import { useContract, useUpdateContract } from "@/hooks/contract/useContracts";
import type { UpdateContractPayload } from "@/lib/schema/contract/contract";
import {
  buildAgreementDraftFromContract,
  buildWorkOrderDraftFromContract,
  formatContractCurrency,
  getContractDocumentVariant,
  getDocumentPartyLabel,
  getDocumentSignatoryLabel,
  hasCustomDocumentText,
} from "@/lib/contract-documents";
import { toNepaliDate } from "@/lib/date-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractStatus =
  | "NOT_STARTED" | "AGREEMENT" | "WORKORDER"
  | "WORKINPROGRESS" | "COMPLETED" | "ARCHIVED";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBsDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return toNepaliDate(new Date(iso)) ?? new Date(iso).toLocaleDateString();
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function formatCurrency(amount?: number | string | null): string {
  if (amount == null || amount === "") return "—";
  return "रू " + Number(amount).toLocaleString("en-IN");
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// Derive the "time health" of a contract based purely on dates + status
function getTimeHealth(contract: {
  startDate?: string | null;
  intendedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status?: string;
}): "ongoing" | "overdue" | "completed" | "not_started" | "archived" {
  const { startDate, intendedCompletionDate, actualCompletionDate, status } = contract;
  if (status === "ARCHIVED") return "archived";
  if (status === "COMPLETED" || actualCompletionDate) return "completed";
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const intended = intendedCompletionDate ? new Date(intendedCompletionDate) : null;
  if (!start || now < start) return "not_started";
  if (intended && now > intended) return "overdue";
  return "ongoing";
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContractStatus, {
  label: string;
  icon: React.ReactNode;
  pill: string;
  dot: string;
}> = {
  NOT_STARTED: {
    label: "Not Started",
    icon: <Clock size={13} />,
    pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  AGREEMENT: {
    label: "Agreement",
    icon: <FileText size={13} />,
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  WORKORDER: {
    label: "Work Order",
    icon: <ClipboardList size={13} />,
    pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-400 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  WORKINPROGRESS: {
    label: "In Progress",
    icon: <TrendingUp size={13} />,
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  COMPLETED: {
    label: "Completed",
    icon: <BadgeCheck size={13} />,
    pill: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-400 dark:border-green-800",
    dot: "bg-green-500",
  },
  ARCHIVED: {
    label: "Archived",
    icon: <Archive size={13} />,
    pill: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
};

const STATUS_ORDER: ContractStatus[] = [
  "NOT_STARTED", "AGREEMENT", "WORKORDER", "WORKINPROGRESS", "COMPLETED", "ARCHIVED",
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[(status as ContractStatus) ?? "NOT_STARTED"] ?? STATUS_CONFIG.NOT_STARTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Time Health Badge ────────────────────────────────────────────────────────

function TimeHealthBadge({ health }: { health: ReturnType<typeof getTimeHealth> }) {
  const configs = {
    ongoing:     { label: "Ongoing",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800", icon: <TrendingUp size={12} /> },
    overdue:     { label: "Overdue",     cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",                         icon: <Ban size={12} /> },
    completed:   { label: "Completed",   cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",              icon: <CheckCircle2 size={12} /> },
    not_started: { label: "Not Started", cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",               icon: <Clock size={12} /> },
    archived:    { label: "Archived",    cls: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",                     icon: <Archive size={12} /> },
  };
  const cfg = configs[health];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Status Update Dropdown ───────────────────────────────────────────────────

function StatusUpdater({
  currentStatus,
  contractId,
  onUpdated,
}: {
  currentStatus?: string;
  contractId: string;
  onUpdated: (newStatus: ContractStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { mutateAsync: updateContract } = useUpdateContract();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (status: ContractStatus) => {
    if (status === currentStatus) { setOpen(false); return; }
    setSaving(true);
    try {
      const statusUpdate: UpdateContractPayload & { status?: ContractStatus } = {
        status,
      };

      await updateContract({ id: contractId, data: statusUpdate });
      onUpdated(status);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
        Update Status
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="p-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Set Status
            </p>
            {STATUS_ORDER.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = s === currentStatus;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg transition-colors text-left
                    ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                  {isActive && <CheckCircle2 size={12} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contract Timeline ────────────────────────────────────────────────────────

function ContractTimeline({ contract }: {
  contract: {
    startDate?: string | null;
    intendedCompletionDate?: string | null;
    actualCompletionDate?: string | null;
    status?: string;
  };
}) {
  const { startDate, intendedCompletionDate, actualCompletionDate } = contract;
  if (!startDate || !intendedCompletionDate) return null;

  const start    = new Date(startDate);
  const intended = new Date(intendedCompletionDate);
  const actual   = actualCompletionDate ? new Date(actualCompletionDate) : null;
  const now      = new Date();

  // Timeline span: start → max(intended, actual, now) + small padding
  const endAnchor = actual
    ? new Date(Math.max(intended.getTime(), actual.getTime(), now.getTime()))
    : new Date(Math.max(intended.getTime(), now.getTime()));

  // Add 5% padding on each side so markers aren't clipped
  const totalSpan  = endAnchor.getTime() - start.getTime();
  const padMs      = totalSpan * 0.05;
  const rangeStart = new Date(start.getTime() - padMs);
  const rangeEnd   = new Date(endAnchor.getTime() + padMs);
  const range      = rangeEnd.getTime() - rangeStart.getTime();

  const pct = (d: Date) =>
    Math.max(0, Math.min(100, ((d.getTime() - rangeStart.getTime()) / range) * 100));

  const startPct    = pct(start);
  const intendedPct = pct(intended);
  const actualPct   = actual ? pct(actual) : null;
  const nowPct      = pct(now);

  const totalDays      = daysBetween(start, intended);
  const elapsedDays    = Math.max(0, daysBetween(start, now));
  const remainingDays  = daysBetween(now, intended);
  const isOverdue      = now > intended && !actual;
  const isCompleted    = !!actual;
  const overdueByDays  = isOverdue ? Math.abs(remainingDays) : 0;

  // Progress bar fill: from start → min(now, intended)
  const progressEnd     = actual ? actual : (now < intended ? now : intended);
  const progressFillPct = pct(progressEnd) - startPct;

  const barColor = isCompleted
    ? "bg-green-500"
    : isOverdue
    ? "bg-red-500"
    : "bg-primary";

  // ── Staggered label collision fix ────────────────────────────────────────
  // Build an ordered list of bottom-row markers sorted left→right, then assign
  // alternating lane depths (lane 0 = closer, lane 1 = further) so adjacent
  // labels never share the same vertical position.
  type MarkerDef = {
    pct: number;
    color: string;
    sublabel: string;
    label: string;
    diamond?: boolean;
    today?: boolean;
    top?: boolean;   // rendered above the bar
  };

  const bottomMarkers: MarkerDef[] = [
    { pct: startPct,    color: "bg-slate-500", sublabel: "Start",        label: formatBsDate(startDate) },
    { pct: intendedPct, color: isOverdue ? "bg-red-500" : isCompleted ? "bg-green-500" : "bg-primary",
      sublabel: "Intended End", label: formatBsDate(intendedCompletionDate) },
    ...(actual && actualPct !== null
      ? [{ pct: actualPct, color: "bg-green-500", sublabel: "Actual End", label: formatBsDate(actualCompletionDate), diamond: true }]
      : []),
  ].sort((a, b) => a.pct - b.pct);

  // Assign lane 0/1 alternating — but if two markers are very close (<12 pct apart)
  // force them into different lanes even if alternation already handled it.
  const lanes: number[] = bottomMarkers.map((_, i) => i % 2);
  for (let i = 1; i < bottomMarkers.length; i++) {
    if (bottomMarkers[i].pct - bottomMarkers[i - 1].pct < 14 && lanes[i] === lanes[i - 1]) {
      lanes[i] = 1 - lanes[i - 1];
    }
  }

  // Lane depth: lane 0 = 36px below bar, lane 1 = 68px below bar
  const LANE_Y = [36, 68];

  return (
    <div className="space-y-4">

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
          <CalendarDays size={11} />
          {totalDays} day contract
        </span>
        {!isCompleted && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium
            ${isOverdue
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
            }`}>
            {isOverdue ? <Ban size={11} /> : <Clock size={11} />}
            {isOverdue
              ? `${overdueByDays}d overdue`
              : `${remainingDays}d remaining`}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
          <TrendingUp size={11} />
          {Math.min(100, Math.round((elapsedDays / totalDays) * 100))}% elapsed
        </span>
        {isCompleted && actual && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800 border font-medium">
            <CheckCircle2 size={11} />
            Done {daysBetween(actual, intended) >= 0
              ? `${daysBetween(actual, intended)}d early`
              : `${Math.abs(daysBetween(actual, intended))}d late`}
          </span>
        )}
      </div>

      {/* ── Timeline ── */}
      {/*
        Layout (px from top of the outer div):
          0 – 20px  : "Today" label + tick (top lane, above bar)
          20px       : bar track (h-3)
          23px+      : bottom marker ticks + staggered label lanes
        Total reserved height = top-area (28px) + bar (12px) + bottom lanes (80px) = ~120px
      */}
      <div className="relative select-none" style={{ height: "120px" }}>

        {/* Today label above bar */}
        {!isCompleted && nowPct > 0 && nowPct < 100 && (
          <div
            className="absolute"
            style={{ left: `${nowPct}%`, top: 0 }}
          >
            {/* label */}
            <div
              className="absolute bottom-0 whitespace-nowrap text-[10px] leading-tight"
              style={{
                transform: nowPct > 78 ? "translateX(-100%)"
                         : nowPct < 22 ? "translateX(0)"
                         : "translateX(-50%)",
              }}
            >
              <span className="font-bold text-foreground block">Today</span>
              <span className="text-muted-foreground/80">{formatBsDate(now.toISOString())}</span>
            </div>
          </div>
        )}

        {/* Bar track — positioned 28px from top */}
        <div
          className="absolute left-0 right-0 h-3 rounded-full bg-muted border overflow-visible"
          style={{ top: "28px" }}
        >
          {/* Progress fill */}
          <div
            className={`absolute top-0 h-full rounded-full ${barColor} opacity-85`}
            style={{ left: `${startPct}%`, width: `${Math.max(0, progressFillPct)}%` }}
          />

          {/* Overdue extension */}
          {isOverdue && (
            <div
              className="absolute top-0 h-full rounded-r-full bg-red-400/25 border-r-2 border-dashed border-red-500"
              style={{ left: `${intendedPct}%`, width: `${Math.max(0, nowPct - intendedPct)}%` }}
            />
          )}

          {/* Today dashed vertical line through bar */}
          {!isCompleted && nowPct > 0 && nowPct < 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 bg-foreground rounded-full shadow"
              style={{ left: `${nowPct}%`, height: "20px", marginLeft: "-1px" }}
            />
          )}

          {/* ── Bottom markers (dots only, labels rendered outside) ── */}
          {bottomMarkers.map((m, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${m.pct}%` }}
            >
              {m.diamond ? (
                <span
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 ${m.color} rotate-45 rounded-sm border-2 border-background shadow-md`}
                  style={{ top: "50%" }}
                />
              ) : (
                <span
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 ${m.color} rounded-full border-2 border-background shadow-md`}
                  style={{ top: "50%" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Staggered labels below bar ── */}
        {bottomMarkers.map((m, i) => {
          const laneY  = LANE_Y[lanes[i]];   // px below top of outer div
          const tickH  = laneY - 4;           // tick connects dot bottom → label

          // Clamp horizontal alignment so labels don't overflow left/right edges
          const align: "left" | "center" | "right" =
            m.pct < 18 ? "left" : m.pct > 82 ? "right" : "center";

          return (
            <div key={i} className="absolute" style={{ left: `${m.pct}%`, top: "28px" }}>
              {/* Tick from dot to label */}
              <div
                className="absolute left-1/2 -translate-x-px w-px bg-muted-foreground/25"
                style={{ top: "12px", height: `${tickH}px` }}
              />
              {/* Label */}
              <div
                className="absolute whitespace-nowrap text-[10px] leading-tight"
                style={{
                  top: `${laneY + 12}px`,
                  ...(align === "center"
                    ? { transform: "translateX(-50%)" }
                    : align === "right"
                    ? { transform: "translateX(-100%)" }
                    : {}),
                }}
              >
                <span className="font-semibold text-muted-foreground block">{m.sublabel}</span>
                <span className="text-muted-foreground/65">{m.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t pt-3">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Start</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Progress</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground border border-background" />Today</span>
        {actual && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-green-500 rotate-45 inline-block" />Actual End</span>}
        {isOverdue && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Overdue</span>}
      </div>
    </div>
  );
}

// TimelineMarker is now inlined inside ContractTimeline for stagger control.

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, accent }: {
  label: string; value?: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${accent ? "text-primary" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children, collapsible = false }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-5 py-3.5 border-b bg-muted/20 ${collapsible ? "cursor-pointer hover:bg-muted/40 transition-colors" : "cursor-default"}`}
      >
        <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h2>
        {collapsible && (
          <ChevronDown size={15} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {(!collapsible || open) && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function DocumentActionCard({
  accent,
  available,
  detail,
  icon,
  meta,
  onOpen,
  onPrint,
  title,
}: {
  accent: "blue" | "violet";
  available: boolean;
  detail: string;
  icon: React.ReactNode;
  meta: string;
  onOpen?: () => void;
  onPrint?: () => void;
  title: string;
}) {
  const accentCls = accent === "blue"
    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
    : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentCls}`}>
          {icon}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            available
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {available ? "Ready" : "Not Attached"}
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{detail}</p>
        <p className="text-xs font-medium text-muted-foreground">{meta}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          disabled={!available || !onOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {icon}
          Open
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={!available || !onPrint}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={14} />
          Print
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DocumentTextBlock({
  text,
  title,
}: {
  text: string;
  title: string;
}) {
  return (
    <div className="mt-3 space-y-1.5 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

export default function ContractDetailPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const [localStatus, setLocalStatus] = useState<ContractStatus | undefined>(undefined);

  const { data: contract, isLoading, error } = useContract(id as string);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">Failed to load contract. Please try again.</span>
        </div>
      </div>
    );
  }

  const displayStatus = (localStatus ?? contract.status) as ContractStatus;
  const health        = getTimeHealth({ ...contract, status: displayStatus });
  const openDocumentPrint = (path: string) => {
    window.open(`${path}?print=1`, "_blank", "noopener,noreferrer");
  };
  const documentVariant = getContractDocumentVariant(contract);
  const documentPartyLabel = getDocumentPartyLabel(documentVariant);
  const agreementDraftText = contract.agreement
    ? buildAgreementDraftFromContract(contract)
    : "";
  const workOrderDraftText = contract.workOrder
    ? buildWorkOrderDraftFromContract(contract)
    : "";
  const agreementHasCustomText = contract.agreement
    ? hasCustomDocumentText(contract.agreement.content, agreementDraftText)
    : false;
  const workOrderHasCustomText = contract.workOrder
    ? hasCustomDocumentText(contract.workOrder.content, workOrderDraftText)
    : false;

  const implementor = contract.company
    ? { type: "company"   as const, name: contract.company.name, sub: contract.company.panNumber ? `PAN: ${contract.company.panNumber}` : undefined }
    : contract.userCommittee
    ? { type: "committee" as const, name: contract.userCommittee.name, sub: "User Committee" }
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 pb-16">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground mt-0.5"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">Contract Details</h1>
              <StatusBadge status={displayStatus} />
              <TimeHealthBadge health={health} />
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {contract.contractNumber}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {contract.agreement && (
            <button
              onClick={() => router.push(`/dashboard/contracts/${id}/agreement`)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <FileText size={13} />
              Agreement
            </button>
          )}
          {contract.workOrder && (
            <button
              onClick={() => router.push(`/dashboard/contracts/${id}/work-order`)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ClipboardList size={13} />
              Work Order
            </button>
          )}
          <StatusUpdater
            currentStatus={displayStatus}
            contractId={id as string}
            onUpdated={setLocalStatus}
          />
          <button
            onClick={() => router.push(`/dashboard/contracts/${id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <Edit size={13} />
            Edit
          </button>
        </div>
      </div>

      {/* ── Timeline ── */}
      <Section title="Project Timeline" icon={<CalendarDays size={16} />}>
        <ContractTimeline contract={contract} />
      </Section>

      {/* ── General Details ── */}
      <Section title="General Details" icon={<Hash size={16} />}>
        <InfoRow label="Contract Number" value={
          <span className="font-mono">{contract.contractNumber}</span>
        } accent />
        <InfoRow label="Contract Amount" value={formatCurrency(contract.contractAmount)} accent />
        <InfoRow label="Start Date (BS)" value={formatBsDate(contract.startDate)} />
        <InfoRow
          label="Intended Completion (BS)"
          value={
            <span className={health === "overdue" ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
              {formatBsDate(contract.intendedCompletionDate)}
              {health === "overdue" && (
                <span className="ml-1.5 text-xs font-normal opacity-80">
                  (overdue by {Math.abs(daysBetween(new Date(), new Date(contract.intendedCompletionDate!)))}d)
                </span>
              )}
            </span>
          }
        />
        <InfoRow
          label="Actual Completion (BS)"
          value={
            contract.actualCompletionDate
              ? <span className="text-green-600 dark:text-green-400">{formatBsDate(contract.actualCompletionDate)}</span>
              : <span className="text-muted-foreground italic text-xs">Not yet completed</span>
          }
        />
        {contract.remarks && (
          <InfoRow label="Remarks" value={
            <span className="max-w-xs text-right leading-snug">{contract.remarks}</span>
          } />
        )}
      </Section>

      {/* ── Project ── */}
      {contract.project && (
        <Section title="Project" icon={<FileText size={16} />}>
          <InfoRow label="Name" value={contract.project.name} />
          {contract.project.sNo && <InfoRow label="S.No." value={contract.project.sNo} />}
        </Section>
      )}

      {/* ── Implementation ── */}
      {implementor && (
        <Section
          title="Implementation"
          icon={implementor.type === "company" ? <Building2 size={16} /> : <Users size={16} />}
        >
          <InfoRow label="Document Format" value={documentPartyLabel} />
          <div className="flex items-center gap-3 py-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
              ${implementor.type === "company"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              }`}
            >
              {implementor.type === "company" ? <Building2 size={16} /> : <Users size={16} />}
            </div>
            <div>
              <p className="text-sm font-semibold">{implementor.name}</p>
              {implementor.sub && (
                <p className="text-xs text-muted-foreground">{implementor.sub}</p>
              )}
            </div>
          </div>
          {contract.user && (
            <div className="mt-3 pt-3 border-t">
              <InfoRow
                label="Site Incharge"
                value={
                  <span className="flex items-center gap-1.5">
                    <User size={12} className="text-muted-foreground" />
                    {contract.user.name ?? "—"}
                    {contract.user.designation && (
                      <span className="text-xs text-muted-foreground font-normal">
                        · {contract.user.designation}
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          )}
        </Section>
      )}

      <Section title="Documents" icon={<CheckSquare size={16} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DocumentActionCard
            accent="blue"
            available={!!contract.agreement}
            detail={
              contract.agreement
                ? `${documentPartyLabel} agreement ready to open or print directly from this page.`
                : "Attach an agreement to unlock the printable agreement document."
            }
            icon={<FileText size={18} />}
            meta={
              contract.agreement
                ? `${agreementHasCustomText ? "Custom recorded terms" : "Auto-generated terms"} | Amount: ${formatContractCurrency(contract.agreement.amount)}`
                : "Agreement document is not available yet."
            }
            onOpen={
              contract.agreement
                ? () => router.push(`/dashboard/contracts/${id}/agreement`)
                : undefined
            }
            onPrint={
              contract.agreement
                ? () => openDocumentPrint(`/dashboard/contracts/${id}/agreement`)
                : undefined
            }
            title="Agreement Document"
          />

          <DocumentActionCard
            accent="violet"
            available={!!contract.workOrder}
            detail={
              contract.workOrder
                ? `${documentPartyLabel} work order ready to open, print, and share for execution.`
                : "Attach a work order to unlock the standard printable work order."
            }
            icon={<ClipboardList size={18} />}
            meta={
              contract.workOrder
                ? `${workOrderHasCustomText ? "Custom recorded scope" : "Auto-generated scope"} | Completion target: ${formatBsDate(contract.workOrder.workCompletionDate)}`
                : "Work order document is not available yet."
            }
            onOpen={
              contract.workOrder
                ? () => router.push(`/dashboard/contracts/${id}/work-order`)
                : undefined
            }
            onPrint={
              contract.workOrder
                ? () => openDocumentPrint(`/dashboard/contracts/${id}/work-order`)
                : undefined
            }
            title="Work Order Document"
          />
        </div>
      </Section>

      {/* ── Agreement ── */}
      <Section
        title={contract.agreement ? "Agreement" : "Agreement — Not Attached"}
        icon={<ClipboardList size={16} />}
        collapsible={!!contract.agreement}
      >
        {contract.agreement ? (
          <>
            <InfoRow label="Agreement Date (BS)" value={formatBsDate(contract.agreement.agreementDate)} />
            <InfoRow label="Amount" value={formatCurrency(contract.agreement.amount)} accent />
            <InfoRow
              label="Text Source"
              value={agreementHasCustomText ? "Custom recorded terms" : "Auto-generated from contract details"}
            />
            <div className="mt-3 border-t pt-3">
              <DocumentTextBlock
                title="Printable Summary"
                text={agreementDraftText}
              />
              {agreementHasCustomText && (
                <DocumentTextBlock
                  title="Recorded Terms"
                  text={contract.agreement.content}
                />
              )}
            </div>
            {(contract.agreement.officeSignatory || contract.agreement.contractorSignatory || contract.agreement.witnessName) && (
              <div className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contract.agreement.officeSignatory && (
                  <SignatoryCard role="Office Signatory" name={contract.agreement.officeSignatory} />
                )}
                {contract.agreement.contractorSignatory && (
                  <SignatoryCard
                    role={getDocumentSignatoryLabel(documentVariant)}
                    name={contract.agreement.contractorSignatory}
                  />
                )}
                {contract.agreement.witnessName && (
                  <SignatoryCard role="Witness" name={contract.agreement.witnessName} />
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic py-1">No agreement attached to this contract.</p>
        )}
      </Section>

      {/* ── Work Order ── */}
      <Section
        title={contract.workOrder ? "Work Order" : "Work Order — Not Attached"}
        icon={<CheckSquare size={16} />}
        collapsible={!!contract.workOrder}
      >
        {contract.workOrder ? (
          <>
            <InfoRow label="Work Completion Date (BS)" value={formatBsDate(contract.workOrder.workCompletionDate)} />
            <InfoRow
              label="Text Source"
              value={workOrderHasCustomText ? "Custom recorded scope" : "Auto-generated from contract details"}
            />
            <div className="mt-3 border-t pt-3">
              <DocumentTextBlock
                title="Printable Summary"
                text={workOrderDraftText}
              />
              {workOrderHasCustomText && (
                <DocumentTextBlock
                  title="Recorded Scope"
                  text={contract.workOrder.content}
                />
              )}
            </div>
            {(contract.workOrder.officeSignatory || contract.workOrder.contractorSignatory || contract.workOrder.witnessName) && (
              <div className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contract.workOrder.officeSignatory && (
                  <SignatoryCard role="Office Signatory" name={contract.workOrder.officeSignatory} />
                )}
                {contract.workOrder.contractorSignatory && (
                  <SignatoryCard
                    role={getDocumentSignatoryLabel(documentVariant)}
                    name={contract.workOrder.contractorSignatory}
                  />
                )}
                {contract.workOrder.witnessName && (
                  <SignatoryCard role="Witness" name={contract.workOrder.witnessName} />
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic py-1">No work order attached to this contract.</p>
        )}
      </Section>

      {/* ── Metadata ── */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground px-1">
        <span>Created: {new Date(contract.createdAt).toLocaleString()}</span>
        <span>Updated: {new Date(contract.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Signatory Card ───────────────────────────────────────────────────────────

function SignatoryCard({ role, name }: { role: string; name: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {role}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}
