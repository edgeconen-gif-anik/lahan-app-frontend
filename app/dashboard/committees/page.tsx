// app/dashboard/committees/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to extract official details safely
const getOfficialDetails = (officials: any[], role: string) => {
  const official = officials?.find((o) => o.role === role);
  if (!official) return "-";
  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">{official.name}</span>
      <span className="text-xs text-muted-foreground">{official.phoneNumber}</span>
    </div>
  );
};

export default function CommitteeLandingPage() {
  const [search, setSearch] = useState("");
  const { data: committeesData, isLoading } = useUserCommittees({ search });
  
  const committeesList = Array.isArray(committeesData) ? committeesData : committeesData?.data || [];

  return (
    <div className="space-y-6 p-6 max-w-full mx-auto overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">उपभोक्ता समितिको लगत (User Committees)</h2>
          <p className="text-muted-foreground">अनुसूची-१ बमोजिम उपभोक्ता समितिको विवरण सङ्कलन र व्यवस्थापन (Manage local beneficiary committees based on Schedule-1).</p>
        </div>
        <Link href="/dashboard/committees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> नयाँ दर्ता (Register)
          </Button>
        </Link>
      </div>

      <div className="flex items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Committee Name, Address, or Official..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-bold" rowSpan={2}>क्र.स.<br/>(S.No)</TableHead>
              <TableHead className="font-bold" rowSpan={2}>उपभोक्ता समितिको नाम र ठेगाना<br/>(Name & Address)</TableHead>
              <TableHead className="text-center font-bold border-x" colSpan={3}>पदाधिकारीको नाम र सम्पर्क नं.<br/>(Officials' Name & Contact)</TableHead>
              <TableHead className="font-bold" rowSpan={2}>गठन मिति<br/>(Formed Date)</TableHead>
              <TableHead className="font-bold" rowSpan={2}>बैंकको नाम<br/>(Bank Name)</TableHead>
              <TableHead className="font-bold" rowSpan={2}>खाता नं.<br/>(Account No.)</TableHead>
              <TableHead className="text-right font-bold" rowSpan={2}>Actions</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="font-semibold bg-muted/30 border-l border-b-0">अध्यक्ष (President)</TableHead>
              <TableHead className="font-semibold bg-muted/30 border-x border-b-0">सचिव (Secretary)</TableHead>
              <TableHead className="font-semibold bg-muted/30 border-r border-b-0">कोषाध्यक्ष (Treasurer)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /><br/><Skeleton className="h-3 w-32 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : committeesList.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                   कुनै पनि उपभोक्ता समिति फेला परेन। (No committees found.)
                 </TableCell>
               </TableRow>
            ) : (
              committeesList.map((committee: any, index: number) => (
                <TableRow key={committee.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  
                  <TableCell className="font-medium text-primary flex-col gap-1 items-start">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/dashboard/committees/${committee.id}`} className="hover:underline font-semibold">
                        {committee.name}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 ml-6">
                      {committee.address}
                    </div>
                  </TableCell>
                  
                  <TableCell className="border-l">{getOfficialDetails(committee.officials, 'PRESIDENT')}</TableCell>
                  <TableCell className="border-x">{getOfficialDetails(committee.officials, 'SECRETARY')}</TableCell>
                  <TableCell className="border-r">{getOfficialDetails(committee.officials, 'TREASURER')}</TableCell>

                  <TableCell>{new Date(committee.formedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{committee.bankName}</TableCell>
                  <TableCell className="font-mono text-sm">{committee.accountNumber}</TableCell>
                  
                  <TableCell className="text-right">
                    <Link href={`/dashboard/committees/${committee.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" /> हेर्नुहोस् (View)
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}