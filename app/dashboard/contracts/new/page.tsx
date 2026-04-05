"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  ClipboardList,
  CheckSquare,
  Search,
  ChevronDown,
  X,
  Hash,
  RefreshCw,
  Shuffle,
  Copy,
  Check,
  Building2,
  Users,
} from "lucide-react";
import { useCreateContract, useNextContractNumber } from "@/hooks/contract/useContracts";
import type { CreateContractPayload } from "@/lib/schema/contract/contract";
import { useProjects } from "@/hooks/project/useProjects";
import { useCompanies } from "@/hooks/company/useCompany";
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { useUsers } from "@/hooks/user/useUsers";
import { toAdDate } from "@/lib/date-utils";

// ─── Utilities ────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const extractList = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && Array.isArray(raw.data)) return raw.data;
  if (raw.results && Array.isArray(raw.results)) return raw.results;
  return [];
};

// ─── Contract Number Generation ───────────────────────────────────────────────

type ContractNoMode = "sequential" | "uuid" | "manual";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().split("-").slice(0, 2).join("").toUpperCase().slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

// ─── Searchable Combobox ──────────────────────────────────────────────────────

interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  required?: boolean;
  disabled?: boolean;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  isLoading = false,
  required = false,
  disabled = false,
  onSearchChange,
  searchValue,
}: SearchableSelectProps) {
  const isServerSearch = typeof onSearchChange === "function";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cachedSelected, setCachedSelected] = useState<ComboboxOption | undefined>(undefined);
  const [localSearch, setLocalSearch] = useState("");

  const search = isServerSearch ? (searchValue ?? "") : localSearch;
  const selectedInOptions = options.find((o) => o.value === value);
  const selected = selectedInOptions ?? cachedSelected;

  useEffect(() => {
    if (selectedInOptions) setCachedSelected(selectedInOptions);
  }, [selectedInOptions]);

  useEffect(() => {
    if (!value) setCachedSelected(undefined);
  }, [value]);

  const filtered = isServerSearch
    ? options
    : options.filter((o) => {
        const q = localSearch.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          (o.sublabel ?? "").toLowerCase().includes(q)
        );
      });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!isServerSearch) setLocalSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isServerSearch]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (isServerSearch) onSearchChange!(v);
    else setLocalSearch(v);
  };

  const handleSelect = (val: string) => {
    const picked = options.find((o) => o.value === val);
    if (picked) setCachedSelected(picked);
    onChange(val);
    setOpen(false);
    if (!isServerSearch) setLocalSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCachedSelected(undefined);
    onChange("");
    if (isServerSearch) onSearchChange!("");
    else setLocalSearch("");
  };

  const handleOpen = () => {
    if (disabled) return;
    if (!open && isServerSearch) onSearchChange!("");
    setOpen((p) => !p);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2 h-10
          border rounded-lg bg-background text-sm transition-all focus:outline-none
          ${open ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-input hover:border-muted-foreground/40"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {isLoading && !open && !selected ? "Loading..." : selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <select
        tabIndex={-1}
        required={required}
        value={value}
        onChange={() => {}}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      >
        <option value="" />
        {options.map((o) => (
          <option key={o.value} value={o.value} />
        ))}
      </select>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="p-2 border-b bg-muted/30">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleSearchInput}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-transparent rounded-lg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                <RefreshCw size={14} className="inline mr-2 animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {search ? "No results found" : "Type to search..."}
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`
                    w-full text-left px-3 py-2.5 text-sm flex flex-col gap-0.5
                    hover:bg-accent transition-colors
                    ${o.value === value ? "bg-primary/10 text-primary font-medium" : ""}
                  `}
                >
                  <span>{o.label}</span>
                  {o.sublabel && (
                    <span className="text-xs text-muted-foreground font-normal">{o.sublabel}</span>
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

// ─── Contract Number Input ────────────────────────────────────────────────────

interface ContractNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  serverSuggestedNumber: string;
  numberSource?: "server" | "local" | "unavailable";
  isLoadingNumber?: boolean;
  onRefetchNumber?: () => void | Promise<unknown>;
}

function ContractNumberInput({
  value,
  onChange,
  serverSuggestedNumber,
  numberSource = "server",
  isLoadingNumber = false,
  onRefetchNumber,
}: ContractNumberInputProps) {
  const [mode, setMode] = useState<ContractNoMode>("sequential");
  const [copied, setCopied] = useState(false);

  const handleModeChange = (m: ContractNoMode) => {
    setMode(m);
    if (m === "sequential") onChange(serverSuggestedNumber);
    else if (m === "uuid") onChange(generateUUID());
    else onChange("");
  };

  const handleRegenerate = () => {
    if (mode === "sequential") onRefetchNumber?.();
    else if (mode === "uuid") onChange(generateUUID());
  };

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (mode === "sequential" && serverSuggestedNumber) onChange(serverSuggestedNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSuggestedNumber]);

  const modeConfig = [
    { id: "sequential" as ContractNoMode, label: "Sequential", icon: <Hash size={13} /> },
    { id: "uuid"       as ContractNoMode, label: "UUID",       icon: <Shuffle size={13} /> },
    {
      id: "manual" as ContractNoMode,
      label: "Manual",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex rounded-lg border bg-muted/30 p-0.5 gap-0.5">
        {modeConfig.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleModeChange(m.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all
              ${mode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
            `}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5 min-h-[16px]">
        {mode === "sequential" ? (
          isLoadingNumber ? (
            <><RefreshCw size={11} className="animate-spin shrink-0" />Fetching next number from server…</>
          ) : serverSuggestedNumber ? (
            <><span className="font-mono text-foreground/70">{serverSuggestedNumber}</span><span className="text-primary/60">• fetched from server</span></>
          ) : (
            <span className="text-destructive/70">Could not fetch — enter manually or retry ↻</span>
          )
        ) : mode === "uuid" ? (
          "Randomly generated unique ID"
        ) : (
          "Enter a custom contract number"
        )}
      </p>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={mode !== "manual"}
          required
          placeholder={mode === "manual" ? "e.g. CNT-2081-0001" : ""}
          className={`
            flex-1 px-3 py-2 h-10 border rounded-lg text-sm font-mono transition-all
            ${mode !== "manual"
              ? "bg-muted/40 text-muted-foreground cursor-default border-dashed"
              : "bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            }
          `}
        />
        {mode !== "manual" && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={mode === "sequential" && isLoadingNumber}
            title={
              mode === "sequential"
                ? numberSource === "local"
                  ? "Refresh inferred sequence"
                  : "Re-fetch from server"
                : "Generate new UUID"
            }
            className="p-2 h-10 w-10 flex items-center justify-center rounded-lg border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw size={15} className={mode === "sequential" && isLoadingNumber ? "animate-spin" : ""} />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          title="Copy to clipboard"
          className="p-2 h-10 w-10 flex items-center justify-center rounded-lg border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children, addon, description }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  addon?: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {addon}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, required, children, colSpan, hint }: {
  label: string; required?: boolean; children: React.ReactNode; colSpan?: "2"; hint?: string;
}) {
  return (
    <div className={`space-y-1.5 ${colSpan === "2" ? "md:col-span-2" : ""}`}>
      <label className="text-sm font-medium text-foreground/90">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      <span className={checked ? "text-foreground font-medium" : "text-muted-foreground"}>{label}</span>
    </label>
  );
}

// ─── Placeholder Banner ───────────────────────────────────────────────────────

function PlaceholderBanner({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10 text-center">
      <span className="text-muted-foreground/40">{icon}</span>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 h-10 border border-input rounded-lg bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60";
const textareaCls =
  "w-full px-3 py-2 border border-input rounded-lg bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-muted-foreground/60";

// ─── Signature Fields (shared) ────────────────────────────────────────────────

function SignatureFields({
  data,
  onChange,
}: {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <Field label="Office Signatory">
        <input
          type="text"
          name="officeSignatory"
          value={data?.officeSignatory ?? ""}
          onChange={onChange}
          className={inputCls}
          placeholder="Full name"
        />
      </Field>
      <Field label="Contractor Signatory">
        <input
          type="text"
          name="contractorSignatory"
          value={data?.contractorSignatory ?? ""}
          onChange={onChange}
          className={inputCls}
          placeholder="Full name"
        />
      </Field>
      <Field label="Witness Name" colSpan="2">
        <input
          type="text"
          name="witnessName"
          value={data?.witnessName ?? ""}
          onChange={onChange}
          className={inputCls}
          placeholder="Full name"
        />
      </Field>
    </>
  );
}

// ─── Agreement Form: Company ──────────────────────────────────────────────────
// Fields required for a Company/Contractor agreement

function AgreementFormCompany({
  data,
  required,
  onChange,
}: {
  data: any;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field label="Agreement Date (BS)" required={required} hint="Bikram Sambat: YYYY-MM-DD">
        <input
          type="text"
          name="agreementDate"
          value={data?.agreementDate ?? ""}
          required={required}
          onChange={onChange}
          placeholder="2081-04-15"
          pattern="\d{4}-\d{2}-\d{2}"
          className={inputCls}
        />
      </Field>
      <Field label="Agreement Amount (रू)" required={required}>
        <input
          type="number"
          name="amount"
          value={data?.amount || ""}
          required={required}
          min="0"
          onChange={onChange}
          className={inputCls}
          placeholder="0.00"
        />
      </Field>
      <Field label="Content / Scope of Agreement" required={required} colSpan="2">
        <textarea
          name="content"
          value={data?.content ?? ""}
          required={required}
          rows={4}
          onChange={onChange}
          className={textareaCls}
          placeholder="Describe the scope and terms agreed upon with the company/contractor. Minimum 10 characters."
        />
      </Field>
      <SignatureFields data={data} onChange={onChange as any} />
    </div>
  );
}

// ─── Agreement Form: User Committee ──────────────────────────────────────────
// Fields required for a User Committee agreement (different structure)

function AgreementFormUserCommittee({
  data,
  required,
  onChange,
}: {
  data: any;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Note: User Committee agreements typically don't require a separate amount
          as the contract amount covers it — but agreementDate and content are still needed */}
      <Field label="Agreement Date (BS)" required={required} hint="Bikram Sambat: YYYY-MM-DD">
        <input
          type="text"
          name="agreementDate"
          value={data?.agreementDate ?? ""}
          required={required}
          onChange={onChange}
          placeholder="2081-04-15"
          pattern="\d{4}-\d{2}-\d{2}"
          className={inputCls}
        />
      </Field>
      {/* Amount still part of schema — kept optional visually for UC but still sent */}
      <Field label="Agreement Amount (रू)" hint="Optional for User Committee">
        <input
          type="number"
          name="amount"
          value={data?.amount || ""}
          min="0"
          onChange={onChange}
          className={inputCls}
          placeholder="0.00 (optional)"
        />
      </Field>
      <Field label="Agreement Terms & Conditions" required={required} colSpan="2">
        <textarea
          name="content"
          value={data?.content ?? ""}
          required={required}
          rows={4}
          onChange={onChange}
          className={textareaCls}
          placeholder="Describe the responsibilities and terms agreed upon with the user committee. Minimum 10 characters."
        />
      </Field>
      {/* UC agreements often have committee chair as signatory instead of contractor */}
      <Field label="Office Signatory">
        <input
          type="text"
          name="officeSignatory"
          value={data?.officeSignatory ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Office representative name"
        />
      </Field>
      <Field label="Committee Signatory">
        <input
          type="text"
          name="contractorSignatory"
          value={data?.contractorSignatory ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Committee chairperson / representative"
        />
      </Field>
      <Field label="Witness Name" colSpan="2">
        <input
          type="text"
          name="witnessName"
          value={data?.witnessName ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Full name"
        />
      </Field>
    </div>
  );
}

// ─── Work Order Form: Company ─────────────────────────────────────────────────

function WorkOrderFormCompany({
  data,
  required,
  onChange,
}: {
  data: any;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field label="Work Completion Date (BS)" required={required} hint="Bikram Sambat: YYYY-MM-DD">
        <input
          type="text"
          name="workCompletionDate"
          value={data?.workCompletionDate ?? ""}
          required={required}
          onChange={onChange}
          placeholder="2082-04-14"
          pattern="\d{4}-\d{2}-\d{2}"
          className={inputCls}
        />
      </Field>
      {/* Spacer to keep grid balanced */}
      <div />
      <Field label="Scope of Work" required={required} colSpan="2">
        <textarea
          name="content"
          value={data?.content ?? ""}
          required={required}
          rows={4}
          onChange={onChange}
          className={textareaCls}
          placeholder="Describe the scope of work assigned to the company/contractor. Minimum 10 characters."
        />
      </Field>
      <SignatureFields data={data} onChange={onChange as any} />
    </div>
  );
}

// ─── Work Order Form: User Committee ─────────────────────────────────────────

function WorkOrderFormUserCommittee({
  data,
  required,
  onChange,
}: {
  data: any;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field label="Work Completion Date (BS)" required={required} hint="Bikram Sambat: YYYY-MM-DD">
        <input
          type="text"
          name="workCompletionDate"
          value={data?.workCompletionDate ?? ""}
          required={required}
          onChange={onChange}
          placeholder="2082-04-14"
          pattern="\d{4}-\d{2}-\d{2}"
          className={inputCls}
        />
      </Field>
      <div />
      <Field label="Work Description & Responsibilities" required={required} colSpan="2">
        <textarea
          name="content"
          value={data?.content ?? ""}
          required={required}
          rows={4}
          onChange={onChange}
          className={textareaCls}
          placeholder="Describe the work to be carried out by the user committee, including responsibilities and deliverables. Minimum 10 characters."
        />
      </Field>
      <Field label="Office Signatory">
        <input
          type="text"
          name="officeSignatory"
          value={data?.officeSignatory ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Office representative name"
        />
      </Field>
      <Field label="Committee Signatory">
        <input
          type="text"
          name="contractorSignatory"
          value={data?.contractorSignatory ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Committee chairperson / representative"
        />
      </Field>
      <Field label="Witness Name" colSpan="2">
        <input
          type="text"
          name="witnessName"
          value={data?.witnessName ?? ""}
          onChange={onChange as any}
          className={inputCls}
          placeholder="Full name"
        />
      </Field>
    </div>
  );
}

// ─── Implementation Type Badge ────────────────────────────────────────────────

function ImplBadge({ type }: { type: "COMPANY" | "USER_COMMITTEE" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
        ${type === "COMPANY"
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}
    >
      {type === "COMPANY" ? <Building2 size={11} /> : <Users size={11} />}
      {type === "COMPANY" ? "Company Format" : "User Committee Format"}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewContractPage() {
  const router = useRouter();
  const { mutateAsync: createContract, isPending } = useCreateContract();

  const {
    contractNumber: serverContractNumber,
    source: contractNumberSource,
    isLoading: isLoadingContractNumber,
    refetch: refetchContractNumber,
  } = useNextContractNumber();

  // ── Project: server-side search ──────────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState("");
  const debouncedProjectSearch = useDebounce(projectSearch, 350);
  const { data: projects, isLoading: isLoadingProjects } = useProjects({
    search: debouncedProjectSearch,
  });

  // ── Users: server-side search ───────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 350);
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    search: debouncedUserSearch,
  });

  const { data: companies,      isLoading: isLoadingCompanies } = useCompanies();
  const { data: userCommittees, isLoading: isLoadingUC }        = useUserCommittees();

  const projectOptions: ComboboxOption[] = extractList(projects).map((p: any) => ({
    value: p.id,
    label: p.name,
    sublabel: p.sNo ? `S.No: ${p.sNo}` : undefined,
  }));

  const companyOptions: ComboboxOption[] = extractList(companies).map((c: any) => ({
    value: c.id,
    label: c.name,
    sublabel: c.panNumber ? `PAN: ${c.panNumber}` : undefined,
  }));

  const ucOptions: ComboboxOption[] = extractList(userCommittees).map((uc: any) => ({
    value: uc.id,
    label: uc.name,
  }));

  const userOptions: ComboboxOption[] = extractList(users).map((u: any) => ({
    value: u.id,
    label: u.name,
    sublabel: u.designation ?? u.email ?? undefined,
  }));

  const [includeAgreement,  setIncludeAgreement]  = useState(false);
  const [includeWorkOrder,  setIncludeWorkOrder]   = useState(false);
  const [implementationBy,  setImplementationBy]   = useState<"COMPANY" | "USER_COMMITTEE">("COMPANY");
  const [submitError,       setSubmitError]        = useState<string | null>(null);

  // ── Form State ────────────────────────────────────────────────────────────
  // Aligned with backend CreateContractSchema:
  // - userId (not userID — backend has a typo, frontend sends correct casing)
  // - intendedCompletionDate (replaces endDate)
  // - actualCompletionDate (optional)
  const [formData, setFormData] = useState({
    contractNumber:           "",
    contractAmount:           0,
    startDate:                "",
    intendedCompletionDate:   "",
    actualCompletionDate:     "" as string | undefined,
    remarks:                  "",
    projectId:                "",
    companyId:                "" as string | undefined,
    userCommitteeId:          "" as string | undefined,
    siteInchargeId:           "" as string | undefined,
    agreement: {
      agreementDate:           "",
      content:                 "",
      amount:                  0,
      contractorSignatory:     "",
      officeSignatory:         "",
      witnessName:             "",
    },
    workOrder: {
      workCompletionDate:      "",
      content:                 "",
      contractorSignatory:     "",
      officeSignatory:         "",
      witnessName:             "",
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      agreement: { ...prev.agreement, [name]: type === "number" ? Number(value) : value },
    }));
  };

  const handleWorkOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, workOrder: { ...prev.workOrder, [name]: value } }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const convertDate = (bsDate: string): string | null => {
      if (!bsDate) return null;
      const ad = toAdDate(bsDate);
      return ad ? ad.toISOString() : null;
    };

    const startDate              = convertDate(formData.startDate);
    const intendedCompletionDate = convertDate(formData.intendedCompletionDate);
    const actualCompletionDate   = formData.actualCompletionDate
      ? convertDate(formData.actualCompletionDate)
      : undefined;

    if (!startDate)              { setSubmitError("Invalid start date. Please use YYYY-MM-DD (BS) format.");    return; }
    if (!intendedCompletionDate) { setSubmitError("Invalid end date. Please use YYYY-MM-DD (BS) format.");      return; }
    if (new Date(intendedCompletionDate) <= new Date(startDate)) {
      setSubmitError("Intended completion date must be after the start date.");
      return;
    }
    if (actualCompletionDate && new Date(actualCompletionDate) <= new Date(startDate)) {
      setSubmitError("Actual completion date must be after the start date.");
      return;
    }

    const companyId       = implementationBy === "COMPANY"        ? (formData.companyId || undefined)       : undefined;
    const userCommitteeId = implementationBy === "USER_COMMITTEE" ? (formData.userCommitteeId || undefined) : undefined;

    if (!companyId && !userCommitteeId) {
      setSubmitError("Please select a company or user committee.");
      return;
    }

    // Build agreement payload
    let agreement: typeof formData.agreement | undefined = undefined;
    if (includeAgreement) {
      const agreementDate = convertDate(formData.agreement.agreementDate);
      if (!agreementDate) { setSubmitError("Invalid agreement date. Please use YYYY-MM-DD (BS) format."); return; }
      agreement = {
        ...formData.agreement,
        agreementDate,
        amount: Number(formData.agreement.amount),
      };
    }

    // Build work order payload
    let workOrder: typeof formData.workOrder | undefined = undefined;
    if (includeWorkOrder) {
      const workCompletionDate = convertDate(formData.workOrder.workCompletionDate);
      if (!workCompletionDate) { setSubmitError("Invalid work completion date. Please use YYYY-MM-DD (BS) format."); return; }
      workOrder = { ...formData.workOrder, workCompletionDate };
    }

    try {
      await createContract({
        contractNumber:          formData.contractNumber,
        contractAmount:          formData.contractAmount,
        startDate,
        intendedCompletionDate,
        actualCompletionDate:    actualCompletionDate ?? undefined,
        remarks:                 formData.remarks || undefined,
        projectId:               formData.projectId,
        companyId,
        userCommitteeId,
        siteInchargeId: formData.siteInchargeId || undefined,
        agreement,
        workOrder,
      } as CreateContractPayload);
      router.push("/dashboard/contracts");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Failed to create contract. Please try again.";
      setSubmitError(Array.isArray(msg) ? msg.join(" • ") : msg);
    }
  };

  // ── Derived: which format label to show on the document sections ──────────
  const docFormatLabel = implementationBy === "COMPANY" ? "Company / Contractor" : "User Committee";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Contract</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the details below to register a new contract.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── General Details ─────────────────────────────────────────────── */}
        <Section title="General Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contract Number */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground/90">
                Contract Number<span className="text-destructive ml-0.5">*</span>
              </label>
              <ContractNumberInput
                value={formData.contractNumber}
                onChange={(val) => setFormData((p) => ({ ...p, contractNumber: val }))}
                serverSuggestedNumber={serverContractNumber}
                numberSource={contractNumberSource}
                isLoadingNumber={isLoadingContractNumber}
                onRefetchNumber={refetchContractNumber}
              />
            </div>

            {/* Contract Amount */}
            <Field label="Contract Amount (रू)" required>
              <input
                type="number"
                name="contractAmount"
                value={formData.contractAmount || ""}
                required
                min="0"
                step="0.01"
                onChange={handleChange}
                className={inputCls}
                placeholder="0.00"
              />
            </Field>

            {/* Project — server-side search */}
            <Field label="Project" required>
              <SearchableSelect
                options={projectOptions}
                value={formData.projectId}
                onChange={(val) => setFormData((p) => ({ ...p, projectId: val }))}
                placeholder="Select a project"
                searchPlaceholder="Search by name or S.No..."
                isLoading={isLoadingProjects}
                required
                onSearchChange={setProjectSearch}
                searchValue={projectSearch}
              />
            </Field>

            {/* Site Incharge */}
            <Field label="Site Incharge" required>
              <SearchableSelect
                options={userOptions}
                value={formData.siteInchargeId ?? ""}
                onChange={(val) => setFormData((p) => ({ ...p, siteInchargeId: val }))}
                placeholder="Select site incharge"
                searchPlaceholder="Search by name..."
                isLoading={isLoadingUsers}
                required
                onSearchChange={setUserSearch}
                searchValue={userSearch}
              />
            </Field>

            {/* Start Date */}
            <Field label="Start Date (BS)" required hint="Bikram Sambat: YYYY-MM-DD">
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                required
                onChange={handleChange}
                placeholder="2081-04-15"
                pattern="\d{4}-\d{2}-\d{2}"
                className={inputCls}
              />
            </Field>

            {/* Intended Completion Date — synced with backend field name */}
            <Field label="Intended Completion Date (BS)" required hint="Bikram Sambat: YYYY-MM-DD">
              <input
                type="text"
                name="intendedCompletionDate"
                value={formData.intendedCompletionDate}
                required
                onChange={handleChange}
                placeholder="2082-04-14"
                pattern="\d{4}-\d{2}-\d{2}"
                className={inputCls}
              />
            </Field>

            {/* Actual Completion Date — optional, validated by backend */}
            <Field label="Actual Completion Date (BS)" hint="Optional — Bikram Sambat: YYYY-MM-DD">
              <input
                type="text"
                name="actualCompletionDate"
                value={formData.actualCompletionDate ?? ""}
                onChange={handleChange}
                placeholder="2082-04-14 (optional)"
                pattern="\d{4}-\d{2}-\d{2}"
                className={inputCls}
              />
            </Field>

            {/* Implemented Through */}
            <div className="md:col-span-2 rounded-lg border border-dashed bg-muted/20 p-4 space-y-3">
              <p className="text-sm font-medium">
                Implemented Through<span className="text-destructive ml-0.5">*</span>
              </p>
              <p className="text-xs text-muted-foreground -mt-1">
                This also determines the format used for Agreement and Work Order documents.
              </p>
              <div className="flex gap-3">
                {([
                  { id: "COMPANY",        label: "Company / Contractor", icon: <Building2 size={15} /> },
                  { id: "USER_COMMITTEE", label: "User Committee",        icon: <Users size={15} /> },
                ] as const).map(({ id, label, icon }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border text-sm transition-all
                      ${implementationBy === id
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <input
                      type="radio"
                      name="implementationBy"
                      checked={implementationBy === id}
                      onChange={() => {
                        setImplementationBy(id);
                        setFormData((p) => ({
                          ...p,
                          companyId:       id === "USER_COMMITTEE" ? "" : p.companyId,
                          userCommitteeId: id === "COMPANY"        ? "" : p.userCommitteeId,
                        }));
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${implementationBy === id ? "border-primary" : "border-muted-foreground/40"}`}
                    >
                      {implementationBy === id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    {icon}
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Company / UC Selector */}
            <div className="md:col-span-2">
              {implementationBy === "COMPANY" ? (
                <Field label="Select Company / Contractor" required>
                  <SearchableSelect
                    options={companyOptions}
                    value={formData.companyId ?? ""}
                    onChange={(val) => setFormData((p) => ({ ...p, companyId: val }))}
                    placeholder="Select a company"
                    searchPlaceholder="Search by name or PAN..."
                    isLoading={isLoadingCompanies}
                    required
                  />
                </Field>
              ) : (
                <Field label="Select User Committee" required>
                  <SearchableSelect
                    options={ucOptions}
                    value={formData.userCommitteeId ?? ""}
                    onChange={(val) => setFormData((p) => ({ ...p, userCommitteeId: val }))}
                    placeholder="Select a user committee"
                    searchPlaceholder="Search by name..."
                    isLoading={isLoadingUC}
                    required
                  />
                </Field>
              )}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground/90">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                rows={3}
                onChange={handleChange}
                className={textareaCls}
                placeholder="Optional notes about this contract..."
              />
            </div>
          </div>
        </Section>

        {/* ── Agreement ───────────────────────────────────────────────────── */}
        <Section
          title="Agreement Details"
          icon={<ClipboardList size={18} />}
          description={includeAgreement ? `Format: ${docFormatLabel}` : undefined}
          addon={
            <div className="flex items-center gap-3">
              {includeAgreement && <ImplBadge type={implementationBy} />}
              <Toggle checked={includeAgreement} onChange={setIncludeAgreement} label="Include Agreement" />
            </div>
          }
        >
          {!includeAgreement ? (
            <PlaceholderBanner
              icon={<ClipboardList size={32} />}
              title="No Agreement Attached"
              description="Toggle the switch above to attach an agreement. The form fields will adapt based on whether implementation is by a Company or User Committee."
            />
          ) : implementationBy === "COMPANY" ? (
            <AgreementFormCompany
              data={formData.agreement}
              required={includeAgreement}
              onChange={handleAgreementChange}
            />
          ) : (
            <AgreementFormUserCommittee
              data={formData.agreement}
              required={includeAgreement}
              onChange={handleAgreementChange}
            />
          )}
        </Section>

        {/* ── Work Order ──────────────────────────────────────────────────── */}
        <Section
          title="Work Order Details"
          icon={<CheckSquare size={18} />}
          description={includeWorkOrder ? `Format: ${docFormatLabel}` : undefined}
          addon={
            <div className="flex items-center gap-3">
              {includeWorkOrder && <ImplBadge type={implementationBy} />}
              <Toggle checked={includeWorkOrder} onChange={setIncludeWorkOrder} label="Include Work Order" />
            </div>
          }
        >
          {!includeWorkOrder ? (
            <PlaceholderBanner
              icon={<CheckSquare size={32} />}
              title="No Work Order Attached"
              description="Toggle the switch above to attach a work order. The form fields will adapt based on whether implementation is by a Company or User Committee."
            />
          ) : implementationBy === "COMPANY" ? (
            <WorkOrderFormCompany
              data={formData.workOrder}
              required={includeWorkOrder}
              onChange={handleWorkOrderChange}
            />
          ) : (
            <WorkOrderFormUserCommittee
              data={formData.workOrder}
              required={includeWorkOrder}
              onChange={handleWorkOrderChange}
            />
          )}
        </Section>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {submitError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive text-sm">
            <X size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ── Footer Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Fields marked with <span className="text-destructive">*</span> are required.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 h-10 border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-7 py-2 h-10 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-opacity"
            >
              <Save size={16} />
              {isPending ? "Creating..." : "Save Contract"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
