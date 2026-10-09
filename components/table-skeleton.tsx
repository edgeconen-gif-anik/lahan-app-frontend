import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder rows for list tables while the first page loads. */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="divide-y"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={columnIndex === 0 ? "h-4 w-3/4" : "h-4 w-full"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
