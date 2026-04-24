"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NepaliOfficialDocument } from "@/components/contracts/nepali-official-document";
import { useCompany } from "@/hooks/company/useCompany";
import { useContract } from "@/hooks/contract/useContracts";
import { useProject } from "@/hooks/project/useProjects";
import { useUserCommittee } from "@/hooks/user-committee/useUserCommittees";
import {
  buildRecipientLines,
  buildWorkOrderNepaliParagraphs,
  formatNepaliDate,
  getCustomWorkOrderNote,
} from "@/lib/contract-document-nepali";

function getDesignationLabel(designation?: string | null) {
  switch (designation) {
    case "ASSISTANT_SUB_ENGINEER":
      return "अ. सब-इन्जिनियर";
    case "SUB_ENGINEER":
      return "सब-इन्जिनियर";
    case "ENGINEER":
      return "इन्जिनियर";
    default:
      return "";
  }
}

function UnavailableState() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Work order unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The work-order document could not be generated because the contract details
          could not be loaded.
        </p>
      </div>
    </div>
  );
}

function splitWorkOrderContent(value: string) {
  return value
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function WorkOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractId = params.id as string;
  const autoPrint = searchParams.get("print") === "1";

  const { data: contract, isLoading, error } = useContract(contractId);
  const { data: company } = useCompany(contract?.companyId ?? "");
  const { data: committee } = useUserCommittee(contract?.userCommitteeId ?? "");
  const { data: project } = useProject(contract?.projectId ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-8">
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

  if (error || !contract) {
    return <UnavailableState />;
  }

  const implementorAddress = company?.address ?? committee?.address;
  const recipientLines = buildRecipientLines({
    address: implementorAddress,
    contract,
  });
  const fiscalYear = project?.fiscalYear ?? null;
  const customWorkOrderContent = getCustomWorkOrderNote(contract);
  const body = customWorkOrderContent
    ? splitWorkOrderContent(customWorkOrderContent)
    : buildWorkOrderNepaliParagraphs({
        contract,
        fiscalYear,
        implementorAddress,
        projectName: project?.name ?? contract.project?.name,
      });
  const workOrderDate = formatNepaliDate(
    contract.workOrder?.issuedDate ?? contract.workOrder?.createdAt ?? contract.createdAt
  );
  const siteIncharge = contract.siteIncharge ?? contract.project?.siteIncharge ?? null;
  const siteInchargeLabel = [getDesignationLabel(siteIncharge?.designation), siteIncharge?.name]
    .filter(Boolean)
    .join(" ");
  const appendixSections = [
    {
      title: "सादर अवगतार्थ:",
      lines: [
        "श्रीमान प्रमुखज्यू :- जानकारी निमित्त ।",
        "श्रीमान उपप्रमुखज्यू :- जानकारी निमित्त ।",
      ],
    },
    {
      title: "बोधार्थ:-",
      lines: [
        "श्री आर्थिक प्रशासन शाखा :- जानकारी निमित्त ।",
        "श्री पूर्वाधार शाखा :- जानकारी निमित्त ।",
        `${siteInchargeLabel || "SITE INCHARGE"} लहान न.पा. नगरकार्यपालिकाको कार्यालय, लहान :- उक्त योजनाको रेखदेख र सुपरिवेक्षण गरी निर्धारित समयभित्र निर्माण कार्य सम्पन्न गर्न/गराउन हुन ।`,
      ],
    },
  ];

  return (
    <NepaliOfficialDocument
      autoPrint={autoPrint}
      appendixSections={appendixSections}
      backHref={`/dashboard/contracts/${contract.id}`}
      body={body}
      contentWidth="narrow"
      cornerMeta={{ label: "मिति", value: workOrderDate }}
      density="compact"
      headingLayout="subject-line"
      letterhead
      meta={[]}
      printBottomReserveMm={45}
      printTopShiftMm={28}
      qrCodeLabel=""
      qrCodePlacement="below-corner"
      qrCodePath={`/dashboard/contracts/${contract.id}/work-order`}
      recipientLines={recipientLines}
      signatureLayout="bottom-right"
      signatureNamePlacement="below"
      signatures={[
        {
          label: "प्रमुख प्रशासकिय अधिकत",
          name: contract.workOrder?.officeSignatory,
          showPlaceholderWhenNameMissing: false,
        },
      ]}
      subject="कार्य आदेश।"
      subjectAlignment="center"
      subjectPrefix="बिषय:-"
      title=""
    />
  );
}
