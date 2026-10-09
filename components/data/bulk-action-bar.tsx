"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BulkActionBarProps = {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
};

/** Appears above a list while rows are selected. */
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2"
    >
      <span className="text-sm font-medium" aria-live="polite">
        {count} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-auto"
      >
        <X />
        Clear
      </Button>
    </div>
  );
}
