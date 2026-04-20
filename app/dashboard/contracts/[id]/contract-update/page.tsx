"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Hash,
  Loader2,
} from "lucide-react";
import {
  useContract,
  useProjectUpdateContract,
} from "@/hooks/contract/useContracts";
import { CONTRACT_STATUS_LABEL } from "@/components/contract-status-badge";
import { toNepaliDate } from "@/lib/date-utils";

function toDateInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function formatBsDate(value?: string | null) {
  if (!value) return "Will use today's date";

  try {
    return toNepaliDate(new Date(value)) ?? new Date(value).toLocaleDateString();
  } catch {
    return new Date(value).toLocaleDateString();
  }
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return `रू ${Number(value).toLocaleString("en-IN")}`;
}

export default function ContractUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const { data: contract, isLoading, error } = useContract(contractId);
  const {
    mutateAsync: applyProjectUpdate,
    isPending: isSubmitting,
  } = useProjectUpdateContract();

  const [finalEvaluatedAmount, setFinalEvaluatedAmount] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completionCode, setCompletionCode] = useState<string | null>(null);

  useEffect(() => {
    if (!contract) return;

    setFinalEvaluatedAmount(
      contract.finalEvaluatedAmount != null
        ? String(Number(contract.finalEvaluatedAmount))
        : ""
    );
    setActualCompletionDate(toDateInput(contract.actualCompletionDate));
    setCompletionCode(contract.completionCode ?? null);
  }, [contract]);

  const helperDateText = useMemo(() => {
    if (!actualCompletionDate) return "Leave blank to use today's date automatically.";
    return `Completion date preview: ${formatBsDate(actualCompletionDate)}`;
  }, [actualCompletionDate]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Contract update could not be loaded. Please try again.
        </div>
      </div>
    );
  }

  const isArchived = contract.status === "ARCHIVED";
  const isCompleted = contract.status === "COMPLETED";
  const activeCompletionCode = completionCode ?? contract.completionCode ?? null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const amount = Number(finalEvaluatedAmount);
    if (!finalEvaluatedAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setSubmitError("Enter a valid final evaluated amount.");
      return;
    }

    try {
      const updatedContract = await applyProjectUpdate({
        id: contractId,
        data: {
          finalEvaluatedAmount: amount,
          actualCompletionDate: actualCompletionDate || undefined,
        },
      });

      setCompletionCode(updatedContract.completionCode ?? null);
      setActualCompletionDate(toDateInput(updatedContract.actualCompletionDate));
      setFinalEvaluatedAmount(
        updatedContract.finalEvaluatedAmount != null
          ? String(Number(updatedContract.finalEvaluatedAmount))
          : finalEvaluatedAmount
      );
    } catch (mutationError: any) {
      const message = mutationError?.response?.data?.message;
      setSubmitError(Array.isArray(message) ? message.join(", ") : message ?? "Failed to complete the contract.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to contract
          </button>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Contract Update</h1>
            <p className="text-sm text-muted-foreground">
              Enter the final evaluated amount to complete this contract and generate
              its completion code for manual paperwork.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contract Number
          </p>
          <p className="mt-2 font-mono text-base font-semibold text-foreground">
            {contract.contractNumber}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Current Status
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {isCompleted ? "Completed" : CONTRACT_STATUS_LABEL[contract.status]}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contract Amount
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(contract.contractAmount)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Final Evaluated Amount
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(contract.finalEvaluatedAmount)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[28px] border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              Completion Entry
            </h2>
            <p className="text-sm text-muted-foreground">
              Submitting this form updates the contract status to completed automatically.
            </p>
          </div>

          {isCompleted && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              This contract is already completed. Saving again will keep the same
              completion code and update the recorded final amount/date.
            </div>
          )}

          {isArchived && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Archived contracts cannot be completed or updated from this page.
            </div>
          )}

          {submitError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Final Evaluated Amount
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={finalEvaluatedAmount}
                onChange={(event) => setFinalEvaluatedAmount(event.target.value)}
                disabled={isArchived || isSubmitting}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Enter final evaluated amount"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Actual Completion Date
              </span>
              <input
                type="date"
                value={actualCompletionDate}
                onChange={(event) => setActualCompletionDate(event.target.value)}
                disabled={isArchived || isSubmitting}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="block text-xs text-muted-foreground">
                {helperDateText}
              </span>
            </label>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            The generated completion code can be copied into the final manual
            completion report after this contract is marked complete.
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isArchived || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <BadgeCheck size={16} />
                  {isCompleted ? "Save Completion Update" : "Mark as Completed"}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-[28px] border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Hash size={16} />
              Completion Code
            </div>
            <div className="mt-4 rounded-2xl border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Paperwork Reference
              </p>
              <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                {activeCompletionCode ?? "Will be generated after completion"}
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Use this code in the final manual completion report and related closing paperwork.
            </p>
          </div>

          <div className="rounded-[28px] border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays size={16} />
              Completion Summary
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Actual Completion</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatBsDate(contract.actualCompletionDate || actualCompletionDate)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Final Evaluated</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatCurrency(
                    finalEvaluatedAmount
                      ? Number(finalEvaluatedAmount)
                      : contract.finalEvaluatedAmount
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Status After Save</dt>
                <dd className="text-right font-medium text-foreground">
                  Completed
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
