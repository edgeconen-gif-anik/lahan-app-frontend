"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Lock, RefreshCw, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ComboboxOption } from "../_lib/types";

interface SearchableSelectProps {
  disabled?: boolean;
  error?: string;
  id?: string;
  isLoading?: boolean;
  label: string;
  onChange: (value: string) => void;
  /** When set, searching is done by the server and `options` are used as-is. */
  onSearchChange?: (search: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  value: string;
}

export function SearchableSelect({
  disabled = false,
  error,
  id,
  isLoading = false,
  label,
  onChange,
  onSearchChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  searchValue,
  value,
}: SearchableSelectProps) {
  const isServerSearch = typeof onSearchChange === "function";
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = isServerSearch ? (searchValue ?? "") : localSearch;
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (!isServerSearch) setLocalSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isServerSearch]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const filteredOptions = isServerSearch
    ? options
    : options.filter((option) => {
        const query = localSearch.toLowerCase();
        return (
          option.label.toLowerCase().includes(query) ||
          (option.sublabel ?? "").toLowerCase().includes(query)
        );
      });

  const close = () => {
    setOpen(false);
    if (!isServerSearch) setLocalSearch("");
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("");
    if (isServerSearch) onSearchChange?.("");
    else setLocalSearch("");
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={label}
        aria-invalid={Boolean(error) || undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && isServerSearch) onSearchChange?.("");
          setOpen((previous) => !previous);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left text-sm shadow-xs transition-all outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          error && "border-destructive/60 bg-destructive/5",
          disabled ? "cursor-not-allowed bg-muted/40 opacity-60" : "cursor-pointer",
        )}
      >
        <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground")}>
          {isLoading && !open && !selected ? "Loading..." : (selected?.label ?? placeholder)}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {selected && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={13} />
            </span>
          ) : null}
          {disabled ? (
            <Lock size={13} className="text-muted-foreground" />
          ) : (
            <ChevronDown
              size={15}
              className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
            />
          )}
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="border-b bg-muted/30 p-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(event) =>
                  isServerSearch
                    ? onSearchChange?.(event.target.value)
                    : setLocalSearch(event.target.value)
                }
                aria-label={`Search ${label.toLowerCase()}`}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-transparent bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>

          <div id={listboxId} role="listbox" aria-label={label} className="max-h-56 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                <RefreshCw size={14} className="mr-2 inline animate-spin" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {search ? "No results found" : "Type to search..."}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                    option.value === value && "bg-accent/60 font-medium",
                  )}
                >
                  <span>{option.label}</span>
                  {option.sublabel ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      {option.sublabel}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
