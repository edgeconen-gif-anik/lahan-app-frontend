import type { QueryClient } from "@tanstack/react-query";

/** Company engagement also appears in cached reports and dashboard summaries. */
export function invalidateCompanyViews(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}
