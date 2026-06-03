"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";
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
const BLANK_LINE = "........................";

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

function getCommitteeOfficial(
  committee:
    | {
        officials?: Array<{
          name: string;
          phoneNumber?: string;
          citizenshipNumber?: string;
          role: "PRESIDENT" | "MEMBER" | "SECRETARY" | "TREASURER";
        }>;
      }
    | null
    | undefined,
  role: "PRESIDENT" | "MEMBER" | "SECRETARY" | "TREASURER"
) {
  return committee?.officials?.find((official) => official.role === role);
}

function committeeShareAmount(value?: number | string | null, percent = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount * percent : 0;
}

function FormLine({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const resolvedValue =
    value == null || value === "" ? BLANK_LINE : String(value);

  return (
    <p>
      <span className="font-medium">{label}</span>
      <span className="ml-1">{resolvedValue}</span>
    </p>
  );
}

function SmallGridTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-stone-300 text-[12px] leading-6">
      <div
        className="grid bg-stone-100 font-semibold"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column} className="border-r border-stone-300 px-2 py-1 last:border-r-0">
            {column}
          </div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid border-t border-stone-300"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, cellIndex) => (
            <div key={`${rowIndex}-${cellIndex}`} className="border-r border-stone-300 px-2 py-1 last:border-r-0">
              {cell || BLANK_LINE}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CommitteeSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-[15px] font-semibold text-stone-950">{title}</h2>
      <div className="space-y-1.5 pl-4 text-[13px] leading-7 text-stone-900">
        {children}
      </div>
    </section>
  );
}

