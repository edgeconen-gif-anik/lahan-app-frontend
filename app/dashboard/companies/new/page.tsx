"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CompanyForm } from "@/shared/company-form"; // ✅ Using your updated path
import { useCreateCompany } from "@/hooks/company/useCompany";

export default function NewCompanyPage() {
  const { mutate, isPending } = useCreateCompany();
  
  // ✅ STATE: Track if the user has completed the mandatory PAN verification step
  const [hasVerifiedPan, setHasVerifiedPan] = useState(false);

  const handleSubmit = (data: any) => {
    // If your backend complains about panNumber being a string instead of a number:
    // const payload = { ...data, panNumber: Number(data.panNumber) };
    // mutate(payload);
    
    mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/companies">
        <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
      </Link>

      {!hasVerifiedPan ? (
        /* ── STEP 1: Mandatory PAN Verification Prompt ── */
        <Card className="shadow-sm border-orange-200 dark:border-orange-900">
          <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900 mb-6 pb-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-orange-600" />
              <CardTitle className="text-2xl text-orange-700 dark:text-orange-500">Mandatory Step: Verify PAN</CardTitle>
            </div>
            <CardDescription className="text-sm mt-2">
              To ensure data accuracy and prevent fake or incorrect entries, you must verify the company's PAN details from the official Inland Revenue Department (IRD) portal before filling out this form.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="bg-slate-50 border-slate-200">
              <AlertTitle className="font-semibold text-slate-800">Instructions:</AlertTitle>
              <AlertDescription className="text-slate-600 mt-2 space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the button below to open the IRD Nepal PAN Search portal.</li>
                  <li>Enter the PAN provided by the contractor/supplier.</li>
                  <li>Verify the Exact Registered Name, Address, and Status.</li>
                  <li>Return to this page and click "Proceed to Registration".</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center py-4">
              <a 
                href="https://ird.gov.np/pan-search/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="w-full sm:w-auto gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <ExternalLink className="h-4 w-4" /> Open IRD PAN Search Portal
                </Button>
              </a>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/50 border-t p-6 flex justify-end">
            <Button 
              onClick={() => setHasVerifiedPan(true)} 
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> I have verified the PAN, Proceed
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* ── STEP 2: The Actual Registration Form ── */
        <Card className="shadow-sm border-muted animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b mb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-primary flex items-center gap-2">
                  Register New Company
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Enter the verified details of the contractor or supplier below.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setHasVerifiedPan(false)}
                className="text-muted-foreground hover:text-primary text-xs"
              >
                Go back to verification
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <CompanyForm 
              onSubmit={handleSubmit} 
              isLoading={isPending} 
              buttonText="Register Company" 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}