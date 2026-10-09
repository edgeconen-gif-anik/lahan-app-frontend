import api from "@/lib/api";
import type { PagedResult, SortOrder } from "@/lib/paged";
import {
  Contract,
  ContractStatus,
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

export type ContractFilterParams = {
  projectId?: string;
  companyId?: string;
  userCommitteeId?: string;
  userId?: string;
  siteInchargeId?: string;
  fiscalYear?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  search?: string;
  status?: ContractStatus;
  implementor?: "COMPANY" | "USER_COMMITTEE";
  /** Unfinished contracts past their intended end date. */
  overdue?: boolean;
};

export type ContractPageParams = ContractFilterParams & {
  page: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
};

export type ContractCounts = {
  total: number;
  byStatus: Record<ContractStatus, number>;
  pendingApprovals: number;
  overdue: number;
};

export const contractService = {
  /** Every matching contract as a plain array (also used for exports). */
  getAll: async (params?: ContractFilterParams): Promise<Contract[]> => {
    const { data } = await api.get<Contract[]>("/contracts", { params });
    return data;
  },

  /** One page of contracts plus per-milestone counts. */
  getPage: async (
    params: ContractPageParams,
  ): Promise<PagedResult<Contract, ContractCounts>> => {
    const { data } = await api.get<PagedResult<Contract, ContractCounts>>(
      "/contracts",
      { params },
    );
    return data;
  },

  getOne: async (id: string): Promise<Contract> => {
    const { data } = await api.get<Contract>(`/contracts/${id}`);
    return data;
  },

  getNextNumber: async (params?: {
    projectId?: string;
  }): Promise<NextContractNumberResponse> => {
    const { data } = await api.get<NextContractNumberResponse>("/contracts/next-number", {
      params,
    });
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
