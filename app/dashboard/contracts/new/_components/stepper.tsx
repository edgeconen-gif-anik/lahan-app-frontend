"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { STEPS } from "../_lib/types";

type StepperProps = {
  current: number;
  /** Steps the user has already moved past or tried to move past. */
  attemptedSteps: number[];
  errorCountForStep: (step: number) => number;
  /** Steps that are optional and currently switched off. */
  skippedSteps: number[];
  onSelect: (step: number) => void;
};

export function Stepper({
  current,
  attemptedSteps,
  errorCountForStep,
  skippedSteps,
  onSelect,
}: StepperProps) {
  return (
    <nav aria-label="Contract steps" className="rounded-xl border bg-card px-4 py-3 shadow-sm sm:px-5">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const errorCount = attemptedSteps.includes(index) ? errorCountForStep(index) : 0;
          const isSkipped = skippedSteps.includes(index);

          return (
            <Fragment key={step.id}>
              <li className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={isActive ? "step" : undefined}
                  className="flex items-center gap-2 rounded-md p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      errorCount > 0 && "border-destructive bg-destructive/10 text-destructive",
                      errorCount === 0 && isActive && "border-primary bg-primary text-primary-foreground",
                      errorCount === 0 && isDone && "border-primary/40 bg-primary/10 text-primary",
                      errorCount === 0 && !isActive && !isDone && "bg-muted text-muted-foreground",
                    )}
                  >
                    {errorCount > 0 ? "!" : isDone ? <Check size={13} /> : index + 1}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                    {isSkipped && !isActive ? (
                      <span className="block text-[11px] text-muted-foreground">Skipped</span>
                    ) : errorCount > 0 ? (
                      <span className="block text-[11px] text-destructive">
                        {errorCount} to fix
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
              {index < STEPS.length - 1 ? (
                <li
                  aria-hidden="true"
                  className={cn("mx-2 h-px flex-1 sm:mx-3", isDone ? "bg-primary/40" : "bg-border")}
                />
              ) : null}
            </Fragment>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground sm:hidden" aria-live="polite">
        Step {current + 1} of {STEPS.length}: {STEPS[current].label}
      </p>
    </nav>
  );
}
