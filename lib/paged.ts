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
