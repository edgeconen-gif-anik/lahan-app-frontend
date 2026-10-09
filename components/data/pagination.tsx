"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type PaginationProps = {
  page: number;
  lastPage: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
};

/** 1 … 4 5 [6] 7 8 … 20 */
function getPageItems(page: number, lastPage: number): (number | "gap")[] {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < lastPage - 1) items.push("gap");
  items.push(lastPage);

  return items;
}

export function Pagination({
  page,
  lastPage,
  total,
  limit,
  onPageChange,
  onLimitChange,
  className,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm sm:flex-row",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          Showing {from}–{to} of {total}
        </span>
        {onLimitChange ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {lastPage > 1 ? (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft />
            <span className="hidden sm:inline">Previous</span>
            <span className="sr-only sm:hidden">Previous page</span>
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            {getPageItems(page, lastPage).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={item === page ? "default" : "ghost"}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  onClick={() => onPageChange(item)}
                  className="min-w-8 px-2"
                >
                  {item}
                </Button>
              ),
            )}
          </div>
          <span className="px-2 text-muted-foreground sm:hidden">
            {page} / {lastPage}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next page</span>
            <ChevronRight />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
