"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Noto_Sans_Devanagari } from "next/font/google";
import QRCode from "react-qr-code";

type DocumentMeta = {
  label: string;
  value: string;
};

type DocumentSignature = {
  label: string;
  name?: string | null;
  note?: string;
  showPlaceholderWhenNameMissing?: boolean;
};

type DocumentAppendixSection = {
  title: string;
  lines: string[];
};

type NepaliOfficialDocumentProps = {
  autoPrint?: boolean;
  appendixSections?: DocumentAppendixSection[];
  backHref: string;
  body: string[];
  contentWidth?: "full" | "narrow";
  cornerMeta?: DocumentMeta;
  density?: "default" | "compact";
  documentLabel?: string;
  footerNote?: string;
  headingLayout?: "centered" | "subject-line";
  letterhead?: boolean;
  meta: DocumentMeta[];
  noteContent?: string | null;
  noteTitle?: string;
  printBottomReserveMm?: number;
  printTopShiftMm?: number;
  qrCodeLabel?: string;
  qrCodePlacement?: "meta" | "bottom-right" | "floating-bottom-right" | "below-corner";
  qrCodePath?: string;
  qrCodeValue?: string;
  recipientLines?: string[];
  paragraphIndent?: boolean;
  signatureLayout?: "grid" | "bottom-right";
  signatureNamePlacement?: "above" | "below";
  signatures: DocumentSignature[];
  subject: string;
  subjectAlignment?: "inherit" | "center";
  subjectPrefix?: string;
  subtitle?: string;
  title: string;
};

const devanagariFont = Noto_Sans_Devanagari({
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  display: "swap",
});

