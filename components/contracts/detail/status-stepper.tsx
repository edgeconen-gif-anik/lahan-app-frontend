import { Check } from "lucide-react";

import { MILESTONES, STATUS_CONFIG, type ContractStatus } from "@/lib/contract-detail-utils";

export function StatusStepper({ status }: { status: ContractStatus }) {
  if (status === "ARCHIVED") {
    return (
      <p className="text-sm text-muted-foreground">
        This contract is archived and can no longer move to another milestone.
      </p>
    );
  }

  const currentIndex = MILESTONES.indexOf(status);

  return (
    <ol className="flex w-full items-start" aria-label="Contract milestones">
      {MILESTONES.map((milestone, index) => {
        const done = index < currentIndex || status === "COMPLETED";
        const current = index === currentIndex && status !== "COMPLETED";
        return (
          <li
            key={milestone}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1.5 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2 ${
                  index <= currentIndex || status === "COMPLETED" ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : current
                    ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? <Check size={13} aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={`px-0.5 text-xs leading-tight ${
                current ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {STATUS_CONFIG[milestone].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
