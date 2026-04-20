import api from "@/lib/api";
import {
  Contract,
  CreateContractPayload,
  ProjectUpdatePayload,
  UpdateContractPayload,
  NextContractNumberResponse,
} from "@/lib/schema/contract/contract";

export type {
  CreateContractPayload,
  ProjectUpdatePayload,
  UpdateContractPayload,
};

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

  projectUpdate: async (id: string, payload: ProjectUpdatePayload): Promise<Contract> => {
    const { data } = await api.patch<Contract>(`/contracts/${id}/project-update`, payload);
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
