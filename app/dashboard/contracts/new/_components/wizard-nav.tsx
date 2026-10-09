"use client";

import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LAST_STEP } from "../_lib/types";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type WizardNavProps = {
  step: number;
  isSaving: boolean;
  lastSavedAt: number | null;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
};

/** Sticks to the bottom of the screen so Next / Save is always reachable. */
export function WizardNav({
  step,
  isSaving,
  lastSavedAt,
  onBack,
  onNext,
  onCancel,
}: WizardNavProps) {
  const isLast = step === LAST_STEP;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {lastSavedAt ? (
          <span aria-live="polite">Draft saved at {formatTime(lastSavedAt)}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft />
            Back
          </Button>
        ) : null}

        {isLast ? (
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? "Saving..." : "Save contract"}
          </Button>
        ) : (
          <Button type="button" onClick={onNext}>
            Next
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
