// app/dashboard/contracts/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, Loader2 } from "lucide-react";
import { useContract, useUpdateContract } from "@/hooks/contract/useContracts";

type MutationError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as MutationError)?.response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : (message ?? fallback);
}

// ── Matches UpdateContractSchema in contract.dto.ts ──────────────────────────
interface EditFormState {
  contractNumber:         string;
  contractAmount:         number | "";
  startDate:              string; // "YYYY-MM-DD" for <input type="date">
  intendedCompletionDate: string; // "YYYY-MM-DD"
  actualCompletionDate:   string; // "YYYY-MM-DD" or ""
  projectId:              string;
  companyId:              string;
  userCommitteeId:        string;
  userID:                 string; // committee representative — schema field is userID
  siteInchargeId:         string; // ✅ site incharge on the contract
  remarks:                string;
}

// ── Safe date formatter ───────────────────────────────────────────────────────
// Returns "YYYY-MM-DD" for valid date strings, "" for null/undefined/invalid
function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return ""; // ✅ guard against Invalid Date
  return d.toISOString().split("T")[0];
}

// ── Build PATCH payload — strips empty strings to undefined ──────────────────
function toAmountInput(value: number | string | null | undefined): number | "" {
  if (value == null || value === "") return "";
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : "";
}

function buildPayload(form: EditFormState) {
  const contractAmount =
    form.contractAmount !== "" && Number.isFinite(Number(form.contractAmount))
      ? Number(form.contractAmount)
      : undefined;

  return {
    contractNumber:         form.contractNumber         || undefined,
    contractAmount,
    startDate:              form.startDate              || undefined,
    intendedCompletionDate: form.intendedCompletionDate || undefined,
    actualCompletionDate:   form.actualCompletionDate   || undefined,
    projectId:              form.projectId              || undefined,
    companyId:              form.companyId              || undefined,
    userCommitteeId:        form.userCommitteeId        || undefined,
    userID:                 form.userID                 || undefined,
    siteInchargeId:         form.siteInchargeId         || undefined,
    remarks:                form.remarks                || undefined,
  };
}

export default function EditContractPage() {
  const params     = useParams();
  const router     = useRouter();
  const contractId = params.id as string;

  const { data: contract, isLoading, isError } = useContract(contractId);
  const { mutateAsync: updateContract, isPending: isUpdating } = useUpdateContract();

  const [formData, setFormData] = useState<EditFormState>({
    contractNumber:         "",
    contractAmount:         "",
    startDate:              "",
    intendedCompletionDate: "",
    actualCompletionDate:   "",
    projectId:              "",
    companyId:              "",
    userCommitteeId:        "",
    userID:                 "",
    siteInchargeId:         "",
    remarks:                "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Populate form when contract loads ──────────────────────────────────────
  useEffect(() => {
    if (!contract) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      contractNumber:         contract.contractNumber         ?? "",
      contractAmount:         toAmountInput(contract.contractAmount),
      // ✅ toDateInput guards against null/undefined/invalid — no more RangeError
      startDate:              toDateInput(contract.startDate),
      intendedCompletionDate: toDateInput(contract.intendedCompletionDate),
      actualCompletionDate:   toDateInput(contract.actualCompletionDate),   // optional
      projectId:              contract.projectId              ?? "",
      companyId:              contract.companyId              ?? "",
      userCommitteeId:        contract.userCommitteeId        ?? "",
      userID:                 contract.userID                 ?? "",         // committee rep
      siteInchargeId:         contract.siteInchargeId         ?? "",         // ✅ site incharge
      remarks:                contract.remarks                ?? "",
    });
  }, [contract]);

  // ── Generic change handler ─────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!contract) {
      setSubmitError("Failed to load contract for editing.");
      return;
    }

    try {
      await updateContract({ id: contractId, data: buildPayload(formData) });
      router.push(`/dashboard/contracts/${contractId}`);
    } catch (error: unknown) {
      console.error("Failed to update contract:", error);
      setSubmitError(getErrorMessage(error, "Failed to update contract. Please try again."));
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError || !contract) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border flex items-center gap-2">
          <AlertCircle size={18} /> Failed to load contract for editing.
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft size={16} /> Back to Details
        </button>
        <h1 className="text-2xl font-bold">
          Edit Contract: {contract.contractNumber}
        </h1>
      </div>

      {/* Submit error banner */}
      {submitError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border flex items-center gap-2">
          <AlertCircle size={18} /> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border shadow-sm p-6 space-y-6">

        {/* ── Section: Contract Details ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contract Details
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contract Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Contract Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="contractNumber"
                required
                value={formData.contractNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Contract Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Contract Amount (रू) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                name="contractAmount"
                required
                min="1"
                step="0.01"
                value={formData.contractAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Intended Completion Date — replaces the old "endDate" */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Intended Completion Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                name="intendedCompletionDate"
                required
                value={formData.intendedCompletionDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Actual Completion Date — optional */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Actual Completion Date
                <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
              </label>
              <input
                type="date"
                name="actualCompletionDate"
                value={formData.actualCompletionDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

          </div>
        </fieldset>

        {/* ── Section: Assignments ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Assignments
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Project ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Project ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="projectId"
                required
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                placeholder="Project UUID"
              />
            </div>

            {/* Site Incharge — siteInchargeId */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Site Incharge
                <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                name="siteInchargeId"
                value={formData.siteInchargeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                placeholder="User UUID — leave blank if unassigned"
              />
              {/* Show resolved name if available */}
              {contract.siteIncharge && (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{contract.siteIncharge.name}</span>
                  {contract.siteIncharge.designation && (
                    <span className="ml-1 text-muted-foreground">({contract.siteIncharge.designation})</span>
                  )}
                </p>
              )}
            </div>

            {/* Company ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Company (Contractor)
                <span className="ml-2 text-xs text-muted-foreground">(or use User Committee)</span>
              </label>
              <input
                type="text"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                placeholder="Company UUID"
              />
              {contract.company && (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{contract.company.name}</span>
                </p>
              )}
            </div>

            {/* User Committee ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                User Committee
                <span className="ml-2 text-xs text-muted-foreground">(or use Company)</span>
              </label>
              <input
                type="text"
                name="userCommitteeId"
                value={formData.userCommitteeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                placeholder="User Committee UUID"
              />
              {contract.userCommittee && (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{contract.userCommittee.name}</span>
                </p>
              )}
            </div>

            {/* Committee Representative — userID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Committee Representative
                <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                name="userID"
                value={formData.userID}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                placeholder="User UUID"
              />
            </div>

          </div>
        </fieldset>

        {/* ── Remarks ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Remarks</label>
          <textarea
            name="remarks"
            rows={3}
            value={formData.remarks}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md bg-background resize-none"
            placeholder="Add any additional notes here..."
          />
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isUpdating ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
