'use client';

import { useParams } from 'next/navigation';
import { useCompany } from '@/hooks/company/useCompany';
import { toNepaliDate } from '@/lib/date-utils'; 
import { categoryLabel } from '@/lib/category';
import { isApprovedStatus } from '@/lib/schema/approval';
import { FaPrint, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code'; 

// ✅ 1. Import Google Font optimized for Next.js
import { Noto_Sans_Devanagari } from 'next/font/google';

// ✅ 2. Initialize the Devanagari font
const devanagariFont = Noto_Sans_Devanagari({
  weight: ['400', '500', '600', '700'],
  subsets: ['devanagari'],
  display: 'swap',
});

// Helper function to convert English digits to Nepali Unicode
const toNepaliDigits = (str: string | number | undefined | null): string => {
  if (!str || str === "N/A" || str === "Invalid Date") return '';
  const npDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(str).replace(/\d/g, (match) => npDigits[parseInt(match, 10)]);
};

export default function CompanyCertificatePage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: company, isLoading, isError } = useCompany(id);
  const verificationUrl =
    typeof window !== "undefined" && company?.id
      ? `${window.location.origin}/dashboard/companies/${company.id}`
      : "";

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 text-lg text-muted-foreground">
        <FaSpinner className="mb-4 h-8 w-8 animate-spin text-primary" />
        Generating Certificate...
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="text-center text-lg mt-20 text-red-600 space-y-4">
        <p>Failed to load company details or company not found.</p>
        <Link href="/dashboard/companies">
          <Button variant="outline">Return to Companies</Button>
        </Link>
      </div>
    );
  }

  if (!isApprovedStatus(company.approvalStatus)) {
    return (
      <div className="text-center text-lg mt-20 space-y-4">
        <p>Certificate is available only after the company has been approved.</p>
        <Link href={`/dashboard/companies/${company.id}`}>
          <Button variant="outline">Back to Company Profile</Button>
        </Link>
      </div>
    );
  }

  const requestDateBs = company.registrationRequestDate 
    ? toNepaliDate(company.registrationRequestDate) 
    : "";
    
  const registrationDateBs = company.registrationDate
    ? toNepaliDate(company.registrationDate)
    : "";

  const shortUid = company.id ? `CMP-${company.id.substring(0, 7).toUpperCase()}-8283` : "";

  return (
    <div className="bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans min-h-screen">
      
      {/* Action Bar */}
      <div className="no-print mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-[210mm] mx-auto">
        <Link href={`/dashboard/companies/${company.id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 transform rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95"
        >
          <FaPrint />
          <span>Print Certificate</span>
        </button>
      </div>

      {/* Certificate Container for screen view */}
      <div className="certificate-container relative w-full max-w-[210mm] mx-auto shadow-2xl bg-white aspect-[1/1.414]">
        
        {/* Background letterhead image */}
        <img
          src="/letter.png" 
          alt="Letterhead"
          className="absolute inset-0 w-full h-full object-contain z-0"
        />

        {/* ✅ 3. Apply the Font Class Here */}
        <div className={`relative z-10 pt-[40%] px-16 text-black text-[16px] leading-loose ${devanagariFont.className}`}>
           <p className="text-right mb-4">
            मिति:{' '}
            <span className="font-semibold">
              {toNepaliDigits(requestDateBs)}
            </span>
          </p>

          <h2 className="text-center font-bold mt-4 mb-6 text-xl underline underline-offset-4">
            मौजुदा सूचीमा दर्ता भएको प्रमाणपत्र
          </h2>

          <div className='space-y-1 font-medium'>
            <p>यू.आइ.डी नं (UID): <strong className="ml-2 font-mono tracking-wider">{shortUid}</strong></p>
            <p>भौचर नं (Voucher No): <strong className="ml-2">{toNepaliDigits(company.voucherNo) || "..................."}</strong></p>
            <p>सूची दर्ता नं: <span className='ml-2'>...................</span></p>
            <p>स्थायी लेखा नम्बर (PAN): <strong className="ml-2">{toNepaliDigits(company.panNumber)}</strong></p>
          </div>

          <p className="mt-6 indent-8 text-justify">
            श्री <strong>{company.name}</strong>,{' '}
            <strong>{company.address}</strong> बाट यस लहान नगरपालिकाको
            कार्यालयमा आर्थिक वर्ष <strong>{toNepaliDigits('२०८२/८३')}</strong>{' '}
            का लागि <strong>{categoryLabel(company.category)}</strong> प्रयोजनार्थ
            मौजुदा सूचीमा सूचीकृत हुन पाउँ भनि मिति{' '}
            <strong>{toNepaliDigits(requestDateBs)}</strong> मा यस
            कार्यालयमा निवेदन प्राप्त भएको हुँदा मौजुदा सूचीमा दर्ता गरी यो
            निस्सा/प्रमाण उपलव्ध गराइएको छ ।
          </p>

          {/* Bottom Section: QR Code & Signature */}
          <div className="mt-20 flex justify-between items-end">
            
            {/* QR Code Block */}
            <div className="flex flex-col items-center border-2 border-slate-200 p-2 rounded-md bg-white">
              {verificationUrl ? (
                <QRCode value={verificationUrl} size={80} level="M" />
              ) : (
                <div className="w-[80px] h-[80px] bg-slate-100" />
              )}
              {/* Keep the small text below QR code in standard font if you prefer, or let it inherit */}
              <span className="text-[10px] mt-1 text-slate-500 font-medium font-sans">Scan to Verify</span>
              <span className="text-[9px] font-mono text-slate-400">{shortUid}</span>
            </div>

            {/* Signature Block */}
            <div className="text-left space-y-2 text-[15px]">
              {/* ✅ Added underline and underline-offset-4 to this specific line */}
              <p className="font-semibold mb-6 underline underline-offset-4">दर्ता गर्ने अधिकारी</p>
              <p>........................................</p>
              <p><span className="font-medium">नाम:</span> ई. अनिक यादव</p>
              <p><span className="font-medium">पद:</span> ईन्जिनियर</p>
              <p>
                <span className="font-medium">मिति:</span>{" "}
                {registrationDateBs ? toNepaliDigits(registrationDateBs) : "—"}
              </p>
            </div>
            
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
            box-sizing: border-box;
          }
          body * {
            visibility: hidden;
          }
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: #fff;
            margin: 0;
            padding: 0;
          }
          .certificate-container, .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;  
            height: 297mm;  
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            overflow: hidden; 
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
