"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Building2, ClipboardList, FileText, Printer, Users } from "lucide-react";
import type { Contract } from "@/lib/schema/contract/contract";
import type { ContractDocumentVariant } from "@/lib/contract-documents";
import { cn } from "@/lib/utils";

type DocumentMetaItem = {
  label: string;
  value: string;
};

type DocumentSection = {
  title: string;
  paragraphs: string[];
};

type DocumentSignature = {
  label: string;
  name?: string | null;
  note?: string;
};

type PrintableContractDocumentProps = {
  autoPrint?: boolean;
  backHref: string;
  contract: Contract;
  documentType: "agreement" | "work-order";
  meta: DocumentMetaItem[];
  sections: DocumentSection[];
  signatures: DocumentSignature[];
  subtitle: string;
  title: string;
  variant: ContractDocumentVariant;
};

const variantStyles: Record<ContractDocumentVariant, string> = {
  COMPANY:
    "border-sky-200 bg-sky-50 text-sky-700 print:border-slate-300 print:bg-white print:text-slate-700",
  USER_COMMITTEE:
    "border-amber-200 bg-amber-50 text-amber-700 print:border-slate-300 print:bg-white print:text-slate-700",
};

export function PrintableContractDocument({
  autoPrint = false,
  backHref,
  contract,
  documentType,
  meta,
  sections,
  signatures,
  subtitle,
  title,
  variant,
}: PrintableContractDocumentProps) {
  const VariantIcon = variant === "USER_COMMITTEE" ? Users : Building2;
  const DocumentIcon = documentType === "agreement" ? FileText : ClipboardList;
  const variantLabel =
    variant === "USER_COMMITTEE" ? "User committee format" : "Company format";
  const hasAutoPrinted = useRef(false);

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current) return;

    hasAutoPrinted.current = true;
    const timeout = window.setTimeout(() => window.print(), 250);

    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ea_0%,#eef3f8_100%)] px-4 py-5 sm:px-6 sm:py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Back to contract
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Printer size={15} />
            Print document
          </button>
        </div>

        <article className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-200 bg-[linear-gradient(135deg,#fffdf8_0%,#f5f8fb_100%)] px-6 py-8 sm:px-10 print:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <DocumentIcon size={12} />
                    {documentType === "agreement" ? "Agreement" : "Work Order"}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      variantStyles[variant]
                    )}
                  >
                    <VariantIcon size={12} />
                    {variantLabel}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Municipality Contract Document
                  </p>
                  <h1 className="mt-2 font-serif text-3xl text-slate-900 sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Contract Reference
                </p>
                <p className="mt-2 font-mono text-lg font-semibold text-slate-900">
                  {contract.contractNumber}
                </p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  {contract.project?.name ?? "Project not linked"}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {meta.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="space-y-8">
              {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {section.title}
                    </p>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="space-y-4 font-serif text-[17px] leading-8 text-slate-700">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.title}-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Signatories
                </p>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {signatures.map((signature) => (
                  <div
                    key={signature.label}
                    className="rounded-[24px] border border-slate-200 bg-white px-5 py-5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {signature.label}
                    </p>
                    <div className="mt-8 border-b border-dashed border-slate-300 pb-2 text-sm font-semibold text-slate-800">
                      {signature.name?.trim() || "Pending signature"}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {signature.note ?? "Authorized signature"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
