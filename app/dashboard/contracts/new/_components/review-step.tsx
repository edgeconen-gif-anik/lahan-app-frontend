"use client";

import { AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatContractCurrency } from "@/lib/contract-documents";
import { toAdDate } from "@/lib/date-utils";
import { numberToWordsIndian } from "@/lib/money";
import type { ContractFormApi } from "../_lib/use-contract-form";
import { Section } from "./form-primitives";

const FIELD_LABELS: Record<string, string> = {
  contractNumber: "Contract number",
  contractAmount: "Contract amount",
  projectId: "Project",
  siteInchargeId: "Site incharge",
  startDate: "Start date",
  intendedCompletionDate: "Intended completion date",
  companyId: "Company / contractor",
  userCommitteeId: "User committee",
  "agreement.agreementDate": "Agreement date",
  "agreement.amount": "Agreement amount",
  "agreement.content": "Agreement content",
  "workOrder.workCompletionDate": "Work completion date",
  "workOrder.content": "Work order content",
};

function stepOfField(fieldPath: string) {
  if (fieldPath.startsWith("agreement.")) return 1;
  if (fieldPath.startsWith("workOrder.")) return 2;
  return 0;
}

function bsWithAd(bs: string) {
  if (!bs) return "—";
  const ad = toAdDate(bs);
  if (!ad || Number.isNaN(ad.getTime())) return bs;

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${bs} (AD ${ad.getFullYear()}-${pad(ad.getMonth() + 1)}-${pad(ad.getDate())})`;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export function ReviewStep({ form }: { form: ContractFormApi }) {
  const { allErrors, formData } = form;
  const errorEntries = Object.entries(allErrors);
  const isCommittee = form.implementationBy === "USER_COMMITTEE";
  const amountWords = numberToWordsIndian(formData.contractAmount);

  return (
    <div className="space-y-5">
      <Section
        title="Review before saving"
        icon={<ClipboardCheck size={16} />}
        description="Check the details below. Use Back, or the Fix buttons, to change anything."
      >
        {errorEntries.length > 0 ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertCircle size={16} />
              {errorEntries.length} {errorEntries.length === 1 ? "thing needs" : "things need"} attention
            </p>
            <ul className="mt-3 space-y-2">
              {errorEntries.map(([fieldPath, message]) => (
                <li
                  key={fieldPath}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{FIELD_LABELS[fieldPath] ?? fieldPath}:</span>{" "}
                    {message}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => form.goToStep(stepOfField(fieldPath))}
                  >
                    Fix
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            Everything required is filled in. You can save this contract.
          </p>
        )}

        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          General details
        </h3>
        <dl className="mt-1 divide-y">
          <SummaryRow label="Contract number" value={<span className="font-mono">{formData.contractNumber}</span>} />
          <SummaryRow
            label="Contract amount"
            value={
              <>
                {formData.contractAmount > 0 ? formatContractCurrency(formData.contractAmount) : null}
                {amountWords ? (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {amountWords}
                  </span>
                ) : null}
              </>
            }
          />
          <SummaryRow label="Project" value={form.selectedProject?.label} />
          <SummaryRow
            label={isCommittee ? "User committee" : "Company / contractor"}
            value={form.selectedImplementor?.label}
          />
          <SummaryRow label="Site incharge" value={form.selectedSiteIncharge?.label} />
          <SummaryRow label="Start date" value={bsWithAd(formData.startDate)} />
          <SummaryRow label="Intended completion" value={bsWithAd(formData.intendedCompletionDate)} />
          {formData.remarks.trim() ? <SummaryRow label="Remarks" value={formData.remarks} /> : null}
        </dl>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Agreement
        </h3>
        {form.includeAgreement ? (
          <dl className="mt-1 divide-y">
            <SummaryRow label="Agreement date" value={bsWithAd(formData.agreement.agreementDate)} />
            <SummaryRow
              label="Agreement amount"
              value={formatContractCurrency(formData.agreement.amount || formData.contractAmount)}
            />
            <SummaryRow
              label="Text"
              value={form.agreementContentMode === "auto" ? "Auto-formatted" : "Written manually"}
            />
            <SummaryRow label="Office signatory" value={formData.agreement.officeSignatory || "Recorded appointment"} />
            <SummaryRow label="Contractor signatory" value={formData.agreement.contractorSignatory} />
            <SummaryRow label="Witness" value={formData.agreement.witnessName} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No agreement will be created.</p>
        )}

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Work order
        </h3>
        {form.includeWorkOrder ? (
          <dl className="mt-1 divide-y">
            <SummaryRow
              label="Work completion date"
              value={bsWithAd(formData.workOrder.workCompletionDate)}
            />
            <SummaryRow
              label="Text"
              value={form.workOrderContentMode === "auto" ? "Auto-formatted" : "Written manually"}
            />
            <SummaryRow label="Office signatory" value={formData.workOrder.officeSignatory || "Recorded appointment"} />
            <SummaryRow label="Contractor signatory" value={formData.workOrder.contractorSignatory} />
            <SummaryRow label="Witness" value={formData.workOrder.witnessName} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No work order will be created.</p>
        )}
      </Section>

      {form.includeAgreement ? (
        <details className="rounded-xl border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Preview agreement text</summary>
          <p className="mt-3 whitespace-pre-line leading-6 text-foreground/85">
            {form.agreementContentMode === "auto"
              ? form.agreementDraftText
              : formData.agreement.content}
          </p>
        </details>
      ) : null}

      {form.includeWorkOrder ? (
        <details className="rounded-xl border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Preview work order text</summary>
          <p className="mt-3 whitespace-pre-line leading-6 text-foreground/85">
            {form.workOrderContentMode === "auto"
              ? form.workOrderDraftText
              : formData.workOrder.content}
          </p>
        </details>
      ) : null}
    </div>
  );
}
