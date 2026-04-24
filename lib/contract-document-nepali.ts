import type { Contract } from "@/lib/schema/contract/contract";
import { toNepaliDate } from "@/lib/date-utils";
import {
  buildAgreementDraftFromContract,
  buildWorkOrderDraftFromContract,
  getContractDocumentVariant,
  getContractImplementorName,
  hasCustomDocumentText,
} from "@/lib/contract-documents";

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toNepaliDigits(value?: string | number | null) {
  if (value == null || value === "") return "";
  return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)] ?? digit);
}

export function formatNepaliDate(
  value?: string | Date | null,
  fallback = "—"
) {
  const formatted = toNepaliDate(value);
  if (!formatted || formatted === "N/A" || formatted === "Invalid Date") {
    return fallback;
  }

  return toNepaliDigits(formatted);
}

export function formatNepaliCurrency(
  value?: string | number | null,
  fallback = "रु. ०"
) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return `रु. ${toNepaliDigits(amount.toLocaleString("en-IN"))}`;
}

export function formatNepaliFiscalYear(value?: string | null) {
  return value ? toNepaliDigits(value) : "—";
}

export function getImplementorRoleLabel(contract: Contract) {
  return getContractDocumentVariant(contract) === "USER_COMMITTEE"
    ? "उपभोक्ता समिति"
    : "निर्माण व्यवसायी";
}

export function getSignatoryRoleLabel(contract: Contract) {
  return getContractDocumentVariant(contract) === "USER_COMMITTEE"
    ? "समितिको प्रतिनिधि"
    : "निर्माण व्यवसायीको प्रतिनिधि";
}

type DocumentContext = {
  contract: Contract;
  fiscalYear?: string | null;
  implementorAddress?: string | null;
  projectName?: string | null;
};

