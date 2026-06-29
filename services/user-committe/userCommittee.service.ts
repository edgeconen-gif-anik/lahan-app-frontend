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

function normalizeUserCommitteeListResponse(
  payload: unknown,
  params?: UserCommitteeListParams
): UserCommitteeListResponse {
  if (Array.isArray(payload)) {
    return {
      data: payload as UserCommitteeRecord[],
      meta: {
        total: payload.length,
        page: params?.page ?? 1,
        lastPage: 1,
      },
    };
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    const response = payload as Partial<UserCommitteeListResponse> & {
      data: UserCommitteeRecord[];
    };

    return {
      data: response.data,
      meta: {
        total: response.meta?.total ?? response.data.length,
        page: response.meta?.page ?? params?.page ?? 1,
        lastPage: response.meta?.lastPage ?? 1,
      },
    };
  }

  return {
    data: [],
    meta: {
      total: 0,
      page: params?.page ?? 1,
      lastPage: 1,
    },
  };
}

function uniqueCommitteesById(committees: UserCommitteeRecord[]) {
  return Array.from(
    new Map(committees.map((committee) => [committee.id, committee])).values()
  );
}

export const userCommitteeService = {
  getAll: async (
    params?: UserCommitteeListParams
  ): Promise<UserCommitteeListResponse> => {
    const { data } = await api.get<unknown>("/user-committees", {
      params,
    });
    return normalizeUserCommitteeListResponse(data, params);
  },

  getAllRegistered: async (
    params?: Omit<UserCommitteeListParams, "page">
  ): Promise<UserCommitteeRecord[]> => {
    const limit = params?.limit ?? 100;
    const firstPage = await userCommitteeService.getAll({
      ...params,
      page: 1,
      limit,
    });
    const committees = [...firstPage.data];

    for (let page = 2; page <= firstPage.meta.lastPage; page += 1) {
      const response = await userCommitteeService.getAll({
        ...params,
        page,
        limit,
      });
      committees.push(...response.data);
    }

    return uniqueCommitteesById(committees);
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
