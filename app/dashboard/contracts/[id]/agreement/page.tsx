"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PrintableContractDocument } from "@/components/contracts/printable-document";
import { useContract } from "@/hooks/contract/useContracts";
import {
  buildAgreementDraftFromContract,
  buildAgreementNarrative,
  formatContractCurrency,
  getContractDocumentVariant,
  getDocumentSignatoryLabel,
  hasCustomDocumentText,
} from "@/lib/contract-documents";
import { toFormalNepaliDate, toNepaliDate } from "@/lib/date-utils";

export default function AgreementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractId = params.id as string;
  const autoPrint = searchParams.get("print") === "1";
  const { data: contract, isLoading, error } = useContract(contractId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ea_0%,#eef3f8_100%)] px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[24px] border border-slate-200 bg-white/80"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !contract || !contract.agreement) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ea_0%,#eef3f8_100%)] px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-slate-900">Agreement unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This contract does not have an attached agreement yet, or the agreement
            could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const variant = getContractDocumentVariant(contract);
  const generatedAgreementText = buildAgreementDraftFromContract(contract);
  const sections = [
    {
      title: variant === "USER_COMMITTEE" ? "Agreement Summary" : "Contract Summary",
      paragraphs: buildAgreementNarrative(contract),
    },
  ];

  if (hasCustomDocumentText(contract.agreement.content, generatedAgreementText)) {
    sections.push({
      title: "Recorded Terms",
      paragraphs: [contract.agreement.content],
    });
  }

  return (
    <PrintableContractDocument
      autoPrint={autoPrint}
      backHref={`/dashboard/contracts/${contract.id}`}
      contract={contract}
      documentType="agreement"
      meta={[
        { label: "Agreement Date", value: toFormalNepaliDate(contract.agreement.agreementDate) },
        { label: "Agreement Amount", value: formatContractCurrency(contract.agreement.amount) },
        { label: "Start Date (BS)", value: toNepaliDate(contract.startDate) },
        {
          label: "Completion Target (BS)",
          value: toNepaliDate(contract.intendedCompletionDate),
        },
      ]}
      sections={sections}
      signatures={[
        {
          label: "Office Signatory",
          name: contract.agreement.officeSignatory,
          note: "Municipality representative",
        },
        {
          label: getDocumentSignatoryLabel(variant),
          name: contract.agreement.contractorSignatory,
          note:
            variant === "USER_COMMITTEE"
              ? "Authorized committee representative"
              : "Authorized contractor representative",
        },
        {
          label: "Witness",
          name: contract.agreement.witnessName,
          note: "Witness to the agreement",
        },
      ]}
      subtitle={
        variant === "USER_COMMITTEE"
          ? "Auto-generated committee agreement based on the linked contract, project, approved amount, and recorded signatories."
          : "Auto-generated company agreement based on the linked contract, project, approved amount, and recorded signatories."
      }
      title="Agreement Document"
      variant={variant}
    />
  );
}
