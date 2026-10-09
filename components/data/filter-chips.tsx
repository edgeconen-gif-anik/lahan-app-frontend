"use client";

import { cn } from "@/lib/utils";

export type FilterChipOption = {
  value: string;
  label: string;
  count?: number;
  /** Highlights chips that need attention, e.g. "Needs approval". */
  tone?: "default" | "warning";
};

type FilterChipsProps = {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
};

/** One-click shortcuts for the views people use most. */
export function FilterChips({
  options,
  value,
  onChange,
  label,
  className,
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : option.tone === "warning"
                  ? "border-amber-500/50 bg-tone-warning text-tone-warning-foreground hover:bg-tone-warning/80"
                  : "bg-card hover:bg-muted",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-semibold",
                  isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
