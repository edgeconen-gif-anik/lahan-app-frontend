"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PrintableContractDocument } from "@/components/contracts/printable-document";
import { useContract } from "@/hooks/contract/useContracts";
import {
  buildWorkOrderDraftFromContract,
  buildWorkOrderNarrative,
  formatContractCurrency,
  getContractDocumentVariant,
  getDocumentSignatoryLabel,
  hasCustomDocumentText,
} from "@/lib/contract-documents";
import { toFormalNepaliDate, toNepaliDate } from "@/lib/date-utils";

export default function WorkOrderPage() {
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

  if (error || !contract || !contract.workOrder) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ea_0%,#eef3f8_100%)] px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-slate-900">Work order unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This contract does not have an attached work order yet, or the work order
            could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const variant = getContractDocumentVariant(contract);
  const generatedWorkOrderText = buildWorkOrderDraftFromContract(contract);
  const sections = [
    {
      title: "Work Authorization",
      paragraphs: buildWorkOrderNarrative(contract),
    },
  ];

  if (hasCustomDocumentText(contract.workOrder.content, generatedWorkOrderText)) {
    sections.push({
      title: "Recorded Scope",
      paragraphs: [contract.workOrder.content],
    });
  }

  return (
    <PrintableContractDocument
      autoPrint={autoPrint}
      backHref={`/dashboard/contracts/${contract.id}`}
      contract={contract}
      documentType="work-order"
      meta={[
        {
          label: "Issued Date",
          value: toFormalNepaliDate(
            contract.workOrder.issuedDate ?? contract.workOrder.createdAt
          ),
        },
        {
          label: "Work Completion Date",
          value: toFormalNepaliDate(contract.workOrder.workCompletionDate),
        },
        { label: "Contract Value", value: formatContractCurrency(contract.contractAmount) },
        { label: "Start Date (BS)", value: toNepaliDate(contract.startDate) },
      ]}
      sections={sections}
      signatures={[
        {
          label: "Office Signatory",
          name: contract.workOrder.officeSignatory,
          note: "Order issued by the Municipality",
        },
        {
          label: getDocumentSignatoryLabel(variant),
          name: contract.workOrder.contractorSignatory,
          note:
            variant === "USER_COMMITTEE"
              ? "Committee receipt and acknowledgement"
              : "Contractor receipt and acknowledgement",
        },
        {
          label: "Witness",
          name: contract.workOrder.witnessName,
          note: "Witness to the issuance",
        },
      ]}
      subtitle="Auto-generated work order based on the linked contract timeline, approved amount, and recorded signatories."
      title="Work Order Document"
      variant={variant}
    />
  );
}
