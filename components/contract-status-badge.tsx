"use client";

import { Badge } from "@/components/ui/badge";
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

const CONTRACT_STATUS_CLASSNAME: Record<ContractStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  AGREEMENT: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  WORKORDER: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  WORKINPROGRESS: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  COMPLETED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  ARCHIVED: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
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

  return (
    <Badge
      className={`${CONTRACT_STATUS_CLASSNAME[status]} ${
        compact ? "px-2 py-0 text-[11px]" : ""
      }`}
    >
      {CONTRACT_STATUS_LABEL[status]}
    </Badge>
  );
}
