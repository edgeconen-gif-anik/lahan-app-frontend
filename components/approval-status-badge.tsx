"use client";

import { Badge } from "@/components/ui/badge";
import { ApprovalStatus, APPROVAL_STATUS_LABEL } from "@/lib/schema/approval";

const STATUS_CLASSNAME: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  APPROVED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  REJECTED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

export function ApprovalStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const safeStatus =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? status
      : "PENDING";

  return (
    <Badge className={STATUS_CLASSNAME[safeStatus]}>
      {APPROVAL_STATUS_LABEL[safeStatus]}
    </Badge>
  );
}
