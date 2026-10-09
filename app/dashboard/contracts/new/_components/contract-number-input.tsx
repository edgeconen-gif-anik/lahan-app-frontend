"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { AlertCircle, Check, Copy, Hash, Loader2, Pencil, RefreshCw, Shuffle } from "lucide-react";

import { cn } from "@/lib/utils";
import { inputClassName } from "./form-primitives";
import type { ContractNoMode } from "../_lib/types";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().split("-").slice(0, 2).join("").toUpperCase().slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

interface ContractNumberInputProps {
  error?: string;
  id?: string;
  isCheckingAvailability?: boolean;
  isLoadingNumber?: boolean;
  mode: ContractNoMode;
  numberSource?: "server" | "local" | "unavailable";
  onBlur?: () => void;
  onChange: (value: string) => void;
  onModeChange: (mode: ContractNoMode) => void;
  onRefetchNumber?: () => void | Promise<unknown>;
  serverSuggestedNumber: string;
  value: string;
}

const MODES = [
  { id: "sequential" as const, label: "Sequential", icon: Hash },
  { id: "uuid" as const, label: "Random ID", icon: Shuffle },
  { id: "manual" as const, label: "Manual", icon: Pencil },
];

export function ContractNumberInput({
  error,
  id,
  isCheckingAvailability = false,
  isLoadingNumber = false,
  mode,
  numberSource = "server",
  onBlur,
  onChange,
  onModeChange,
  onRefetchNumber,
  serverSuggestedNumber,
  value,
}: ContractNumberInputProps) {
  const [copied, setCopied] = useState(false);
  const syncSequentialNumber = useEffectEvent((nextValue: string) => {
    onChange(nextValue);
  });

  // In sequential mode the field always follows the server's suggestion.
  useEffect(() => {
    if (mode === "sequential" && serverSuggestedNumber && value !== serverSuggestedNumber) {
      syncSequentialNumber(serverSuggestedNumber);
    }
  }, [mode, serverSuggestedNumber, value]);

  const handleModeChange = (nextMode: ContractNoMode) => {
    onModeChange(nextMode);
    if (nextMode === "sequential") onChange(serverSuggestedNumber);
    else if (nextMode === "uuid") onChange(generateUUID());
    else onChange("");
  };

  return (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="Contract number type" className="flex gap-1 rounded-lg border bg-muted/35 p-1">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            onClick={() => handleModeChange(option.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all",
              mode === option.id
                ? "border bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon size={12} aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>

      <div className="min-h-[18px] text-xs">
        {mode === "sequential" ? (
          isLoadingNumber ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <RefreshCw size={11} className="shrink-0 animate-spin" />
              Fetching next number from server...
            </span>
          ) : serverSuggestedNumber ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-foreground/70">{serverSuggestedNumber}</span>
              <span className="text-muted-foreground">
                {numberSource === "local" ? "local fallback sequence" : "server sequence"}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-destructive/80">
              <AlertCircle size={11} className="shrink-0" />
              Could not fetch a suggested number. Switch to manual entry or retry.
            </span>
          )
        ) : mode === "uuid" ? (
          <span className="text-muted-foreground">
            Random unique contract number generated for this record.
          </span>
        ) : (
          <span className="text-muted-foreground">Enter a custom contract number.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            readOnly={mode !== "manual"}
            aria-invalid={Boolean(error) || undefined}
            placeholder={mode === "manual" ? "e.g. CNT-2082-0001" : ""}
            className={cn(
              inputClassName(Boolean(error), "h-10 px-3 font-mono"),
              mode !== "manual" && !error && "border-dashed bg-muted/35 text-muted-foreground",
              isCheckingAvailability && "pr-9",
            )}
          />
          {isCheckingAvailability ? (
            <Loader2
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-label="Checking availability"
            />
          ) : null}
        </div>

        {mode !== "manual" ? (
          <button
            type="button"
            onClick={() => {
              if (mode === "sequential") onRefetchNumber?.();
              if (mode === "uuid") onChange(generateUUID());
            }}
            disabled={mode === "sequential" && isLoadingNumber}
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label={mode === "sequential" ? "Refresh suggested number" : "Generate a new random ID"}
          >
            <RefreshCw
              size={14}
              className={mode === "sequential" && isLoadingNumber ? "animate-spin" : ""}
            />
          </button>
        ) : null}

        <button
          type="button"
          onClick={async () => {
            if (!value) return;
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard can be blocked; nothing else to do.
            }
          }}
          disabled={!value}
          className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          aria-label="Copy contract number"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
