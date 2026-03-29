// services\company\company.service.ts
import api from "@/lib/api";
import { Company, CompanyFormValues } from "@/lib/schema/company.schema";

export const companyService = {
  // 1. Get All (✅ Updated to accept params for searching & pagination)
  getAll: async (params?: { search?: string; limit?: number; page?: number }) => {
    // Note: Removed <Company[]> here to avoid strict type clashing if your backend 
    // actually returns a paginated object like { data: Company[], meta: {} }
    const { data } = await api.get("/companies", { params });
    return data;
  },

  // 2. Get One
  getOne: async (id: string) => {
    const { data } = await api.get<Company>(`/companies/${id}`);
    return data;
  },

  // 3. Create
  create: async (payload: CompanyFormValues) => {
    const { data } = await api.post<Company>("/companies", payload);
    return data;
  },

  // 4. Update
  update: async ({ id, payload }: { id: string; payload: CompanyFormValues }) => {
    const { data } = await api.patch<Company>(`/companies/${id}`, payload);
    return data;
  },

  approve: async (id: string) => {
    const { data } = await api.patch<Company>(`/companies/${id}/approve`);
    return data;
  },

  // 5. Delete
  delete: async (id: string) => {
    const { data } = await api.delete(`/companies/${id}`);
    return data;
  }
};
