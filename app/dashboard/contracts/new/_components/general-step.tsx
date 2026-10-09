"use client";

import { Building2, FileText, Users } from "lucide-react";

import { BsDateField } from "@/components/form/bs-date-field";
import { MoneyInput } from "@/components/form/money-input";
import { cn } from "@/lib/utils";
import type { ContractFormApi } from "../_lib/use-contract-form";
import { ContractNumberInput } from "./contract-number-input";
import { Field, Section, inputClassName } from "./form-primitives";
import { SearchableSelect } from "./searchable-select";

const IMPLEMENTATION_OPTIONS = [
  { id: "COMPANY" as const, label: "Company / contractor", icon: Building2 },
  { id: "USER_COMMITTEE" as const, label: "User committee", icon: Users },
];

export function GeneralStep({ form }: { form: ContractFormApi }) {
  const { fieldErrors, formData, implementationBy } = form;

  return (
    <Section
      title="General details"
      icon={<FileText size={16} />}
      description="Core contract information, implementation type, and timeline."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field
            label="Contract number"
            htmlFor="contractNumber"
            required
            error={fieldErrors.contractNumber}
            fieldPath="contractNumber"
          >
            <ContractNumberInput
              id="contractNumber"
              value={formData.contractNumber}
              mode={form.contractNumberMode}
              onModeChange={form.setContractNumberMode}
              onChange={(value) => {
                form.markTouched("contractNumber");
                form.setField("contractNumber", value);
              }}
              onBlur={() => form.markTouched("contractNumber")}
              error={fieldErrors.contractNumber}
              serverSuggestedNumber={form.serverContractNumber}
              numberSource={form.contractNumberSource}
              isLoadingNumber={form.isLoadingContractNumber}
              isCheckingAvailability={form.isCheckingNumber}
              onRefetchNumber={form.refetchContractNumber}
            />
          </Field>
        </div>

        <Field
          label="Contract amount"
          htmlFor="contractAmount"
          required
          error={fieldErrors.contractAmount}
          fieldPath="contractAmount"
        >
          <MoneyInput
            id="contractAmount"
            value={formData.contractAmount}
            onValueChange={(value) => form.setField("contractAmount", value)}
            onBlur={() => form.markTouched("contractAmount")}
            invalid={Boolean(fieldErrors.contractAmount)}
          />
        </Field>

        <Field
          label="Project"
          htmlFor="projectId"
          required
          error={fieldErrors.projectId}
          fieldPath="projectId"
        >
          <SearchableSelect
            id="projectId"
            label="Project"
            options={form.projectOptions}
            value={formData.projectId}
            onChange={form.setProject}
            placeholder="Select a project"
            searchPlaceholder="Search by name or S.No..."
            isLoading={form.isLoadingProjects}
            error={fieldErrors.projectId}
            onSearchChange={form.setProjectSearch}
            searchValue={form.projectSearch}
          />
        </Field>

        <Field
          label="Site incharge"
          htmlFor="siteInchargeId"
          required
          hint={form.siteInchargeHint}
          error={fieldErrors.siteInchargeId}
          fieldPath="siteInchargeId"
        >
          <SearchableSelect
            id="siteInchargeId"
            label="Site incharge"
            options={form.userOptions}
            value={form.siteInchargeValue}
            onChange={form.setSiteIncharge}
            placeholder={form.isAdmin ? "Select site incharge" : "Current logged-in user"}
            searchPlaceholder="Search by name..."
            isLoading={form.isAdmin ? form.isLoadingUsers : false}
            disabled={!form.isAdmin}
            error={fieldErrors.siteInchargeId}
            onSearchChange={form.isAdmin ? form.setUserSearch : undefined}
            searchValue={form.isAdmin ? form.userSearch : undefined}
          />
        </Field>

        <Field
          label="Start date (BS)"
          htmlFor="startDate"
          required
          error={fieldErrors.startDate}
          fieldPath="startDate"
        >
          <BsDateField
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onValueChange={(value) => form.setField("startDate", value)}
            onBlur={() => form.markTouched("startDate")}
            required
            invalid={Boolean(fieldErrors.startDate)}
          />
        </Field>

        <Field
          label="Intended completion date (BS)"
          htmlFor="intendedCompletionDate"
          required
          error={fieldErrors.intendedCompletionDate}
          fieldPath="intendedCompletionDate"
        >
          <BsDateField
            id="intendedCompletionDate"
            name="intendedCompletionDate"
            value={formData.intendedCompletionDate}
            onValueChange={(value) => form.setField("intendedCompletionDate", value)}
            onBlur={() => form.markTouched("intendedCompletionDate")}
            required
            invalid={Boolean(fieldErrors.intendedCompletionDate)}
          />
        </Field>

        <fieldset className="space-y-3 rounded-xl border border-dashed bg-muted/10 p-5 md:col-span-2">
          <legend className="px-1 text-sm font-medium">
            Implemented through <span className="text-destructive">*</span>
          </legend>
          <p className="text-xs text-muted-foreground">
            Agreement pages change by implementation type. Work order pages keep the same layout.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            {IMPLEMENTATION_OPTIONS.map((option) => {
              const isSelected = implementationBy === option.id;

              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    isSelected
                      ? "border-primary/40 bg-primary/5 font-medium text-foreground"
                      : "text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="implementationBy"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => form.changeImplementation(option.id)}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected ? "border-primary" : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                  </span>
                  <option.icon size={15} aria-hidden="true" />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="md:col-span-2">
          {implementationBy === "COMPANY" ? (
            <Field
              label="Company / contractor"
              htmlFor="companyId"
              required
              hint="Only approved companies are listed."
              error={fieldErrors.companyId}
              fieldPath="companyId"
            >
              <SearchableSelect
                id="companyId"
                label="Company"
                options={form.companyOptions}
                value={formData.companyId ?? ""}
                onChange={form.setCompany}
                placeholder="Search by name or PAN..."
                searchPlaceholder="Search by name or PAN..."
                isLoading={form.isLoadingCompanies}
                error={fieldErrors.companyId}
              />
            </Field>
          ) : (
            <Field
              label="User committee"
              htmlFor="userCommitteeId"
              required
              error={fieldErrors.userCommitteeId}
              fieldPath="userCommitteeId"
            >
              <SearchableSelect
                id="userCommitteeId"
                label="User committee"
                options={form.userCommitteeOptions}
                value={formData.userCommitteeId ?? ""}
                onChange={form.setUserCommittee}
                placeholder="Search by committee name..."
                searchPlaceholder="Search by committee name..."
                isLoading={form.isLoadingUC}
                error={fieldErrors.userCommitteeId}
              />
            </Field>
          )}
        </div>

        <div className="md:col-span-2">
          <Field label="Remarks" htmlFor="remarks" optional>
            <textarea
              id="remarks"
              value={formData.remarks}
              rows={3}
              onChange={(event) => form.setField("remarks", event.target.value)}
              className={inputClassName(false, "min-h-[88px] resize-y px-3 py-2 leading-6")}
              placeholder="Optional notes about this contract..."
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}