function CommitteeAgreementBody({
  agreementDate,
  caoName,
  committee,
  contractAmount,
  endDate,
  projectLocation,
  projectName,
  startDate,
}: {
  agreementDate: string;
  caoName?: string | null;
  committee?: {
    name?: string | null;
    address?: string | null;
    formedDate?: string | null;
    officials?: Array<{
      name: string;
      phoneNumber?: string;
      citizenshipNumber?: string;
      role: "PRESIDENT" | "MEMBER" | "SECRETARY" | "TREASURER";
    }>;
  } | null;
  contractAmount: number | string | null | undefined;
  endDate: string;
  projectLocation?: string | null;
  projectName: string;
  startDate: string;
}) {
  const president = getCommitteeOfficial(committee, "PRESIDENT");
  const secretary = getCommitteeOfficial(committee, "SECRETARY");
  const treasurer = getCommitteeOfficial(committee, "TREASURER");
  const members = committee?.officials?.filter((official) => official.role === "MEMBER") ?? [];
  const officeShare = committeeShareAmount(contractAmount, 0.95);
  const committeeShare = committeeShareAmount(contractAmount, 0.05);

  const officialRows = [
    ["१. अध्यक्ष", president?.name ?? "", president?.citizenshipNumber ?? "", committee?.address ?? ""],
    ["२. उपाध्यक्ष", "", "", ""],
    ["३. कोषाध्यक्ष", treasurer?.name ?? "", treasurer?.citizenshipNumber ?? "", committee?.address ?? ""],
    ["४. सचिव", secretary?.name ?? "", secretary?.citizenshipNumber ?? "", committee?.address ?? ""],
    ["५. सदस्य", members[0]?.name ?? "", members[0]?.citizenshipNumber ?? "", committee?.address ?? ""],
    ["६. सदस्य", members[1]?.name ?? "", members[1]?.citizenshipNumber ?? "", committee?.address ?? ""],
    ["७. सदस्य", members[2]?.name ?? "", members[2]?.citizenshipNumber ?? "", committee?.address ?? ""],
  ];

  const conditionLines = [
    `१. आयोजना मिति ${startDate} देखि शुरु गरी मिति ${endDate} सम्ममा पुरा गर्नु पर्नेछ ।`,
    "२. प्राप्त रकम तथा निर्माण सामाग्री सम्वन्धित आयोजनाको उद्धेश्यका लागि मात्र प्रयोग गर्नुपर्नेछ ।",
    "३. नगदी, जिन्सी सामानको प्राप्ती, खर्च र बाँकी तथा आयोजनाको प्रगति विवरण राख्नु पर्नेछ ।",
    "४. आम्दानी खर्चको विवरण र कार्यप्रगतिको जानकारी उपभोक्ता समूहमा छलफल गरी अर्को किस्ता माग गर्नु पर्नेछ ।",
    "५. आयोजनाको कुल लागत भन्दा घटी लागतमा आयोजना सम्पन्न भएको अवस्थामा सो मुताविकनै अनुदान र श्रमदानको प्रतिशत निर्धारण गरी भुक्तानी लिनु पर्नेछ ।",
    "६. उपभोक्ता समितिले प्राविधिकको राय, परामर्श एवं निर्देशन अनुरुप काम गर्नु पर्नेछ ।",
    "७. उपभोक्ता समितिले आयोजनासंग सम्वन्धित विल, भरपाईहरु, डोर हाजिरी फारामहरु, जिन्सी नगदी खाताहरु, समिति/समुहको निर्णय पुस्तिका आदि कागजातहरु कार्यालयले मागेको बखत उपलब्ध गराउनु पर्नेछ र त्यसको लेखापरीक्षण पनि गराउनु पर्नेछ ।",
    "८. कुनै सामाग्री खरिद गर्दा आन्तरिक राजस्व कार्यालयबाट स्थायी लेखा नम्बर र मुल्य अभिबृद्धि कर दर्ता प्रमाण पत्र प्राप्त व्यक्ति वा फर्म संस्था वा कम्पनीबाट खरिद गरी सोही अनुसारको विल भरपाई आधिकारीक व्यक्तिबाट प्रमाणित गरी पेश गर्नु पर्नेछ ।",
    "९. मूल्य अभिबृद्धि कर (VAT) लाग्ने बस्तु तथा सेवा खरिद गर्दा रु २०,०००।– भन्दा बढी मूल्यको सामाग्रीमा अनिवार्य रुपमा मूल्य अभिबृद्धि कर दर्ता प्रमाणपत्र प्राप्त गरेका व्यक्ति फर्म संस्था वा कम्पनीबाट खरिद गर्नु पर्नेछ । साथै उक्त विलमा उल्लिखित मु.अ.कर बाहेकको रकममा १.५% अग्रीम आयकर बापत करकट्टि गरी बाँकी रकम मात्र सम्वन्धित सेवा प्रदायकलाई भुक्तानी हुनेछ । रु २०,०००।– भन्दा कम मूल्यको सामाग्री खरिदमा पान नम्बर लिएको व्यक्ति वा फर्मबाट खरिद गर्नु पर्नेछ । अन्यथा खरिद गर्ने पदाधिकारी स्वयम् जिम्मेवार हुनेछ ।",
    "१०. डोजर रोलर लगायतका मेशिनरी सामान भाडामा लिएको एवम् घर बहालमा लिई विल भरपाई पेश भएको अवस्थामा १०% प्रतिशत घर भाडा कर एबम् बहाल कर तिर्नु पर्नेछ ।",
    "११. प्रशिक्षकले पाउने पारिश्रमिक एवम् सहभागीले पाउने भत्तामा प्रचलित नियमानुसार कर लाग्नेछ ।",
    "१२. निर्माण कार्यको हकमा शुरु लागत अनुमानका कुनै आईटमहरुमा परिवर्तन हुने भएमा अधिकार प्राप्त व्यक्ति/कार्यालयबाट लागत अनुमान संसोधन गरे पश्चात मात्र कार्य गराउनु पर्नेछ । यसरी लागत अनुमान संशोधन नगरी कार्य गरेमा उपभोक्ता समिति/समुहनै जिम्मेवार हुनेछ ।",
    "१३. उपभोक्ता समितिले काम सम्पन्न गरिसकेपछि बाँकी रहन गएका खप्ने सामानहरु मर्मत संभार समिति गठन भएको भए सो समितिलाई र सो नभए सम्वन्धित कार्यालयलाई बुझाउनु पर्नेछ ।",
    "१४. सम्झौता बमोजिम आयोजना सम्पन्न भएपछि अन्तिम भुक्तानीको लागि कार्यसम्पन्न प्रतिवेदन, नापी किताव, प्रमाणित विल भरपाई, योजनाको फोटो, आय व्यय अनुमोदन सहितको निर्णय, सार्वजनिक लेखा परीक्षणको निर्णयको प्रतिलिपी तथा वडा कार्यालयको सिफारिस सहित निवेदन पेश गर्नु पर्नेछ ।",
    "१५. आयोजना सम्पन्न भएपछि कार्यालयबाट जाँचपास गरी फरफारकको प्रमाणपत्र लिनु पर्नेछ । साथै आयोजनाको आवश्यक मर्मत संभारको व्यवस्था सम्वन्धित उपभोक्ताहरुले नै गर्नु पर्नेछ ।",
    "१६. आयोजना कार्यान्वयन गर्ने समुह वा उपभोक्ता समितिले आयोजनाको भौतिक तथा वित्तीय प्रगती प्रतिवेदन सम्झौतामा तोकिए बमोजिम कार्यालयमा पेश गर्नु पर्नेछ ।",
    "१७. आयोजनाको दीगो सञ्चालन तथा मर्मत संभारको व्यवस्था गर्नु पर्नेछ ।",
    "१८. आयोजनाको सवै काम उपभोक्ता समिति/समुहको निर्णय अनुसार गर्नु गराउनु पर्नेछ ।",
  ];

  const officeConditionLines = [
    "१. आयोजनाको वजेट, उपभोक्ता समितिको काम, कर्तव्य तथा अधिकार, खरिद, लेखाङ्कन, प्रतिवेदन आदि विषयमा उपभोक्ता समितिका पदाधिकारीहरुलाई अनुशिक्षण कार्यक्रम सञ्चालन गरिनेछ ।",
    "२. आयोजनामा आवश्यक प्राविधिक सहयोग कार्यालयबाट उपलब्ध गराउन सकिने अवस्थामा गराईनेछ र नसकिने अवस्था भएमा उपभोक्ता समितिले बाह्य बजारबाट सेवा परामर्श अन्तर्गत सेवा लिन सक्नेछ ।",
    "३. आयोजनाको प्राविधिक सुपरिवेक्षणका लागि कार्यालयको तर्फबाट प्राविधिक खटाईनेछ । उपभोक्ता समितिबाट भएको कामको नियमित सुपरिवेक्षण गर्ने जिम्मेवारी निज प्राविधिकको हुनेछ ।",
    "४. पेश्की लिएर लामो समयसम्म आयोजना संचालन नगर्ने उपभोक्ता समितिलाई कार्यालयले नियम अनुसार कारवाही गर्नेछ ।",
    "५. श्रममुलक प्रविधिबाट कार्य गराउने गरी लागत अनुमान स्वीकृत गराई सोही बमोजिम सम्झौता गरी मेशिनरी उपकरणको प्रयोगबाट कार्य गरेको पाईएमा सम्झौता रद्ध गरी बढी भएको रकम सरकारी बाँकी सरह असुल उपर गरिनेछ ।",
    "६. आयोजना सम्पन्न भएपछि कार्यालयबाट जाँच पास गरी फरफारक गर्नु पर्नेछ ।",
    "७. आवश्यक कागजात संलग्न गरी भुक्तानी उपलब्ध गराउन अनुरोध भई आएपछि उपभोक्ता समितिको बैंक खातामा भुक्तानी दिनु पर्नेछ ।",
    "८. यसमा उल्लेख नभएका कुराहरु प्रचलित कानून बमोजिम हुनेछ ।",
  ];

  return (
    <div className="committee-agreement-print mt-4 space-y-5 text-[13px] leading-7 text-stone-900">
      <CommitteeSection title="१. सम्झौता गर्ने पक्ष र आयोजनाः">
        <p className="font-semibold">क) उपभोक्ता समितिको विवरणः</p>
        <FormLine label="१. नामः" value={committee?.name} />
        <FormLine label="२. ठेगानाः" value={committee?.address} />
        <p className="font-semibold pt-1">ख) आयोजनाको विवरणः</p>
        <FormLine label="१. नामः" value={projectName} />
        <FormLine label="२. आयोजना स्थलः" value={projectLocation} />
        <FormLine label="३. उद्देश्यः" />
        <FormLine label="४. आयोजना सुरु हुने मितिः" value={startDate} />
      </CommitteeSection>

      <CommitteeSection title="२. आयोजनाको लागत सम्बन्धी विवरणः">
        <FormLine label="क) लागत अनुमान रु" value={formatNepaliCurrency(contractAmount)} />
        <p className="font-semibold">ख) लागत व्यहोर्ने स्रोतहरुः</p>
        <FormLine label="१. कार्यालयः" value={formatNepaliCurrency(officeShare)} />
        <FormLine label="२. उपभोक्ता समितिः" value={formatNepaliCurrency(committeeShare)} />
        <FormLine label="३. अन्यः" />
        <p className="font-semibold pt-1">ग) बस्तुगत अनुदानको विवरण</p>
        <SmallGridTable
          columns={["स्रोत", "सामाग्रीको नाम", "एकाई"]}
          rows={[
            ["१. संघबाट", "", ""],
            ["२. प्रदेशबाट", "", ""],
            ["३. स्थानीय तहबाट", "", ""],
            ["४. गैह्रसरकारी संघसंस्थाबाट", "", ""],
            ["५. विदेशी दातृ संघ संस्थाबाट", "", ""],
            ["६. उपभोक्ता समितिबाट", "", ""],
            ["७. अन्य निकायबाट", "", ""],
          ]}
        />
        <p className="font-semibold pt-1">घ) आयोजनाबाट लाभान्वित हुनेः</p>
        <FormLine label="१. घरपरिवार संख्याः" />
        <FormLine label="२. जनसंख्याः" />
        <FormLine label="३. संगठित संस्थाः" />
        <FormLine label="४. अन्यः" />
      </CommitteeSection>

      <CommitteeSection title="३. उपभोक्ता समिति/समुदायमा आधारित संस्था/गैह्रसरकारी संस्थाको विवरणः">
        <FormLine label="क) गठन भएको मितिः" value={formatNepaliDate(committee?.formedDate)} />
        <p className="font-semibold">ख) पदाधिकारीको नाम र ठेगाना (नागरिकता प्रमाणपत्र नं. र जिल्ला)</p>
        <SmallGridTable
          columns={["पद", "नाम", "नागरिकता नं.", "ठेगाना"]}
          rows={officialRows}
        />
        <FormLine label="ग) गठन गर्दा उपस्थित लाभान्वितको संख्याः" />
      </CommitteeSection>

      <CommitteeSection title="४. आयोजना सञ्चालन सम्बन्धी अनुभवः">
        <p>{BLANK_LINE}</p>
      </CommitteeSection>

      <CommitteeSection title="५. उपभोक्ता समितिले प्राप्त गर्ने किस्ता विवरणः">
        <SmallGridTable
          columns={["किस्ताको क्रम", "मिति", "किस्ताको रकम", "निर्माण सामाग्री परिमाण", "कैफियत"]}
          rows={[
            ["पहिलो", "", "", "", ""],
            ["दोश्रो", "", "", "", ""],
            ["तेश्रो", "", "", "", ""],
            ["जम्मा", "", "", "", ""],
          ]}
        />
      </CommitteeSection>

      <CommitteeSection title="६. आयोजना मर्मत संभार सम्बन्धी व्यवस्था">
        <FormLine label="क) आयोजना मर्मत संभारको जिम्मा लिने समिति/संस्थाको नामः" />
        <p className="font-semibold">ख) मर्मत सम्भारको सम्भावित स्रोत (छ छैन खुलाउने)</p>
        <FormLine label="जनश्रमदानः" />
        <FormLine label="सेवा शुल्कः" />
        <FormLine label="दस्तुर, चन्दाबाटः" />
        <FormLine label="अन्य केही भएः" />
      </CommitteeSection>

      <section className="space-y-3 pt-2">
        <h2 className="text-center text-[16px] font-bold">सम्झौताका शर्तहरु</h2>
        <p className="font-semibold">उपभोक्ता समितिको जिम्मेवारी तथा पालना गरिने शर्तहरुः</p>
        <div className="space-y-1.5 text-justify">
          {conditionLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <p className="font-semibold">कार्यालयको जिम्मेवारी तथा पालना गरिने शर्तहरुः</p>
        <div className="space-y-1.5 text-justify">
          {officeConditionLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <p className="pt-2 text-justify">
        माथि उल्लेख भए बमोजिमका शर्तहरु पालना गर्न हामी निम्न पक्षहरु मन्जुर गर्दछौं ।
      </p>

      <section className="grid gap-8 pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="font-semibold">उपभोक्ता समिति समुहको तर्फबाट</p>
          <FormLine label="दस्तखत" />
          <FormLine label="नाम थर:" value={president?.name} />
          <FormLine label="पद:" value="अध्यक्ष" />
          <FormLine label="ठेगाना:" value={committee?.address} />
          <FormLine label="सम्पर्क नं:" value={president?.phoneNumber ? toNepaliDigits(president.phoneNumber) : ""} />
          <FormLine label="मिति:" value={agreementDate} />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">कार्यालयको तर्फबाट</p>
          <FormLine label="दस्तखत" />
          <FormLine label="नाम थर:" value={caoName} />
          <FormLine label="पद:" value="प्रमुख प्रशासकीय अधिकृत" />
          <FormLine label="मिति:" value={agreementDate} />
        </div>
      </section>

      <style jsx global>{`
        @media print {
          .official-document-sheet:has(.committee-agreement-print) {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          .official-document-sheet:has(.committee-agreement-print)
            .official-document-content {
            display: block !important;
            height: auto !important;
            min-height: auto !important;
            padding: 10mm 12mm 12mm !important;
            overflow: visible !important;
          }

          .official-document-sheet:has(.committee-agreement-print)
            .official-document-content
            > div {
            width: 100% !important;
          }

          .committee-agreement-print {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .committee-agreement-print section {
            break-inside: auto;
            page-break-inside: auto;
          }

          .committee-agreement-print h2,
          .committee-agreement-print .rounded-md {
            break-after: avoid;
            page-break-after: avoid;
          }

          .committee-agreement-print .grid {
            break-inside: auto;
            page-break-inside: auto;
          }

          .committee-agreement-print p {
            orphans: 2;
            widows: 2;
          }

          .committee-agreement-print > section {
            margin-top: 4mm;
          }
        }
      `}</style>
    </div>
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

function AgreementLoadingFallback() {
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

function AgreementContent() {
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

  if (!isCompanyAgreement) {
    const projectLocation =
      (project as { location?: string | null } | undefined)?.location ??
      contract.project?.sNo ??
      "";

    return (
      <NepaliOfficialDocument
        autoPrint={autoPrint}
        backHref={`/dashboard/contracts/${contract.id}`}
        body={[]}
        density="compact"
        footerNote="यो योजना सम्झौता फाराम प्रणालीमा अभिलेखित उपभोक्ता समिति, आयोजना, सम्झौता रकम, मिति र पदाधिकारी विवरणका आधारमा तयार गरिएको हो ।"
        letterhead={false}
        metaCardPlacement="left"
        meta={[
          {
            label: "सम्झौता नं.",
            value: toNepaliDigits(contract.contractNumber) || "—",
          },
          {
            label: "आ.व.",
            value: formatNepaliFiscalYear(project?.fiscalYear ?? contract.fiscalYear),
          },
          {
            label: "सम्झौता रकम",
            value: contractPrice,
          },
        ]}
        paragraphIndent={false}
        postBodyContent={
          <CommitteeAgreementBody
            agreementDate={agreementDate}
            caoName={setup?.chiefAdministrativeOfficerName}
            committee={committee}
            contractAmount={agreementAmountValue}
            endDate={formatNepaliDate(contract.intendedCompletionDate)}
            projectLocation={projectLocation}
            projectName={projectName}
            startDate={formatNepaliDate(contract.startDate)}
          />
        }
        printBottomReserveMm={14}
        printTopShiftMm={0}
        preMetaContent={
          <div className="committee-agreement-heading text-center leading-7">
            <p className="font-semibold">अनुसूची २</p>
            <p>(कार्यविधिको दफा ७(२) सँग सम्वन्धित)</p>
            <p className="font-semibold">लहान नगरपालिका</p>
            <p className="text-[17px] font-bold">योजना सम्झौता फाराम</p>
          </div>
        }
        signatures={[]}
        subject=""
        subjectPrefix=""
        subtitle=""
        title=""
      />
    );
  }

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
      contentWidth={isCompanyAgreement ? "narrow" : "full"}
      density="compact"
      letterhead={false}
      documentLabel={isCompanyAgreement ? "कम्पनी/ठेकेदार ढाँचा" : "उपभोक्ता समिति ढाँचा"}
      footerNote="यो सम्झौता पत्र प्रणालीमा अभिलेखित सम्झौता, परियोजना, रकम र हस्ताक्षर विवरणका आधारमा तयार गरिएको हो ।"
      metaCardPlacement="left"
      metaCardSize="small"
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
      printLayout="screen"
      signatures={agreementSignatures}
      subject=""
      subjectPrefix=""
      subtitle={EMPLOYER_NAME}
      title={isCompanyAgreement ? "सम्झौता फारम" : "सम्झौता पत्र"}
    />
  );
}

export default function AgreementPage() {
  return (
    <Suspense fallback={<AgreementLoadingFallback />}>
      <AgreementContent />
    </Suspense>
  );
}
