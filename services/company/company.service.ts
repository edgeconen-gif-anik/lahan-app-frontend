import api from "@/lib/api";
import { legacyCompanyPage } from "@/lib/legacy-list-pages";
import { contractService } from "@/services/contract/contractService";
import type { PagedResult, SortOrder } from "@/lib/paged";
import { Company, CompanyFormValues } from "@/lib/schema/company.schema";

export type CompanyFilterParams = {
  search?: string;
  fiscalYear?: string;
  category?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  contracted?: "CONTRACTED" | "NON_CONTRACTED";
};

export type CompanyCounts = {
  total: number;
  pending: number;
  contracted: number;
  nonContracted: number;
};

/** A company row from the paged endpoint. */
export type CompanyListItem = Company & {
  /** True when the company has at least one approved contract. */
  hasApprovedContract: boolean;
};

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

/** Only older servers need the bulk lookup; current responses carry the state. */
async function withApprovedContractState(companies: Company[]): Promise<Company[]> {
  if (companies.every((company) =>
    typeof company.hasApprovedContract === "boolean" ||
    typeof company.approvedContractCount === "number")) return companies;

  const contracts = await contractService.getAll({
    fiscalYear: "all",
    approvalStatus: "APPROVED",
  });
  const counts = new Map<string, number>();
  for (const contract of contracts) {
    const companyId = contract.companyId ?? contract.company?.id;
    if (companyId && contract.approvalStatus === "APPROVED") {
      counts.set(companyId, (counts.get(companyId) ?? 0) + 1);
    }
  }
  return companies.map((company) => ({
    ...company,
    approvedContractCount: counts.get(company.id) ?? 0,
    hasApprovedContract: (counts.get(company.id) ?? 0) > 0,
  }));
}

export const companyService = {
  verifyOfficer: async ({ id, ...payload }: { id: string; expectedUpdatedAt: string; registrationOfficerName: string; registrationOfficerDesignation: string; evidence: string }) => {
    const { data } = await api.patch<Company>(`/companies/${id}/verify-officer`, payload);
    return data;
  },
  getAll: async (params?: CompanyFilterParams & {
    limit?: number;
    page?: number;
  }): Promise<Company[]> => {
    const { data } = await api.get("/companies", { params });
    return withApprovedContractState(normalizeCompanyListResponse(data));
  },

  /** One page of companies plus the summary counts shown above the table. */
  getPage: async (
    params: CompanyFilterParams & {
      page: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: SortOrder;
    },
  ): Promise<PagedResult<CompanyListItem, CompanyCounts>> => {
    const { data } = await api.get<Company[] | PagedResult<CompanyListItem, CompanyCounts>>(
      "/companies",
      { params },
    );
    if (!Array.isArray(data)) return data;

    // Legacy servers apply approval filtering before returning the array.
    // Load the wider scope so summary counts still include every approval state.
    const rows = params.approvalStatus
      ? await companyService.getAll({
          fiscalYear: params.fiscalYear,
          search: params.search,
          category: params.category,
        })
      : await withApprovedContractState(data);
    return legacyCompanyPage(rows, params);
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
