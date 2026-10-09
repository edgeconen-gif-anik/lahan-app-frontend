import { toAdDate } from "@/lib/date-utils";
import type { ContractFormData, ImplementationBy } from "./types";

const BS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidBsDate(value: string) {
  return BS_DATE_PATTERN.test(value.trim()) && Boolean(toAdDate(value.trim()));
}

/** What validation needs to know besides the form values themselves. */
export interface ValidationContext {
  implementationBy: ImplementationBy;
  includeAgreement: boolean;
  includeWorkOrder: boolean;
  agreementContentMode: "auto" | "manual";
  workOrderContentMode: "auto" | "manual";
  isAdmin: boolean;
  sessionUserId?: string;
  /** Contracts that already exist per project (one contract per project). */
  existingContractByProjectId: Map<string, { id: string; contractNumber: string }>;
  /** Set when the entered contract number is already used by another contract. */
  takenContractNumber: { value: string; owner?: string | null } | null;
  /** The agreement / work-order text as it would be saved in auto mode. */
  buildAgreementDraft: (state: ContractFormData) => string;
  buildWorkOrderDraft: (state: ContractFormData) => string;
}

export const GENERAL_FIELDS = [
  "contractNumber",
  "contractAmount",
  "projectId",
  "siteInchargeId",
  "startDate",
  "intendedCompletionDate",
] as const;

/** Field paths checked on each step. Steps 1 and 2 are empty when skipped. */
export function getStepFields(step: number, ctx: ValidationContext): string[] {
  switch (step) {
    case 0:
      return [
        ...GENERAL_FIELDS,
        ctx.implementationBy === "COMPANY" ? "companyId" : "userCommitteeId",
      ];
    case 1:
      return ctx.includeAgreement
        ? ["agreement.agreementDate", "agreement.amount", "agreement.content"]
        : [];
    case 2:
      return ctx.includeWorkOrder
        ? ["workOrder.workCompletionDate", "workOrder.content"]
        : [];
    default:
      return [];
  }
}

export function getAllFields(ctx: ValidationContext) {
  return [0, 1, 2].flatMap((step) => getStepFields(step, ctx));
}

const INVALID_BS = "Use a valid BS date like 2082-01-15.";

export function validateContractField(
  fieldPath: string,
  state: ContractFormData,
  ctx: ValidationContext,
): string | undefined {
  const startDate = state.startDate.trim();
  const startDateAd = startDate ? toAdDate(startDate) : null;

  switch (fieldPath) {
    case "contractNumber": {
      const number = state.contractNumber.trim();
      if (!number) return "Generate or enter a contract number.";
      if (
        ctx.takenContractNumber &&
        ctx.takenContractNumber.value.toLowerCase() === number.toLowerCase()
      ) {
        return ctx.takenContractNumber.owner
          ? `Contract number ${number} is already used (${ctx.takenContractNumber.owner}).`
          : `Contract number ${number} is already used.`;
      }
      return undefined;
    }
    case "contractAmount":
      return Number(state.contractAmount) > 0
        ? undefined
        : "Contract amount must be greater than 0.";
    case "projectId": {
      if (!state.projectId) return "Select a project.";
      const existing = ctx.existingContractByProjectId.get(state.projectId);
      return existing
        ? `This project already has contract ${existing.contractNumber}. Use the existing contract instead.`
        : undefined;
    }
    case "siteInchargeId":
      return (ctx.isAdmin ? state.siteInchargeId : ctx.sessionUserId)
        ? undefined
        : "Select a site incharge.";
    case "startDate":
      if (!startDate) return "Enter the start date in BS format.";
      if (!isValidBsDate(startDate)) return INVALID_BS;
      return undefined;
    case "intendedCompletionDate": {
      const value = state.intendedCompletionDate.trim();
      if (!value) return "Enter the intended completion date.";
      if (!isValidBsDate(value)) return INVALID_BS;
      const intendedAd = toAdDate(value);
      if (startDateAd && intendedAd && intendedAd <= startDateAd) {
        return "Completion date must be after the start date.";
      }
      return undefined;
    }
    case "companyId":
      if (ctx.implementationBy !== "COMPANY") return undefined;
      return state.companyId ? undefined : "Select a company / contractor.";
    case "userCommitteeId":
      if (ctx.implementationBy !== "USER_COMMITTEE") return undefined;
      return state.userCommitteeId ? undefined : "Select a user committee.";
    case "agreement.agreementDate": {
      if (!ctx.includeAgreement) return undefined;
      const value = state.agreement.agreementDate.trim();
      if (!value) return "Enter the agreement date.";
      if (!isValidBsDate(value)) return INVALID_BS;
      return undefined;
    }
    case "agreement.amount":
      if (!ctx.includeAgreement) return undefined;
      return Number(state.agreement.amount || state.contractAmount) > 0
        ? undefined
        : "Agreement amount must be greater than 0.";
    case "agreement.content": {
      if (!ctx.includeAgreement) return undefined;
      const text =
        ctx.agreementContentMode === "auto"
          ? ctx.buildAgreementDraft(state)
          : state.agreement.content;
      return text.trim().length >= 10
        ? undefined
        : "Agreement content must be at least 10 characters.";
    }
    case "workOrder.workCompletionDate": {
      if (!ctx.includeWorkOrder) return undefined;
      const value = state.workOrder.workCompletionDate.trim();
      if (!value) return "Enter the work completion date.";
      if (!isValidBsDate(value)) return INVALID_BS;
      const completionAd = toAdDate(value);
      if (startDateAd && completionAd && completionAd <= startDateAd) {
        return "Work completion date must be after the start date.";
      }
      return undefined;
    }
    case "workOrder.content": {
      if (!ctx.includeWorkOrder) return undefined;
      const text =
        ctx.workOrderContentMode === "auto"
          ? ctx.buildWorkOrderDraft(state)
          : state.workOrder.content;
      return text.trim().length >= 10
        ? undefined
        : "Work order content must be at least 10 characters.";
    }
    default:
      return undefined;
  }
}

export function collectErrors(
  fieldPaths: string[],
  state: ContractFormData,
  ctx: ValidationContext,
) {
  return fieldPaths.reduce<Record<string, string>>((errors, fieldPath) => {
    const error = validateContractField(fieldPath, state, ctx);
    if (error) errors[fieldPath] = error;
    return errors;
  }, {});
}
