"use client";

import { Building2, Sparkles, Users } from "lucide-react";

import type { ContractDocumentVariant } from "@/lib/contract-documents";
import { cn } from "@/lib/utils";
import type { ContractFormData } from "../_lib/types";

export function inputClassName(hasError?: boolean, extra?: string) {
  return cn(
    "w-full rounded-md border bg-background text-sm shadow-xs outline-none transition-[color,box-shadow]",
    "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    hasError && "border-destructive/60 bg-destructive/5",
    extra,
  );
}

export function Section({
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
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {icon ? <span className="text-muted-foreground">{icon}</span> : null}
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {addon}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Field({
  children,
  error,
  fieldPath,
  hint,
  htmlFor,
  label,
  optional,
  required,
}: {
  children: React.ReactNode;
  error?: string;
  fieldPath?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5" data-field-path={fieldPath}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium">
        {label}
        {required ? <span className="text-destructive" aria-hidden="true">*</span> : null}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "border-primary bg-primary" : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <span className={cn("font-medium", checked ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </label>
  );
}

export function PlaceholderBanner({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center">
      <span className="rounded-full border bg-background p-3 text-muted-foreground">{icon}</span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ImplBadge({ type }: { type: ContractDocumentVariant }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium">
      {type === "COMPANY" ? <Building2 size={11} /> : <Users size={11} />}
      {type === "COMPANY" ? "Company agreement format" : "Committee agreement format"}
    </span>
  );
}

export function DocumentDraftCard({
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
    <div className="rounded-xl border bg-muted/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles size={13} />
              {title}
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                isAuto ? "border-primary/30 bg-primary/10 text-primary" : "bg-background text-muted-foreground",
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
              ? "border bg-background hover:bg-muted"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          <Sparkles size={13} />
          {toggleLabel}
        </button>
      </div>

      <div className="mt-4 rounded-lg border bg-background px-4 py-4">
        <p className="max-h-44 overflow-auto whitespace-pre-line text-sm leading-6 text-foreground/85">
          {preview}
        </p>
      </div>
    </div>
  );
}

type SignatoryData = ContractFormData["agreement"] | ContractFormData["workOrder"];

export function SignatureFields({
  contractorLabel = "Contractor signatory",
  data,
  onChange,
}: {
  contractorLabel?: string;
  data: SignatoryData;
  onChange: (name: "officeSignatory" | "contractorSignatory" | "witnessName", value: string) => void;
}) {
  return (
    <>
      <Field
        label="Office signatory"
        htmlFor="officeSignatory"
        hint="Leave blank to use the recorded appointment for the document date when saved. Enter the actual signatory for historical documents without appointment history."
      >
        <input
          id="officeSignatory"
          type="text"
          value={data.officeSignatory}
          onChange={(event) => onChange("officeSignatory", event.target.value)}
          className={inputClassName(false, "h-10 px-3")}
          placeholder="Full name"
        />
      </Field>
      <Field label={contractorLabel} htmlFor="contractorSignatory">
        <input
          id="contractorSignatory"
          type="text"
          value={data.contractorSignatory}
          onChange={(event) => onChange("contractorSignatory", event.target.value)}
          className={inputClassName(false, "h-10 px-3")}
          placeholder="Full name"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Witness name" htmlFor="witnessName">
          <input
            id="witnessName"
            type="text"
            value={data.witnessName}
            onChange={(event) => onChange("witnessName", event.target.value)}
            className={inputClassName(false, "h-10 px-3")}
            placeholder="Full name"
          />
        </Field>
      </div>
    </>
  );
}
