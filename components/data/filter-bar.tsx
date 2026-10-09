"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: React.ReactNode;
  /** Shown only when at least one filter is active. */
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
};

/** Consistent container for search, dropdown filters and a reset button. */
export function FilterBar({
  children,
  onReset,
  hasActiveFilters = false,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:flex-wrap md:items-center",
        className,
      )}
    >
      {children}
      {onReset && hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="md:ml-auto"
        >
          <RotateCcw />
          Reset filters
        </Button>
      ) : null}
    </div>
  );
}
