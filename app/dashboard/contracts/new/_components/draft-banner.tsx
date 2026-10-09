"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StoredDraft } from "../_lib/use-contract-draft";

type DraftBannerProps = {
  draft: StoredDraft;
  onResume: () => void;
  onDiscard: () => void;
};

/** Offers to continue an unfinished contract left over from an earlier visit. */
export function DraftBanner({ draft, onResume, onDiscard }: DraftBannerProps) {
  const savedAt = new Date(draft.savedAt).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const label =
    draft.snapshot.formData.contractNumber ||
    draft.snapshot.formData.remarks ||
    "an unfinished contract";

  return (
    <div
      role="region"
      aria-label="Saved draft"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
    >
      <p className="flex items-start gap-2 text-sm">
        <History className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <span className="font-medium">Continue where you left off?</span>{" "}
          <span className="text-muted-foreground">
            A draft of {label} was saved on {savedAt}.
          </span>
        </span>
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
          Discard draft
        </Button>
        <Button type="button" size="sm" onClick={onResume}>
          Resume draft
        </Button>
      </div>
    </div>
  );
}
