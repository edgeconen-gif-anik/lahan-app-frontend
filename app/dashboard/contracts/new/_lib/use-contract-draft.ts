"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import type { ContractFormSnapshot } from "./types";

const DRAFT_VERSION = 1;

export interface StoredDraft {
  savedAt: number;
  snapshot: ContractFormSnapshot;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      version?: number;
      savedAt?: number;
      snapshot?: ContractFormSnapshot;
    };

    if (
      parsed.version !== DRAFT_VERSION ||
      typeof parsed.savedAt !== "number" ||
      typeof parsed.snapshot?.formData !== "object"
    ) {
      return null;
    }

    return { savedAt: parsed.savedAt, snapshot: parsed.snapshot };
  } catch {
    return null;
  }
}

/**
 * Keeps an in-progress contract in this browser so a refresh, a crash or the
 * idle sign-out doesn't lose it. One draft per signed-in user.
 */
export function useContractDraft(userId?: string) {
  const key = userId ? `lahan:contract-draft:v${DRAFT_VERSION}:${userId}` : null;

  const getSnapshot = useCallback(() => {
    if (!key) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const storedDraft = useMemo(() => parseDraft(raw), [raw]);

  // "pending" until the user answers the resume prompt (or there is nothing
  // to resume). Autosave stays off while pending so a stored draft isn't
  // overwritten before the user has seen it.
  const [decision, setDecision] = useState<"pending" | "resolved">("pending");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const save = useCallback(
    (snapshot: ContractFormSnapshot) => {
      if (!key) return;
      const savedAt = Date.now();

      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ version: DRAFT_VERSION, savedAt, snapshot }),
        );
        setLastSavedAt(savedAt);
      } catch {
        // Storage can be full or blocked; the form still works without it.
      }
    },
    [key],
  );

  const clear = useCallback(() => {
    if (!key) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignored.
    }
    setLastSavedAt(null);
  }, [key]);

  const discard = useCallback(() => {
    clear();
    setDecision("resolved");
  }, [clear]);

  const markResumed = useCallback(() => setDecision("resolved"), []);

  // A draft this session wrote itself is never "pending"; only one left over
  // from an earlier visit is.
  const pendingDraft =
    decision === "pending" && storedDraft && storedDraft.savedAt !== lastSavedAt
      ? storedDraft
      : null;

  return {
    /** A saved draft waiting for the user's answer, if any. */
    pendingDraft,
    autosaveEnabled: Boolean(key) && !pendingDraft,
    lastSavedAt,
    save,
    clear,
    discard,
    markResumed,
  };
}
