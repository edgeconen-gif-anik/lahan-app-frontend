"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  formatIndianNumber,
  groupIndianDigits,
  numberToWordsIndian,
} from "@/lib/money";

type MoneyInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Spell the amount out under the field so typos in zeros are obvious. */
  showWords?: boolean;
  className?: string;
};

/** Keeps digits and one decimal point (max two decimals) from typed text. */
function sanitize(text: string) {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [integerPart, ...rest] = cleaned.split(".");
  if (rest.length === 0) return integerPart;

  return `${integerPart}.${rest.join("").slice(0, 2)}`;
}

/** Re-applies grouping while preserving a trailing "." the user just typed. */
function groupForTyping(clean: string) {
  const [integerPart, decimalPart] = clean.split(".");
  const grouped = groupIndianDigits(integerPart.replace(/^0+(?=\d)/, ""));

  return decimalPart === undefined ? grouped : `${grouped}.${decimalPart}`;
}

/**
 * Amount field for rupee values: "Rs." prefix, Nepali-style digit grouping
 * (12,50,000) and the amount in words below.
 */
export function MoneyInput({
  value,
  onValueChange,
  onBlur,
  name,
  id,
  placeholder = "0.00",
  required,
  disabled,
  invalid,
  showWords = true,
  className,
}: MoneyInputProps) {
  // While typing we show the user's own text (so "12." keeps its dot); once
  // the field loses focus it falls back to the formatted number.
  const [typing, setTyping] = useState<string | null>(null);
  const display = typing ?? formatIndianNumber(value);
  const words = showWords ? numberToWordsIndian(value) : "";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none rounded-full border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Rs.
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onFocus={() => setTyping(formatIndianNumber(value))}
          onChange={(event) => {
            const clean = sanitize(event.target.value);
            setTyping(groupForTyping(clean));
            onValueChange(clean === "" || clean === "." ? 0 : Number(clean));
          }}
          onBlur={() => {
            setTyping(null);
            onBlur?.();
          }}
          className={cn(
            "h-10 w-full rounded-md border bg-background pl-14 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive/60 bg-destructive/5",
          )}
        />
      </div>
      {words ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {words}
        </p>
      ) : null}
    </div>
  );
}
