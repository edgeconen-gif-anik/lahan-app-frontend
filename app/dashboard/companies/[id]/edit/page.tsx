"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyForm } from "@/shared/company-form"; // ✅ Adjust path if it's in @/components/company-form
import { useCompany, useUpdateCompany } from "@/hooks/company/useCompany";
import { CompanyFormValues } from "@/lib/schema/company.schema";

export default function EditCompanyPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  // 1. Fetch existing company data
  const { data: company, isLoading: isFetching, isError } = useCompany(id);
  
  // 2. Setup the update mutation
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

  // 3. Handle Submit
  const handleSubmit = (formData: CompanyFormValues) => {
    // The useUpdateCompany hook expects an object with { id, payload }
    updateCompany({ id, payload: formData });
  };

  // ── Loading State ──
  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error State ──
  if (isError || !company) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 space-y-4">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Company Not Found</h2>
        <p className="text-muted-foreground">Unable to load data for editing. It may have been deleted.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // ── Prepare Default Values ──
  // The API returns dates as ISO strings ("2024-01-10T00:00:00.000Z").
  // Our Zod schema and Form component expect actual JS Date objects.
  const defaultFormValues: Partial<CompanyFormValues> = {
    name: company.name,
    panNumber: String(company.panNumber), // Ensure it's a string for the input
    voucherNo: company.voucherNo || "",
    category: company.category,
    address: company.address,
    contactPerson: company.contactPerson || "",
    phoneNumber: company.phoneNumber || "",
    email: company.email || "",
    remarks: company.remarks || "",
    // Convert string dates to Date objects safely
    registrationRequestDate: company.registrationRequestDate ? new Date(company.registrationRequestDate) : undefined,
    registrationDate: company.registrationDate ? new Date(company.registrationDate) : undefined,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="pl-0 gap-2 hover:bg-transparent hover:text-primary"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card className="shadow-sm border-muted">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b mb-6">
          <CardTitle className="text-2xl text-primary">Edit Company Profile</CardTitle>
          <CardDescription className="text-sm">
            Update the details for <strong>{company.name}</strong>.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <CompanyForm 
            defaultValues={defaultFormValues} 
            onSubmit={handleSubmit} 
            isLoading={isUpdating} 
            buttonText="Save Changes" 
          />
        </CardContent>
      </Card>
    </div>
  );
}