export function NepaliOfficialDocument({
  autoPrint = false,
  appendixSections = [],
  backHref,
  body,
  contentWidth = "full",
  cornerMeta,
  density = "default",
  documentLabel,
  footerNote,
  headingLayout = "centered",
  letterhead = false,
  meta,
  noteContent,
  noteTitle = "रेकर्ड गरिएको थप विवरण",
  printBottomReserveMm,
  printTopShiftMm,
  qrCodeLabel = "QR",
  qrCodePlacement = "meta",
  qrCodePath,
  qrCodeValue,
  recipientLines = [],
  paragraphIndent = true,
  signatureLayout = "grid",
  signatureNamePlacement = "above",
  signatures,
  subject,
  subjectAlignment = "inherit",
  subjectPrefix = "विषय :- ",
  subtitle,
  title,
}: NepaliOfficialDocumentProps) {
  const hasAutoPrinted = useRef(false);
  const isCompact = density === "compact";
  const isNarrowContent = contentWidth === "narrow";
  const hasSubject = Boolean(subject.trim());
  const isBottomRightSignature =
    signatureLayout === "bottom-right" && signatures.length === 1;
  const hasMetaText = Boolean(documentLabel || meta.length > 0);
  const hasQrValue = Boolean(qrCodeValue?.trim() || qrCodePath);
  const showMetaQr = Boolean(hasQrValue && qrCodePlacement === "meta");
  const showCornerQr = Boolean(hasQrValue && qrCodePlacement === "below-corner");
  const showBottomQr = Boolean(hasQrValue && qrCodePlacement === "bottom-right");
  const showFloatingQr = Boolean(hasQrValue && qrCodePlacement === "floating-bottom-right");
  const showInlineBottomQr = showBottomQr && isBottomRightSignature;
  const shouldRenderMetaCard = Boolean(documentLabel || meta.length > 0 || showMetaQr);
  const windowOrigin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
  const resolvedQrCodeValue = qrCodeValue?.trim()
    ? qrCodeValue.trim()
    : !qrCodePath
      ? ""
      : /^https?:\/\//i.test(qrCodePath)
        ? qrCodePath
        : windowOrigin
          ? `${windowOrigin}${qrCodePath.startsWith("/") ? qrCodePath : `/${qrCodePath}`}`
          : "";
  const rootStyle =
    printTopShiftMm == null && printBottomReserveMm == null
      ? undefined
      : ({
          ...(printTopShiftMm == null
            ? {}
            : { "--document-print-top-shift": `${printTopShiftMm}mm` }),
          ...(printBottomReserveMm == null
            ? {}
            : { "--document-print-bottom-reserve": `${printBottomReserveMm}mm` }),
        } as CSSProperties);

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current) return;

    hasAutoPrinted.current = true;
    const timeout = window.setTimeout(() => window.print(), 300);

    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  return (
    <div
      className="official-document-root min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] px-4 py-5 sm:px-6 sm:py-8 print:bg-white print:px-0 print:py-0"
      data-density={density}
      data-letterhead={letterhead ? "true" : "false"}
      style={rootStyle}
    >
      {letterhead ? (
        <>
          <div className="official-document-print-header" aria-hidden="true" />
          <div className="official-document-print-footer" aria-hidden="true" />
        </>
      ) : null}
      <div className="official-document-shell mx-auto max-w-5xl space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contract
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Print document
          </button>
        </div>

        <article className="official-document-sheet relative mx-auto min-h-[297mm] w-full max-w-[210mm] rounded-[28px] border border-stone-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.16)] print:rounded-none print:border-0 print:shadow-none">
          <div
            className={`official-document-content relative z-10 flex min-h-[297mm] flex-col text-stone-900 ${
              isCompact ? "text-[14px] leading-7" : "text-[15px] leading-8"
            } ${devanagariFont.className}`}
          >
            <div className={isNarrowContent ? "mx-auto w-full max-w-[166mm]" : "w-full"}>
              {cornerMeta ? (
                <div className={`official-document-corner-meta flex justify-end ${isCompact ? "mb-2" : "mb-3"}`}>
                  <p className={isCompact ? "text-[13px] leading-6 text-stone-700" : "text-sm leading-7 text-stone-700"}>
                    <span className="font-medium text-stone-500">{cornerMeta.label} :</span>{" "}
                    <span className="font-semibold text-stone-900">{cornerMeta.value}</span>
                  </p>
                </div>
              ) : null}

              {showCornerQr ? (
                <div className={`official-document-corner-qr flex justify-end ${isCompact ? "mb-2" : "mb-3"}`}>
                  <div className="flex flex-col items-center">
                    {resolvedQrCodeValue ? (
                      <QRCode
                        value={resolvedQrCodeValue}
                        size={isCompact ? 56 : 68}
                        level="M"
                        bgColor="transparent"
                        fgColor="#111827"
                      />
                    ) : (
                      <div className={isCompact ? "h-[56px] w-[56px]" : "h-[68px] w-[68px]"} />
                    )}
                    {qrCodeLabel ? (
                      <p className={isCompact ? "mt-0.5 text-[8px] font-medium text-stone-500" : "mt-1 text-[9px] font-medium text-stone-500"}>
                        {qrCodeLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div
                className={`official-document-meta flex flex-col md:flex-row md:items-start md:justify-between ${
                  isCompact ? "gap-4" : "gap-5"
                }`}
              >
                <div
                  className={
                    shouldRenderMetaCard
                      ? isCompact
                        ? "space-y-0.5 md:max-w-[56%]"
                        : "max-w-[70%] space-y-1"
                      : isCompact
                        ? "w-full space-y-0.5"
                        : "w-full space-y-1"
                  }
                >
                  {recipientLines.map((line) => (
                    <p key={line} className={isCompact ? "text-[15px] font-medium" : "text-[16px] font-medium"}>
                      {line}
                    </p>
                  ))}
                </div>

                {shouldRenderMetaCard ? (
                  <div
                    className={`official-document-meta-card border border-stone-300/80 bg-white/80 shadow-sm backdrop-blur-[1px] ${
                      isCompact
                        ? "rounded-[20px] px-3.5 py-2.5 text-[13px] leading-6"
                        : "rounded-2xl px-4 py-3 text-sm leading-7"
                    }`}
                  >
                    <div
                      className={
                        isCompact && showMetaQr && hasMetaText
                          ? "flex items-start gap-3"
                          : "flex items-center justify-center"
                      }
                    >
                      {hasMetaText ? (
                        <div className="min-w-0 flex-1">
                          {documentLabel ? (
                            <p
                              className={`font-semibold text-stone-500 ${
                                isCompact ? "text-[10px] tracking-[0.16em]" : "text-xs uppercase tracking-[0.22em]"
                              }`}
                            >
                              {documentLabel}
                            </p>
                          ) : null}
                          <div
                            className={
                              documentLabel
                                ? isCompact
                                  ? "mt-1.5 space-y-1"
                                  : "mt-2 space-y-1.5"
                                : isCompact
                                  ? "space-y-1"
                                  : "space-y-1.5"
                            }
                          >
                            {meta.map((item) => (
                              <div key={item.label} className="flex gap-2">
                                <span
                                  className={`text-stone-500 ${isCompact ? "min-w-[72px] text-[11px]" : "min-w-[86px]"}`}
                                >
                                  {item.label}
                                </span>
                                <span className="min-w-0 font-semibold text-stone-800">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {showMetaQr ? (
                        <div className={isCompact ? "shrink-0" : "mt-3"}>
                          <div
                            className={`official-document-qr flex flex-col items-center rounded-[16px] border border-stone-200 bg-white shadow-sm ${
                              hasMetaText
                                ? isCompact
                                  ? "w-fit"
                                  : "w-fit"
                                : isCompact
                                  ? "w-fit"
                                  : "w-fit"
                            }`}
                          >
                            {resolvedQrCodeValue ? (
                              <QRCode
                                value={resolvedQrCodeValue}
                                size={hasMetaText ? (isCompact ? 58 : 72) : isCompact ? 64 : 76}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#111827"
                              />
                            ) : (
                              <div
                                className={`bg-stone-100 ${
                                  hasMetaText
                                    ? isCompact
                                      ? "h-[58px] w-[58px]"
                                      : "h-[72px] w-[72px]"
                                    : isCompact
                                      ? "h-[64px] w-[64px]"
                                      : "h-[76px] w-[76px]"
                                }`}
                              />
                            )}
                            <p className={isCompact ? "mt-1 text-[9px] font-medium text-stone-500" : "mt-1.5 text-[10px] font-medium text-stone-500"}>
                              {qrCodeLabel}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                data-layout={headingLayout}
                className={`official-document-heading ${
                  headingLayout === "subject-line"
                    ? isCompact
                      ? "mt-5 text-left"
                      : "mt-6 text-left"
                    : `text-center ${isCompact ? "mt-7" : "mt-8"}`
                }`}
              >
                {title ? (
                  <h1 className={isCompact ? "text-[20px] font-semibold tracking-wide text-stone-900" : "text-[22px] font-semibold tracking-wide text-stone-900"}>
                    {title}
                  </h1>
                ) : null}
                {hasSubject ? (
                  <p
                    className={
                      `${
                        headingLayout === "subject-line"
                          ? isCompact
                            ? "text-[16px] font-semibold text-stone-900"
                            : "text-[17px] font-semibold text-stone-900"
                          : isCompact
                            ? "mt-2 text-[16px] font-semibold text-stone-900"
                            : "mt-3 text-[17px] font-semibold text-stone-900"
                      } ${subjectAlignment === "center" ? "text-center" : ""}`
                    }
                  >
                    {subjectPrefix}
                    {subject}
                  </p>
                ) : null}
                {subtitle ? (
                  <p
                    className={`max-w-3xl text-sm text-stone-600 ${
                      headingLayout === "subject-line" ? "" : "mx-auto "
                    }${
                      isCompact ? "mt-2 leading-6" : "mt-3 leading-7"
                    }`}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <section
                className={`official-document-section flex-1 text-justify ${
                  isCompact ? "mt-6 space-y-4 text-[14px] leading-8" : "mt-8 space-y-5 text-[15px] leading-9"
                }`}
              >
                {body.map((paragraph, index) => (
                  <p
                    key={`${documentLabel ?? title}-${index}`}
                    className={paragraphIndent ? (isCompact ? "indent-10" : "indent-12") : ""}
                  >
                    {paragraph}
                  </p>
                ))}

                {noteContent ? (
                  <div
                    className={`official-document-note border border-stone-300/80 bg-white/70 shadow-sm ${
                      isCompact ? "mt-4 rounded-[18px] px-4 py-3" : "mt-6 rounded-[22px] px-5 py-4"
                    }`}
                  >
                    <p className="text-sm font-semibold text-stone-900">{noteTitle}</p>
                    <p
                      className={`whitespace-pre-line text-stone-700 ${
                        isCompact ? "mt-2 text-[13px] leading-7" : "mt-3 text-[14px] leading-8"
                      }`}
                    >
                      {noteContent}
                    </p>
                  </div>
                ) : null}
              </section>

              <section
                className={
                  isBottomRightSignature
                    ? isCompact
                      ? "official-document-signatures mt-8 flex justify-end pt-2"
                      : "official-document-signatures mt-12 flex justify-end pt-4"
                    : `official-document-signatures grid ${
                        isCompact ? "mt-8 gap-4 pt-2 md:grid-cols-3" : "mt-12 gap-8 pt-4 sm:grid-cols-2 lg:grid-cols-3"
                      }`
                }
              >
                {isBottomRightSignature ? (
                  <div className={isCompact ? "flex items-end gap-3" : "flex items-end gap-4"}>
                    {signatures.map((signature) => {
                      const resolvedName = signature.name?.trim();
                      const shouldShowName = Boolean(
                        resolvedName || signature.showPlaceholderWhenNameMissing !== false
                      );

                      return (
                        <div
                          key={signature.label}
                          className={isCompact ? "w-full max-w-[190px] space-y-2 text-center" : "w-full max-w-[220px] space-y-3 text-center"}
                        >
                          <div
                            className={`mx-auto h-px w-full border-t border-dashed border-stone-500 ${
                              isCompact ? "max-w-[180px]" : "max-w-[220px]"
                            }`}
                          />
                          <div className={isCompact ? "space-y-0.5 leading-6" : "space-y-1 leading-7"}>
                            {signatureNamePlacement === "below" ? (
                              <>
                                <p className={isCompact ? "text-[13px] text-stone-700" : "text-sm text-stone-700"}>
                                  {signature.label}
                                </p>
                                {shouldShowName ? (
                                  <p className={isCompact ? "text-[14px] font-semibold text-stone-900" : "text-[15px] font-semibold text-stone-900"}>
                                    {resolvedName || "........................"}
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <>
                                {shouldShowName ? (
                                  <p className={isCompact ? "text-[14px] font-semibold text-stone-900" : "text-[15px] font-semibold text-stone-900"}>
                                    {resolvedName || "........................"}
                                  </p>
                                ) : null}
                                <p className={isCompact ? "text-[13px] text-stone-700" : "text-sm text-stone-700"}>
                                  {signature.label}
                                </p>
                              </>
                            )}
                            {signature.note ? (
                              <p className={isCompact ? "text-[11px] leading-5 text-stone-500" : "text-xs leading-6 text-stone-500"}>
                                {signature.note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}

                    {showInlineBottomQr ? (
                      <div
                        className={`official-document-qr flex flex-col items-center rounded-[16px] border border-stone-200 bg-white shadow-sm ${
                          isCompact ? "w-fit" : "w-fit"
                        }`}
                      >
                        {resolvedQrCodeValue ? (
                          <QRCode
                            value={resolvedQrCodeValue}
                            size={isCompact ? 48 : 58}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#111827"
                          />
                        ) : (
                          <div className={isCompact ? "h-[48px] w-[48px] bg-stone-100" : "h-[58px] w-[58px] bg-stone-100"} />
                        )}
                        <p className={isCompact ? "mt-1 text-[8px] font-medium text-stone-500" : "mt-1 text-[9px] font-medium text-stone-500"}>
                          {qrCodeLabel}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  signatures.map((signature) => {
                    const resolvedName = signature.name?.trim();
                    const shouldShowName = Boolean(
                      resolvedName || signature.showPlaceholderWhenNameMissing !== false
                    );

                    return (
                      <div
                        key={signature.label}
                        className={isCompact ? "space-y-2 text-center" : "space-y-3 text-center"}
                      >
                        <div
                          className={`mx-auto h-px w-full border-t border-dashed border-stone-500 ${
                            isCompact ? "max-w-[180px]" : "max-w-[220px]"
                          }`}
                        />
                        <div className={isCompact ? "space-y-0.5 leading-6" : "space-y-1 leading-7"}>
                          {signatureNamePlacement === "below" ? (
                            <>
                              <p className={isCompact ? "text-[13px] text-stone-700" : "text-sm text-stone-700"}>
                                {signature.label}
                              </p>
                              {shouldShowName ? (
                                <p className={isCompact ? "text-[14px] font-semibold text-stone-900" : "text-[15px] font-semibold text-stone-900"}>
                                  {resolvedName || "........................"}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {shouldShowName ? (
                                <p className={isCompact ? "text-[14px] font-semibold text-stone-900" : "text-[15px] font-semibold text-stone-900"}>
                                  {resolvedName || "........................"}
                                </p>
                              ) : null}
                              <p className={isCompact ? "text-[13px] text-stone-700" : "text-sm text-stone-700"}>
                                {signature.label}
                              </p>
                            </>
                          )}
                          {signature.note ? (
                            <p className={isCompact ? "text-[11px] leading-5 text-stone-500" : "text-xs leading-6 text-stone-500"}>
                              {signature.note}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              {appendixSections.length ? (
                <section
                  className={`official-document-appendix ${
                    isCompact ? "mt-6 space-y-4 text-[13px] leading-6" : "mt-8 space-y-5 text-[14px] leading-7"
                  }`}
                >
                  {appendixSections.map((section) => (
                    <div key={section.title} className="space-y-1.5">
                      <p className="font-semibold text-stone-900">{section.title}</p>
                      {section.lines.map((line) => (
                        <p key={`${section.title}-${line}`} className="text-stone-800">
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </section>
              ) : null}

              {showBottomQr && !showInlineBottomQr ? (
                <div className={`official-document-bottom-qr flex justify-end ${isCompact ? "mt-4" : "mt-5"}`}>
                  <div
                    className={`official-document-qr flex flex-col items-center rounded-[16px] border border-stone-200 bg-white shadow-sm ${
                      isCompact ? "w-fit" : "w-fit"
                    }`}
                  >
                    {resolvedQrCodeValue ? (
                      <QRCode
                        value={resolvedQrCodeValue}
                        size={isCompact ? 52 : 62}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#111827"
                      />
                    ) : (
                      <div className={isCompact ? "h-[1px] w-[1px] bg-stone-100" : "h-[62px] w-[62px] bg-stone-100"} />
                    )}
                    <p className={isCompact ? "mt-1 text-[9px] font-medium text-stone-500" : "mt-1.5 text-[10px] font-medium text-stone-500"}>
                      {qrCodeLabel}
                    </p>
                  </div>
                </div>
              ) : null}

              {footerNote ? (
                <p
                  className={`official-document-footer text-stone-600 ${
                    isCompact ? "mt-4 text-[11px] leading-5" : "mt-6 text-xs leading-6"
                  }`}
                >
                  {footerNote}
                </p>
              ) : null}
            </div>
          </div>

          {showFloatingQr ? (
            <div className="official-document-floating-qr" aria-hidden="true">
              <div
                className={`official-document-qr flex flex-col items-center rounded-[16px] border border-stone-200 bg-white/95 shadow-sm ${
                  isCompact ? "w-fit" : "w-fit"
                }`}
              >
                {resolvedQrCodeValue ? (
                  <QRCode
                    value={resolvedQrCodeValue}
                    size={isCompact ? 44 : 54}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#111827"
                  />
                ) : (
                  <div className={isCompact ? "h-[44px] w-[44px] bg-stone-100" : "h-[54px] w-[54px] bg-stone-100"} />
                )}
                <p className={isCompact ? "mt-1 text-[8px] font-medium text-stone-500" : "mt-1 text-[9px] font-medium text-stone-500"}>
                  {qrCodeLabel}
                </p>
              </div>
            </div>
          ) : null}
        </article>
      </div>

      <style jsx global>{`
        .official-document-root {
          --document-page-top: 25mm;
          --document-page-side: 14mm;
          --document-page-bottom: 25mm;
          --document-print-top-shift: 4mm;
          --document-print-bottom-reserve: var(--document-page-bottom);
        }

        .official-document-content {
          padding: var(--document-page-top) var(--document-page-side) var(--document-page-bottom);
        }

        .official-document-root[data-letterhead="true"] {
          --document-page-top: 75mm;
          --document-page-bottom: 35mm;
          --document-print-top-shift: 10mm;
        }

        .official-document-root[data-letterhead="true"] .official-document-sheet {
          background-color: #fff;
          background-image: url('/letterhead.png');
          background-position: top center;
          background-repeat: no-repeat;
          background-size: 210mm 297mm;
        }

        .official-document-floating-qr {
          position: absolute;
          right: 12mm;
          bottom: 12mm;
          z-index: 15;
        }

        .official-document-print-header,
        .official-document-print-footer {
          display: none;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }

          body * {
            visibility: hidden;
          }

          .official-document-root,
          .official-document-root * {
            visibility: visible;
          }

          .official-document-root {
            min-height: auto !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .official-document-root[data-letterhead="true"] .official-document-print-header,
          .official-document-root[data-letterhead="true"] .official-document-print-footer {
            display: block !important;
            position: fixed;
            left: 50%;
            width: 210mm;
            transform: translateX(-50%);
            pointer-events: none;
          }

          .official-document-root[data-letterhead="true"] .official-document-print-header {
            top: 0;
            z-index: 0;
            height: var(--document-page-top);
            background-image: url('/letterhead.png');
            background-position: top center;
            background-repeat: no-repeat;
            background-size: 210mm 297mm;
          }

          .official-document-root[data-letterhead="true"] .official-document-print-footer {
            bottom: 0;
            z-index: 0;
            height: var(--document-page-bottom);
            background-image: url('/letterhead.png');
            background-position: bottom center;
            background-repeat: no-repeat;
            background-size: 210mm 297mm;
          }

          .official-document-shell {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          .official-document-sheet {
            position: relative;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            overflow: visible;
          }

          .official-document-root[data-letterhead="true"] .official-document-sheet {
            background: transparent !important;
          }

          .official-document-content {
            min-height: 297mm !important;
            padding: calc(var(--document-page-top) - var(--document-print-top-shift)) var(--document-page-side) var(--document-print-bottom-reserve) !important;
          }

          .official-document-corner-meta {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .official-document-section p {
            orphans: 3;
            widows: 3;
          }

          .official-document-meta,
          .official-document-appendix,
          .official-document-bottom-qr,
          .official-document-note,
          .official-document-signatures,
          .official-document-footer {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
