import type { ContractDocumentVariant } from "@/lib/contract-documents";

export type ContractNoMode = "sequential" | "uuid" | "manual";
export type DocumentContentMode = "auto" | "manual";
export type FieldErrors = Record<string, string>;
export type ImplementationBy = ContractDocumentVariant;

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface ContractProjectOption {
  id: string;
  name: string;
  sNo?: string | null;
  fiscalYear?: string | null;
}

export interface CompanyRecord {
  approvalStatus?: string;
  id: string;
  name: string;
  panNumber?: number | string | null;
}

export interface UserCommitteeRecord {
  id: string;
  name: string;
  fiscalYear?: string | null;
}

export interface UserRecord {
  designation?: string | null;
  email?: string | null;
  id: string;
  name: string;
}

export const INITIAL_FORM_DATA = {
  contractNumber: "",
  contractAmount: 0,
  startDate: "",
  intendedCompletionDate: "",
  remarks: "",
  projectId: "",
  companyId: "" as string | undefined,
  userCommitteeId: "" as string | undefined,
  siteInchargeId: "" as string | undefined,
  agreement: {
    agreementDate: "",
    content: "",
    amount: 0,
    contractorSignatory: "",
    officeSignatory: "",
    witnessName: "",
  },
  workOrder: {
    workCompletionDate: "",
    content: "",
    contractorSignatory: "",
    officeSignatory: "",
    witnessName: "",
  },
};

export type ContractFormData = typeof INITIAL_FORM_DATA;

export const STEPS = [
  { id: "general", label: "General details" },
  { id: "agreement", label: "Agreement" },
  { id: "work-order", label: "Work order" },
  { id: "review", label: "Review" },
] as const;

export const LAST_STEP = STEPS.length - 1;

/** Everything that makes up an in-progress form; this is what a draft stores. */
export interface ContractFormSnapshot {
  formData: ContractFormData;
  includeAgreement: boolean;
  includeWorkOrder: boolean;
  implementationBy: ImplementationBy;
  agreementContentMode: DocumentContentMode;
  workOrderContentMode: DocumentContentMode;
  contractNumberMode: ContractNoMode;
  step: number;
}

export const INITIAL_SNAPSHOT: ContractFormSnapshot = {
  formData: INITIAL_FORM_DATA,
  includeAgreement: false,
  includeWorkOrder: false,
  implementationBy: "COMPANY",
  agreementContentMode: "auto",
  workOrderContentMode: "auto",
  contractNumberMode: "sequential",
  step: 0,
};
