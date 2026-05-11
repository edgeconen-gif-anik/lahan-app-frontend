"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NepaliOfficialDocument } from "@/components/contracts/nepali-official-document";
import { useCompany } from "@/hooks/company/useCompany";
import { useContract } from "@/hooks/contract/useContracts";
import { useProject } from "@/hooks/project/useProjects";
import { useUserCommittee } from "@/hooks/user-committee/useUserCommittees";
import {
  buildAgreementNepaliParagraphs,
  formatNepaliCurrency,
  formatNepaliDate,
  formatNepaliFiscalYear,
  getCustomAgreementNote,
  toNepaliDigits,
} from "@/lib/contract-document-nepali";
import { getContractDocumentVariant } from "@/lib/contract-documents";
import { useSystemSetup } from "@/hooks/setup/useSetup";

const EMPLOYER_NAME =
  "लहान नगरपालिका, नगर कार्यपालिकाको कार्यालय, लहान, सिराहा";
const MUNICIPAL_OFFICE_NAME = "लहान न.पा. नगर कार्यपालिकाको कार्यालय";
const MUNICIPAL_PHONE = "०३३६३१३७";
const DEFAULT_COMPANY_WITNESS_NAMES = "ई. अनिक यादव, ई. विनोद कुमार यादव";
const EMPTY_SIGNATURE_VALUE = "........................";

const NEPALI_NUMBER_WORDS: Record<number, string> = {
  0: "शून्य",
  1: "एक",
  2: "दुई",
  3: "तीन",
  4: "चार",
  5: "पाँच",
  6: "छ",
  7: "सात",
  8: "आठ",
  9: "नौ",
  10: "दश",
  11: "एघार",
  12: "बाह्र",
  13: "तेह्र",
  14: "चौध",
  15: "पन्ध्र",
  16: "सोह्र",
  17: "सत्र",
  18: "अठार",
  19: "उन्नाइस",
  20: "बीस",
  21: "एक्काइस",
  22: "बाइस",
  23: "तेइस",
  24: "चौबीस",
  25: "पच्चीस",
  26: "छब्बीस",
  27: "सत्ताइस",
  28: "अठ्ठाइस",
  29: "उनन्तीस",
  30: "तीस",
  31: "एकतीस",
  32: "बत्तीस",
  33: "तेत्तीस",
  34: "चौतीस",
  35: "पैँतीस",
  36: "छत्तीस",
  37: "सैँतीस",
  38: "अठतीस",
  39: "उनन्चालीस",
  40: "चालीस",
  41: "एकचालीस",
  42: "बयालीस",
  43: "त्रिचालीस",
  44: "चवालीस",
  45: "पैँतालीस",
  46: "छयालीस",
  47: "सत्चालीस",
  48: "अठ्चालीस",
  49: "उनन्चास",
  50: "पचास",
  51: "एकाउन्न",
  52: "बाउन्न",
  53: "त्रिपन्न",
  54: "चौवन्न",
  55: "पचपन्न",
  56: "छपन्न",
  57: "सन्ताउन्न",
  58: "अन्ठाउन्न",
  59: "उनन्साठी",
  60: "साठी",
  61: "एकसट्ठी",
  62: "बासट्ठी",
  63: "त्रिसट्ठी",
  64: "चौसट्ठी",
  65: "पैँसट्ठी",
  66: "छयसट्ठी",
  67: "सतसट्ठी",
  68: "अठसट्ठी",
  69: "उनन्सत्तरी",
  70: "सत्तरी",
  71: "एकहत्तर",
  72: "बहत्तर",
  73: "त्रिहत्तर",
  74: "चौहत्तर",
  75: "पचहत्तर",
  76: "छयहत्तर",
  77: "सतहत्तर",
  78: "अठहत्तर",
  79: "उनासी",
  80: "असी",
  81: "एकासी",
  82: "बयासी",
  83: "त्रियासी",
  84: "चौरासी",
  85: "पचासी",
  86: "छयासी",
  87: "सतासी",
  88: "अठासी",
  89: "उनान्नब्बे",
  90: "नब्बे",
  91: "एकान्नब्बे",
  92: "बयान्नब्बे",
  93: "त्रियान्नब्बे",
  94: "चौरान्नब्बे",
  95: "पन्चान्नब्बे",
  96: "छयान्नब्बे",
  97: "सन्तान्नब्बे",
  98: "अन्ठान्नब्बे",
  99: "उनान्सय",
};

