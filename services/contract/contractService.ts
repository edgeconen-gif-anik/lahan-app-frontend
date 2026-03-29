import api from "@/lib/api";
import {
  Contract,
  CreateContractPayload,
  UpdateContractPayload,
  NextContractNumberResponse,
} from "@/lib/schema/contract/contract";

export type { CreateContractPayload, UpdateContractPayload };

export const contractService = {
  getAll: async (params?: {
    projectId?: string;
    companyId?: string;
    userCommitteeId?: string;
    userId?: string;
  }): Promise<Contract[]> => {
    const { data } = await api.get<Contract[]>("/contracts", { params });
    return data;
  },

  getOne: async (id: string): Promise<Contract> => {
    const { data } = await api.get<Contract>(`/contracts/${id}`);
    return data;
  },

  getNextNumber: async (): Promise<NextContractNumberResponse> => {
    const { data } = await api.get<NextContractNumberResponse>("/contracts/next-number");
    return data;
  },

  create: async (payload: CreateContractPayload): Promise<Contract> => {
    const { data } = await api.post<Contract>("/contracts", payload);
    return data;
  },

  update: async (id: string, payload: UpdateContractPayload): Promise<Contract> => {
    const { data } = await api.patch<Contract>(`/contracts/${id}`, payload);
    return data;
  },

  approve: async (id: string): Promise<Contract> => {
    const { data } = await api.patch<Contract>(`/contracts/${id}/approve`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};
