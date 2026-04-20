"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompany } from "@/hooks/company/useCompany";
import { useContracts } from "@/hooks/contract/useContracts";
import {
  getCompanyContractCount,
  getCompanyIsContracted,
} from "@/lib/schema/company.schema";
import { isApprovedStatus } from "@/lib/schema/approval";
import { toFormalNepaliDate } from "@/lib/date-utils";
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, User, Calendar, 
  FileText, CheckCircle2, XCircle, Pencil, Receipt, 
  FileBadge, Briefcase, FileSignature, Activity, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CompanyViewPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: company, isLoading: isLoadingCompany, isError } = useCompany(id);
  const { data: companyContracts = [], isLoading: isLoadingContracts } = useContracts({ companyId: id });

  // Helper to format dates gracefully
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return {
      ad: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      bs: toFormalNepaliDate(date)
    };
  };

  const reqDate = formatDate(company?.registrationRequestDate);
  const regDate = formatDate(company?.registrationDate);

  if (isLoadingCompany || isLoadingContracts) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] md:col-span-2" />
          <Skeleton className="h-[300px] md:col-span-1" />
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20 space-y-4">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Company Not Found</h2>
        <p className="text-muted-foreground">The company you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard/companies">
          <Button variant="outline">Return to Companies list</Button>
        </Link>
      </div>
    );
  }

  const contractCount = getCompanyContractCount(company, companyContracts.length);
  const isContracted = getCompanyIsContracted(company, companyContracts.length);
  const showCertificate = isApprovedStatus(company.approvalStatus);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-4">
          <Link href="/dashboard/companies">
            <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {company.name}
              </h1>
              <Badge variant="secondary" className={
                company.category === 'WORKS' ? 'bg-blue-100 text-blue-800' :
                company.category === 'SUPPLY' ? 'bg-green-100 text-green-800' :
                company.category === 'CONSULTING' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }>
                {company.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{company.address}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/companies/${company.id}/edit`}>
            <Button variant="outline" className="gap-2 bg-white">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          </Link>
          {showCertificate ? (
            <Link href={`/dashboard/companies/${company.id}/certificate`}>
              <Button className="gap-2">
                <FileBadge className="h-4 w-4" /> View Certificate
              </Button>
            </Link>
          ) : (
            <Button className="gap-2" disabled>
              <FileBadge className="h-4 w-4" /> Certificate After Approval
            </Button>
          )}
        </div>
      </div>

      {/* ── NEW: Analytics / Metrics Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full text-blue-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {company._count?.projects || 0}
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Projects</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-100 bg-green-50/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-green-100 rounded-full text-green-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Running Projects</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-100 bg-purple-50/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-purple-100 rounded-full text-purple-700">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {contractCount}
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Contracts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-100 bg-orange-50/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-orange-100 rounded-full text-orange-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">—</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ── Left Column: Main Details ── */}
        <div className="md:col-span-2 space-y-6">
          
          {/* General Information */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">PAN / VAT Number</p>
                <p className="text-base font-semibold font-mono bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded border">
                  {company.panNumber}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Receipt className="h-4 w-4" /> Voucher Number
                </p>
                <p className="text-base font-medium">
                  {company.voucherNo || <span className="text-muted-foreground italic">Not provided</span>}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Remarks / Notes
                </p>
                <p className="text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border">
                  {company.remarks || <span className="text-muted-foreground italic">No remarks added.</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Dates */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Registration Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Request Date */}
              <div className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">Registration Request Date</p>
                  <p className="text-sm text-muted-foreground mt-1">Date when the company applied for registry.</p>
                </div>
                <div className="text-right">
                  {reqDate ? (
                    <>
                      <p className="font-semibold text-blue-700">{reqDate.bs}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reqDate.ad}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">N/A</span>
                  )}
                </div>
              </div>

              {/* Approval Date */}
              <div className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">Registration Approval Date</p>
                  <p className="text-sm text-muted-foreground mt-1">Date when the registration was officially approved.</p>
                </div>
                <div className="text-right">
                  {regDate ? (
                    <>
                      <p className="font-semibold text-green-700">{regDate.bs}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{regDate.ad}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">N/A</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ── Right Column: Actions, Contact & Status ── */}
        <div className="space-y-6">

          {/* NEW: Quick Links */}
          <Card className="shadow-sm border-slate-200">
             <CardHeader className="bg-slate-50/50 border-b pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-700 font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200">
                 <Briefcase className="mr-3 h-4 w-4" /> View All Projects
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-purple-700 hover:bg-purple-50 border-slate-200">
                 <FileSignature className="mr-3 h-4 w-4" /> View Contracts
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-green-700 hover:bg-green-50 border-slate-200">
                 <Activity className="mr-3 h-4 w-4" /> Project Timeline
              </Button>
            </CardContent>
          </Card>
          
          {/* Contact Information */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                <p className="font-medium">{company.contactPerson || "N/A"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone Number
                </p>
                {company.phoneNumber ? (
                  <a href={`tel:${company.phoneNumber}`} className="font-medium text-blue-600 hover:underline">
                    {company.phoneNumber}
                  </a>
                ) : (
                  <p className="font-medium text-muted-foreground italic">N/A</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </p>
                {company.email ? (
                  <a href={`mailto:${company.email}`} className="font-medium text-blue-600 hover:underline break-all">
                    {company.email}
                  </a>
                ) : (
                  <p className="font-medium text-muted-foreground italic">N/A</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Status */}
          <Card className="shadow-sm border-blue-100">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-blue-800 dark:text-blue-300 font-semibold">
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PAN Verified</span>
                {company.panVerified ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 pr-2">
                    <CheckCircle2 className="h-3 w-3" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1 pr-2">
                    <XCircle className="h-3 w-3" /> Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Contract</span>
                {isContracted ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-2">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                    None
                  </Badge>
                )}
              </div>
              
              <div className="pt-2 text-xs text-muted-foreground text-center border-t mt-4">
                Registered: {new Date(company.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" /> Contract Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Milestone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody>
                {companyContracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No contracts are linked to this company yet.
                    </td>
                  </tr>
                ) : (
                  companyContracts.map((contract) => (
                    <tr key={contract.id} className="border-t">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="font-mono font-semibold text-primary hover:underline"
                          >
                            {contract.contractNumber}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            Rs. {Number(contract.contractAmount).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {contract.project?.name ?? "Unlinked Project"}
                      </td>
                      <td className="px-6 py-4">
                        <ContractStatusBadge status={contract.status} />
                      </td>
                      <td className="px-6 py-4">
                        <ApprovalStatusBadge status={contract.approvalStatus} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>Start: {toFormalNepaliDate(contract.startDate)}</div>
                        <div className="text-muted-foreground">
                          Intended End: {toFormalNepaliDate(contract.intendedCompletionDate)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
