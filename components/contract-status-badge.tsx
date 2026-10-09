"use client";

import { Badge } from "@/components/ui/badge";
import {
  CONTRACT_STATUS_DEFINITION,
  StatusBadge,
} from "@/components/status-badge";
import type { ContractStatus } from "@/lib/schema/contract/contract";

export const CONTRACT_STATUS_ORDER: ContractStatus[] = [
  "NOT_STARTED",
  "AGREEMENT",
  "WORKORDER",
  "WORKINPROGRESS",
  "COMPLETED",
  "ARCHIVED",
];

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  NOT_STARTED: "Not Started",
  AGREEMENT: "Agreement",
  WORKORDER: "Work Order",
  WORKINPROGRESS: "Work In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function ContractStatusBadge({
  status,
  compact = false,
}: {
  status?: ContractStatus | null;
  compact?: boolean;
}) {
  if (!status) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  const definition = CONTRACT_STATUS_DEFINITION[status];

  return (
    <StatusBadge tone={definition.tone} icon={definition.icon} compact={compact}>
      {CONTRACT_STATUS_LABEL[status]}
    </StatusBadge>
  );
}
