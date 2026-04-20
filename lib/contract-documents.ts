import type { Contract } from "@/lib/schema/contract/contract";
import { toNepaliDate } from "@/lib/date-utils";

export type ContractDocumentVariant = "COMPANY" | "USER_COMMITTEE";

export type ContractDocumentDraftInput = {
  variant: ContractDocumentVariant;
  contractNumber?: string | null;
  projectName?: string | null;
  implementorName?: string | null;
  contractAmount?: number | string | null;
  agreementAmount?: number | string | null;
  startDateBs?: string | null;
  intendedCompletionDateBs?: string | null;
  agreementDateBs?: string | null;
  workCompletionDateBs?: string | null;
};

const DEFAULT_PROJECT_NAME = "the selected project";
const DEFAULT_IMPLEMENTOR_NAME = "the selected implementation party";

function cleanText(value?: string | null, fallback = "") {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function normalizeAmount(value?: number | string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sentenceDate(value?: string | null, fallback = "the approved date") {
  return cleanText(value, fallback);
}

export function formatContractCurrency(value?: number | string | null) {
  const amount = normalizeAmount(value);
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function normalizeDocumentText(value?: string | null) {
  return cleanText(value);
}

export function hasCustomDocumentText(
  savedValue?: string | null,
  generatedValue?: string | null
) {
  const saved = normalizeDocumentText(savedValue);
  if (!saved) return false;

  return saved !== normalizeDocumentText(generatedValue);
}

export function getContractDocumentVariant(
  contract: Pick<Contract, "company" | "companyId" | "userCommittee" | "userCommitteeId">
): ContractDocumentVariant {
  return contract.userCommitteeId || contract.userCommittee
    ? "USER_COMMITTEE"
    : "COMPANY";
}

export function getContractImplementorName(
  contract: Pick<Contract, "company" | "userCommittee">
) {
  return cleanText(
    contract.company?.name ?? contract.userCommittee?.name,
    DEFAULT_IMPLEMENTOR_NAME
  );
}

export function getDocumentPartyLabel(variant: ContractDocumentVariant) {
  return variant === "USER_COMMITTEE" ? "User committee" : "Company / contractor";
}

export function getDocumentSignatoryLabel(variant: ContractDocumentVariant) {
  return variant === "USER_COMMITTEE"
    ? "Committee Signatory"
    : "Contractor Signatory";
}

export function buildAgreementDraftText(input: ContractDocumentDraftInput) {
  const contractNumber = cleanText(input.contractNumber, "the generated contract number");
  const projectName = cleanText(input.projectName, DEFAULT_PROJECT_NAME);
  const implementorName = cleanText(input.implementorName, DEFAULT_IMPLEMENTOR_NAME);
  const startDate = sentenceDate(input.startDateBs, "the approved start date");
  const completionDate = sentenceDate(
    input.intendedCompletionDateBs,
    "the approved completion date"
  );
  const agreementDate = sentenceDate(
    input.agreementDateBs,
    "the recorded agreement date"
  );
  const agreementAmount = formatContractCurrency(
    input.agreementAmount || input.contractAmount
  );

  if (input.variant === "USER_COMMITTEE") {
    return [
      `This agreement is entered into on ${agreementDate} between the Municipality and ${implementorName} for community-led implementation of "${projectName}" under contract no. ${contractNumber}.`,
      `${implementorName} shall mobilize local participation, maintain transparent records, and complete the approved work within the agreed timeline from ${startDate} to ${completionDate}.`,
      `The Municipality shall release and monitor the approved amount of ${agreementAmount} according to progress, measurement, compliance, and completion requirements.`,
    ].join(" ");
  }

  return [
    `This agreement is entered into on ${agreementDate} between the Municipality and ${implementorName} for execution of "${projectName}" under contract no. ${contractNumber}.`,
    `${implementorName} agrees to carry out the approved work for ${agreementAmount} beginning from ${startDate} and completing within the approved timeline ending on ${completionDate}.`,
    `The contractor shall follow the approved estimate, municipal instructions, quality standards, measurement records, and completion procedures before final payment and handover.`,
  ].join(" ");
}

export function buildWorkOrderDraftText(input: ContractDocumentDraftInput) {
  const contractNumber = cleanText(input.contractNumber, "the generated contract number");
  const projectName = cleanText(input.projectName, DEFAULT_PROJECT_NAME);
  const implementorName = cleanText(input.implementorName, DEFAULT_IMPLEMENTOR_NAME);
  const startDate = sentenceDate(input.startDateBs, "the approved start date");
  const workCompletionDate = sentenceDate(
    input.workCompletionDateBs || input.intendedCompletionDateBs,
    "the approved completion date"
  );
  const contractAmount = formatContractCurrency(input.contractAmount);

  return [
    `Through this work order, ${implementorName} is authorized to begin work on "${projectName}" under contract no. ${contractNumber}.`,
    `The work shall proceed from ${startDate} and be completed by ${workCompletionDate} within the approved contract value of ${contractAmount}.`,
    `All work must follow the approved estimate, site instructions, safety measures, quality standards, and measurement-based verification before completion and handover.`,
  ].join(" ");
}

export function buildAgreementNarrative(contract: Contract) {
  const variant = getContractDocumentVariant(contract);
  const projectName = cleanText(contract.project?.name, "the approved project");
  const implementorName = getContractImplementorName(contract);
  const contractNumber = cleanText(contract.contractNumber, "the contract number");
  const agreementAmount = formatContractCurrency(
    contract.agreement?.amount ?? contract.contractAmount
  );
  const startDate = sentenceDate(toNepaliDate(contract.startDate), "the approved start date");
  const completionDate = sentenceDate(
    toNepaliDate(contract.intendedCompletionDate),
    "the approved completion date"
  );

  if (variant === "USER_COMMITTEE") {
    return [
      `The Municipality and ${implementorName} have entered into this agreement for community-based implementation of "${projectName}" under contract no. ${contractNumber}.`,
      `${implementorName} is expected to organize local participation, maintain transparent expenditure records, and complete the approved work within the agreed timeframe from ${startDate} to ${completionDate}.`,
      `Fund release, monitoring, and final settlement shall follow verified progress, measurement, compliance, and the approved amount of ${agreementAmount}.`,
    ];
  }

  return [
    `The Municipality and ${implementorName} have entered into this agreement for execution of "${projectName}" under contract no. ${contractNumber}.`,
    `${implementorName} shall perform the approved work for ${agreementAmount} within the agreed timeframe from ${startDate} to ${completionDate} and in accordance with the sanctioned estimate and instructions.`,
    `Quality assurance, site coordination, measurement, certification, payment, and final completion shall be processed according to the approved municipal procedures.`,
  ];
}

export function buildWorkOrderNarrative(contract: Contract) {
  const projectName = cleanText(contract.project?.name, "the approved project");
  const implementorName = getContractImplementorName(contract);
  const contractNumber = cleanText(contract.contractNumber, "the contract number");
  const contractAmount = formatContractCurrency(contract.contractAmount);
  const startDate = sentenceDate(toNepaliDate(contract.startDate), "the approved start date");
  const workCompletionDate = sentenceDate(
    toNepaliDate(
      contract.workOrder?.workCompletionDate ?? contract.intendedCompletionDate
    ),
    "the approved completion date"
  );

  return [
    `This work order formally authorizes ${implementorName} to start work on "${projectName}" under contract no. ${contractNumber}.`,
    `The work shall begin from ${startDate} and be completed by ${workCompletionDate} within the approved contract value of ${contractAmount}.`,
    `Execution, supervision, measurement, safety, and quality control shall follow the approved estimate, municipal instructions, and the records verified by the responsible office.`,
  ];
}

export function buildAgreementDraftFromContract(contract: Contract) {
  return buildAgreementDraftText({
    variant: getContractDocumentVariant(contract),
    contractNumber: contract.contractNumber,
    projectName: contract.project?.name,
    implementorName: getContractImplementorName(contract),
    contractAmount: contract.contractAmount,
    agreementAmount: contract.agreement?.amount ?? contract.contractAmount,
    startDateBs: toNepaliDate(contract.startDate),
    intendedCompletionDateBs: toNepaliDate(contract.intendedCompletionDate),
    agreementDateBs: contract.agreement?.agreementDate
      ? toNepaliDate(contract.agreement.agreementDate)
      : undefined,
  });
}

export function buildWorkOrderDraftFromContract(contract: Contract) {
  return buildWorkOrderDraftText({
    variant: getContractDocumentVariant(contract),
    contractNumber: contract.contractNumber,
    projectName: contract.project?.name,
    implementorName: getContractImplementorName(contract),
    contractAmount: contract.contractAmount,
    startDateBs: toNepaliDate(contract.startDate),
    intendedCompletionDateBs: toNepaliDate(contract.intendedCompletionDate),
    workCompletionDateBs: contract.workOrder?.workCompletionDate
      ? toNepaliDate(contract.workOrder.workCompletionDate)
      : undefined,
  });
}
