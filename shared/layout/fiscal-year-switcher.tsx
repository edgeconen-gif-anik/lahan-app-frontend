"use client";

import { CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFiscalYears, useSystemSetup } from "@/hooks/setup/useSetup";
import { useFiscalYearSelection } from "@/lib/fiscal-year-context";
import { cn } from "@/lib/utils";

/** Header control that sets the fiscal year used by every list and report. */
export function FiscalYearSwitcher() {
  const { data: setup } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const [selection, setSelection] = useFiscalYearSelection();

  const currentFiscalYear = setup?.currentFiscalYear;
  if (!currentFiscalYear) return null;

  const value = selection ?? currentFiscalYear;
  const isOtherYear = value !== currentFiscalYear;

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        // Choosing the current year goes back to "follow the system default".
        setSelection(next === currentFiscalYear ? null : next)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label="Fiscal year"
        className={cn(
          "w-auto gap-1.5 px-2 sm:gap-2 sm:px-3",
          isOtherYear && "border-amber-500/60 bg-tone-warning text-tone-warning-foreground",
        )}
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        <SelectValue>
          {value === "all" ? "All years" : `FY ${value}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">All fiscal years</SelectItem>
        {fiscalYears.map((year) => (
          <SelectItem key={year} value={year}>
            FY {year}
            {year === currentFiscalYear ? " (current)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
