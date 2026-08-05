const FISCAL_YEAR_PATTERN = /^(\d{4})\s*[/-]\s*(\d{2,3})$/;

export const ALL_FISCAL_YEARS = "all";

export function normalizeFiscalYear(value?: string | null) {
  const match = value?.trim().match(FISCAL_YEAR_PATTERN);
  if (!match) return null;

  const [, startYear, endYear] = match;
  return `${startYear}/${endYear.slice(-3).padStart(3, "0")}`;
}

export function formatFiscalYearForDisplay(value?: string | null) {
  const normalized = normalizeFiscalYear(value);
  if (!normalized) return value?.trim() ?? "";

  const [startYear, endYear] = normalized.split("/");
  return `${startYear}/${endYear.slice(-2)}`;
}

export function getFiscalYearCode(value?: string | null) {
  const normalized = normalizeFiscalYear(value);
  if (!normalized) return "";

  const [startYear, endYear] = normalized.split("/");
  return `${startYear.slice(-2)}${endYear.slice(-2)}`;
}

export function mergeFiscalYears(
  years: string[] | undefined,
  ...additionalYears: Array<string | null | undefined>
) {
  const normalizedYears = [...(years ?? []), ...additionalYears]
    .map(normalizeFiscalYear)
    .filter((year): year is string => Boolean(year));

  return Array.from(new Set(normalizedYears)).sort((left, right) => {
    const leftStart = Number(left.slice(0, 4));
    const rightStart = Number(right.slice(0, 4));
    return rightStart - leftStart || right.localeCompare(left);
  });
}
