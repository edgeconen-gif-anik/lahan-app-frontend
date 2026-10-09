import { paginateList, sortList } from "./paged";
import { ContractStatusEnum, type Contract } from "./schema/contract/contract";
import { getCompanyIsContracted, type Company } from "./schema/company.schema";
import type { ContractCounts, ContractPageParams } from "@/services/contract/contractService";
import type { CompanyCounts, CompanyFilterParams, CompanyListItem } from "@/services/company/company.service";
import type { SortOrder } from "./paged";

function isOverdue(contract: Contract, now: number) {
  if (!contract.intendedCompletionDate) return false;
  return contract.status !== "COMPLETED" && contract.status !== "ARCHIVED" &&
    !contract.actualCompletionDate &&
    new Date(contract.intendedCompletionDate).getTime() < now;
}

/** Older servers ignore the new list filters and return a complete array. */
export function legacyContractPage(rows: Contract[], params: ContractPageParams) {
  const now = Date.now();
  const search = params.search?.trim().toLowerCase();
  const base = rows.filter((contract) => {
    if (params.approvalStatus && contract.approvalStatus !== params.approvalStatus) return false;
    if (params.implementor === "COMPANY" && !contract.companyId) return false;
    if (params.implementor === "USER_COMMITTEE" && !contract.userCommitteeId) return false;
    return !search || [contract.contractNumber, contract.project?.name,
      contract.project?.sNo, contract.company?.name, contract.userCommittee?.name]
      .some((value) => value?.toLowerCase().includes(search));
  });
  const scope = params.overdue ? base.filter((row) => isOverdue(row, now)) : base;
  const byStatus = Object.fromEntries(
    ContractStatusEnum.options.map((status) => [status, 0]),
  ) as ContractCounts["byStatus"];
  scope.forEach((row) => { byStatus[row.status] += 1; });
  const filtered = params.status ? scope.filter((row) => row.status === params.status) : scope;
  const sortFields: Array<keyof Contract> = ["createdAt", "contractNumber", "contractAmount", "startDate", "intendedCompletionDate"];
  const sortField = sortFields.find((field) => field === params.sortBy) ?? "createdAt";
  // Prisma Decimal amounts may arrive as strings on legacy servers.
  const sorted = sortField === "contractAmount"
    ? [...filtered].sort((left, right) =>
        (Number(left.contractAmount) - Number(right.contractAmount)) *
        (params.sortOrder === "asc" ? 1 : -1))
    : sortList(filtered, sortField, params.sortOrder);

  return paginateList(sorted, params, {
    total: scope.length,
    byStatus,
    pendingApprovals: base.filter((row) => row.approvalStatus === "PENDING").length,
    overdue: base.filter((row) => isOverdue(row, now)).length,
  });
}

export function legacyCompanyPage(
  rows: Company[],
  params: CompanyFilterParams & { page: number; limit?: number; sortBy?: string; sortOrder?: SortOrder },
) {
  const companies: CompanyListItem[] = rows.map((company) => ({
    ...company,
    hasApprovedContract: (company as Partial<CompanyListItem>).hasApprovedContract ??
      (company.approvedContractCount ?? 0) > 0,
  }));
  const contracted = (company: CompanyListItem) => getCompanyIsContracted(company);
  const approved = companies.filter((company) => company.approvalStatus === "APPROVED");
  const counts: CompanyCounts = {
    total: companies.length,
    pending: companies.filter((company) => company.approvalStatus === "PENDING").length,
    contracted: approved.filter(contracted).length,
    nonContracted: approved.filter((company) => !contracted(company)).length,
  };
  const filtered = companies.filter((company) => {
    if (params.approvalStatus && company.approvalStatus !== params.approvalStatus) return false;
    if (params.contracted === "CONTRACTED" && !contracted(company)) return false;
    if (params.contracted === "NON_CONTRACTED" && contracted(company)) return false;
    return true;
  });
  const sortField = params.sortBy === "name" || params.sortBy === "registrationRequestDate"
    ? params.sortBy : "createdAt";
  return paginateList(sortList(filtered, sortField, params.sortOrder), params, counts);
}
