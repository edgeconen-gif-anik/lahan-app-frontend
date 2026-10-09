"use client";

import { ClipboardList } from "lucide-react";

import { BsDateField } from "@/components/form/bs-date-field";
import { MoneyInput } from "@/components/form/money-input";
import { formatIndianNumber } from "@/lib/money";
import type { ContractFormApi } from "../_lib/use-contract-form";
import {
  DocumentDraftCard,
  Field,
  ImplBadge,
  PlaceholderBanner,
  Section,
  SignatureFields,
  Toggle,
  inputClassName,
} from "./form-primitives";

export function AgreementStep({ form }: { form: ContractFormApi }) {
  const { fieldErrors, formData, implementationBy, includeAgreement } = form;
  const data = formData.agreement;
  const isCommittee = implementationBy === "USER_COMMITTEE";
  const isAuto = form.agreementContentMode === "auto";

  return (
    <Section
      title="Agreement details"
      icon={<ClipboardList size={16} />}
      description={
        includeAgreement
          ? `Format: ${isCommittee ? "User committee" : "Company / contractor"}`
          : "Attach an agreement if the contract should produce a printable agreement page. You can skip this step."
      }
      addon={
        <div className="flex items-center gap-3">
          {includeAgreement ? <ImplBadge type={implementationBy} /> : null}
          <Toggle
            checked={includeAgreement}
            onChange={form.toggleAgreement}
            label="Include agreement"
          />
        </div>
      }
    >
      {!includeAgreement ? (
        <PlaceholderBanner
          icon={<ClipboardList size={32} />}
          title="No agreement attached"
          description="Turn on “Include agreement” to prefill the agreement date and amount and auto-format the agreement text. Otherwise just continue to the next step."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <DocumentDraftCard
              description={
                isAuto
                  ? "Agreement text is being formatted automatically from the selected project, amount, timeline, and implementation type."
                  : "Manual mode is active. Switch back anytime to use the live auto-formatted agreement text."
              }
              isAuto={isAuto}
              onToggleMode={form.toggleAgreementContentMode}
              preview={form.agreementDraftText}
              toggleLabel={isAuto ? "Customize manually" : "Switch back to auto format"}
              title={isCommittee ? "Committee agreement draft" : "Company agreement draft"}
            />
          </div>

          <Field
            label="Agreement date (BS)"
            htmlFor="agreementDate"
            required
            error={fieldErrors["agreement.agreementDate"]}
            fieldPath="agreement.agreementDate"
          >
            <BsDateField
              id="agreementDate"
              name="agreementDate"
              value={data.agreementDate}
              onValueChange={(value) => form.setAgreementField("agreementDate", value)}
              onBlur={() => form.markTouched("agreement.agreementDate")}
              required
              invalid={Boolean(fieldErrors["agreement.agreementDate"])}
            />
          </Field>

          <Field
            label="Agreement amount"
            htmlFor="agreementAmount"
            hint="Defaults to the contract amount. You can still override it here."
            error={fieldErrors["agreement.amount"]}
            fieldPath="agreement.amount"
          >
            <MoneyInput
              id="agreementAmount"
              value={data.amount}
              placeholder={formatIndianNumber(formData.contractAmount) || "0.00"}
              onValueChange={(value) => form.setAgreementField("amount", value)}
              onBlur={() => form.markTouched("agreement.amount")}
              invalid={Boolean(fieldErrors["agreement.amount"])}
            />
          </Field>

          <div className="md:col-span-2">
            {isAuto ? (
              <div
                className="rounded-lg border bg-muted/25 p-4"
                data-field-path="agreement.content"
              >
                <p className="text-sm font-semibold">Agreement text is auto-formatted</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This content updates automatically as you change the project,
                  implementation type, amount, or dates.
                </p>
              </div>
            ) : (
              <Field
                label={isCommittee ? "Committee responsibilities" : "Agreement scope and terms"}
                htmlFor="agreementContent"
                required
                error={fieldErrors["agreement.content"]}
                fieldPath="agreement.content"
              >
                <textarea
                  id="agreementContent"
                  value={data.content}
                  rows={5}
                  onBlur={() => form.markTouched("agreement.content")}
                  onChange={(event) => form.setAgreementField("content", event.target.value)}
                  className={inputClassName(
                    Boolean(fieldErrors["agreement.content"]),
                    "min-h-[120px] resize-y px-3 py-2 leading-6",
                  )}
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
            onChange={form.setAgreementField}
            contractorLabel={isCommittee ? "Committee signatory" : "Contractor signatory"}
          />
        </div>
      )}
    </Section>
  );
}
