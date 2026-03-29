import api from "@/lib/api";
import { ApprovalStatus } from "@/lib/schema/approval";

export type CommitteeOfficial = {
  id?: string;
  name: string;
  phoneNumber: string;
  citizenshipNumber?: string;
  role: "PRESIDENT" | "MEMBER" | "SECRETARY" | "TREASURER";
};

export type UserCommitteeRecord = {
  id: string;
  name: string;
  address: string;
  fiscalYear: string;
  formedDate: string;
  bankName: string;
  accountNumber: string;
  approvalStatus: ApprovalStatus;
  approvedAt?: string | null;
  officials: CommitteeOfficial[];
};

export type UserCommitteeListParams = {
  search?: string;
  fiscalYear?: string;
  page?: number;
  limit?: number;
};

export type UserCommitteeListResponse = {
  data: UserCommitteeRecord[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
};

export type UserCommitteeMutationPayload = Record<string, unknown> & {
  id?: string;
};

export const userCommitteeService = {
  getAll: async (
    params?: UserCommitteeListParams
  ): Promise<UserCommitteeListResponse> => {
    const { data } = await api.get<UserCommitteeListResponse>("/user-committees", {
      params,
    });
    return data;
  },

  getOne: async (id: string): Promise<UserCommitteeRecord> => {
    const { data } = await api.get<UserCommitteeRecord>(`/user-committees/${id}`);
    return data;
  },

  create: async (
    payload: UserCommitteeMutationPayload
  ): Promise<UserCommitteeRecord> => {
    const { data } = await api.post<UserCommitteeRecord>("/user-committees", payload);
    return data;
  },

  update: async ({
    id,
    ...payload
  }: UserCommitteeMutationPayload & { id: string }): Promise<UserCommitteeRecord> => {
    const { data } = await api.patch<UserCommitteeRecord>(
      `/user-committees/${id}`,
      payload
    );
    return data;
  },

  approve: async (id: string): Promise<UserCommitteeRecord> => {
    const { data } = await api.patch<UserCommitteeRecord>(
      `/user-committees/${id}/approve`
    );
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/user-committees/${id}`);
    return data;
  },
};
