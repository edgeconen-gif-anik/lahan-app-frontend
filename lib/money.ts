const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

/** Largest value the amount-in-words helper handles (1 lakh crore). */
export const MAX_AMOUNT_IN_WORDS = 999_999_999_999;

function belowHundred(value: number) {
  if (value < 20) return ONES[value];
  const ones = value % 10;
  return TENS[Math.floor(value / 10)] + (ones ? `-${ONES[ones]}` : "");
}

function belowThousand(value: number) {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];

  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(belowHundred(rest));

  return parts.join(" ");
}

function rupeesInWords(rupees: number) {
  // Indian grouping: crore (10^7), lakh (10^5), thousand, then the rest.
  const crore = Math.floor(rupees / 10_000_000);
  const lakh = Math.floor((rupees % 10_000_000) / 100_000);
  const thousand = Math.floor((rupees % 100_000) / 1000);
  const rest = rupees % 1000;
  const parts: string[] = [];

  if (crore) parts.push(`${belowThousandCount(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));

  return parts.join(" ");
}

// A crore count can exceed 99 (e.g. 120 crore), so it needs hundreds too.
function belowThousandCount(value: number) {
  return value < 1000 ? belowThousand(value) : String(value);
}

/**
 * "Twelve Lakh Fifty Thousand Rupees Only" for 1250000.
 * Returns "" for zero, negative or out-of-range values.
 */
export function numberToWordsIndian(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT_IN_WORDS) {
    return "";
  }

  let rupees = Math.floor(value);
  let paisa = Math.round((value - rupees) * 100);
  if (paisa === 100) {
    rupees += 1;
    paisa = 0;
  }

  const rupeeText = rupees > 0 ? `${rupeesInWords(rupees)} Rupees` : "";
  const paisaText = paisa > 0 ? `${belowHundred(paisa)} Paisa` : "";

  return `${[rupeeText, paisaText].filter(Boolean).join(" and ")} Only`;
}

/** Groups digits the Nepali/Indian way: 1250000 -> "12,50,000". */
export function groupIndianDigits(integerDigits: string) {
  if (integerDigits.length <= 3) return integerDigits;

  const lastThree = integerDigits.slice(-3);
  const leading = integerDigits.slice(0, -3);

  return `${leading.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`;
}

/** Formats a number for display in an input, keeping up to two decimals. */
export function formatIndianNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) return "";

  const [integerPart, decimalPart] = value.toFixed(2).split(".");
  const decimals = decimalPart.replace(/0+$/, "");

  return `${groupIndianDigits(integerPart)}${decimals ? `.${decimals}` : ""}`;
}
