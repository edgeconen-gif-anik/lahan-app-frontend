"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableSkeleton } from "@/components/table-skeleton";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  /** Server-side sort key. Omit for columns that can't be sorted. */
  sortKey?: string;
  className?: string;
  align?: "right";
};

export type SortState = { key: string; order: "asc" | "desc" };

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  /** Shown instead of the rows when there are none (use <EmptyState />). */
  empty: React.ReactNode;
  /** Opening the row's detail page, etc. Clicks on inner controls are ignored. */
  onRowClick?: (row: T) => void;
  /** Card shown on phones instead of the table row. */
  renderMobileCard?: (row: T) => React.ReactNode;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  /** The "⋯" menu (or buttons) at the end of each row. */
  rowActions?: (row: T) => React.ReactNode;
  selection?: {
    selectedIds: ReadonlySet<string>;
    onChange: (next: Set<string>) => void;
  };
  skeletonRows?: number;
  /** Minimum width before the table scrolls sideways on tablets. */
  minWidth?: number;
  className?: string;
};

const INTERACTIVE = "a, button, select, input, textarea, label, [role='menuitem']";

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  empty,
  onRowClick,
  renderMobileCard,
  sort,
  onSortChange,
  rowActions,
  selection,
  skeletonRows = 6,
  minWidth = 900,
  className,
}: DataTableProps<T>) {
  const pageIds = rows.map(getRowId);
  const selectedOnPage = selection
    ? pageIds.filter((id) => selection.selectedIds.has(id)).length
    : 0;
  const allSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    selection.onChange(next);
  };

  const toggleOne = (id: string) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };

  const handleRowClick = (event: React.MouseEvent, row: T) => {
    if (!onRowClick) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    onRowClick(row);
  };

  const columnCount =
    columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className={cn("overflow-hidden bg-card", className)}>
      {/* Phones: cards */}
      {renderMobileCard ? (
        <div className="divide-y md:hidden" aria-busy={isLoading}>
          {isLoading ? (
            <TableSkeleton rows={4} columns={2} />
          ) : rows.length === 0 ? (
            empty
          ) : (
            rows.map((row) => (
              <div
                key={getRowId(row)}
                className="flex items-start gap-3 p-4"
              >
                {selection ? (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    aria-label="Select row"
                    checked={selection.selectedIds.has(getRowId(row))}
                    onChange={() => toggleOne(getRowId(row))}
                  />
                ) : null}
                <div className="min-w-0 flex-1">{renderMobileCard(row)}</div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Tablets and desktops: table */}
      <div
        className={cn(
          "overflow-x-auto",
          renderMobileCard ? "hidden md:block" : undefined,
        )}
      >
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b bg-muted/40">
            <tr>
              {selection ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    aria-label="Select all rows on this page"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) element.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    disabled={pageIds.length === 0}
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const isSorted = sort?.key === column.sortKey;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={
                      column.sortKey
                        ? isSorted
                          ? sort?.order === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.sortKey!)}
                        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground"
                      >
                        {column.header}
                        {isSorted ? (
                          sort?.order === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowActions ? (
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody aria-busy={isLoading}>
            {isLoading ? (
              <tr>
                <td colSpan={columnCount} className="p-0">
                  <TableSkeleton
                    rows={skeletonRows}
                    columns={Math.min(columns.length, 6)}
                  />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>{empty}</td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const id = getRowId(row);
                const isSelected = selection?.selectedIds.has(id) ?? false;

                return (
                  <tr
                    key={id}
                    aria-selected={selection ? isSelected : undefined}
                    onClick={(event) => handleRowClick(event, row)}
                    className={cn(
                      "border-b align-top transition-colors last:border-0 hover:bg-muted/30",
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    {selection ? (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          aria-label="Select row"
                          checked={isSelected}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-4",
                          column.align === "right" && "text-right",
                          column.className,
                        )}
                      >
                        {column.cell(row, rowIndex)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-4 py-4 text-right">{rowActions(row)}</td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
