"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useSystemSetup } from "@/hooks/setup/useSetup";

const STORAGE_KEY = "lahan-fiscal-year";

// Tiny external store backed by localStorage so the choice survives reloads,
// is shared by every page, and stays in sync across open tabs.
const listeners = new Set<() => void>();
let memorySelection: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private window); fall back to this visit only.
    return memorySelection;
  }
}

function getServerSnapshot() {
  return null;
}

function writeSelection(value: string | null) {
  memorySelection = value;

  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Ignored: memorySelection already holds the choice.
  }

  listeners.forEach((listener) => listener());
}

/**
 * The fiscal year chosen in the header, shared by every page.
 * Returns [selection, setSelection]; selection is null until the user picks
 * something other than the default (the system's current fiscal year).
 */
export function useFiscalYearSelection() {
  const selection = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const setSelection = useCallback(
    (value: string | null) => writeSelection(value),
    [],
  );

  return [selection, setSelection] as const;
}

/** The year pages should actually query: the selection, else the current year. */
export function useEffectiveFiscalYear() {
  const [selection] = useFiscalYearSelection();
  const { data: setup } = useSystemSetup();

  return selection ?? setup?.currentFiscalYear ?? "";
}
