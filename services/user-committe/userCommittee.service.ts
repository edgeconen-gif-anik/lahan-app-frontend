// D:\Lahan Project APP\client\services\committee\userCommittee.service.ts
import api from "@/lib/api";

export const userCommitteeService = {
  // Get all committees (with optional search/pagination params)
  getAll: async (params?: any) => {
    const { data } = await api.get("/user-committees", { params });
    return data;
  },

  // Get a single committee by ID
  getOne: async (id: string) => {
    const { data } = await api.get(`/user-committees/${id}`);
    return data;
  },

  // Create a new committee (includes officials)
  create: async (payload: any) => {
    const { data } = await api.post("/user-committees", payload);
    return data;
  },

  // Update a committee
  update: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
    const { data } = await api.patch(`/user-committees/${id}`, payload);
    return data;
  },

  // Delete a committee
  delete: async (id: string) => {
    const { data } = await api.delete(`/user-committees/${id}`);
    return data;
  },
};