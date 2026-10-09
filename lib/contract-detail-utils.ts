import { toNepaliDate } from "@/lib/date-utils";

export type ContractStatus =
  | "NOT_STARTED" | "AGREEMENT" | "WORKORDER"
  | "WORKINPROGRESS" | "COMPLETED" | "ARCHIVED";

export type TimeHealth = "ongoing" | "overdue" | "completed" | "not_started" | "archived";

export const MS_PER_DAY = 86_400_000;

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** BS date for display; flags the AD fallback so it is never mistaken for BS. */
export function formatBsDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const bs = toNepaliDate(date);
  return bs && bs !== "Invalid Date" && bs !== "N/A"
    ? bs
    : `${date.toLocaleDateString()} (AD)`;
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const days = daysBetween(date, new Date());
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatBsDate(iso);
}

export function formatUserName(
  user?: { name?: string | null; email?: string | null } | null,
): string {
  return user?.name || user?.email || "Unknown user";
}

export function getTimeHealth(contract: {
  startDate?: string | null;
  intendedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status?: string;
}): TimeHealth {
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

export const STATUS_CONFIG: Record<ContractStatus, { label: string; dot: string; pill: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  AGREEMENT: {
    label: "Agreement",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800",
  },
  WORKORDER: {
    label: "Work Order",
    dot: "bg-violet-500",
    pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-400 dark:border-violet-800",
  },
  WORKINPROGRESS: {
    label: "In Progress",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-green-500",
    pill: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-400 dark:border-green-800",
  },
  ARCHIVED: {
    label: "Archived",
    dot: "bg-zinc-400",
    pill: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
};

/** Milestones shown in the stepper (ARCHIVED is a terminal side-state). */
export const MILESTONES: ContractStatus[] = [
  "NOT_STARTED", "AGREEMENT", "WORKORDER", "WORKINPROGRESS", "COMPLETED",
];

export function getNextMilestone(current?: string): ContractStatus | null {
  const index = MILESTONES.indexOf(current as ContractStatus);
  if (index === -1 || index >= MILESTONES.length - 1) return null;
  return MILESTONES[index + 1];
}
