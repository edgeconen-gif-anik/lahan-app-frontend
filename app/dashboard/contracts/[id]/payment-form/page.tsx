"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Noto_Sans_Devanagari } from "next/font/google";
import { useContract } from "@/hooks/contract/useContracts";

const devanagariFont = Noto_Sans_Devanagari({
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  display: "swap",
});

function formatAmount(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "";

  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function PaymentFormLoading() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-[210mm] space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    </div>
  );
}

function PaymentFormUnavailable({
  contractId,
  reason,
}: {
  contractId: string;
  reason: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <Link
          href={`/dashboard/contracts/${contractId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to contract
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">
          Payment form unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{reason}</p>
      </div>
    </div>
  );
}

function PaymentFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractId = params.id as string;
  const autoPrint = searchParams.get("print") === "1";
  const hasAutoPrinted = useRef(false);
  const { data: contract, isLoading, error } = useContract(contractId);

  const printDocument = useCallback(() => {
    document.title = `payment_form_${contract?.contractNumber ?? contractId}`;
    window.print();
  }, [contract?.contractNumber, contractId]);

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current || !contract) return;

    hasAutoPrinted.current = true;
    const timeout = window.setTimeout(printDocument, 300);

    return () => window.clearTimeout(timeout);
  }, [autoPrint, contract, printDocument]);

  if (isLoading) {
    return <PaymentFormLoading />;
  }

  if (error || !contract) {
    return (
      <PaymentFormUnavailable
        contractId={contractId}
        reason="The payment recommendation form could not be generated because the contract details could not be loaded."
      />
    );
  }

  if (contract.status !== "COMPLETED" || !contract.completionCode) {
    return (
      <PaymentFormUnavailable
        contractId={contract.id}
        reason="This form is available only after project completion, when the contract has a generated completion code."
      />
    );
  }

  const finalEvaluatedAmount = formatAmount(contract.finalEvaluatedAmount);
  const projectName = contract.project?.name ?? "";

  return (
    <div
      className={`${devanagariFont.className} min-h-screen bg-slate-100 px-4 py-5 text-slate-950 print:bg-white print:px-0 print:py-0`}
    >
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          href={`/dashboard/contracts/${contract.id}`}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to contract
        </Link>
        <button
          type="button"
          onClick={printDocument}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          <Printer size={16} />
          Print
        </button>
      </div>

      <article className="payment-form-sheet mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] shadow-xl print:min-h-0 print:max-w-none print:px-[12mm] print:py-[8mm] print:shadow-none">
        <header className="text-center leading-tight">
          <h1 className="text-[18px] font-semibold">लहान नगरपालिका</h1>
          <p className="text-[16px] font-medium">नगर कार्यपालिकको कार्यालय</p>
          <p className="text-[14px]">कार्यालय कोड : ८०१०२१६०६</p>
          <h2 className="mt-4 text-[20px] font-bold">
            भुक्तानी कारोवारको सिफारिस पत्र
          </h2>
        </header>

        <div className="mt-5 flex justify-center">
          <table className="code-table text-[13px]">
            <tbody>
              <tr>
                <th>CONTRACT CODE</th>
                <td>{contract.contractNumber}</td>
              </tr>
              <tr>
                <th>COMPLETION CODE</th>
                <td>{contract.completionCode}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-4 text-[13px] leading-6">
          <p>श्री आर्थिक प्रशासन शाखा</p>
          <p>
            देहायको कारोबारको भुक्तानी तथा लेखाङकनका लागि सिफारिस गरिएको छ ।
          </p>
        </section>

        <table className="payment-table mt-4 text-[11px]">
          <thead>
            <tr>
              <th>क्र.स.</th>
              <th>कारोबारको विवरण</th>
              <th>पुष्टायाँई गर्ने कागजातको विवरण</th>
              <th>कारोबार रकम</th>
              <th>निर्णय गर्ने पदाधिकारीको नाम</th>
              <th>टिप्पणी निर्णय मिति</th>
            </tr>
            <tr className="number-row">
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
              <td>1</td>
              <td>योजना को नाम</td>
              <td />
              <td />
              <td>लहान नगरपालिका</td>
              <td />
            </tr>
            <tr className="tall-row">
              <td />
              <td>{projectName}</td>
              <td>3.1&nbsp; Measurement Book</td>
              <td>{finalEvaluatedAmount}</td>
              <td />
              <td />
            </tr>
            <tr>
              <td />
              <td />
              <td>3.2 Contract Bill</td>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <td />
              <td />
              <td>3.3 Work Completion Report</td>
              <td />
              <td />
              <td />
            </tr>
            {[
              "3.3 Project Photos",
              "3.4 Red book Copy",
              "3.5 VAT Bill",
              "3.6 Agreement Paper",
              "3.7 Comperative Chart",
              "3.8 Tippni Approval",
              "3.9 Eastimate",
            ].map((item) => (
              <tr key={item}>
                <td />
                <td />
                <td>{item}</td>
                <td />
                <td />
                <td />
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={3}>जम्मा</td>
              <td>{finalEvaluatedAmount}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>

        <p className="border-box mt-0 text-[12px] leading-6">
          उपरोक्त कारोबारको भुक्तानीको लागि खर्च शीर्षक नं. ……….. बाट भुक्तानी
          गर्न सिफारिस गर्दछु ।
        </p>

        <section className="mt-5 grid grid-cols-2 gap-8 text-[12px] leading-6">
          <div className="space-y-1">
            <p>आर्थिक प्रशासन शाखा :……….</p>
            <p>प्राप्त गर्ने वा बुझिलिनेको नाम :-</p>
            <p>पद: अधिकृत ( आर्थिक शाखा )</p>
            <p>मिति:</p>
          </div>
          <div className="space-y-1">
            <p>सिफारिस गर्ने:………...</p>
            <p>पदाधिकारी/कर्मचारीको नाम : ई अनिक यादव</p>
            <p>पद: इन्जिनियर</p>
            <p>सम्बद्ध शाखा/महाशाखा: योजना शाखा</p>
          </div>
        </section>

        <section className="mt-6 text-[11px] leading-5">
          <p className="font-semibold">उद्देश्यः</p>
          <p className="border-box mt-1">
            आर्थिक प्रशासन शाखामा अन्य महाशाखा/शाखाहरूबाट आवश्यक कागजात सहित
            भुक्तानी तथा पेस्की फर्छ्यौट गर्न सिफारिस गर्नु यो फारामको उद्देश्य
            हो ।
          </p>
        </section>
      </article>

      <style jsx>{`
        .code-table {
          border-collapse: collapse;
          min-width: 88mm;
        }

        .code-table th,
        .code-table td {
          border: 1px solid #111827;
          padding: 5px 10px;
          text-align: left;
        }

        .code-table th {
          width: 38mm;
          font-family: Arial, sans-serif;
          font-weight: 700;
        }

        .code-table td {
          font-family: Consolas, "Courier New", monospace;
          font-weight: 700;
        }

        .payment-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .payment-table th,
        .payment-table td {
          border: 1px solid #111827;
          padding: 4px 5px;
          vertical-align: middle;
        }

        .payment-table th {
          text-align: center;
          font-weight: 700;
        }

        .payment-table th:nth-child(1),
        .payment-table td:nth-child(1) {
          width: 9%;
          text-align: center;
        }

        .payment-table th:nth-child(2),
        .payment-table td:nth-child(2) {
          width: 24%;
        }

        .payment-table th:nth-child(3),
        .payment-table td:nth-child(3) {
          width: 28%;
        }

        .payment-table th:nth-child(4),
        .payment-table td:nth-child(4) {
          width: 14%;
          text-align: right;
        }

        .payment-table th:nth-child(5),
        .payment-table td:nth-child(5) {
          width: 14%;
        }

        .payment-table th:nth-child(6),
        .payment-table td:nth-child(6) {
          width: 11%;
          text-align: center;
        }

        .number-row td,
        .total-row td {
          text-align: center;
          font-weight: 700;
        }

        .tall-row td {
          min-height: 42px;
          height: 42px;
        }

        .border-box {
          border: 1px solid #111827;
          padding: 5px;
        }

        .payment-form-sheet {
          background-image: url("/payment_bg_rec.png");
          background-position: center;
          background-repeat: no-repeat;
          background-size: 100% 100%;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
        }
      `}</style>
    </div>
  );
}

export default function PaymentFormPage() {
  return (
    <Suspense fallback={<PaymentFormLoading />}>
      <PaymentFormContent />
    </Suspense>
  );
}
