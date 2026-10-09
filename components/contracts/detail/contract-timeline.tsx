import { Ban, CalendarDays, CheckCircle2, Clock, TrendingUp } from "lucide-react";

import { daysBetween, formatBsDate } from "@/lib/contract-detail-utils";

type TimelineContract = {
  startDate?: string | null;
  intendedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
};

function Chip({ tone, children }: { tone: "muted" | "good" | "bad"; children: React.ReactNode }) {
  const cls = {
    muted: "bg-muted text-muted-foreground",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    bad: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function DateCell({ label, value, dotClass }: { label: string; value: string; dotClass: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ContractTimeline({ contract }: { contract: TimelineContract }) {
  const { startDate, intendedCompletionDate, actualCompletionDate } = contract;
  if (!startDate || !intendedCompletionDate) {
    return <p className="text-sm text-muted-foreground">Start and intended completion dates are not set yet.</p>;
  }

  const start = new Date(startDate);
  const intended = new Date(intendedCompletionDate);
  const actual = actualCompletionDate ? new Date(actualCompletionDate) : null;
  const now = new Date();

  const isCompleted = Boolean(actual);
  const isOverdue = !isCompleted && now > intended;
  const totalDays = Math.max(0, daysBetween(start, intended));
  const elapsedDays = Math.max(0, daysBetween(start, now));
  const remainingDays = daysBetween(now, intended);
  const elapsedPct =
    totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : isOverdue ? 100 : 0;

  // Bar spans start → latest of intended/actual/now, with a little padding.
  const endAnchor = Math.max(intended.getTime(), actual?.getTime() ?? 0, now.getTime());
  const span = Math.max(1, endAnchor - start.getTime());
  const pad = span * 0.04;
  const from = start.getTime() - pad;
  const range = span + pad * 2;
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - from) / range) * 100));

  const startPct = pct(start);
  const intendedPct = pct(intended);
  const nowPct = pct(now);
  const actualPct = actual ? pct(actual) : null;

  const fillEnd = actualPct ?? Math.min(nowPct, intendedPct);
  const barColor = isCompleted ? "bg-green-500" : isOverdue ? "bg-red-500" : "bg-primary";

  const ariaLabel = actual
    ? `Completed ${Math.abs(daysBetween(actual, intended))} days ${actual <= intended ? "early" : "late"}`
    : isOverdue
      ? `${elapsedDays} of ${totalDays} days elapsed, ${Math.abs(remainingDays)} days overdue`
      : `${elapsedDays} of ${totalDays} days elapsed, ${remainingDays} days remaining`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip tone="muted"><CalendarDays size={11} />{totalDays} day contract</Chip>
        {actual ? (
          <Chip tone={actual <= intended ? "good" : "bad"}>
            <CheckCircle2 size={11} />
            {actual <= intended
              ? `Done ${daysBetween(actual, intended)}d early`
              : `Done ${daysBetween(intended, actual)}d late`}
          </Chip>
        ) : isOverdue ? (
          <Chip tone="bad"><Ban size={11} />{Math.abs(remainingDays)}d overdue</Chip>
        ) : (
          <Chip tone="good">
            <Clock size={11} />
            {now < start ? `Starts in ${daysBetween(now, start)}d` : `${remainingDays}d remaining`}
          </Chip>
        )}
        {!actual && (
          <Chip tone="muted">
            <TrendingUp size={11} />
            {isOverdue ? "Past due" : `${elapsedPct}% elapsed`}
          </Chip>
        )}
      </div>

      <div role="img" aria-label={ariaLabel} className="relative h-6 select-none">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full border bg-muted" />
        <div
          className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-full opacity-85 ${barColor}`}
          style={{ left: `${startPct}%`, width: `${Math.max(0, fillEnd - startPct)}%` }}
        />
        {isOverdue && (
          <div
            className="absolute top-1/2 h-3 -translate-y-1/2 rounded-r-full border-r-2 border-dashed border-red-500 bg-red-400/25"
            style={{ left: `${intendedPct}%`, width: `${Math.max(0, nowPct - intendedPct)}%` }}
          />
        )}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-slate-500 shadow"
          style={{ left: `${startPct}%` }}
        />
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow ${isOverdue ? "bg-red-500" : "bg-primary"}`}
          style={{ left: `${intendedPct}%` }}
        />
        {actualPct !== null && (
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border-2 border-background bg-green-500 shadow"
            style={{ left: `${actualPct}%` }}
          />
        )}
        {!actual && nowPct > 0 && nowPct < 100 && (
          <span
            className="absolute top-0 h-6 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
            style={{ left: `${nowPct}%` }}
          />
        )}
      </div>

      {/* Dates live in a grid, not on the bar, so they never collide on narrow screens. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-4">
        <DateCell label="Start" value={formatBsDate(startDate)} dotClass="bg-slate-500" />
        {!actual && <DateCell label="Today" value={formatBsDate(now.toISOString())} dotClass="bg-foreground" />}
        <DateCell
          label="Intended end"
          value={formatBsDate(intendedCompletionDate)}
          dotClass={isOverdue ? "bg-red-500" : "bg-primary"}
        />
        {actual && <DateCell label="Actual end" value={formatBsDate(actualCompletionDate)} dotClass="bg-green-500" />}
      </div>
    </div>
  );
}
