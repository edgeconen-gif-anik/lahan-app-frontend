"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  /** The committed value (usually from the URL). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  debounceMs?: number;
  className?: string;
};

/**
 * Search box that waits for a pause in typing before reporting the value, so
 * every keystroke doesn't hit the server or rewrite the URL.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label,
  debounceMs = 400,
  className,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastEmitted, setLastEmitted] = useState(value);
  const [lastSeenValue, setLastSeenValue] = useState(value);

  // Adopt outside changes (e.g. "Reset filters") but ignore the echo of what
  // we just emitted, otherwise fast typing would be overwritten.
  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (value !== lastEmitted) {
      setDraft(value);
      setLastEmitted(value);
    }
  }

  useEffect(() => {
    if (draft === lastEmitted) return;

    const timer = window.setTimeout(() => {
      setLastEmitted(draft);
      onChange(draft.trim());
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [draft, lastEmitted, onChange, debounceMs]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            setLastEmitted("");
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
