// services/contract/contractService.ts
import api from "@/lib/api";
import {
  Contract,
  CreateContractPayload,
  UpdateContractPayload,
  NextContractNumberResponse,
} from "@/lib/schema/contract/contract";
 
// Re-export so hooks can import payload types from here if preferred
export type { CreateContractPayload, UpdateContractPayload };
 
export const contractService = {
  getAll: async (params?: {
    projectId?:       string;
    companyId?:       string;
    userCommitteeId?: string;
    userId?:          string;
  }): Promise<Contract[]> => {
    const { data } = await api.get<Contract[]>("/contracts", { params });
    return data;
  },
 
  getOne: async (id: string): Promise<Contract> => {
    const { data } = await api.get<Contract>(`/contracts/${id}`);
    return data;
  },
 
  // GET /contracts/next-number
  // Must be declared before :id routes on the backend (already done).
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
 
  // DELETE returns 204 No Content — no response body
  delete: async (id: string): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};