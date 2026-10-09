"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Building2,
  CornerDownLeft,
  FileSignature,
  FolderKanban,
  Loader2,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/auth/use-role";
import { useEffectiveFiscalYear } from "@/lib/fiscal-year-context";
import { cn } from "@/lib/utils";
import { searchService } from "@/services/search/searchService";
import { NAV_GROUPS, OVERVIEW_ITEM } from "./navigation";
import { QUICK_CREATE_ITEMS } from "./quick-create-menu";

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
};

type PaletteSection = { label: string; items: PaletteItem[] };

const MIN_REMOTE_QUERY = 2;

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function CommandPalette() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const fiscalYear = useEffectiveFiscalYear();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasRemoteQuery = debouncedQuery.length >= MIN_REMOTE_QUERY;
  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery, fiscalYear],
    queryFn: () => searchService.search(debouncedQuery, fiscalYear),
    enabled: open && hasRemoteQuery,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const sections = useMemo<PaletteSection[]>(() => {
    const needle = query.trim().toLowerCase();
    const matches = (text: string) => !needle || text.toLowerCase().includes(needle);

    const pages: PaletteItem[] = [OVERVIEW_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)]
      .filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin)
      .filter((item) => matches(item.label))
      .map((item) => ({
        id: `page-${item.href}`,
        label: item.label,
        href: item.href,
        icon: item.icon,
      }));

    const create: PaletteItem[] = QUICK_CREATE_ITEMS.filter(
      (item) => !("adminOnly" in item) || isAdmin,
    )
      .filter((item) => matches(item.label))
      .map((item) => ({
        id: `create-${item.href}`,
        label: item.label,
        href: item.href,
        icon: Plus,
      }));

    const found: PaletteSection[] =
      hasRemoteQuery && results
        ? [
            {
              label: "Projects",
              items: results.projects.map((project) => ({
                id: `project-${project.id}`,
                label: project.name,
                hint: [project.sNo && `S.No ${project.sNo}`, project.fiscalYear]
                  .filter(Boolean)
                  .join(" · "),
                href: `/dashboard/projects/${project.id}`,
                icon: FolderKanban,
              })),
            },
            {
              label: "Contracts",
              items: results.contracts.map((contract) => ({
                id: `contract-${contract.id}`,
                label: contract.contractNumber,
                hint: contract.projectName ?? undefined,
                href: `/dashboard/contracts/${contract.id}`,
                icon: FileSignature,
              })),
            },
            {
              label: "Companies",
              items: results.companies.map((company) => ({
                id: `company-${company.id}`,
                label: company.name,
                hint: company.address,
                href: `/dashboard/companies/${company.id}`,
                icon: Building2,
              })),
            },
            {
              label: "Committees",
              items: results.committees.map((committee) => ({
                id: `committee-${committee.id}`,
                label: committee.name,
                hint: committee.address,
                href: `/dashboard/committees/${committee.id}`,
                icon: Users,
              })),
            },
          ]
        : [];

    return [
      ...found,
      { label: "Go to", items: pages },
      { label: "Create", items: create },
    ].filter((section) => section.items.length > 0);
  }, [hasRemoteQuery, isAdmin, query, results]);

  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const activeIndex = Math.min(active, Math.max(flatItems.length - 1, 0));
  const activeId = flatItems[activeIndex]?.id;

  useEffect(() => {
    if (!open || !activeId) return;
    document
      .getElementById(`palette-option-${activeId}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId, open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const go = (item: PaletteItem) => {
    handleOpenChange(false);
    router.push(item.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(flatItems.length ? (activeIndex + 1) % flatItems.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        flatItems.length
          ? (activeIndex - 1 + flatItems.length) % flatItems.length
          : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) go(item);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Search (Ctrl+K)"
        className="gap-2 text-muted-foreground sm:w-56 sm:justify-start"
      >
        <Search />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl outline-none"
          >
            <DialogPrimitive.Title className="sr-only">
              Search and jump to
            </DialogPrimitive.Title>

            <div className="flex items-center gap-2 border-b px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search projects, contracts, companies, committees…"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-listbox"
                aria-activedescendant={
                  activeId ? `palette-option-${activeId}` : undefined
                }
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
              ) : null}
            </div>

            <div
              id="palette-listbox"
              role="listbox"
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {flatItems.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {hasRemoteQuery && isFetching
                    ? "Searching…"
                    : "No results found."}
                </p>
              ) : (
                sections.map((section) => (
                  <div key={section.label} className="mb-1" role="group" aria-label={section.label}>
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </p>
                    {section.items.map((item) => {
                      const isActive = item.id === activeId;

                      return (
                        <div
                          key={item.id}
                          id={`palette-option-${item.id}`}
                          role="option"
                          aria-selected={isActive}
                          onMouseMove={() =>
                            setActive(flatItems.findIndex((i) => i.id === item.id))
                          }
                          onClick={() => go(item)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm",
                            isActive && "bg-accent text-accent-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.hint ? (
                            <span className="hidden max-w-[40%] truncate text-xs text-muted-foreground sm:inline">
                              {item.hint}
                            </span>
                          ) : null}
                          {isActive ? (
                            <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
              <span>↑↓ to move · Enter to open · Esc to close</span>
              <span>
                Results for{" "}
                {fiscalYear === "all"
                  ? "all years"
                  : fiscalYear
                    ? `FY ${fiscalYear}`
                    : "the current year"}
              </span>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
