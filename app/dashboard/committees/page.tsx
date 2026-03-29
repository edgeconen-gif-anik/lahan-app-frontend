"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useUserCommittees,
  useApproveUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";
import type {
  CommitteeOfficial,
  UserCommitteeRecord,
} from "@/services/user-committe/userCommittee.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { CheckCircle2, Eye, Plus, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const getOfficialDetails = (officials: CommitteeOfficial[], role: string) => {
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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const { data: committeesData, isLoading } = useUserCommittees({ search });
  const { mutate: approveCommittee, isPending: isApprovingCommittee } =
    useApproveUserCommittee();

  const committeesList = Array.isArray(committeesData)
    ? committeesData
    : committeesData?.data || [];

  return (
    <div className="space-y-6 p-6 max-w-full mx-auto overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Committees</h2>
          <p className="text-muted-foreground">
            Manage committee registrations and send new entries for admin approval.
          </p>
        </div>
        <Link href="/dashboard/committees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Register Committee
          </Button>
        </Link>
      </div>

      <div className="flex items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by committee name, address, or official..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-bold" rowSpan={2}>S.No</TableHead>
              <TableHead className="font-bold" rowSpan={2}>Committee</TableHead>
              <TableHead className="text-center font-bold border-x" colSpan={3}>Officials</TableHead>
              <TableHead className="font-bold" rowSpan={2}>Formed Date</TableHead>
              <TableHead className="font-bold" rowSpan={2}>Bank Name</TableHead>
              <TableHead className="font-bold" rowSpan={2}>Account No.</TableHead>
              <TableHead className="font-bold" rowSpan={2}>Approval</TableHead>
              <TableHead className="text-right font-bold" rowSpan={2}>Actions</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="font-semibold bg-muted/30 border-l border-b-0">President</TableHead>
              <TableHead className="font-semibold bg-muted/30 border-x border-b-0">Secretary</TableHead>
              <TableHead className="font-semibold bg-muted/30 border-r border-b-0">Treasurer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /><br /><Skeleton className="h-3 w-32 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : committeesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No committees found.
                </TableCell>
              </TableRow>
            ) : (
              committeesList.map((committee: UserCommitteeRecord, index: number) => (
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

                  <TableCell className="border-l">{getOfficialDetails(committee.officials, "PRESIDENT")}</TableCell>
                  <TableCell className="border-x">{getOfficialDetails(committee.officials, "SECRETARY")}</TableCell>
                  <TableCell className="border-r">{getOfficialDetails(committee.officials, "TREASURER")}</TableCell>

                  <TableCell>{new Date(committee.formedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{committee.bankName}</TableCell>
                  <TableCell className="font-mono text-sm">{committee.accountNumber}</TableCell>
                  <TableCell>
                    <ApprovalStatusBadge status={committee.approvalStatus} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && committee.approvalStatus !== "APPROVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isApprovingCommittee}
                          onClick={() => approveCommittee(committee.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                        </Button>
                      )}
                      <Link href={`/dashboard/committees/${committee.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                      </Link>
                    </div>
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
