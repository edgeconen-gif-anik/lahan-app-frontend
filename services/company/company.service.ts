import api from "@/lib/api";
import { Company, CompanyFormValues } from "@/lib/schema/company.schema";

function normalizeCompanyListResponse(payload: unknown): Company[] {
  if (Array.isArray(payload)) {
    return payload as Company[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Company[] }).data;
  }

  return [];
}

export const companyService = {
  getAll: async (params?: { search?: string; limit?: number; page?: number }): Promise<Company[]> => {
    const { data } = await api.get("/companies", { params });
    return normalizeCompanyListResponse(data);
  },

  getOne: async (id: string) => {
    const { data } = await api.get<Company>(`/companies/${id}`);
    return data;
  },

  create: async (payload: CompanyFormValues) => {
    const { data } = await api.post<Company>("/companies", payload);
    return data;
  },

  update: async ({ id, payload }: { id: string; payload: CompanyFormValues }) => {
    const { data } = await api.patch<Company>(`/companies/${id}`, payload);
    return data;
  },

  approve: async (id: string) => {
    const { data } = await api.patch<Company>(`/companies/${id}/approve`);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/companies/${id}`);
    return data;
  },
};
