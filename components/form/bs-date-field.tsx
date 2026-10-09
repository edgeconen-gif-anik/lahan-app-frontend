"use client";

import { NepaliDatePicker } from "@/components/ui/nepali-date-picker";
import { toAdDate } from "@/lib/date-utils";

type BsDateFieldProps = {
  /** BS date such as "2082-01-15". */
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
};

function formatAd(bsValue: string) {
  const ad = toAdDate(bsValue.trim());
  if (!ad || Number.isNaN(ad.getTime())) return null;

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${ad.getFullYear()}-${pad(ad.getMonth() + 1)}-${pad(ad.getDate())}`;
}

/**
 * Bikram Sambat date picker that also shows the matching AD date underneath,
 * so staff never have to guess which calendar a field uses.
 */
export function BsDateField({ value, ...pickerProps }: BsDateFieldProps) {
  const ad = value ? formatAd(value) : null;

  return (
    <div className="space-y-1">
      <NepaliDatePicker value={value} {...pickerProps} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {ad ? `AD: ${ad}` : "BS date (Bikram Sambat), e.g. 2082-01-15"}
      </p>
    </div>
  );
}