function cleanText(value?: string | null, fallback = "—") {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function buildSharedContext(input: DocumentContext) {
  const { contract, fiscalYear, implementorAddress, projectName } = input;

  return {
    agreementAmount: formatNepaliCurrency(
      contract.agreement?.amount ?? contract.contractAmount
    ),
    agreementDate: formatNepaliDate(
      contract.agreement?.agreementDate ?? contract.startDate,
      "सम्झौता मिति"
    ),
    completionDate: formatNepaliDate(
      contract.workOrder?.workCompletionDate ?? contract.intendedCompletionDate,
      "समाप्ति मिति"
    ),
    contractAmount: formatNepaliCurrency(contract.contractAmount),
    contractNumber: toNepaliDigits(contract.contractNumber),
    fiscalYear: formatNepaliFiscalYear(fiscalYear),
    implementorAddress: cleanText(implementorAddress),
    implementorName: cleanText(getContractImplementorName(contract), "सम्बन्धित कार्यान्वयन पक्ष"),
    issuedDate: formatNepaliDate(
      contract.workOrder?.issuedDate ?? contract.workOrder?.createdAt ?? contract.updatedAt
    ),
    projectName: cleanText(projectName ?? contract.project?.name, "स्वीकृत योजना"),
    startDate: formatNepaliDate(contract.startDate, "सुरु मिति"),
    variant: getContractDocumentVariant(contract),
  };
}

export function buildWorkOrderNepaliParagraphs(input: DocumentContext) {
  const context = buildSharedContext(input);
  const fiscalYearText =
    context.fiscalYear !== "—"
      ? `चालु आ.व. ${context.fiscalYear} को लागि`
      : "चालु आर्थिक वर्षको लागि";

  return [
    `${fiscalYearText} यस नगरपालिकाबाट स्वीकृत योजना/कार्यक्रम अन्तर्गत "${context.projectName}" सम्बन्धी कार्यका लागि सम्झौता नं. ${context.contractNumber} बमोजिम ${context.agreementDate} गते सम्झौता भएकोले तपाईंले कबुल गर्नु भएको रकम ${context.contractAmount} बराबरको उक्त कार्य ${context.startDate} देखि सुरु गरी ${context.completionDate} भित्र सम्झौतामा तोकिएका शर्तहरूको अधीनमा रही कार्यालयको सुपरिवेक्षणमा, स्पेसिफिकेसन तथा स्वीकृत लागत अनुमान अनुसार सम्पन्न गर्न/गराउन हुन यो कार्य आदेश दिइएको छ ।`,
  ];
}

export function buildAgreementNepaliParagraphs(input: DocumentContext) {
  const context = buildSharedContext(input);

  if (context.variant === "USER_COMMITTEE") {
    return [
      `यस नगरपालिका र ${context.implementorName} बीच "${context.projectName}" कार्य कार्यान्वयनका लागि सम्झौता नं. ${context.contractNumber} अनुसार ${context.agreementDate} गते यो सम्झौता कायम गरिएको छ ।`,
      `${context.implementorName} ले स्थानीय सहभागिता, अभिलेख व्यवस्थापन तथा पारदर्शी खर्च प्रणाली कायम राख्दै ${context.agreementAmount} बराबरको स्वीकृत कार्य ${context.startDate} देखि ${context.completionDate} भित्र प्राविधिक स्टिमेट, डिजाइन तथा स्वीकृत सर्त बमोजिम सम्पन्न गर्नेछ ।`,
      `नगरपालिकाले कार्य प्रगति, नापजाँच, गुणस्तर परीक्षण, आवश्यक कागजात तथा प्रचलित कानुनी व्यवस्था अनुसार भुक्तानी, अनुगमन र अन्तिम फरफारक प्रक्रिया अगाडि बढाउनेछ ।`,
      `दुवै पक्षले समयसीमा, गुणस्तर, उत्तरदायित्व तथा अभिलेखसम्बन्धी सर्त पालना गर्ने र आवश्यक समन्वय गरी कार्य सफलतापूर्वक सम्पन्न गर्ने सहमति जनाएका छन् ।`,
    ];
  }

  return [
    `यस नगरपालिका र ${context.implementorName} बीच "${context.projectName}" कार्य कार्यान्वयनका लागि सम्झौता नं. ${context.contractNumber} अनुसार ${context.agreementDate} गते यो सम्झौता कायम गरिएको छ ।`,
    `${context.implementorName} ले ${context.agreementAmount} बराबरको स्वीकृत कार्य ${context.startDate} देखि ${context.completionDate} भित्र प्राविधिक स्टिमेट, डिजाइन, स्पेसिफिकेसन, स्वीकृत लागत अनुमान तथा कार्यालयका निर्देशन बमोजिम सम्पन्न गर्नेछ ।`,
    `नगरपालिकाले नापजाँच, कार्य प्रगति, गुणस्तर प्रमाणीकरण, आवश्यक कागजात तथा प्रचलित नियमअनुसार भुक्तानी, अनुगमन र अन्तिम फरफारक प्रक्रिया अगाडि बढाउनेछ ।`,
    `दुवै पक्षले कार्यान्वयन अवधिभर गुणस्तर, समयसीमा, सुरक्षा, समन्वय र अभिलेख व्यवस्थापनसम्बन्धी सर्त पालना गर्ने तथा सम्झौतामा उल्लिखित दायित्व पूरा गर्ने सहमति जनाएका छन् ।`,
  ];
}

export function getCustomAgreementNote(contract: Contract) {
  if (!contract.agreement?.content) return null;

  const generated = buildAgreementDraftFromContract(contract);
  return hasCustomDocumentText(contract.agreement.content, generated)
    ? contract.agreement.content.trim()
    : null;
}

export function getCustomWorkOrderNote(contract: Contract) {
  if (!contract.workOrder?.content) return null;

  const generated = buildWorkOrderDraftFromContract(contract);
  return hasCustomDocumentText(contract.workOrder.content, generated)
    ? contract.workOrder.content.trim()
    : null;
}

export function buildRecipientLines(input: {
  address?: string | null;
  contract: Contract;
}) {
  const implementorName = getContractImplementorName(input.contract);
  const address = cleanText(input.address, "");

  return [
    `श्री ${implementorName},`,
    ...(address ? [address] : []),
  ];
}
