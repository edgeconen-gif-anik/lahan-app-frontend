import type { Contract } from "@/lib/schema/contract/contract";

export type ProjectStatus = "NOT_STARTED" | "ONGOING" | "COMPLETED" | "ARCHIVED";

export function deriveProjectStatusFromContracts(
  contracts: Pick<Contract, "status">[]
): ProjectStatus {
  if (contracts.length === 0) {
    return "NOT_STARTED";
  }

  const activeStatuses = contracts
    .map((contract) => contract.status)
    .filter((status) => status !== "ARCHIVED");

  if (activeStatuses.length === 0) {
    return "ARCHIVED";
  }

  if (activeStatuses.every((status) => status === "COMPLETED")) {
    return "COMPLETED";
  }

  return "ONGOING";
}
