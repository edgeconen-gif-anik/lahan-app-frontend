/** Response shape of the backend's opt-in paged list endpoints. */
export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
};

export type PagedResult<T, Counts = Record<string, never>> = {
  data: T[];
  meta: PageMeta;
  counts: Counts;
};

export type SortOrder = "asc" | "desc";

/** Adapt a complete legacy list to the same page shape as the paged API. */
export function paginateList<T, Counts>(
  rows: T[],
  params: { page: number; limit?: number },
  counts: Counts,
): PagedResult<T, Counts> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(params.page, 1), lastPage);

  return {
    data: rows.slice((page - 1) * limit, page * limit),
    meta: { total, page, limit, lastPage },
    counts,
  };
}

export function sortList<T>(
  rows: T[],
  field: keyof T,
  order: SortOrder = "desc",
) {
  return [...rows].sort((left, right) => {
    const a = left[field];
    const b = right[field];
    const result = typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a ?? "").localeCompare(String(b ?? ""));
    return order === "asc" ? result : -result;
  });
}
