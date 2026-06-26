"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useFuelLog } from "@/hooks/fuel/useFuelLogs";
import {
  FUEL_TYPE_LABEL,
  type FuelLog,
} from "@/lib/schema/fuel/fuel";
import { toNepaliDate } from "@/lib/date-utils";

export type FuelDocumentKind = "demand-form" | "log-book" | "fuel-coupon";
type FuelDocumentMode = FuelDocumentKind | "all";

const documentMeta: Record<
  FuelDocumentKind,
  { title: string; label: string; printLabel: string }
> = {
  "demand-form": {
    title: "माग फारम",
    label: "माग फारम",
    printLabel: "Print Demand Form",
  },
  "log-book": {
    title: "लग बुक",
    label: "Log Book",
    printLabel: "Print Log Book",
  },
  "fuel-coupon": {
    title: "फ्युल कुपन",
    label: "Fuel Coupon",
    printLabel: "Print Fuel Coupon",
  },
};

const NEPALI_FUEL_TYPE_LABEL: Record<FuelLog["fuelType"], string> = {
  PETROL: "पेट्रोल",
  DIESEL: "डिजेल",
};

function valueText(value?: string | number | null, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value?: number | null) {
  if (value == null) return "";
  return `रु. ${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function userName(
  user?: { name?: string | null; email?: string | null; designation?: string | null } | null,
) {
  return user?.name || user?.email || "";
}

function serial(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function shortDate(value?: string | null) {
  const date = toNepaliDate(value);
  return date === "N/A" || date === "Invalid Date" ? "" : date;
}

function CheckboxLine({ label }: { label: string }) {
  return (
    <div className="check-line">
      <span>{label}</span>
      <span className="box" />
    </div>
  );
}

function OfficialHeader({
  fuelLog,
  documentTitle,
}: {
  fuelLog: FuelLog;
  documentTitle: string;
}) {
  return (
    <header className="official-header">
      <div className="top-line">
        <span />
        <span>म.ले.प. फाराम नं : ४०१</span>
      </div>
      <h1>लहान नगरपालिका</h1>
      <h2>नगर कार्यपालिकाको कार्यालय</h2>
      <h3>लहान, सिराहा</h3>
      <p>कार्यालय कोड नं.: ............</p>
      <div className="rule-grid" />
      <h4>{documentTitle}</h4>
      <div className="form-meta">
        <div />
        <div>
          <p>आर्थिक वर्ष : ................</p>
          <p>माग फारम नं : FL-{serial(fuelLog.id)}</p>
          <p>मिति : {shortDate(fuelLog.logDate)}</p>
        </div>
      </div>
    </header>
  );
}

function SignBlock({
  title,
  name,
  date,
}: {
  title: string;
  name?: string;
  date?: string;
}) {
  return (
    <div className="sign-block">
      <p className="sign-title">{title} नं:........</p>
      <p>नाम: {valueText(name, "................................")}</p>
      <p>पद: ................................</p>
      <p>मिति: {valueText(date, "................................")}</p>
    </div>
  );
}

function DemandFormDocument({ fuelLog }: { fuelLog: FuelLog }) {
  return (
    <article className="fuel-sheet excel-demand-sheet">
      <section className="excel-header">
        <div className="excel-top-right">म.ले.प.फाराम नं : ४०१</div>
        <h1>लहान नगरपालिका</h1>
        <h2>नगर कार्यपालिकाको कार्यालय</h2>
        <h3>लहान, सिरहा</h3>
        <p>कार्यालय कोड नं.:………..</p>
        <div className="excel-blank-row" />
        <h4>माग फाराम</h4>
        <div className="excel-meta-grid">
          <span />
          <span>आर्थिक वर्ष :</span>
          <span />
          <span>माग फाराम नं: FL-{serial(fuelLog.id)}</span>
          <span />
          <span>मितिः {shortDate(fuelLog.logDate)}</span>
        </div>
      </section>

      <table className="demand-table excel-demand-table">
        <colgroup>
          <col className="col-sn" />
          <col className="col-item" />
          <col className="col-spec" />
          <col className="col-unit" />
          <col className="col-qty" />
          <col className="col-remarks" />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2}>क्र.सं.</th>
            <th rowSpan={2}>सामानको नाम</th>
            <th rowSpan={2}>स्पेसिफिकेसन</th>
            <th colSpan={2}>माग गरिएको</th>
            <th rowSpan={2}>कैफियत</th>
          </tr>
          <tr>
            <th>एकाइ</th>
            <th>परिमाण</th>
          </tr>
          <tr className="sub-count">
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>6</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>१</td>
            <td>{NEPALI_FUEL_TYPE_LABEL[fuelLog.fuelType]}</td>
            <td>
              {fuelLog.vehicleNumber
                ? `सवारी नं. ${fuelLog.vehicleNumber}`
                : "इन्धन"}
            </td>
            <td>लिटर</td>
            <td>{fuelLog.quantityLiters}</td>
            <td>{fuelLog.remarks || ""}</td>
          </tr>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="empty-row">
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          ))}
          <tr className="table-spacer">
            <td colSpan={6} />
          </tr>
        </tbody>
      </table>

      <section className="excel-sign-grid">
        <div className="excel-sign-cell">
          <p className="strong">माग गर्ने:……</p>
          <p>नामः {userName(fuelLog.requestedBy) || userName(fuelLog.user)}</p>
          <p>पद:</p>
          <p>मितिः {shortDate(fuelLog.createdAt)}</p>
          <p>प्रयोजनः {fuelLog.purpose}</p>
        </div>
        <div className="excel-sign-cell">
          <p className="strong">सिफारिस गर्ने:…….</p>
          <p>नामः</p>
          <p>पद:</p>
          <p>मितिः</p>
        </div>
        <div className="excel-sign-cell">
          <p className="strong center">स्टोरकिपरले भर्ने</p>
          <CheckboxLine label="क) बजारबाट खरिद गर्नु पर्ने" />
          <CheckboxLine label="ख) गोदाममा रहेको" />
          <p>स्टोरकिपरको दस्तखत:……..</p>
          <p>नाम:</p>
          <p className="strong">स्वीकृत गर्ने:……..</p>
          <p>नामः {userName(fuelLog.approvedBy)}</p>
          <p>पद:</p>
          <p>मितिः {fuelLog.approvedAt ? shortDate(fuelLog.approvedAt) : ""}</p>
        </div>
        <div className="excel-sign-cell lower">
          <p className="strong">मालसामान बुझिलिने:………</p>
          <p>नामः</p>
          <p>पद:</p>
          <p>मितिः</p>
        </div>
        <div className="excel-sign-cell lower">
          <p className="strong">खर्च निकासा खातामा चढाउने:……..</p>
          <p>नामः</p>
          <p>पद:</p>
          <p>मितिः</p>
        </div>
      </section>
    </article>
  );
}

function LogBookDocument({ fuelLog }: { fuelLog: FuelLog }) {
  return (
    <article className="fuel-sheet">
      <OfficialHeader fuelLog={fuelLog} documentTitle="सवारी साधन लग बुक" />

      <table className="log-table">
        <thead>
          <tr>
            <th>मिति</th>
            <th>सवारी नं.</th>
            <th>प्रयोगकर्ता</th>
            <th>प्रयोजन / रुट</th>
            <th>ओडोमिटर</th>
            <th>इन्धन</th>
            <th>परिमाण</th>
            <th>दस्तखत</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{shortDate(fuelLog.logDate)}</td>
            <td>{valueText(fuelLog.vehicleNumber)}</td>
            <td>{userName(fuelLog.user)}</td>
            <td>{fuelLog.purpose}</td>
            <td>{valueText(fuelLog.odometerReading)}</td>
            <td>{FUEL_TYPE_LABEL[fuelLog.fuelType]}</td>
            <td>{fuelLog.quantityLiters} लि.</td>
            <td />
          </tr>
          {Array.from({ length: 14 }).map((_, index) => (
            <tr key={index} className="empty-row">
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          ))}
        </tbody>
      </table>

      <section className="signature-strip">
        <SignBlock title="चालक / प्रयोगकर्ता" name={userName(fuelLog.user)} />
        <SignBlock title="जाँच गर्ने" />
        <SignBlock
          title="स्वीकृत गर्ने"
          name={userName(fuelLog.approvedBy)}
          date={fuelLog.approvedAt ? shortDate(fuelLog.approvedAt) : ""}
        />
      </section>
    </article>
  );
}

function FuelCouponDocument({ fuelLog }: { fuelLog: FuelLog }) {
  return (
    <article className="fuel-sheet coupon-sheet">
      <OfficialHeader fuelLog={fuelLog} documentTitle="फ्युल कुपन" />

      <section className="coupon-card">
        <div className="coupon-number">
          <span>कुपन नं.</span>
          <strong>FL-{serial(fuelLog.id)}</strong>
          <em>{fuelLog.approvalStatus}</em>
        </div>
        <div className="coupon-info">
          <div>
            <span>मिति</span>
            <strong>{shortDate(fuelLog.logDate)}</strong>
          </div>
          <div>
            <span>नाम</span>
            <strong>{userName(fuelLog.user)}</strong>
          </div>
          <div>
            <span>सवारी नं.</span>
            <strong>{valueText(fuelLog.vehicleNumber, "-")}</strong>
          </div>
          <div>
            <span>इन्धन</span>
            <strong>{FUEL_TYPE_LABEL[fuelLog.fuelType]}</strong>
          </div>
          <div>
            <span>परिमाण</span>
            <strong>{fuelLog.quantityLiters} लिटर</strong>
          </div>
          <div>
            <span>रकम</span>
            <strong>{money(fuelLog.totalAmount) || "-"}</strong>
          </div>
          <div className="wide">
            <span>प्रयोजन</span>
            <strong>{fuelLog.purpose}</strong>
          </div>
        </div>
      </section>

      <section className="signature-strip">
        <SignBlock title="माग गर्ने" name={userName(fuelLog.requestedBy)} />
        <SignBlock
          title="स्वीकृत गर्ने"
          name={userName(fuelLog.approvedBy)}
          date={fuelLog.approvedAt ? shortDate(fuelLog.approvedAt) : ""}
        />
        <SignBlock title="इन्धन दिने" />
      </section>

      <p className="coupon-note">
        यो कुपन माथि उल्लेखित मिति, सवारी साधन, इन्धन प्रकार र परिमाणका लागि
        मात्र मान्य हुनेछ।
      </p>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto h-[297mm] max-w-[210mm] animate-pulse rounded bg-white" />
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
        <Link
          href="/dashboard/fuel"
          className="inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fuel logs
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">
          Fuel paperwork unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The fuel log could not be loaded, so the printable paperwork cannot be
          generated.
        </p>
      </div>
    </div>
  );
}

function renderDocument(kind: FuelDocumentKind, fuelLog: FuelLog) {
  if (kind === "demand-form") return <DemandFormDocument fuelLog={fuelLog} />;
  if (kind === "log-book") return <LogBookDocument fuelLog={fuelLog} />;
  return <FuelCouponDocument fuelLog={fuelLog} />;
}

function FuelPrintContent({ mode }: { mode: FuelDocumentMode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autoPrint = searchParams.get("print") === "1";
  const hasAutoPrinted = useRef(false);
  const { data: fuelLog, isLoading, isError } = useFuelLog(id);
  const documents: FuelDocumentKind[] =
    mode === "all" ? ["demand-form", "log-book", "fuel-coupon"] : [mode];

  const printDocument = useCallback(() => {
    document.title =
      mode === "all"
        ? `fuel_documents_${fuelLog ? serial(fuelLog.id) : id}`
        : `${mode}_${fuelLog ? serial(fuelLog.id) : id}`;
    window.print();
  }, [fuelLog, id, mode]);

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current || !fuelLog) return;

    hasAutoPrinted.current = true;
    const timeout = window.setTimeout(printDocument, 300);
    return () => window.clearTimeout(timeout);
  }, [autoPrint, fuelLog, printDocument]);

  if (isLoading) return <LoadingState />;
  if (isError || !fuelLog) return <UnavailableState />;

  const label =
    mode === "all"
      ? "Print All Pages"
      : documentMeta[mode as FuelDocumentKind].printLabel;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/fuel"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fuel logs
        </Link>
        <nav className="flex flex-wrap gap-2">
          <Link className="doc-tab" href={`/dashboard/fuel/${id}/demand-form`}>
            माग फारम
          </Link>
          <Link className="doc-tab" href={`/dashboard/fuel/${id}/log-book`}>
            Log Book
          </Link>
          <Link className="doc-tab" href={`/dashboard/fuel/${id}/fuel-coupon`}>
            Fuel Coupon
          </Link>
          <Link className="doc-tab" href={`/dashboard/fuel/${id}/print`}>
            All
          </Link>
        </nav>
        <button
          type="button"
          onClick={printDocument}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          {label}
        </button>
      </div>

      <main className="mx-auto max-w-[210mm] space-y-5 print:max-w-none print:space-y-0">
        {documents.map((kind) => (
          <div key={kind}>{renderDocument(kind, fuelLog)}</div>
        ))}
      </main>

      <style jsx>{`
        .doc-tab {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 10px;
        }

        .fuel-sheet {
          background-color: #fff;
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.9),
              rgba(255, 255, 255, 0.9)
            ),
            url("/payment_bg_rec.png");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          border: 1px solid #1d4ed8;
          box-shadow: 0 20px 70px rgba(15, 23, 42, 0.18);
          min-height: 297mm;
          padding: 10mm;
          width: 210mm;
          page-break-after: always;
          break-after: page;
          color: #020617;
          font-family: Arial, "Noto Sans Devanagari", sans-serif;
        }

        .fuel-sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .official-header {
          text-align: center;
        }

        .top-line {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
        }

        .official-header h1 {
          font-size: 16px;
          font-weight: 800;
          line-height: 1.35;
        }

        .official-header h2,
        .official-header h3 {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }

        .official-header p {
          font-size: 11px;
          font-weight: 700;
          line-height: 1.7;
        }

        .official-header h4 {
          border-top: 1px solid #cbd5e1;
          font-size: 14px;
          font-weight: 900;
          margin-top: 4mm;
          padding-top: 3mm;
        }

        .rule-grid {
          background-image:
            linear-gradient(#e2e8f0 1px, transparent 1px),
            linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
          background-size: 48mm 8mm;
          height: 8mm;
          margin-top: 1mm;
        }

        .form-meta {
          display: grid;
          grid-template-columns: 1fr 55mm;
          margin-top: 2mm;
          text-align: left;
        }

        .excel-demand-sheet {
          padding: 7mm 8mm 0 14mm;
        }

        .excel-header {
          position: relative;
          text-align: center;
        }

        .excel-top-right {
          font-size: 10px;
          font-weight: 700;
          position: absolute;
          right: 0;
          top: 0;
        }

        .excel-header h1 {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.55;
          margin: 0;
        }

        .excel-header h2,
        .excel-header h3 {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.55;
          margin: 0;
        }

        .excel-header p {
          font-size: 10px;
          font-weight: 800;
          line-height: 1.55;
          margin: 0;
        }

        .excel-header h4 {
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.55;
          margin: 0;
          padding-top: 2mm;
        }

        .excel-blank-row {
          background-image: linear-gradient(
            90deg,
            #e5e7eb 1px,
            transparent 1px
          );
          background-size: 27mm 100%;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          height: 6mm;
          margin-top: 1mm;
        }

        .excel-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          grid-auto-rows: 6.1mm;
          margin-top: 0;
          text-align: left;
        }

        .excel-meta-grid span {
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          font-size: 11px;
          font-weight: 800;
          padding-left: 2mm;
        }

        .demand-table,
        .log-table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }

        .demand-table {
          margin-top: 5mm;
        }

        .excel-demand-table {
          margin-top: 0;
        }

        .excel-demand-table .col-sn {
          width: 8%;
        }

        .excel-demand-table .col-item {
          width: 29%;
        }

        .excel-demand-table .col-spec {
          width: 23%;
        }

        .excel-demand-table .col-unit {
          width: 15%;
        }

        .excel-demand-table .col-qty {
          width: 13%;
        }

        .excel-demand-table .col-remarks {
          width: 12%;
        }

        .demand-table th,
        .demand-table td,
        .log-table th,
        .log-table td {
          border: 1px solid #020617;
          font-size: 11px;
          line-height: 1.35;
          padding: 2.4mm 2mm;
          vertical-align: top;
        }

        .excel-demand-table th,
        .excel-demand-table td {
          font-size: 10.5px;
          height: 6.1mm;
          line-height: 1.25;
          padding: 1.4mm 1.6mm;
        }

        .demand-table th,
        .log-table th {
          font-weight: 900;
          text-align: center;
        }

        .demand-table td {
          height: 9mm;
        }

        .demand-table td:first-child,
        .sub-count td {
          text-align: center;
        }

        .empty-row td {
          height: 9mm;
        }

        .excel-demand-table .empty-row td {
          height: 6.1mm;
        }

        .excel-demand-table .table-spacer td {
          border-left-color: transparent;
          border-right-color: transparent;
          height: 4.2mm;
        }

        .excel-sign-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-height: 78mm;
        }

        .excel-sign-cell {
          background-image:
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
          background-size: 100% 6.1mm, 100% 100%;
          min-height: 42mm;
          padding: 1.8mm 2mm;
        }

        .excel-sign-cell.lower {
          min-height: 28mm;
        }

        .excel-sign-cell p,
        .excel-sign-cell .check-line {
          font-size: 10.5px;
          line-height: 1.85;
          min-height: 5.7mm;
        }

        .excel-sign-cell .strong {
          font-weight: 900;
        }

        .excel-sign-cell .center {
          text-align: center;
        }

        .demand-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 8mm;
        }

        .sign-block,
        .store-block {
          border-bottom: 1px solid #e2e8f0;
          min-height: 36mm;
          padding: 2mm;
        }

        .sign-title {
          font-weight: 900;
        }

        .sign-block p,
        .store-block p,
        .check-line {
          font-size: 11px;
          line-height: 1.8;
        }

        .check-line {
          align-items: center;
          display: flex;
          justify-content: space-between;
        }

        .box {
          border: 1px solid #020617;
          display: inline-block;
          height: 5mm;
          width: 5mm;
        }

        .purpose-line {
          align-items: baseline;
          display: grid;
          gap: 4mm;
          grid-template-columns: 22mm 1fr;
          margin-top: 5mm;
          font-size: 11px;
        }

        .purpose-line strong {
          border-bottom: 1px dotted #020617;
          min-height: 8mm;
          padding-bottom: 1mm;
        }

        .log-table {
          margin-top: 7mm;
        }

        .log-table th,
        .log-table td {
          font-size: 10px;
        }

        .signature-strip {
          display: grid;
          gap: 7mm;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 12mm;
        }

        .signature-strip .sign-block {
          border: 1px solid #020617;
          min-height: 31mm;
          padding: 4mm;
        }

        .coupon-card {
          border: 2px solid #020617;
          display: grid;
          grid-template-columns: 58mm 1fr;
          margin-top: 14mm;
          min-height: 92mm;
        }

        .coupon-number {
          align-items: center;
          border-right: 2px solid #020617;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .coupon-number span {
          font-size: 12px;
          font-weight: 900;
        }

        .coupon-number strong {
          font-family: Consolas, "Courier New", monospace;
          font-size: 28px;
          margin-top: 4mm;
        }

        .coupon-number em {
          border: 1px solid #020617;
          font-size: 11px;
          font-style: normal;
          font-weight: 900;
          margin-top: 5mm;
          padding: 2mm 5mm;
        }

        .coupon-info {
          display: grid;
          gap: 3mm;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          padding: 6mm;
        }

        .coupon-info div {
          border-bottom: 1px dotted #020617;
          min-height: 12mm;
        }

        .coupon-info .wide {
          grid-column: 1 / -1;
        }

        .coupon-info span {
          color: #475569;
          display: block;
          font-size: 10px;
          font-weight: 800;
        }

        .coupon-info strong {
          display: block;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 1mm;
        }

        .coupon-note {
          border: 1px solid #020617;
          font-size: 11px;
          line-height: 1.7;
          margin-top: 8mm;
          padding: 4mm;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          .no-print,
          .no-print * {
            display: none !important;
          }

          .fuel-sheet {
            box-shadow: none;
            min-height: 297mm;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export function FuelPrintDocuments({ mode }: { mode: FuelDocumentMode }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <FuelPrintContent mode={mode} />
    </Suspense>
  );
}
