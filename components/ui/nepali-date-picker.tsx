"use client";

import * as React from "react";
import NepaliDate from "nepali-date-converter";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MIN_BS_YEAR = 2000;
const MAX_BS_YEAR = 2090;
const BS_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type BsParts = { year: number; month: number; day: number };

const pad = (value: number) => String(value).padStart(2, "0");

function formatBs({ year, month, day }: BsParts) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function daysInBsMonth(year: number, month: number) {
  const next = month === 11 ? [year + 1, 0] : [year, month + 1];
  if (next[0] > MAX_BS_YEAR) return 30;

  const diff =
    new NepaliDate(next[0], next[1], 1).toJsDate().getTime() -
    new NepaliDate(year, month, 1).toJsDate().getTime();
  return Math.round(diff / 86_400_000);
}

function parseBs(value: string): BsParts | null {
  const match = BS_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (year < MIN_BS_YEAR || year > MAX_BS_YEAR || month < 0 || month > 11) {
    return null;
  }
  if (day < 1 || day > daysInBsMonth(year, month)) return null;

  return { year, month, day };
}

export function getTodayBs(): BsParts {
  const today = new NepaliDate();
  return { year: today.getYear(), month: today.getMonth(), day: today.getDate() };
}

/** "YYYY-MM-DD" (AD) -> "YYYY-MM-DD" (BS), or "" when invalid. */
export function adIsoToBs(value: string): string {
  const match = BS_PATTERN.exec(value.trim());
  if (!match) return "";

  try {
    // Noon UTC keeps the calendar day stable regardless of timezone offsets.
    const bs = new NepaliDate(
      new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)),
    );
    return formatBs({ year: bs.getYear(), month: bs.getMonth(), day: bs.getDate() });
  } catch {
    return "";
  }
}

/** "YYYY-MM-DD" (BS) -> "YYYY-MM-DD" (AD), or "" when invalid. */
export function bsToAdIso(value: string): string {
  const parts = parseBs(value);
  if (!parts) return "";

  const { AD } = new NepaliDate(parts.year, parts.month, parts.day).getDateObject();
  return `${AD.year}-${pad(AD.month + 1)}-${pad(AD.date)}`;
}

function formatTyping(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export interface NepaliDatePickerProps {
  /**
   * "bs" (default): value is a BS string such as "2082-01-15".
   * "ad": value is an AD ISO string such as "2025-04-28"; the picker still
   * shows and selects Bikram Sambat dates and converts for you.
   */
  valueType?: "bs" | "ad";
  value: string;
  /** Called with the new value in the same format as `value`. "" when cleared. */
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show the red/invalid style. */
  invalid?: boolean;
  className?: string;
}

export function NepaliDatePicker({
  valueType = "bs",
  value,
  onValueChange,
  onBlur,
  name,
  id,
  placeholder = "YYYY-MM-DD",
  required,
  disabled,
  invalid,
  className,
}: NepaliDatePickerProps) {
  const isAd = valueType === "ad";
  const bsValue = isAd ? adIsoToBs(value) : value;
  const selected = parseBs(bsValue);
  const today = getTodayBs();

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [view, setView] = React.useState({ year: today.year, month: today.month });

  const text = draft ?? bsValue;

  const commit = (nextBs: string) => {
    onValueChange(isAd ? bsToAdIso(nextBs) : nextBs);
  };

  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      const base = selected ?? today;
      setView({ year: base.year, month: base.month });
    }
  };

  const shiftMonth = (delta: number) => {
    setView((current) => {
      const index = current.year * 12 + current.month + delta;
      const year = Math.floor(index / 12);
      if (year < MIN_BS_YEAR || year > MAX_BS_YEAR) return current;
      return { year, month: index - year * 12 };
    });
  };

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTyping(event.target.value);
    setDraft(formatted);

    if (formatted === "") {
      commit("");
    } else if (parseBs(formatted)) {
      commit(formatted);
    } else if (isAd) {
      // Keep the stored AD value empty until a full, valid BS date is typed.
      onValueChange("");
    } else {
      // Plain BS fields keep partial text so existing validation can report it.
      onValueChange(formatted);
    }
  };

  const handleSelect = (day: number) => {
    commit(formatBs({ ...view, day }));
    setDraft(null);
    setOpen(false);
  };

  const firstWeekday = new NepaliDate(view.year, view.month, 1).getDay();
  const totalDays = daysInBsMonth(view.year, view.month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  const isToday = (day: number) =>
    today.year === view.year && today.month === view.month && today.day === day;
  const isSelected = (day: number) =>
    selected?.year === view.year &&
    selected.month === view.month &&
    selected.day === day;

  const yearOptions = Array.from(
    { length: MAX_BS_YEAR - MIN_BS_YEAR + 1 },
    (_, index) => MIN_BS_YEAR + index,
  );

  return (
    <Popover open={open} onOpenChange={openChange} modal={false}>
      <div className={cn("relative", className)}>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          value={text}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={handleTyping}
          onBlur={() => {
            setDraft(null);
            onBlur?.();
          }}
          className={cn(
            "h-11 w-full rounded-md border bg-background py-2 pl-3 pr-20 font-mono text-sm shadow-xs outline-none transition",
            "focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-60",
            invalid ? "border-destructive/60 bg-destructive/5" : "border-input",
          )}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {value && !disabled && !required ? (
            <button
              type="button"
              aria-label="Clear date"
              onClick={() => {
                setDraft(null);
                onValueChange("");
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          ) : null}
          <span className="rounded-full border bg-muted/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            BS
          </span>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Open Nepali calendar"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <CalendarDays size={16} />
            </button>
          </PopoverTrigger>
        </div>
      </div>

      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-3 flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="rounded p-1.5 hover:bg-muted"
          >
            <ChevronLeft size={16} />
          </button>
          <select
            aria-label="Month"
            value={view.month}
            onChange={(event) =>
              setView((current) => ({ ...current, month: Number(event.target.value) }))
            }
            className="h-8 flex-1 rounded-md border bg-background px-1 text-sm"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={view.year}
            onChange={(event) =>
              setView((current) => ({ ...current, year: Number(event.target.value) }))
            }
            className="h-8 w-[4.5rem] rounded-md border bg-background px-1 text-sm"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="rounded p-1.5 hover:bg-muted"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="py-1 font-medium">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) =>
            day === null ? (
              <div key={`blank-${index}`} />
            ) : (
              <button
                key={day}
                type="button"
                onClick={() => handleSelect(day)}
                aria-label={`${MONTHS[view.month]} ${day}, ${view.year}`}
                aria-current={isToday(day) ? "date" : undefined}
                className={cn(
                  "h-8 rounded-md text-sm transition hover:bg-muted",
                  isToday(day) &&
                    "border border-primary font-bold text-primary ring-1 ring-primary/30",
                  isSelected(day) &&
                    "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {day}
              </button>
            ),
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">
            Today: {formatBs(today)}
          </span>
          <button
            type="button"
            onClick={() => {
              commit(formatBs(today));
              setDraft(null);
              setOpen(false);
            }}
            className="rounded-md px-2 py-1 font-medium text-primary hover:bg-muted"
          >
            Select today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
