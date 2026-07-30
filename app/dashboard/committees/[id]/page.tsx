"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  ExternalLink,
  FileSignature,
  Loader2,
  User,
  Phone,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  Trash2,
  IdCard,
} from "lucide-react";

import { toFormalNepaliDate } from "@/lib/date-utils";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { useContracts } from "@/hooks/contract/useContracts";
import {
  useApproveUserCommittee,
  useUserCommittee,
  useDeleteUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";

function formatCurrency(value?: number | string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "Rs. 0";

  return `Rs. ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  return value ? toFormalNepaliDate(value) : "Not set";
}

export default function CommitteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session } = useSession();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
    session?.user?.role ?? "",
  );

  const { data: committee, isLoading } = useUserCommittee(id);
  const { data: contracts = [], isLoading: isLoadingContracts } = useContracts({
    userCommitteeId: id,
  });
  const { mutate: approveCommittee, isPending: isApproving } =
    useApproveUserCommittee();
  const { mutate: deleteCommittee, isPending: isDeleting } =
    useDeleteUserCommittee();

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this committee? This action cannot be undone."
      )
    ) {
      deleteCommittee(id, {
        onSuccess: () => {
          router.push("/dashboard/committees");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-muted-foreground">
          Committee not found
        </h2>
        <Link href="/dashboard/committees">
          <Button variant="outline">Return to List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/committees">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {committee.name}
              </h2>
              <ApprovalStatusBadge status={committee.approvalStatus} />
            </div>
            <p className="text-muted-foreground">
              उपभोक्ता समितिको विवरण
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/committees/${id}#official-contacts`}>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" /> Contacts
            </Button>
          </Link>

          {isAdmin && committee.approvalStatus !== "APPROVED" && (
            <Button
              variant="outline"
              onClick={() => approveCommittee(committee.id)}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>

          <Link href={`/dashboard/committees/${id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" /> Edit Details
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Approval Status
                  </p>
                  <div className="mt-1">
                    <ApprovalStatusBadge status={committee.approvalStatus} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Approved Date
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {committee.approvedAt
                      ? toFormalNepaliDate(committee.approvedAt)
                      : "Not approved yet"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {committee.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Fiscal Year
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {committee.fiscalYear}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Formed Date (BS)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {toFormalNepaliDate(
                      committee.formedDate
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Bank Name
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {committee.bankName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Account Number
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {committee.accountNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Officials */}
        <div className="md:col-span-2">
          <Card id="official-contacts" className="h-full scroll-mt-24">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Committee Officials and Contacts
                  </CardTitle>
                  <CardDescription>
                    Associated contact records for committee members and their roles.
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {committee.officials?.length ?? 0} contact
                  {(committee.officials?.length ?? 0) === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {committee.officials?.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {committee.officials.map(
                    (official) => (
                      <div
                        key={official.id}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 font-semibold">
                            {official.name}
                          </span>
                          <Badge
                            variant={
                              official.role ===
                              "PRESIDENT"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {official.role}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <a
                            href={`tel:${official.phoneNumber}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {official.phoneNumber}
                          </a>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IdCard className="h-4 w-4" />
                          <span>
                            {official.citizenshipNumber ||
                              "Not Provided"}
                          </span>
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-auto w-full"
                        >
                          <a href={`tel:${official.phoneNumber}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call contact
                          </a>
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-lg">
                  <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No officials added yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSignature className="h-5 w-5" />
                Contract Details
              </CardTitle>
              <CardDescription>
                Contracts linked with this user committee.
              </CardDescription>
            </div>
            <Badge variant={contracts.length ? "default" : "secondary"}>
              {contracts.length ? "Contracted" : "Not contracted"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingContracts ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading contract details...
            </div>
          ) : contracts.length ? (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="inline-flex items-center gap-2 font-semibold hover:underline"
                      >
                        {contract.contractNumber}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {contract.project?.name ?? "Project not linked"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ContractStatusBadge status={contract.status} compact />
                      <ApprovalStatusBadge status={contract.approvalStatus} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Amount
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(contract.contractAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Timeline
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {formatDate(contract.startDate)} -{" "}
                        {formatDate(
                          contract.actualCompletionDate ??
                            contract.intendedCompletionDate
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Fiscal Year
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {contract.fiscalYear}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No contract linked yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contract details will appear here once this committee is selected
                on a contract.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
