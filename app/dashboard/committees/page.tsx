"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useAllUserCommittees,
  useApproveUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";
import type {
  CommitteeOfficial,
  UserCommitteeRecord,
} from "@/services/user-committe/userCommittee.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { RegistrationInitiatorCell } from "@/components/registration-initiator-cell";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiscalYears, useSystemSetup } from "@/hooks/setup/useSetup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApprovalStatus } from "@/lib/schema/approval";

type ApprovalFilter = "ALL" | ApprovalStatus;

const getOfficialDetails = (officials: CommitteeOfficial[], role: string) => {
  const official = officials?.find((o) => o.role === role);
  if (!official) return "-";

  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">{official.name}</span>
      <span className="text-xs text-muted-foreground">
        {official.phoneNumber}
      </span>
    </div>
  );
};

export default function CommitteeLandingPage() {
  const { data: session } = useSession();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
    session?.user?.role ?? "",
  );
  const [search, setSearch] = useState("");
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL");
  const { data: setup } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const effectiveFiscalYear =
    fiscalYearFilter ?? setup?.currentFiscalYear ?? "";
  const { data: committeesList = [], isLoading } = useAllUserCommittees({
    search,
    fiscalYear: effectiveFiscalYear || undefined,
  });
  const { mutate: approveCommittee, isPending: isApprovingCommittee } =
    useApproveUserCommittee();
  const statusCounts = useMemo(
    () =>
      committeesList.reduce(
        (counts, committee) => {
          counts.total += 1;
          counts[committee.approvalStatus] += 1;
          return counts;
        },
        { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 },
      ),
    [committeesList],
  );
  const pendingCommittees = useMemo(
    () =>
      committeesList.filter(
        (committee) => committee.approvalStatus === "PENDING",
      ),
    [committeesList],
  );
  const visibleCommittees = useMemo(
    () =>
      approvalFilter === "ALL"
        ? committeesList
        : committeesList.filter(
            (committee) => committee.approvalStatus === approvalFilter,
          ),
    [approvalFilter, committeesList],
  );

  return (
    <div className="space-y-6 p-6 max-w-full mx-auto overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Committees</h2>
          <p className="text-muted-foreground">
            Manage committee registrations and send new entries for admin
            approval.
          </p>
        </div>
        <Link href="/dashboard/committees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Register Committee
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 bg-card p-4 rounded-lg border shadow-sm md:flex-row md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by committee name, address, or official..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={effectiveFiscalYear}
          onChange={(event) => setFiscalYearFilter(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Fiscal Years</option>
          {fiscalYears.map((year) => (
            <option key={year} value={year}>
              {year}
              {year === setup?.currentFiscalYear ? " (Current)" : ""}
            </option>
          ))}
        </select>
        <select
          value={approvalFilter}
          onChange={(event) =>
            setApprovalFilter(event.target.value as ApprovalFilter)
          }
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All Approval Status</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Committees</p>
              <p className="text-2xl font-semibold">{statusCounts.total}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="py-4 border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-amber-800">Pending Approval</p>
              <p className="text-2xl font-semibold text-amber-900">
                {statusCounts.PENDING}
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-700" />
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold">{statusCounts.APPROVED}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold">{statusCounts.REJECTED}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-rose-700" />
          </CardContent>
        </Card>
      </div>

      {isAdmin && pendingCommittees.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/80 py-4 shadow-sm">
          <CardHeader className="gap-3 px-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base text-amber-950">
                <AlertCircle className="h-4 w-4" />
                Pending approval requests
              </CardTitle>
              <p className="text-sm text-amber-800">
                Review committee registrations waiting for admin approval.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovalFilter("PENDING")}
            >
              Review pending
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:grid-cols-3">
            {pendingCommittees.slice(0, 3).map((committee) => (
              <div
                key={committee.id}
                className="rounded-md border border-amber-200 bg-background/80 p-3"
              >
                <Link
                  href={`/dashboard/committees/${committee.id}`}
                  className="line-clamp-1 font-medium hover:underline"
                >
                  {committee.name}
                </Link>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {committee.address}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <ApprovalStatusBadge status={committee.approvalStatus} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isApprovingCommittee}
                    onClick={() => approveCommittee(committee.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <Table className="min-w-[1320px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-bold" rowSpan={2}>
                S.No
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Committee
              </TableHead>
              <TableHead className="text-center font-bold border-x" colSpan={3}>
                Officials
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Formed Date
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Bank Name
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Account No.
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Initiator
              </TableHead>
              <TableHead className="font-bold" rowSpan={2}>
                Approval
              </TableHead>
              <TableHead className="text-right font-bold" rowSpan={2}>
                Actions
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="font-semibold bg-muted/30 border-l border-b-0">
                President
              </TableHead>
              <TableHead className="font-semibold bg-muted/30 border-x border-b-0">
                Secretary
              </TableHead>
              <TableHead className="font-semibold bg-muted/30 border-r border-b-0">
                Treasurer
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                    <br />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : visibleCommittees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-24 text-center text-muted-foreground"
                >
                  No committees found.
                </TableCell>
              </TableRow>
            ) : (
              visibleCommittees.map(
                (committee: UserCommitteeRecord, index: number) => (
                  <TableRow key={committee.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>

                    <TableCell className="font-medium text-primary flex-col gap-1 items-start">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Link
                          href={`/dashboard/committees/${committee.id}`}
                          className="hover:underline font-semibold"
                        >
                          {committee.name}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 ml-6">
                        {committee.address}
                      </div>
                    </TableCell>

                    <TableCell className="border-l">
                      {getOfficialDetails(committee.officials, "PRESIDENT")}
                    </TableCell>
                    <TableCell className="border-x">
                      {getOfficialDetails(committee.officials, "SECRETARY")}
                    </TableCell>
                    <TableCell className="border-r">
                      {getOfficialDetails(committee.officials, "TREASURER")}
                    </TableCell>

                    <TableCell>
                      {new Date(committee.formedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{committee.bankName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {committee.accountNumber}
                    </TableCell>
                    <TableCell>
                      <RegistrationInitiatorCell
                        initiator={committee.initiatedBy}
                      />
                    </TableCell>
                    <TableCell>
                      <ApprovalStatusBadge status={committee.approvalStatus} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
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
                        <Link
                          href={`/dashboard/committees/${committee.id}#official-contacts`}
                        >
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" /> Contacts
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
