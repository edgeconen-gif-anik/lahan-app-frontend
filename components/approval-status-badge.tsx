"use client";

import type { ApprovalStatus } from "@/lib/schema/approval";
import {
  APPROVAL_STATUS_DEFINITION,
  StatusBadge,
} from "@/components/status-badge";

export function ApprovalStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const safeStatus: ApprovalStatus =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? status
      : "PENDING";
  const definition = APPROVAL_STATUS_DEFINITION[safeStatus];

  return (
    <StatusBadge tone={definition.tone} icon={definition.icon}>
      {definition.label}
    </StatusBadge>
  );
}
