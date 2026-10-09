import api from "@/lib/api";

export type SearchResults = {
  projects: { id: string; name: string; sNo: string | null; fiscalYear: string }[];
  contracts: {
    id: string;
    contractNumber: string;
    projectName: string | null;
    fiscalYear: string;
  }[];
  companies: { id: string; name: string; address: string }[];
  committees: { id: string; name: string; address: string }[];
};

export const searchService = {
  search: async (q: string, fiscalYear?: string): Promise<SearchResults> => {
    const response = await api.get<SearchResults>("/search", {
      params: { q, fiscalYear: fiscalYear || undefined },
    });
    return response.data;
  },
};
