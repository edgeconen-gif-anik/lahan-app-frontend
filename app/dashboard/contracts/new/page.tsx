"use client";

import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Copy,
  FileText,
  Hash,
  Lock,
  RefreshCw,
  Save,
  Search,
  Shuffle,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCreateContract, useNextContractNumber } from "@/hooks/contract/useContracts";
import { useProjects } from "@/hooks/project/useProjects";
import { useCompanies } from "@/hooks/company/useCompany";
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { useUsers } from "@/hooks/user/useUsers";
import type { CreateContractPayload } from "@/lib/schema/contract/contract";
import { toAdDate } from "@/lib/date-utils";
import { isApprovedStatus } from "@/lib/schema/approval";
import {
  buildAgreementDraftText,
  buildWorkOrderDraftText,
  formatContractCurrency,
  type ContractDocumentVariant,
} from "@/lib/contract-documents";
import { cn } from "@/lib/utils";

type ContractNoMode = "sequential" | "uuid" | "manual";
type DocumentContentMode = "auto" | "manual";
type FieldErrors = Record<string, string>;

interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ContractProjectOption {
  id: string;
  name: string;
  sNo?: string | null;
}

interface CompanyRecord {
  approvalStatus?: string;
  id: string;
  name: string;
  panNumber?: number | string | null;
}

interface UserCommitteeRecord {
  id: string;
  name: string;
}

interface UserRecord {
  designation?: string | null;
  email?: string | null;
  id: string;
  name: string;
}

const BS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const INITIAL_FORM_DATA = {
  contractNumber: "",
  contractAmount: 0,
  startDate: "",
  intendedCompletionDate: "",
  actualCompletionDate: "" as string | undefined,
  remarks: "",
  projectId: "",
  companyId: "" as string | undefined,
  userCommitteeId: "" as string | undefined,
  siteInchargeId: "" as string | undefined,
  agreement: {
    agreementDate: "",
    content: "",
    amount: 0,
    contractorSignatory: "",
    officeSignatory: "",
    witnessName: "",
  },
  workOrder: {
    workCompletionDate: "",
    content: "",
    contractorSignatory: "",
    officeSignatory: "",
    witnessName: "",
  },
};

type ContractFormData = typeof INITIAL_FORM_DATA;

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

function extractList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "object" && raw !== null) {
    const withData = raw as { data?: T[]; results?: T[] };
    if (Array.isArray(withData.data)) return withData.data;
    if (Array.isArray(withData.results)) return withData.results;
  }
  return [];
}

function isValidBsDate(value: string) {
  return BS_DATE_PATTERN.test(value.trim()) && Boolean(toAdDate(value.trim()));
}

function formatBsDateInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 4) return digitsOnly;
  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
}

function getInputClassName(hasError?: boolean, extraClassName?: string) {
  return cn(
    "w-full rounded-xl border bg-background/95 text-sm shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 focus:outline-none",
    hasError
      ? "border-destructive/60 bg-destructive/5 focus:border-destructive focus:ring-4 focus:ring-destructive/10"
      : "border-border/80 hover:border-foreground/15 focus:border-foreground/15 focus:ring-4 focus:ring-foreground/5",
    extraClassName
  );
}

