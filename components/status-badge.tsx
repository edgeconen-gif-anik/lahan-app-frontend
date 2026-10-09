import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  FileSignature,
  Hammer,
  PlayCircle,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { APPROVAL_STATUS_LABEL, type ApprovalStatus } from "@/lib/schema/approval";
import type { ProjectStatus } from "@/lib/project-status";
import type { ContractStatus } from "@/lib/schema/contract/contract";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

/** Soft background + paired text colour; both flip automatically in dark mode. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-tone-neutral text-tone-neutral-foreground",
  info: "bg-tone-info text-tone-info-foreground",
  success: "bg-tone-success text-tone-success-foreground",
  warning: "bg-tone-warning text-tone-warning-foreground",
  danger: "bg-tone-danger text-tone-danger-foreground",
  accent: "bg-tone-accent text-tone-accent-foreground",
};

type StatusBadgeProps = {
  tone: StatusTone;
  icon?: LucideIcon;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * One badge for every status in the app. The icon means state is never
 * conveyed by colour alone.
 */
export function StatusBadge({
  tone,
  icon: Icon,
  compact = false,
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-medium",
        compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

type StatusDefinition = { label: string; tone: StatusTone; icon: LucideIcon };

export const APPROVAL_STATUS_DEFINITION: Record<ApprovalStatus, StatusDefinition> = {
  PENDING: { label: APPROVAL_STATUS_LABEL.PENDING, tone: "warning", icon: Clock3 },
  APPROVED: { label: APPROVAL_STATUS_LABEL.APPROVED, tone: "success", icon: CheckCircle2 },
  REJECTED: { label: APPROVAL_STATUS_LABEL.REJECTED, tone: "danger", icon: XCircle },
};

export const PROJECT_STATUS_DEFINITION: Record<ProjectStatus, StatusDefinition> = {
  NOT_STARTED: { label: "Not Started", tone: "neutral", icon: Circle },
  ONGOING: { label: "Ongoing", tone: "info", icon: PlayCircle },
  COMPLETED: { label: "Completed", tone: "success", icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", tone: "neutral", icon: Archive },
};

export const CONTRACT_STATUS_DEFINITION: Record<ContractStatus, StatusDefinition> = {
  NOT_STARTED: { label: "Not Started", tone: "neutral", icon: Circle },
  AGREEMENT: { label: "Agreement", tone: "info", icon: FileSignature },
  WORKORDER: { label: "Work Order", tone: "accent", icon: ClipboardList },
  WORKINPROGRESS: { label: "Work In Progress", tone: "warning", icon: Hammer },
  COMPLETED: { label: "Completed", tone: "success", icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", tone: "neutral", icon: Archive },
};

export function ProjectStatusBadge({
  status,
  compact,
  className,
}: {
  status?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const definition =
    PROJECT_STATUS_DEFINITION[(status ?? "NOT_STARTED") as ProjectStatus] ??
    PROJECT_STATUS_DEFINITION.NOT_STARTED;

  return (
    <StatusBadge
      tone={definition.tone}
      icon={definition.icon}
      compact={compact}
      className={className}
    >
      {definition.label}
    </StatusBadge>
  );
}
