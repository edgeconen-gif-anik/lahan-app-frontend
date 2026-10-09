"use client";

import { CheckSquare } from "lucide-react";

import { BsDateField } from "@/components/form/bs-date-field";
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

export function WorkOrderStep({ form }: { form: ContractFormApi }) {
  const { fieldErrors, formData, implementationBy, includeWorkOrder } = form;
  const data = formData.workOrder;
  const isAuto = form.workOrderContentMode === "auto";

  return (
    <Section
      title="Work order details"
      icon={<CheckSquare size={16} />}
      description={
        includeWorkOrder
          ? "Work order page uses one shared layout for both implementation types."
          : "Attach a work order if this contract should generate the standard work-order page. You can skip this step."
      }
      addon={
        <div className="flex items-center gap-3">
          {includeWorkOrder ? <ImplBadge type={implementationBy} /> : null}
          <Toggle
            checked={includeWorkOrder}
            onChange={form.toggleWorkOrder}
            label="Include work order"
          />
        </div>
      }
    >
      {!includeWorkOrder ? (
        <PlaceholderBanner
          icon={<CheckSquare size={32} />}
          title="No work order attached"
          description="Turn on “Include work order” to prefill the completion date and auto-format the standard work order text. Otherwise continue to the review."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <DocumentDraftCard
              description={
                isAuto
                  ? "Work order text is being formatted automatically from the chosen project, contract value, start date, and completion deadline."
                  : "Manual mode is active. Switch back anytime to restore the live auto-formatted work order text."
              }
              isAuto={isAuto}
              onToggleMode={form.toggleWorkOrderContentMode}
              preview={form.workOrderDraftText}
              toggleLabel={isAuto ? "Customize manually" : "Switch back to auto format"}
              title="Work order draft"
            />
          </div>

          <Field
            label="Work completion date (BS)"
            htmlFor="workCompletionDate"
            required
            error={fieldErrors["workOrder.workCompletionDate"]}
            fieldPath="workOrder.workCompletionDate"
          >
            <BsDateField
              id="workCompletionDate"
              name="workCompletionDate"
              value={data.workCompletionDate}
              onValueChange={(value) => form.setWorkOrderField("workCompletionDate", value)}
              onBlur={() => form.markTouched("workOrder.workCompletionDate")}
              required
              invalid={Boolean(fieldErrors["workOrder.workCompletionDate"])}
            />
          </Field>

          <div className="rounded-lg border bg-muted/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Format note
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Work order layout stays the same for both company and committee contracts.
              The signatory label adjusts automatically so the final document reads naturally.
            </p>
          </div>

          <div className="md:col-span-2">
            {isAuto ? (
              <div
                className="rounded-lg border bg-muted/25 p-4"
                data-field-path="workOrder.content"
              >
                <p className="text-sm font-semibold">Work order text is auto-formatted</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This section keeps itself updated from the contract details unless you
                  switch to manual editing.
                </p>
              </div>
            ) : (
              <Field
                label="Scope of work"
                htmlFor="workOrderContent"
                required
                error={fieldErrors["workOrder.content"]}
                fieldPath="workOrder.content"
              >
                <textarea
                  id="workOrderContent"
                  value={data.content}
                  rows={5}
                  onBlur={() => form.markTouched("workOrder.content")}
                  onChange={(event) => form.setWorkOrderField("content", event.target.value)}
                  className={inputClassName(
                    Boolean(fieldErrors["workOrder.content"]),
                    "min-h-[120px] resize-y px-3 py-2 leading-6",
                  )}
                  placeholder="Describe the approved work scope, execution conditions, measurement basis, and completion expectations. Minimum 10 characters."
                />
              </Field>
            )}
          </div>

          <SignatureFields
            data={data}
            onChange={form.setWorkOrderField}
            contractorLabel={
              implementationBy === "USER_COMMITTEE" ? "Committee signatory" : "Contractor signatory"
            }
          />
        </div>
      )}
    </Section>
  );
}
