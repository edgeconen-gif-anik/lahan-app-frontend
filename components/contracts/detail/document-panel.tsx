"use client";

import { useId, useState } from "react";
import { ChevronDown, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

type Signatory = { role: string; name?: string | null };

export function DocumentPanel({
  accent,
  icon,
  title,
  badge,
  summary,
  meta,
  onOpen,
  onPrint,
  disabledReason,
  printedText,
  recordedLabel,
  recordedText,
  signatories = [],
  signatoriesEmptyHint,
}: {
  accent: "blue" | "violet" | "emerald";
  icon: React.ReactNode;
  title: string;
  badge: { label: string; tone: "ready" | "custom" | "muted" };
  summary: string;
  meta: string;
  onOpen: () => void;
  onPrint: () => void;
  /** When set, Open/Print are disabled and the reason is shown as visible text. */
  disabledReason?: string;
  printedText?: string;
  recordedLabel?: string;
  recordedText?: string | null;
  signatories?: Signatory[];
  signatoriesEmptyHint?: string;
}) {
  const [showText, setShowText] = useState(false);
  const textId = useId();

  const accentCls = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
    violet: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  }[accent];

  const badgeCls = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    custom: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    muted: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }[badge.tone];

  const hasText = Boolean(printedText || recordedText);
  const filledSignatories = signatories.filter((s) => s.name);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentCls}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpen} disabled={Boolean(disabledReason)}>
            Open
          </Button>
          <Button type="button" size="sm" onClick={onPrint} disabled={Boolean(disabledReason)}>
            <Printer size={14} aria-hidden="true" />
            Print
            <span className="sr-only"> (opens in a new tab)</span>
          </Button>
        </div>
      </div>

      {disabledReason && <p className="mt-3 text-xs text-muted-foreground">{disabledReason}</p>}

      {hasText && (
        <div className="mt-3 border-t pt-3">
          <button
            type="button"
            onClick={() => setShowText((p) => !p)}
            aria-expanded={showText}
            aria-controls={textId}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown size={14} className={`transition-transform ${showText ? "rotate-180" : ""}`} aria-hidden="true" />
            {showText ? "Hide text" : "Preview text"}
          </button>
          <div id={textId} hidden={!showText} className="mt-2 space-y-2">
            {recordedText && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">{recordedLabel ?? "Recorded text"}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{recordedText}</p>
              </div>
            )}
            {printedText && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Printable summary</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{printedText}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {signatoriesEmptyHint !== undefined && (
        <div className="mt-3 border-t pt-3">
          {filledSignatories.length > 0 ? (
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {filledSignatories.map((s) => (
                <div key={s.role} className="rounded-lg border bg-muted/20 px-3 py-2">
                  <dt className="text-xs font-medium text-muted-foreground">{s.role}</dt>
                  <dd className="text-sm font-medium">{s.name}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">{signatoriesEmptyHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