const NEPALI_NUMBER_SCALES = [
  { value: 100_000_000_000, label: "खर्ब" },
  { value: 1_000_000_000, label: "अर्ब" },
  { value: 10_000_000, label: "करोड" },
  { value: 100_000, label: "लाख" },
  { value: 1_000, label: "हजार" },
  { value: 100, label: "सय" },
] as const;

function cleanText(value?: string | null, fallback = "") {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function normalizeAmount(value?: number | string | null) {
  if (typeof value === "string") {
    return Number(value.replace(/,/g, ""));
  }

  return Number(value);
}

function toNepaliNumberWords(value: number): string {
  const wholeNumber = Math.trunc(Math.abs(value));

  if (wholeNumber < 100) {
    return NEPALI_NUMBER_WORDS[wholeNumber] ?? toNepaliDigits(wholeNumber);
  }

  let remaining = wholeNumber;
  const parts: string[] = [];

  for (const scale of NEPALI_NUMBER_SCALES) {
    const count = Math.floor(remaining / scale.value);
    if (count === 0) continue;

    parts.push(`${toNepaliNumberWords(count)} ${scale.label}`);
    remaining %= scale.value;
  }

  if (remaining > 0) {
    parts.push(toNepaliNumberWords(remaining));
  }

  return parts.join(" ");
}

function formatNepaliCurrencyWords(value?: number | string | null) {
  const amount = normalizeAmount(value);
  if (!Number.isFinite(amount)) return "रकम उल्लेख नभएको";

  const totalPaisa = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(totalPaisa / 100);
  const paisa = totalPaisa % 100;
  const rupeeWords = `रुपैयाँ ${toNepaliNumberWords(rupees)}`;
  const paisaWords = paisa > 0 ? ` पैसा ${toNepaliNumberWords(paisa)}` : "";

  return `${rupeeWords}${paisaWords} मात्र`;
}

function buildCompanyAgreementBody(input: {
  agreementDate: string;
  agreementAmount: string;
  agreementAmountWords: string;
  companyAddress: string;
  implementorName: string;
  projectName: string;
}) {
  const companyDescription = input.companyAddress
    ? `श्री ${input.implementorName}, ${input.companyAddress}`
    : `श्री ${input.implementorName}`;

  return [
    `विक्रम संवत् ${input.agreementDate} गतेका दिन श्री ${EMPLOYER_NAME} (जसलाई प्रथम पक्ष भनेर सम्बोधन गरिनेछ) एक पक्ष र ${companyDescription} (जसलाई दोश्रो पक्ष भनेर सम्बोधन गरिनेछ) बीच "${input.projectName}" कार्य सम्पन्न गर्न तथा कुनै कार्यमा त्रुटि देखिएमा सो कार्य समेत ${input.agreementAmount} (अक्षरूपी ${input.agreementAmountWords}) भ्याट र पि. एस. समेतमा सम्पन्न गर्न/गराउन लहान नगरपालिका नगर कार्यपालिकाको कार्यालय, लहानमा दुवै पक्षीय हस्ताक्षर गरी यो ठेक्का सम्झौता गरिएको छ ।`,
    "यसपछि सो ठेक्कामा निम्नलिखित अनुसार हुनेछः",
    "१) यस ठेक्कामा शब्द र अभिव्यक्तिको अर्थ यसपछि संकेत गरिएको ठेक्काका शर्तहरूमा निर्धारित गरे अनुसार हुनेछ ।",
    "२) प्रथम पक्षसँग गरेको सम्झौता बमोजिम दोश्रो पक्षले भुक्तानी पाउन खरिद सम्झौतामा भएको व्यवस्था बमोजिम निर्माण कार्य सम्पन्न गरी तथा कुनै त्रुटि भएमा सो कार्य समेत गरी प्रथम पक्षसँग भुक्तानी लिने कुरामा सहमत छ ।",
    "३) दोश्रो पक्षसँग गरेको सम्झौता बमोजिम प्रथम पक्षले खरिद सम्झौतामा भएको व्यवस्था बमोजिम निर्माण कार्य सम्पन्न गरी तथा कुनै त्रुटि भएमा सो कार्य समेत गरेपछि दोश्रो पक्षलाई सम्झौता बमोजिम रकम तथा त्यस्तो सम्झौतामा व्यवस्था भएको अन्य कुनै थप रकम समेत सम्झौतामा उल्लेख भएको तरिका र समयमा प्रथम पक्षले भुक्तानी दिने कुरामा सहमत छ ।",
  ];
}

type SignatureInfoRow = {
  label: string;
  value?: string | null;
};

function SignatureInfo({ label, value }: SignatureInfoRow) {
  const resolvedValue = cleanText(value, EMPTY_SIGNATURE_VALUE);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <span className="font-medium text-stone-700">{label}:</span>
      <span className="min-h-7 border-b border-dotted border-stone-400 text-stone-900">
        {resolvedValue}
      </span>
    </div>
  );
}

