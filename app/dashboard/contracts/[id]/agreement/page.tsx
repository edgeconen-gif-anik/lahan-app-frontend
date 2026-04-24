"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NepaliOfficialDocument } from "@/components/contracts/nepali-official-document";
import { useCompany } from "@/hooks/company/useCompany";
import { useContract } from "@/hooks/contract/useContracts";
import { useProject } from "@/hooks/project/useProjects";
import { useUserCommittee } from "@/hooks/user-committee/useUserCommittees";
import {
  formatNepaliCurrency,
  formatNepaliDate,
  formatNepaliFiscalYear,
  getCustomAgreementNote,
  toNepaliDigits,
} from "@/lib/contract-document-nepali";
import { getContractDocumentVariant } from "@/lib/contract-documents";

const EMPLOYER_NAME =
  "लहान नगरपालिका, नगर कार्यपालिकाको कार्यालय, लहान, सिराहा";

function buildStandardAgreementBody(input: {
  agreementDate: string;
  contractPrice: string;
  counterpartyLabel: string;
  implementorName: string;
  projectName: string;
}) {
  return [
    `आज मिति ${input.agreementDate} मा ${EMPLOYER_NAME} (यसपछि "नियोक्ता" भनिने) एक पक्ष र ${input.implementorName} (यसपछि "${input.counterpartyLabel}" भनिने) अर्को पक्षबीच "${input.projectName}" कार्यको कार्यान्वयन, सम्पन्नता तथा देखिएका त्रुटिहरू सच्याउने प्रयोजनका लागि यो सम्झौता गरिएको छ ।`,
    `नियोक्ताले "${input.projectName}" नामक कार्य ${input.counterpartyLabel} मार्फत गराउन चाहेको र उक्त ${input.counterpartyLabel} ले पेश गरेको बोलपत्र/प्रस्ताव स्वीकृत भई ${input.contractPrice} रकममा उक्त कार्य सम्पन्न गर्ने सहमति भएकोले यसपछिका शर्तहरू लागू हुनेछन् ।`,
    "दुवै पक्षबीच देहाय बमोजिम सहमति कायम गरियो :",
    "१. यस सम्झौतामा प्रयोग भएका शब्द तथा अभिव्यक्तिहरूको अर्थ यससँग सम्बन्धित सम्झौता कागजातहरूमा उल्लेख भए बमोजिम नै मानिनेछ ।",
    `२. नियोक्ताले यस सम्झौतामा उल्लेख गरे बमोजिम भुक्तानी गर्ने प्रतिफलस्वरूप ${input.counterpartyLabel} ले सम्झौताका सम्पूर्ण शर्त तथा प्रावधानहरूको पालना गर्दै कार्य सम्पन्न गर्ने र कार्यमा देखिएका त्रुटिहरू नियमानुसार सच्याउनेछ ।`,
    `३. नियोक्ताले ${input.counterpartyLabel} ले कार्य सम्पन्न गरी आवश्यक त्रुटिहरू सच्याएपछि सम्झौतामा तोकिएको समय, प्रक्रिया तथा विधिबमोजिम सम्झौता रकम ${input.contractPrice} वा सम्झौता अनुसार देय हुन आउने अन्य रकम भुक्तानी गर्नेछ ।`,
    "यसको साक्षीस्वरूप माथि उल्लेखित मितिमा नेपाल कानून बमोजिम दुवै पक्षले यस सम्झौतामा हस्ताक्षर गरी कार्यान्वयनमा ल्याएका छन् ।",
  ];
}

function UnavailableState() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Agreement unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The agreement document could not be generated because the contract details
          could not be loaded.
        </p>
      </div>
    </div>
  );
}

export default function AgreementPage() {
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

  const variant = getContractDocumentVariant(contract);
  const counterpartyLabel =
    variant === "USER_COMMITTEE" ? "उपभोक्ता समिति" : "ठेकेदार";
  const implementorName =
    company?.name?.trim() ||
    committee?.name?.trim() ||
    contract.company?.name?.trim() ||
    contract.userCommittee?.name?.trim() ||
    `सम्बन्धित ${counterpartyLabel}`;
  const projectName =
    project?.name?.trim() || contract.project?.name?.trim() || "स्वीकृत कार्य";
  const agreementDate = formatNepaliDate(
    contract.agreement?.agreementDate ?? contract.startDate,
    "सम्झौता मिति"
  );
  const contractPrice = formatNepaliCurrency(
    contract.agreement?.amount ?? contract.contractAmount
  );
  const body = buildStandardAgreementBody({
    agreementDate,
    contractPrice,
    counterpartyLabel,
    implementorName,
    projectName,
  });
  const customNote = getCustomAgreementNote(contract);
  const meta = [
    {
      label: "मिति",
      value: formatNepaliDate(contract.agreement?.agreementDate ?? contract.startDate),
    },
    {
      label: "सम्झौता नं.",
      value: toNepaliDigits(contract.contractNumber) || "—",
    },
    {
      label: "सम्झौता रकम",
      value: contractPrice,
    },
    ...(project?.fiscalYear
      ? [{ label: "आ.व.", value: formatNepaliFiscalYear(project.fiscalYear) }]
      : []),
  ];

  return (
    <NepaliOfficialDocument
      autoPrint={autoPrint}
      backHref={`/dashboard/contracts/${contract.id}`}
      body={body}
      density="compact"
      letterhead={false}
      documentLabel="मानक ढाँचा"
      footerNote="यो सम्झौता पत्र प्रणालीमा अभिलेखित सम्झौता, परियोजना, रकम र हस्ताक्षर विवरणका आधारमा तयार गरिएको हो ।"
      meta={meta}
      noteContent={customNote}
      noteTitle="रेकर्ड गरिएको थप सर्त"
      paragraphIndent={false}
      signatures={[
        {
          label: "नियोक्ताको तर्फबाट",
          name: contract.agreement?.officeSignatory,
          note: EMPLOYER_NAME,
        },
        {
          label:
            variant === "USER_COMMITTEE"
              ? "उपभोक्ता समितिको तर्फबाट"
              : "ठेकेदारको तर्फबाट",
          name: contract.agreement?.contractorSignatory,
          note: implementorName,
        },
        {
          label: "साक्षी",
          name: contract.agreement?.witnessName,
          note: "सम्झौताको साक्षी",
        },
      ]}
      subject=""
      subjectPrefix=""
      subtitle={EMPLOYER_NAME}
      title="सम्झौता पत्र"
    />
  );
}
