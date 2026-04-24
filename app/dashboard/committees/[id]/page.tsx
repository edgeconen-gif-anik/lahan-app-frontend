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
import {
  useApproveUserCommittee,
  useUserCommittee,
  useDeleteUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";

export default function CommitteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: committee, isLoading } = useUserCommittee(id);
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
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3">
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
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                Committee Officials
              </CardTitle>
              <CardDescription>
                Members and their designated roles.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {committee.officials?.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {committee.officials.map(
                    (official) => (
                      <div
                        key={official.id}
                        className="flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
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
                          <span>
                            {official.phoneNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IdCard className="h-4 w-4" />
                          <span>
                            {official.citizenshipNumber ||
                              "Not Provided"}
                          </span>
                        </div>
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
    </div>
  );
}