function getTextareaClassName(hasError?: boolean) {
  return getInputClassName(hasError, "min-h-[120px] resize-y px-3 py-2 leading-6");
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().split("-").slice(0, 2).join("").toUpperCase().slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

interface SearchableSelectProps {
  disabled?: boolean;
  error?: string;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onSearchChange?: (search: string) => void;
  onTouched?: () => void;
  options: ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  value: string;
}

function SearchableSelect({
  disabled = false,
  error,
  isLoading = false,
  onChange,
  onSearchChange,
  onTouched,
  options,
  placeholder = "Select an option",
  required = false,
  searchPlaceholder = "Search...",
  searchValue,
  value,
}: SearchableSelectProps) {
  const isServerSearch = typeof onSearchChange === "function";
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = isServerSearch ? (searchValue ?? "") : localSearch;
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (!isServerSearch) setLocalSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isServerSearch]);

  useEffect(() => {
    if (open) {
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timeout);
    }
  }, [open]);

  const filteredOptions = isServerSearch
    ? options
    : options.filter((option) => {
        const query = localSearch.toLowerCase();
        return (
          option.label.toLowerCase().includes(query) ||
          (option.sublabel ?? "").toLowerCase().includes(query)
        );
      });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (isServerSearch) onSearchChange?.(nextValue);
    else setLocalSearch(nextValue);
  };

  const handleSelect = (nextValue: string) => {
    onTouched?.();
    onChange(nextValue);
    setOpen(false);
    if (!isServerSearch) setLocalSearch("");
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onTouched?.();
    onChange("");
    if (isServerSearch) onSearchChange?.("");
    else setLocalSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && isServerSearch) onSearchChange?.("");
          setOpen((previous) => !previous);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm transition-all focus:outline-none",
          error
            ? "border-destructive/60 bg-destructive/5 text-foreground"
            : open
            ? "border-foreground/15 bg-background ring-4 ring-foreground/5"
            : "border-border/80 bg-background/95 hover:border-foreground/15",
          disabled ? "cursor-not-allowed bg-muted/40 opacity-60" : "cursor-pointer"
        )}
      >
        <span className={selected ? "truncate text-foreground" : "truncate text-muted-foreground"}>
          {isLoading && !open && !selected ? "Loading..." : selected?.label ?? placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <span
              onClick={handleClear}
              className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={13} />
            </span>
          )}
          {disabled ? (
            <Lock size={13} className="text-muted-foreground" />
          ) : (
            <ChevronDown
              size={15}
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          )}
        </div>
      </button>

      <select
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        required={required}
        tabIndex={-1}
        value={value}
        onChange={() => undefined}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value} />
        ))}
      </select>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border/70 bg-popover/95 shadow-2xl backdrop-blur animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="border-b border-border/70 bg-muted/30 p-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-transparent bg-background py-2 pl-8 pr-3 text-sm transition-colors focus:border-foreground/15 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                <RefreshCw size={14} className="mr-2 inline animate-spin" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {search ? "No results found" : "Type to search..."}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/70",
                    option.value === value && "bg-foreground/[0.06] font-medium text-foreground"
                  )}
                >
                  <span>{option.label}</span>
                  {option.sublabel && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {option.sublabel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ContractNumberInputProps {
  error?: string;
  isLoadingNumber?: boolean;
  numberSource?: "server" | "local" | "unavailable";
  onBlur?: () => void;
  onChange: (value: string) => void;
  onRefetchNumber?: () => void | Promise<unknown>;
  serverSuggestedNumber: string;
  value: string;
}

function ContractNumberInput({
  error,
  isLoadingNumber = false,
  numberSource = "server",
  onBlur,
  onChange,
  onRefetchNumber,
  serverSuggestedNumber,
  value,
}: ContractNumberInputProps) {
  const [mode, setMode] = useState<ContractNoMode>("sequential");
  const [copied, setCopied] = useState(false);
  const syncSequentialNumber = useEffectEvent((nextValue: string) => {
    onChange(nextValue);
  });

  useEffect(() => {
    if (
      mode === "sequential" &&
      serverSuggestedNumber &&
      value !== serverSuggestedNumber
    ) {
      syncSequentialNumber(serverSuggestedNumber);
    }
  }, [mode, serverSuggestedNumber, value]);

  const modes = [
    { id: "sequential" as const, label: "Sequential", icon: <Hash size={12} /> },
    { id: "uuid" as const, label: "UUID", icon: <Shuffle size={12} /> },
    {
      id: "manual" as const,
      label: "Manual",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      ),
    },
  ];

  const handleModeChange = (nextMode: ContractNoMode) => {
    setMode(nextMode);
    if (nextMode === "sequential") onChange(serverSuggestedNumber);
    else if (nextMode === "uuid") onChange(generateUUID());
    else onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-xl border border-border/70 bg-muted/35 p-1">
        {modes.map((modeOption) => (
          <button
            key={modeOption.id}
            type="button"
            onClick={() => handleModeChange(modeOption.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
              mode === modeOption.id
                ? "border border-border/80 bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {modeOption.icon}
            {modeOption.label}
          </button>
        ))}
      </div>

      <div className="min-h-[18px] text-xs">
        {mode === "sequential" ? (
          isLoadingNumber ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <RefreshCw size={11} className="animate-spin shrink-0" />
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
        <input
          type="text"
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          readOnly={mode !== "manual"}
          required
          placeholder={mode === "manual" ? "e.g. CNT-2082-0001" : ""}
          className={cn(
            "h-11 flex-1 rounded-xl border px-3 py-2 font-mono text-sm shadow-sm transition-all focus:outline-none",
            mode !== "manual"
              ? error
                ? "border-destructive/60 bg-destructive/5 text-foreground"
                : "border-dashed border-border/80 bg-muted/35 text-muted-foreground"
              : getInputClassName(Boolean(error), "px-3 py-2"),
            mode !== "manual" && error && "bg-destructive/5 text-foreground"
          )}
        />

        {mode !== "manual" && (
          <button
            type="button"
            onClick={() => {
              if (mode === "sequential") onRefetchNumber?.();
              if (mode === "uuid") onChange(generateUUID());
            }}
            disabled={mode === "sequential" && isLoadingNumber}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            title={mode === "sequential" ? "Refresh suggested number" : "Generate new UUID"}
          >
            <RefreshCw
              size={14}
              className={mode === "sequential" && isLoadingNumber ? "animate-spin" : ""}
            />
          </button>
        )}

        <button
          type="button"
          onClick={async () => {
            if (!value) return;
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          disabled={!value}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

const STEPS = ["General details", "Agreement", "Work order", "Review"] as const;

function ProgressStepper({ current }: { current: number }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card/90 px-5 py-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-y-3">
      {STEPS.map((label, index) => {
        const isDone = index < current;
        const isActive = index === current;

        return (
          <React.Fragment key={label}>
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isDone && "bg-foreground text-background",
                  isActive && "border border-border bg-background text-foreground shadow-sm",
                  !isDone && !isActive && "border border-border/60 bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check size={12} /> : index + 1}
              </div>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-xs font-medium sm:block",
                  isActive
                    ? "text-foreground"
                    : isDone
                    ? "text-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-colors",
                  isDone ? "bg-foreground/20" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
      </div>
    </div>
  );
}

interface BsDateInputProps {
  error?: string;
  name: string;
  onBlur?: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

function BsDateInput({
  error,
  name,
  onBlur,
  onChange,
  placeholder = "2082-01-15",
  required,
  value,
}: BsDateInputProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatBsDateInput(event.target.value);

    if (formattedValue !== event.target.value) {
      event.target.value = formattedValue;
      event.currentTarget.value = formattedValue;
    }

    onChange(event);
  };

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        inputMode="numeric"
        maxLength={10}
        onBlur={onBlur}
        onChange={handleDateChange}
        required={required}
        placeholder={placeholder}
        pattern="\d{4}-\d{2}-\d{2}"
        className={getInputClassName(Boolean(error), "h-11 pl-3 pr-14 py-2")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border/70 bg-muted/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        BS
      </span>
    </div>
  );
}

interface CurrencyInputProps {
  error?: string;
  hint?: string;
  name: string;
  onBlur?: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  value: number | string;
}

function CurrencyInput({
  error,
  hint,
  name,
  onBlur,
  onChange,
  placeholder = "0.00",
  required,
  value,
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none rounded-full border border-border/70 bg-muted/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Rs.
      </span>
      <input
        type="number"
        name={name}
        value={value || ""}
        onBlur={onBlur}
        onChange={onChange}
        required={required}
        min="0"
        step="0.01"
        placeholder={placeholder}
        className={getInputClassName(Boolean(error), "h-11 pl-14 pr-3 py-2")}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({
  addon,
  children,
  description,
  icon,
  title,
}: {
  addon?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card/90 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.5)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(244,244,245,0.68)_100%)] px-6 py-4 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.82)_0%,rgba(17,17,19,0.92)_100%)]">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {icon && <span className="text-foreground/70">{icon}</span>}
            {title}
          </h2>
          {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
        {addon}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  children,
  error,
  fieldPath,
  hint,
  label,
  optional,
  required,
}: {
  children: React.ReactNode;
  error?: string;
  fieldPath?: string;
  hint?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5" data-field-path={fieldPath}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/90">
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full border transition-colors",
          checked
            ? "border-foreground bg-foreground"
            : "border-border bg-muted/70"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      <span className={cn("font-medium transition-colors", checked ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </label>
  );
}

function PlaceholderBanner({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
      <span className="rounded-full border border-border/70 bg-background/80 p-3 text-muted-foreground/80 shadow-sm">
        {icon}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ImplBadge({ type }: { type: ContractDocumentVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        type === "COMPANY"
          ? "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          : "border-stone-300 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
      )}
    >
      {type === "COMPANY" ? <Building2 size={11} /> : <Users size={11} />}
      {type === "COMPANY" ? "Company agreement format" : "Committee agreement format"}
    </span>
  );
}

function DocumentDraftCard({
  description,
  isAuto,
  onToggleMode,
  preview,
  toggleLabel,
  title,
}: {
  description: string;
  isAuto: boolean;
  onToggleMode: () => void;
  preview: string;
  toggleLabel: string;
  title: string;
}) {
  return (
    <div className="rounded-[26px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,244,245,0.94)_100%)] p-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.95)_0%,rgba(17,17,19,0.94)_100%)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles size={13} />
              {title}
            </p>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                isAuto
                  ? "border-foreground/10 bg-foreground/[0.06] text-foreground"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {isAuto ? "Auto format on" : "Manual edit mode"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggleMode}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            isAuto
              ? "border border-border bg-background text-foreground hover:bg-muted"
              : "bg-foreground text-background hover:opacity-90"
          )}
        >
          <Sparkles size={13} />
          {toggleLabel}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/90 px-4 py-4 shadow-sm">
        <p className="max-h-44 overflow-auto text-sm leading-6 text-foreground/85">{preview}</p>
      </div>
    </div>
  );
}

function SignatureFields({
  contractorLabel = "Contractor signatory",
  data,
  onChange,
}: {
  contractorLabel?: string;
  data: ContractFormData["agreement"] | ContractFormData["workOrder"];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <Field label="Office signatory">
        <input
          type="text"
          name="officeSignatory"
          value={data.officeSignatory}
          onChange={onChange}
          className={getInputClassName(false, "h-10 px-3 py-2")}
          placeholder="Full name"
        />
      </Field>
      <Field label={contractorLabel}>
        <input
          type="text"
          name="contractorSignatory"
          value={data.contractorSignatory}
          onChange={onChange}
          className={getInputClassName(false, "h-10 px-3 py-2")}
          placeholder="Full name"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Witness name">
          <input
            type="text"
            name="witnessName"
            value={data.witnessName}
            onChange={onChange}
            className={getInputClassName(false, "h-10 px-3 py-2")}
            placeholder="Full name"
          />
        </Field>
      </div>
    </>
  );
}

function AgreementForm({
  data,
  draftText,
  errorFor,
  onBlurField,
  onChange,
  onToggleContentMode,
  contentMode,
  variant,
}: {
  data: ContractFormData["agreement"];
  draftText: string;
  errorFor: (fieldPath: string) => string | undefined;
  onBlurField: (fieldPath: string) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleContentMode: () => void;
  contentMode: DocumentContentMode;
  variant: ContractDocumentVariant;
}) {
  const isCommittee = variant === "USER_COMMITTEE";
  const isAuto = contentMode === "auto";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <DocumentDraftCard
          description={
            isAuto
              ? "Agreement text is being formatted automatically from the selected project, amount, timeline, and implementation type."
              : "Manual mode is active. Switch back anytime to use the live auto-formatted agreement text."
          }
          isAuto={isAuto}
          onToggleMode={onToggleContentMode}
          preview={draftText}
          toggleLabel={isAuto ? "Customize manually" : "Switch back to auto format"}
          title={isCommittee ? "Committee agreement draft" : "Company agreement draft"}
        />
      </div>

      <Field
        label="Agreement date (BS)"
        required
        hint="Bikram Sambat format"
        error={errorFor("agreement.agreementDate")}
        fieldPath="agreement.agreementDate"
      >
        <BsDateInput
          name="agreementDate"
          value={data.agreementDate}
          onBlur={() => onBlurField("agreement.agreementDate")}
          onChange={onChange}
          required
          error={errorFor("agreement.agreementDate")}
        />
      </Field>

      <Field
        label="Agreement amount"
        hint="Defaults to the contract amount. You can still override it here."
        error={errorFor("agreement.amount")}
        fieldPath="agreement.amount"
      >
        <CurrencyInput
          name="amount"
          value={data.amount}
          onBlur={() => onBlurField("agreement.amount")}
          onChange={onChange}
          error={errorFor("agreement.amount")}
        />
      </Field>

      <div className="md:col-span-2">
        {isAuto ? (
          <div
            className="rounded-2xl border border-border/70 bg-muted/25 p-4"
            data-field-path="agreement.content"
          >
            <p className="text-sm font-semibold text-foreground">
              Agreement text is auto-formatted
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              This content will update automatically as you change the project,
              implementation type, amount, or dates.
            </p>
          </div>
        ) : (
          <Field
            label={isCommittee ? "Committee responsibilities" : "Agreement scope and terms"}
            required
            error={errorFor("agreement.content")}
            fieldPath="agreement.content"
          >
            <textarea
              name="content"
              value={data.content}
              rows={5}
              onBlur={() => onBlurField("agreement.content")}
              onChange={onChange}
              required
              className={getTextareaClassName(Boolean(errorFor("agreement.content")))}
              placeholder={
                isCommittee
                  ? "Describe the committee responsibilities, records, monitoring, and timeline. Minimum 10 characters."
                  : "Describe the contract scope, implementation terms, monitoring, and delivery requirements. Minimum 10 characters."
              }
            />
          </Field>
        )}
      </div>

      <SignatureFields
        data={data}
        onChange={onChange as (event: React.ChangeEvent<HTMLInputElement>) => void}
        contractorLabel={isCommittee ? "Committee signatory" : "Contractor signatory"}
      />
    </div>
  );
}

function WorkOrderForm({
  data,
  draftText,
  errorFor,
  onBlurField,
  onChange,
  onToggleContentMode,
  contentMode,
  variant,
}: {
  data: ContractFormData["workOrder"];
  draftText: string;
  errorFor: (fieldPath: string) => string | undefined;
  onBlurField: (fieldPath: string) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleContentMode: () => void;
  contentMode: DocumentContentMode;
  variant: ContractDocumentVariant;
}) {
  const isAuto = contentMode === "auto";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <DocumentDraftCard
          description={
            isAuto
              ? "Work order text is being formatted automatically from the chosen project, contract value, start date, and completion deadline."
              : "Manual mode is active. Switch back anytime to restore the live auto-formatted work order text."
          }
          isAuto={isAuto}
          onToggleMode={onToggleContentMode}
          preview={draftText}
          toggleLabel={isAuto ? "Customize manually" : "Switch back to auto format"}
          title="Work order draft"
        />
      </div>

      <Field
        label="Work completion date (BS)"
        required
        hint="Bikram Sambat format"
        error={errorFor("workOrder.workCompletionDate")}
        fieldPath="workOrder.workCompletionDate"
      >
        <BsDateInput
          name="workCompletionDate"
          value={data.workCompletionDate}
          onBlur={() => onBlurField("workOrder.workCompletionDate")}
          onChange={onChange}
          required
          error={errorFor("workOrder.workCompletionDate")}
        />
      </Field>

      <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Format note
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Work order layout stays the same for both company and committee contracts.
          The signatory label adjusts automatically so the final document reads
          naturally.
        </p>
      </div>

      <div className="md:col-span-2">
        {isAuto ? (
          <div
            className="rounded-2xl border border-border/70 bg-muted/25 p-4"
            data-field-path="workOrder.content"
          >
            <p className="text-sm font-semibold text-foreground">
              Work order text is auto-formatted
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              This section will keep itself updated from the contract details unless
              you switch to manual editing.
            </p>
          </div>
        ) : (
          <Field
            label="Scope of work"
            required
            error={errorFor("workOrder.content")}
            fieldPath="workOrder.content"
          >
            <textarea
              name="content"
              value={data.content}
              rows={5}
              onBlur={() => onBlurField("workOrder.content")}
              onChange={onChange}
              required
              className={getTextareaClassName(Boolean(errorFor("workOrder.content")))}
              placeholder="Describe the approved work scope, execution conditions, measurement basis, and completion expectations. Minimum 10 characters."
            />
          </Field>
        )}
      </div>

      <SignatureFields
        data={data}
        onChange={onChange as (event: React.ChangeEvent<HTMLInputElement>) => void}
        contractorLabel={variant === "USER_COMMITTEE" ? "Committee signatory" : "Contractor signatory"}
      />
    </div>
  );
}

export default function NewContractPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { mutateAsync: createContract, isPending } = useCreateContract();
  const [formData, setFormData] = useState<ContractFormData>(INITIAL_FORM_DATA);

  const {
    contractNumber: serverContractNumber,
    source: contractNumberSource,
    isLoading: isLoadingContractNumber,
    refetch: refetchContractNumber,
  } = useNextContractNumber(formData.projectId || undefined);

  const [projectSearch, setProjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [includeAgreement, setIncludeAgreement] = useState(false);
  const [includeWorkOrder, setIncludeWorkOrder] = useState(false);
  const [implementationBy, setImplementationBy] = useState<ContractDocumentVariant>("COMPANY");
  const [agreementContentMode, setAgreementContentMode] = useState<DocumentContentMode>("auto");
  const [workOrderContentMode, setWorkOrderContentMode] = useState<DocumentContentMode>("auto");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);

  const debouncedProjectSearch = useDebounce(projectSearch, 350);
  const debouncedUserSearch = useDebounce(userSearch, 350);

  const { data: projects, isLoading: isLoadingProjects } = useProjects({
    search: debouncedProjectSearch,
  });
  const {
    data: users,
    isError: isUsersError,
    isLoading: isLoadingUsers,
  } = useUsers({ search: debouncedUserSearch }, { enabled: isAdmin });
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
  const { data: userCommittees, isLoading: isLoadingUC } = useUserCommittees();

  const availableProjects = extractList<ContractProjectOption>(projects);

  const projectOptions = useMemo<ComboboxOption[]>(
    () =>
      availableProjects.map((project) => ({
        value: project.id,
        label: project.name,
        sublabel: project.sNo ? `S.No: ${project.sNo}` : undefined,
      })),
    [availableProjects]
  );

  const companyOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<CompanyRecord>(companies)
        .filter((company) => isApprovedStatus(company.approvalStatus))
        .map((company) => ({
          value: company.id,
          label: company.name,
          sublabel: company.panNumber ? `PAN: ${company.panNumber}` : undefined,
        })),
    [companies]
  );

  const userCommitteeOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<UserCommitteeRecord>(userCommittees).map((committee) => ({
        value: committee.id,
        label: committee.name,
      })),
    [userCommittees]
  );

  const adminUserOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<UserRecord>(users).map((user) => ({
        value: user.id,
        label: user.name,
        sublabel: user.designation ?? user.email ?? undefined,
      })),
    [users]
  );

  const currentUserOption: ComboboxOption[] = session?.user?.id
    ? [
        {
          value: session.user.id,
          label: session.user.name ?? "Current user",
          sublabel: session.user.email ?? "Logged in user",
        },
      ]
    : [];

  const userOptions = isAdmin ? adminUserOptions : currentUserOption;
  const siteInchargeValue = isAdmin ? formData.siteInchargeId ?? "" : session?.user?.id ?? "";
  const siteInchargeHint = isAdmin
    ? isUsersError
      ? "Users could not be loaded. Check permissions or try again."
      : "Search and select the user responsible for site supervision."
    : "Your account is automatically assigned as site incharge.";

  const selectedProject = projectOptions.find((option) => option.value === formData.projectId);
  const selectedImplementor =
    implementationBy === "COMPANY"
      ? companyOptions.find((option) => option.value === (formData.companyId ?? ""))
      : userCommitteeOptions.find((option) => option.value === (formData.userCommitteeId ?? ""));

  const buildAgreementDraftFor = (
    state: ContractFormData,
    variant: ContractDocumentVariant
  ) =>
    buildAgreementDraftText({
      variant,
      contractNumber: state.contractNumber,
      projectName: selectedProject?.label ?? projectOptions.find((option) => option.value === state.projectId)?.label,
      implementorName:
        variant === "COMPANY"
          ? companyOptions.find((option) => option.value === (state.companyId ?? ""))?.label
          : userCommitteeOptions.find((option) => option.value === (state.userCommitteeId ?? ""))?.label,
      contractAmount: state.contractAmount,
      agreementAmount: state.agreement.amount || state.contractAmount,
      startDateBs: state.startDate,
      intendedCompletionDateBs: state.intendedCompletionDate,
      agreementDateBs: state.agreement.agreementDate,
    });

  const buildWorkOrderDraftFor = (
    state: ContractFormData,
    variant: ContractDocumentVariant
  ) =>
    buildWorkOrderDraftText({
      variant,
      contractNumber: state.contractNumber,
      projectName: selectedProject?.label ?? projectOptions.find((option) => option.value === state.projectId)?.label,
      implementorName:
        variant === "COMPANY"
          ? companyOptions.find((option) => option.value === (state.companyId ?? ""))?.label
          : userCommitteeOptions.find((option) => option.value === (state.userCommitteeId ?? ""))?.label,
      contractAmount: state.contractAmount,
      startDateBs: state.startDate,
      intendedCompletionDateBs: state.intendedCompletionDate,
      workCompletionDateBs: state.workOrder.workCompletionDate,
    });

  const agreementDraftText = buildAgreementDraftFor(formData, implementationBy);
  const workOrderDraftText = buildWorkOrderDraftFor(formData, implementationBy);
  const agreementContentValue =
    agreementContentMode === "auto" ? agreementDraftText : formData.agreement.content;
  const workOrderContentValue =
    workOrderContentMode === "auto" ? workOrderDraftText : formData.workOrder.content;
  const activeStep = includeWorkOrder ? 2 : includeAgreement ? 1 : 0;

  const getRelevantFields = () => {
    const fields = [
      "contractNumber",
      "contractAmount",
      "projectId",
      "siteInchargeId",
      "startDate",
      "intendedCompletionDate",
      "actualCompletionDate",
      implementationBy === "COMPANY" ? "companyId" : "userCommitteeId",
    ];

    if (includeAgreement) {
      fields.push("agreement.agreementDate", "agreement.amount", "agreement.content");
    }

    if (includeWorkOrder) {
      fields.push("workOrder.workCompletionDate", "workOrder.content");
    }

    return fields;
  };

  const validateField = (fieldPath: string, state: ContractFormData = formData) => {
    const startDate = state.startDate.trim();
    const startDateAd = startDate ? toAdDate(startDate) : null;

    switch (fieldPath) {
      case "contractNumber":
        return state.contractNumber.trim()
          ? undefined
          : "Generate or enter a contract number.";
      case "contractAmount":
        return Number(state.contractAmount) > 0
          ? undefined
          : "Contract amount must be greater than 0.";
      case "projectId":
        return state.projectId ? undefined : "Select a project.";
      case "siteInchargeId":
        return (isAdmin ? state.siteInchargeId : session?.user?.id)
          ? undefined
          : "Select a site incharge.";
      case "startDate":
        if (!startDate) return "Enter the start date in BS format.";
        if (!isValidBsDate(startDate)) return "Use a valid BS date like 2082-01-15.";
        return undefined;
      case "intendedCompletionDate": {
        const value = state.intendedCompletionDate.trim();
        if (!value) return "Enter the intended completion date.";
        if (!isValidBsDate(value)) return "Use a valid BS date like 2082-01-15.";
        const intendedCompletionDateAd = toAdDate(value);
        if (startDateAd && intendedCompletionDateAd && intendedCompletionDateAd <= startDateAd) {
          return "Completion date must be after the start date.";
        }
        return undefined;
      }
      case "actualCompletionDate": {
        const value = state.actualCompletionDate?.trim() ?? "";
        if (!value) return undefined;
        if (!isValidBsDate(value)) return "Use a valid BS date like 2082-01-15.";
        const actualCompletionDateAd = toAdDate(value);
        if (startDateAd && actualCompletionDateAd && actualCompletionDateAd <= startDateAd) {
          return "Actual completion date must be after the start date.";
        }
        return undefined;
      }
      case "companyId":
        if (implementationBy !== "COMPANY") return undefined;
        return state.companyId ? undefined : "Select a company / contractor.";
      case "userCommitteeId":
        if (implementationBy !== "USER_COMMITTEE") return undefined;
        return state.userCommitteeId ? undefined : "Select a user committee.";
      case "agreement.agreementDate": {
        if (!includeAgreement) return undefined;
        const value = state.agreement.agreementDate.trim();
        if (!value) return "Enter the agreement date.";
        if (!isValidBsDate(value)) return "Use a valid BS date like 2082-01-15.";
        return undefined;
      }
      case "agreement.amount": {
        if (!includeAgreement) return undefined;
        return Number(state.agreement.amount || state.contractAmount) > 0
          ? undefined
          : "Agreement amount must be greater than 0.";
      }
      case "agreement.content":
        if (!includeAgreement) return undefined;
        return (
          (
            agreementContentMode === "auto"
              ? buildAgreementDraftFor(state, implementationBy)
              : state.agreement.content
          )
            .trim()
            .length >= 10
        )
          ? undefined
          : "Agreement content must be at least 10 characters.";
      case "workOrder.workCompletionDate": {
        if (!includeWorkOrder) return undefined;
        const value = state.workOrder.workCompletionDate.trim();
        if (!value) return "Enter the work completion date.";
        if (!isValidBsDate(value)) return "Use a valid BS date like 2082-01-15.";
        const workCompletionDateAd = toAdDate(value);
        if (startDateAd && workCompletionDateAd && workCompletionDateAd <= startDateAd) {
          return "Work completion date must be after the start date.";
        }
        return undefined;
      }
      case "workOrder.content":
        if (!includeWorkOrder) return undefined;
        return (
          (
            workOrderContentMode === "auto"
              ? buildWorkOrderDraftFor(state, implementationBy)
              : state.workOrder.content
          )
            .trim()
            .length >= 10
        )
          ? undefined
          : "Work order content must be at least 10 characters.";
      default:
        return undefined;
    }
  };

  const collectValidationErrors = (state: ContractFormData = formData) => {
    return getRelevantFields().reduce<FieldErrors>((errors, fieldPath) => {
      const error = validateField(fieldPath, state);
      if (error) errors[fieldPath] = error;
      return errors;
    }, {});
  };

  const fieldErrors = (() => {
    if (!didAttemptSubmit && Object.keys(touchedFields).length === 0) {
      return {} as FieldErrors;
    }

    if (didAttemptSubmit) {
      return collectValidationErrors();
    }

    return Object.keys(touchedFields).reduce<FieldErrors>((errors, fieldPath) => {
      if (!touchedFields[fieldPath]) return errors;
      const error = validateField(fieldPath);
      if (error) errors[fieldPath] = error;
      return errors;
    }, {});
  })();

  const markTouched = (...fieldPaths: string[]) => {
    setTouchedFields((previous) => {
      const nextTouched = { ...previous };
      fieldPaths.forEach((fieldPath) => {
        nextTouched[fieldPath] = true;
      });
      return nextTouched;
    });
  };

  const scrollToFirstError = (errors: FieldErrors) => {
    const firstErrorField = getRelevantFields().find((fieldPath) => errors[fieldPath]);
    if (!firstErrorField) return;

    const element = document.querySelector(`[data-field-path="${firstErrorField}"]`);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const setAndClearServerError = (updater: (current: ContractFormData) => ContractFormData) => {
    setSubmitError(null);
    setFormData((current) => updater(current));
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = event.target;
    setAndClearServerError((current) => ({
      ...current,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleProjectChange = (projectId: string) => {
    markTouched("projectId");
    setAndClearServerError((current) => ({
      ...current,
      projectId,
      siteInchargeId: isAdmin ? current.siteInchargeId : session?.user?.id ?? "",
    }));
  };

  const handleAgreementChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = event.target;
    setAndClearServerError((current) => ({
      ...current,
      agreement: {
        ...current.agreement,
        [name]: type === "number" ? Number(value) : value,
      },
    }));
  };

  const handleWorkOrderChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setAndClearServerError((current) => ({
      ...current,
      workOrder: {
        ...current.workOrder,
        [name]: value,
      },
    }));
  };

  const toggleAgreementContentMode = () => {
    setSubmitError(null);

    if (agreementContentMode === "auto") {
      setAgreementContentMode("manual");
      setFormData((current) => ({
        ...current,
        agreement: {
          ...current.agreement,
          content:
            current.agreement.content.trim() || buildAgreementDraftFor(current, implementationBy),
        },
      }));
      markTouched("agreement.content");
      return;
    }

    setAgreementContentMode("auto");
  };

  const toggleWorkOrderContentMode = () => {
    setSubmitError(null);

    if (workOrderContentMode === "auto") {
      setWorkOrderContentMode("manual");
      setFormData((current) => ({
        ...current,
        workOrder: {
          ...current.workOrder,
          content:
            current.workOrder.content.trim() || buildWorkOrderDraftFor(current, implementationBy),
        },
      }));
      markTouched("workOrder.content");
      return;
    }

    setWorkOrderContentMode("auto");
  };

  const handleAgreementToggle = (checked: boolean) => {
    setSubmitError(null);
    setIncludeAgreement(checked);

    if (!checked) return;

    setAgreementContentMode("auto");

    setFormData((current) => ({
      ...current,
      agreement: {
        ...current.agreement,
        agreementDate: current.agreement.agreementDate || current.startDate,
        amount: Number(current.agreement.amount || current.contractAmount),
      },
    }));
  };

  const handleWorkOrderToggle = (checked: boolean) => {
    setSubmitError(null);
    setIncludeWorkOrder(checked);

    if (!checked) return;

    setWorkOrderContentMode("auto");

    setFormData((current) => ({
      ...current,
      workOrder: {
        ...current.workOrder,
        workCompletionDate:
          current.workOrder.workCompletionDate || current.intendedCompletionDate,
      },
    }));
  };

  const handleImplementationChange = (nextImplementation: ContractDocumentVariant) => {
    setSubmitError(null);
    markTouched(nextImplementation === "COMPANY" ? "companyId" : "userCommitteeId");
    setImplementationBy(nextImplementation);
    setFormData((current) => ({
      ...current,
      companyId: nextImplementation === "USER_COMMITTEE" ? "" : current.companyId,
      userCommitteeId: nextImplementation === "COMPANY" ? "" : current.userCommitteeId,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDidAttemptSubmit(true);
    setSubmitError(null);

    const validationErrors = collectValidationErrors();
    if (Object.keys(validationErrors).length > 0) {
      const touched = getRelevantFields().reduce<Record<string, boolean>>((all, fieldPath) => {
        all[fieldPath] = true;
        return all;
      }, {});

      setTouchedFields((current) => ({ ...current, ...touched }));
      setSubmitError("Please review the highlighted fields and try again.");
      scrollToFirstError(validationErrors);
      return;
    }

    const convertDate = (bsDate: string): string | null => {
      if (!bsDate) return null;
      const adDate = toAdDate(bsDate);
      return adDate ? adDate.toISOString() : null;
    };

    const startDate = convertDate(formData.startDate);
    const intendedCompletionDate = convertDate(formData.intendedCompletionDate);
    const actualCompletionDate = formData.actualCompletionDate
      ? convertDate(formData.actualCompletionDate)
      : undefined;

    if (!startDate || !intendedCompletionDate) {
      setSubmitError("Some dates could not be converted. Please review the BS dates.");
      return;
    }

    const companyId =
      implementationBy === "COMPANY" ? formData.companyId || undefined : undefined;
    const userCommitteeId =
      implementationBy === "USER_COMMITTEE"
        ? formData.userCommitteeId || undefined
        : undefined;

    const agreement = includeAgreement
      ? {
          ...formData.agreement,
          agreementDate: convertDate(formData.agreement.agreementDate)!,
          amount: Number(formData.agreement.amount || formData.contractAmount),
          content: agreementContentValue.trim(),
        }
      : undefined;

    const workOrder = includeWorkOrder
      ? {
          ...formData.workOrder,
          workCompletionDate: convertDate(formData.workOrder.workCompletionDate)!,
          content: workOrderContentValue.trim(),
        }
      : undefined;

    try {
      await createContract({
        contractNumber: formData.contractNumber.trim(),
        contractAmount: Number(formData.contractAmount),
        startDate,
        intendedCompletionDate,
        actualCompletionDate: actualCompletionDate ?? undefined,
        remarks: formData.remarks.trim() || undefined,
        projectId: formData.projectId,
        companyId,
        userCommitteeId,
        siteInchargeId: isAdmin
          ? formData.siteInchargeId || undefined
          : session?.user?.id || undefined,
        agreement,
        workOrder,
      } as CreateContractPayload);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null
          ? (
              error as {
                message?: string;
                response?: { data?: { message?: string | string[] } };
              }
            ).response?.data?.message ??
            (error as { message?: string }).message
          : undefined;

      setSubmitError(
        Array.isArray(message)
          ? message.join(" | ")
          : message ?? "Failed to create contract. Please try again."
      );
    }
  };

  const summaryCards = [
    {
      label: "Implementation",
      value: implementationBy === "COMPANY" ? "Company / contractor" : "User committee",
      detail: selectedImplementor?.label ?? "Choose the implementing party",
    },
    {
      label: "Project",
      value: selectedProject?.label ?? "Project not selected",
      detail: selectedProject?.sublabel ?? "Link the contract to a project",
    },
    {
      label: "Documents",
      value:
        includeAgreement && includeWorkOrder
          ? "Agreement and work order"
          : includeAgreement
          ? "Agreement only"
          : includeWorkOrder
          ? "Work order only"
          : "Contract only",
      detail: "Document drafts adjust from your current form selections",
    },
    {
      label: "Contract value",
      value: formatContractCurrency(formData.contractAmount),
      detail:
        formData.startDate && formData.intendedCompletionDate
          ? `${formData.startDate} -> ${formData.intendedCompletionDate}`
          : "Add dates to complete the contract timeline",
    },
  ];

  const validationIssueCount = Object.keys(fieldErrors).length;
  const validationStatus = didAttemptSubmit
    ? validationIssueCount === 0
      ? "All required fields look ready to save."
      : `${validationIssueCount} ${validationIssueCount === 1 ? "field needs" : "fields need"} attention before saving.`
    : "Live validation is running while you fill the form.";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,244,245,0.75)_32%,rgba(228,228,231,0.4)_58%,transparent_74%),linear-gradient(180deg,rgba(250,250,250,0.96)_0%,rgba(244,244,245,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(63,63,70,0.22),rgba(24,24,27,0.15)_34%,transparent_68%),linear-gradient(180deg,rgba(9,9,11,0.98)_0%,rgba(17,17,19,0.96)_100%)]" />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-20 sm:px-6 xl:px-8">
        <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/85 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Contract Workspace
                  </span>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                      Create new contract
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      Register the contract, keep validation visible while you work,
                      and generate agreement and work-order drafts from one neutral,
                      review-friendly form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground/80">
                  {isAdmin
                    ? "Admin can assign the site incharge"
                    : "Site incharge is filled from the signed-in account"}
                </span>
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground/80">
                  Auto dark theme runs from 7 PM to 6 AM
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[24px] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <ProgressStepper current={activeStep} />

            <form id="new-contract-form" onSubmit={handleSubmit} className="space-y-5">
        <Section
          title="General details"
          icon={<FileText size={16} />}
          description="Core contract information, implementation type, and timeline."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2" data-field-path="contractNumber">
              <label className="text-sm font-medium text-foreground/90">
                Contract number <span className="text-destructive">*</span>
              </label>
              <ContractNumberInput
                value={formData.contractNumber}
                onChange={(value) => {
                  markTouched("contractNumber");
                  setAndClearServerError((current) => ({ ...current, contractNumber: value }));
                }}
                onBlur={() => markTouched("contractNumber")}
                error={fieldErrors.contractNumber}
                serverSuggestedNumber={serverContractNumber}
                numberSource={contractNumberSource}
                isLoadingNumber={isLoadingContractNumber}
                onRefetchNumber={refetchContractNumber}
              />
              {fieldErrors.contractNumber && (
                <p className="text-xs font-medium text-destructive">
                  {fieldErrors.contractNumber}
                </p>
              )}
            </div>

            <Field
              label="Contract amount"
              required
              error={fieldErrors.contractAmount}
              fieldPath="contractAmount"
            >
              <CurrencyInput
                name="contractAmount"
                value={formData.contractAmount}
                onBlur={() => markTouched("contractAmount")}
                onChange={handleChange}
                required
                error={fieldErrors.contractAmount}
              />
            </Field>

            <Field label="Project" required error={fieldErrors.projectId} fieldPath="projectId">
              <SearchableSelect
                options={projectOptions}
                value={formData.projectId}
                onChange={handleProjectChange}
                onTouched={() => markTouched("projectId")}
                placeholder="Select a project"
                searchPlaceholder="Search by name or S.No..."
                isLoading={isLoadingProjects}
                required
                error={fieldErrors.projectId}
                onSearchChange={setProjectSearch}
                searchValue={projectSearch}
              />
            </Field>

            <Field
              label="Site incharge"
              required
              hint={siteInchargeHint}
              error={fieldErrors.siteInchargeId}
              fieldPath="siteInchargeId"
            >
              <SearchableSelect
                options={userOptions}
                value={siteInchargeValue}
                onChange={(value) => {
                  markTouched("siteInchargeId");
                  setAndClearServerError((current) => ({
                    ...current,
                    siteInchargeId: value,
                  }));
                }}
                onTouched={() => markTouched("siteInchargeId")}
                placeholder={isAdmin ? "Select site incharge" : "Current logged-in user"}
                searchPlaceholder="Search by name..."
                isLoading={isAdmin ? isLoadingUsers : false}
                required
                disabled={!isAdmin}
                error={fieldErrors.siteInchargeId}
                onSearchChange={isAdmin ? setUserSearch : undefined}
                searchValue={isAdmin ? userSearch : undefined}
              />
            </Field>

            <Field
              label="Start date (BS)"
              required
              hint="Bikram Sambat format"
              error={fieldErrors.startDate}
              fieldPath="startDate"
            >
              <BsDateInput
                name="startDate"
                value={formData.startDate}
                onBlur={() => markTouched("startDate")}
                onChange={handleChange}
                required
                error={fieldErrors.startDate}
              />
            </Field>

            <Field
              label="Intended completion date (BS)"
              required
              hint="Bikram Sambat format"
              error={fieldErrors.intendedCompletionDate}
              fieldPath="intendedCompletionDate"
            >
              <BsDateInput
                name="intendedCompletionDate"
                value={formData.intendedCompletionDate}
                onBlur={() => markTouched("intendedCompletionDate")}
                onChange={handleChange}
                required
                error={fieldErrors.intendedCompletionDate}
              />
            </Field>

            <Field
              label="Actual completion date (BS)"
              optional
              hint="Leave blank if the contract is not complete yet."
              error={fieldErrors.actualCompletionDate}
              fieldPath="actualCompletionDate"
            >
              <BsDateInput
                name="actualCompletionDate"
                value={formData.actualCompletionDate ?? ""}
                onBlur={() => markTouched("actualCompletionDate")}
                onChange={handleChange}
                placeholder="Optional completion date"
                error={fieldErrors.actualCompletionDate}
              />
            </Field>

            <div className="hidden md:block" />

            <div className="space-y-3 rounded-xl border border-dashed bg-muted/10 p-5 md:col-span-2">
              <div>
                <p className="text-sm font-medium">
                  Implemented through <span className="text-destructive">*</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Agreement pages change by implementation type. Work order pages keep
                  the same layout.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {([
                  {
                    id: "COMPANY" as const,
                    label: "Company / contractor",
                    icon: <Building2 size={15} />,
                  },
                  {
                    id: "USER_COMMITTEE" as const,
                    label: "User committee",
                    icon: <Users size={15} />,
                  },
                ]).map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                      implementationBy === option.id
                        ? "border-foreground/30 bg-foreground/5 font-medium text-foreground"
                        : "border-input text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="implementationBy"
                      className="sr-only"
                      checked={implementationBy === option.id}
                      onChange={() => handleImplementationChange(option.id)}
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        implementationBy === option.id
                          ? "border-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {implementationBy === option.id && (
                        <span className="h-2 w-2 rounded-full bg-foreground" />
                      )}
                    </span>
                    {option.icon}
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              {implementationBy === "COMPANY" ? (
                <Field
                  label="Company / contractor"
                  required
                  hint="Only approved companies are listed."
                  error={fieldErrors.companyId}
                  fieldPath="companyId"
                >
                  <SearchableSelect
                    options={companyOptions}
                    value={formData.companyId ?? ""}
                    onChange={(value) => {
                      markTouched("companyId");
                      setAndClearServerError((current) => ({ ...current, companyId: value }));
                    }}
                    onTouched={() => markTouched("companyId")}
                    placeholder="Search by name or PAN..."
                    searchPlaceholder="Search by name or PAN..."
                    isLoading={isLoadingCompanies}
                    required
                    error={fieldErrors.companyId}
                  />
                </Field>
              ) : (
                <Field
                  label="User committee"
                  required
                  error={fieldErrors.userCommitteeId}
                  fieldPath="userCommitteeId"
                >
                  <SearchableSelect
                    options={userCommitteeOptions}
                    value={formData.userCommitteeId ?? ""}
                    onChange={(value) => {
                      markTouched("userCommitteeId");
                      setAndClearServerError((current) => ({
                        ...current,
                        userCommitteeId: value,
                      }));
                    }}
                    onTouched={() => markTouched("userCommitteeId")}
                    placeholder="Search by committee name..."
                    searchPlaceholder="Search by committee name..."
                    isLoading={isLoadingUC}
                    required
                    error={fieldErrors.userCommitteeId}
                  />
                </Field>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                Remarks
                <span className="text-xs font-normal">(optional)</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                rows={3}
                onChange={handleChange}
                className={getTextareaClassName(false)}
                placeholder="Optional notes about this contract..."
              />
            </div>
          </div>
        </Section>

        <Section
          title="Agreement details"
          icon={<ClipboardList size={16} />}
          description={
            includeAgreement
              ? `Format: ${implementationBy === "COMPANY" ? "Company / contractor" : "User committee"}`
              : "Attach an agreement if the contract should produce a printable agreement page."
          }
          addon={
            <div className="flex items-center gap-3">
              {includeAgreement && <ImplBadge type={implementationBy} />}
              <Toggle
                checked={includeAgreement}
                onChange={handleAgreementToggle}
                label="Include agreement"
              />
            </div>
          }
        >
          {!includeAgreement ? (
            <PlaceholderBanner
              icon={<ClipboardList size={32} />}
              title="No agreement attached"
              description="Enable the agreement section to prefill the agreement date and amount, then auto-format the agreement text from the contract details."
            />
          ) : (
            <AgreementForm
              data={formData.agreement}
              draftText={agreementDraftText}
              contentMode={agreementContentMode}
              errorFor={(fieldPath) => fieldErrors[fieldPath]}
              onBlurField={(fieldPath) => markTouched(fieldPath)}
              onChange={handleAgreementChange}
              onToggleContentMode={toggleAgreementContentMode}
              variant={implementationBy}
            />
          )}
        </Section>

        <Section
          title="Work order details"
          icon={<CheckSquare size={16} />}
          description={
            includeWorkOrder
              ? "Work order page uses one shared layout for both implementation types."
              : "Attach a work order if this contract should generate the standard work-order page."
          }
          addon={
            <div className="flex items-center gap-3">
              {includeWorkOrder && <ImplBadge type={implementationBy} />}
              <Toggle
                checked={includeWorkOrder}
                onChange={handleWorkOrderToggle}
                label="Include work order"
              />
            </div>
          }
        >
          {!includeWorkOrder ? (
            <PlaceholderBanner
              icon={<CheckSquare size={32} />}
              title="No work order attached"
              description="Enable the work order section to prefill the completion date and auto-format the standard work order text."
            />
          ) : (
            <WorkOrderForm
              data={formData.workOrder}
              draftText={workOrderDraftText}
              contentMode={workOrderContentMode}
              errorFor={(fieldPath) => fieldErrors[fieldPath]}
              onBlurField={(fieldPath) => markTouched(fieldPath)}
              onChange={handleWorkOrderChange}
              onToggleContentMode={toggleWorkOrderContentMode}
              variant={implementationBy}
            />
          )}
        </Section>

        {submitError && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-2 xl:hidden">
          <p className="text-xs text-muted-foreground">
            Fields marked <span className="font-semibold text-destructive">*</span> are
            required. Validation appears inline as you work.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-11 rounded-xl border border-border/80 bg-background px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-7 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Save size={15} />
              {isPending ? "Creating..." : "Save contract"}
            </button>
          </div>
        </div>
            </form>
          </div>

          <aside className="hidden space-y-4 xl:block xl:sticky xl:top-6 xl:h-fit">
            <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.55)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Live Status
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {validationIssueCount === 0 ? "Ready for review" : "Needs review"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {validationStatus}
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Current Step
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{STEPS[activeStep]}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Documents
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {includeAgreement || includeWorkOrder
                      ? includeAgreement && includeWorkOrder
                        ? "Agreement and work order included"
                        : includeAgreement
                        ? "Agreement included"
                        : "Work order included"
                      : "Contract only for now"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formData.startDate && formData.intendedCompletionDate
                      ? `${formData.startDate} -> ${formData.intendedCompletionDate}`
                      : "Start and completion dates still needed"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.55)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Quick Summary
              </p>
              <div className="mt-4 space-y-3">
                {summaryCards.map((card) => (
                  <div
                    key={`sidebar-${card.label}`}
                    className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{card.value}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.55)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Actions
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Save when the contract details, implementation party, and optional
                document drafts look right. The printable pages will reuse this same
                live information.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="submit"
                  form="new-contract-form"
                  disabled={isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={15} />
                  {isPending ? "Creating..." : "Save contract"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
