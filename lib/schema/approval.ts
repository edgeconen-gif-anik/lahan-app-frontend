import { z } from "zod";

export const ApprovalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function isApprovedStatus(status?: string | null): status is ApprovalStatus {
  return status === "APPROVED";
}