function SignatureParty({
  rows,
  title,
}: {
  rows: SignatureInfoRow[];
  title: string;
}) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-stone-900">{title}</p>
      <SignatureInfo label="दस्तखत" />
      {rows.map((row) => (
        <SignatureInfo key={row.label} {...row} />
      ))}
    </div>
  );
}

function CompanyAgreementSignatureBlock({
  companyAddress,
  companyName,
  companyPhone,
  contractorSignatory,
  officeSignatory,
  witnessName,
}: {
  companyAddress?: string | null;
  companyName: string;
  companyPhone?: string | null;
  contractorSignatory?: string | null;
  officeSignatory?: string | null;
  witnessName?: string | null;
}) {
  return (
    <section className="official-document-signatures mt-10 space-y-7 pt-2 text-[13px] leading-7 text-stone-900">
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <SignatureParty
          title="दोश्रो पक्षको तर्फबाट सहीछाप गर्ने"
          rows={[
            { label: "सहीछाप गर्नेको नाम", value: contractorSignatory },
            { label: "फर्मसँगको सम्बन्ध" },
            { label: "फर्मको नाम", value: companyName },
            { label: "ठेगाना", value: companyAddress },
            { label: "फोन नं.", value: companyPhone ? toNepaliDigits(companyPhone) : null },
          ]}
        />
        <SignatureParty
          title="प्रथम पक्षको तर्फबाट सहीछाप गर्ने"
          rows={[
            { label: "सहीछाप गर्नेको नाम", value: officeSignatory },
            { label: "पद", value: "प्रमुख प्रशासकीय अधिकृत" },
            { label: "कार्यालयको नाम", value: MUNICIPAL_OFFICE_NAME },
            { label: "ठेगाना", value: "लहान, सिराहा" },
            { label: "फोन नं.", value: MUNICIPAL_PHONE },
          ]}
        />
      </div>

      <div className="grid gap-x-10 gap-y-6 pt-2 sm:grid-cols-2">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-px w-48 border-t border-dotted border-stone-500" />
          <p className="font-medium">(साक्षीको सहीछाप)</p>
          <SignatureInfo label="नाम" />
        </div>
        <div className="space-y-2 text-center">
          <div className="mx-auto h-px w-48 border-t border-dotted border-stone-500" />
          <p className="font-medium">(साक्षीको सहीछाप)</p>
          <SignatureInfo label="नाम" value={witnessName} />
        </div>
      </div>
    </section>
  );
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
  const { data: setup } = useSystemSetup();

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
  const isCompanyAgreement = variant === "COMPANY";
  const counterpartyLabel = isCompanyAgreement ? "निर्माण व्यवसायी" : "उपभोक्ता समिति";
  const implementorName =
    company?.name?.trim() ||
    committee?.name?.trim() ||
    contract.company?.name?.trim() ||
    contract.userCommittee?.name?.trim() ||
    `सम्बन्धित ${counterpartyLabel}`;
  const implementorAddress = isCompanyAgreement
    ? cleanText(company?.address)
    : cleanText(committee?.address);
  const projectName =
    project?.name?.trim() || contract.project?.name?.trim() || "स्वीकृत कार्य";
  const agreementDate = formatNepaliDate(
    contract.agreement?.agreementDate ?? contract.startDate,
    "सम्झौता मिति"
  );
  const agreementAmountValue = contract.agreement?.amount ?? contract.contractAmount;
  const contractPrice = formatNepaliCurrency(agreementAmountValue);
  const body = isCompanyAgreement
    ? buildCompanyAgreementBody({
        agreementAmount: contractPrice,
        agreementAmountWords: formatNepaliCurrencyWords(agreementAmountValue),
        agreementDate,
        companyAddress: implementorAddress,
        implementorName,
        projectName,
      })
    : buildAgreementNepaliParagraphs({
        contract,
        fiscalYear: project?.fiscalYear ?? contract.fiscalYear,
        implementorAddress,
        projectName,
      });
  const customNote = getCustomAgreementNote(contract);
  const officeSignatory =
    contract.agreement?.officeSignatory?.trim() ||
    setup?.chiefAdministrativeOfficerName?.trim();
  const configuredWitnessName =
    contract.agreement?.witnessName?.trim() || setup?.sectionChiefName?.trim();
  const companyWitnessName =
    configuredWitnessName || DEFAULT_COMPANY_WITNESS_NAMES;
  const agreementSignatures = isCompanyAgreement
    ? []
    : [
        {
          label: "नियोक्ताको तर्फबाट",
          name: officeSignatory,
          note: EMPLOYER_NAME,
        },
        {
          label: "उपभोक्ता समितिको तर्फबाट",
          name: contract.agreement?.contractorSignatory,
          note: implementorName,
        },
        {
          label: "साक्षी",
          name: configuredWitnessName,
          note: "सम्झौताको साक्षी",
        },
      ];
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
    ...(project?.fiscalYear || contract.fiscalYear
      ? [
          {
            label: "आ.व.",
            value: formatNepaliFiscalYear(project?.fiscalYear ?? contract.fiscalYear),
          },
        ]
      : []),
  ];

  return (
    <NepaliOfficialDocument
      autoPrint={autoPrint}
      backHref={`/dashboard/contracts/${contract.id}`}
      body={body}
      density="compact"
      letterhead={false}
      documentLabel={isCompanyAgreement ? "कम्पनी/ठेकेदार ढाँचा" : "उपभोक्ता समिति ढाँचा"}
      footerNote="यो सम्झौता पत्र प्रणालीमा अभिलेखित सम्झौता, परियोजना, रकम र हस्ताक्षर विवरणका आधारमा तयार गरिएको हो ।"
      meta={meta}
      noteContent={customNote}
      noteTitle="रेकर्ड गरिएको थप सर्त"
      paragraphIndent={false}
      postBodyContent={
        isCompanyAgreement ? (
          <CompanyAgreementSignatureBlock
            companyAddress={implementorAddress}
            companyName={implementorName}
            companyPhone={company?.phoneNumber}
            contractorSignatory={contract.agreement?.contractorSignatory}
            officeSignatory={officeSignatory}
            witnessName={companyWitnessName}
          />
        ) : undefined
      }
      signatures={agreementSignatures}
      subject=""
      subjectPrefix=""
      subtitle={EMPLOYER_NAME}
      title={isCompanyAgreement ? "सम्झौता फारम" : "सम्झौता पत्र"}
    />
  );
}
