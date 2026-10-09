"use client";

import { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatContractCurrency } from "@/lib/contract-documents";
import { AgreementStep } from "./_components/agreement-step";
import { DraftBanner } from "./_components/draft-banner";
import { GeneralStep } from "./_components/general-step";
import { ReviewStep } from "./_components/review-step";
import { Stepper } from "./_components/stepper";
import { WizardNav } from "./_components/wizard-nav";
import { WorkOrderStep } from "./_components/work-order-step";
import { LAST_STEP } from "./_lib/types";
import { useContractForm } from "./_lib/use-contract-form";

export default function NewContractPage() {
  const form = useContractForm();
  const [confirmStartOver, setConfirmStartOver] = useState(false);

  const skippedSteps = [
    ...(form.includeAgreement ? [] : [1]),
    ...(form.includeWorkOrder ? [] : [2]),
  ];

  const summary = [
    {
      label: "Implementation",
      value:
        form.implementationBy === "COMPANY" ? "Company / contractor" : "User committee",
      detail: form.selectedImplementor?.label ?? "Choose the implementing party",
    },
    {
      label: "Project",
      value: form.selectedProject?.label ?? "Project not selected",
      detail: form.selectedProjectExistingContract
        ? `Existing contract ${form.selectedProjectExistingContract.contractNumber}`
        : (form.selectedProject?.sublabel ?? "Link the contract to a project"),
    },
    {
      label: "Documents",
      value:
        form.includeAgreement && form.includeWorkOrder
          ? "Agreement and work order"
          : form.includeAgreement
            ? "Agreement only"
            : form.includeWorkOrder
              ? "Work order only"
              : "Contract only",
      detail: "Change this in steps 2 and 3",
    },
    {
      label: "Contract value",
      value:
        form.formData.contractAmount > 0
          ? formatContractCurrency(form.formData.contractAmount)
          : "Not entered",
      detail:
        form.formData.startDate && form.formData.intendedCompletionDate
          ? `${form.formData.startDate} → ${form.formData.intendedCompletionDate}`
          : "Add dates to complete the timeline",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <ConfirmDialog
        open={confirmStartOver}
        onOpenChange={setConfirmStartOver}
        title="Start over?"
        description="This clears everything entered so far and deletes the saved draft. This cannot be undone."
        confirmLabel="Clear form"
        destructive
        onConfirm={() => {
          form.startOver();
          setConfirmStartOver(false);
        }}
      />

      <PageHeader
        title="New contract"
        description="Register a contract in a few short steps. Your progress is saved on this device as you go."
        actions={
          form.hasDraftContent ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmStartOver(true)}>
              <RotateCcw />
              Start over
            </Button>
          ) : null
        }
      />

      {form.pendingDraft ? (
        <DraftBanner
          draft={form.pendingDraft}
          onResume={form.resumeDraft}
          onDiscard={form.discardPendingDraft}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Stepper
            current={form.step}
            attemptedSteps={form.attemptedSteps}
            errorCountForStep={form.errorCountForStep}
            skippedSteps={skippedSteps}
            onSelect={form.goToStep}
          />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              // Pressing Enter inside a field moves forward until the last step.
              if (form.step === LAST_STEP) void form.submit();
              else form.nextStep();
            }}
          >
            {form.step === 0 ? <GeneralStep form={form} /> : null}
            {form.step === 1 ? <AgreementStep form={form} /> : null}
            {form.step === 2 ? <WorkOrderStep form={form} /> : null}
            {form.step === 3 ? <ReviewStep form={form} /> : null}

            {form.submitError ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{form.submitError}</span>
              </div>
            ) : null}

            <WizardNav
              step={form.step}
              isSaving={form.isSaving}
              lastSavedAt={form.lastSavedAt}
              onBack={form.previousStep}
              onNext={form.nextStep}
              onCancel={() => form.router.back()}
            />
          </form>
        </div>

        <aside className="hidden xl:sticky xl:top-0 xl:block xl:h-fit">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick summary
            </p>
            <div className="mt-4 space-y-3">
              {summary.map((item) => (
                <div key={item.label} className="rounded-lg border bg-background px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
