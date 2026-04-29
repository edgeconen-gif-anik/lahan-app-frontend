"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Landmark,
  Loader2,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUserCommittee,
  useUpdateUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";
import type { UserCommitteeRecord } from "@/services/user-committe/userCommittee.service";
import { sanitizeTenDigitPhone, TEN_DIGIT_PHONE_LENGTH } from "@/lib/validation/phone";
import {
  type CommitteeFormState,
  type CommitteeOfficialDraft,
  validateCommitteeForm,
  validateCommitteeOfficials,
} from "@/lib/validation/user-committee";
import { cn } from "@/lib/utils";

type TouchedFieldMap = Partial<Record<keyof CommitteeFormState, boolean>>;
type OfficialTouchedMap = Record<
  string,
  Partial<Record<"name" | "phoneNumber" | "citizenshipNumber", boolean>>
>;

const ROLE_LABELS: Record<CommitteeOfficialDraft["role"], string> = {
  PRESIDENT: "President",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  MEMBER: "Member",
};

const ROLE_BADGE_CLASSNAMES: Record<CommitteeOfficialDraft["role"], string> = {
  PRESIDENT: "border-emerald-200 bg-emerald-50 text-emerald-800",
  SECRETARY: "border-sky-200 bg-sky-50 text-sky-800",
  TREASURER: "border-amber-200 bg-amber-50 text-amber-800",
  MEMBER: "border-stone-200 bg-stone-100 text-stone-700",
};

const ROLE_ROW_CLASSNAMES: Record<CommitteeOfficialDraft["role"], string> = {
  PRESIDENT: "border-l-emerald-500 bg-emerald-50/40",
  SECRETARY: "border-l-sky-500 bg-sky-50/40",
  TREASURER: "border-l-amber-500 bg-amber-50/40",
  MEMBER: "border-l-stone-300 bg-white",
};

function createOfficial(role: CommitteeOfficialDraft["role"]): CommitteeOfficialDraft {
  return {
    id: crypto.randomUUID(),
    role,
    name: "",
    phoneNumber: "",
    citizenshipNumber: "",
  };
}

function buildInitialFormData(committee: UserCommitteeRecord): CommitteeFormState {
  return {
    name: committee.name,
    address: committee.address,
    fiscalYear: committee.fiscalYear,
    formedDate: committee.formedDate.split("T")[0],
    bankName: committee.bankName,
    accountNumber: committee.accountNumber,
  };
}

function buildInitialOfficials(committee: UserCommitteeRecord) {
  return committee.officials.map((official) => ({
    id: official.id ?? crypto.randomUUID(),
    role: official.role,
    name: official.name,
    phoneNumber: sanitizeTenDigitPhone(official.phoneNumber),
    citizenshipNumber: official.citizenshipNumber || "",
  }));
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function FieldShell({
  children,
  description,
  error,
  htmlFor,
  icon,
  label,
}: {
  children: ReactNode;
  description?: string;
  error?: string;
  htmlFor?: string;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      {children}
      {description && !error ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}

type EditCommitteeFormProps = {
  committee: UserCommitteeRecord;
  id: string;
};

export default function EditCommitteePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: committee, isLoading } = useUserCommittee(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/committees">
            <ArrowLeft className="h-4 w-4" /> Back to committees
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Committee not found</AlertTitle>
          <AlertDescription>
            This committee could not be loaded for editing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <EditCommitteeForm key={committee.id} committee={committee} id={id} />;
}

function EditCommitteeForm({ committee, id }: EditCommitteeFormProps) {
  const router = useRouter();
  const { mutate: updateCommittee, isPending } = useUpdateUserCommittee();

  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState<TouchedFieldMap>({});
  const [touchedOfficials, setTouchedOfficials] = useState<OfficialTouchedMap>({});
  const [formData, setFormData] = useState<CommitteeFormState>(() =>
    buildInitialFormData(committee)
  );
  const [officials, setOfficials] = useState<CommitteeOfficialDraft[]>(() =>
    buildInitialOfficials(committee)
  );

  const fieldErrors = useMemo(
    () => (formData ? validateCommitteeForm(formData) : {}),
    [formData]
  );
  const officialErrors = useMemo(
    () => validateCommitteeOfficials(officials),
    [officials]
  );

  const hasErrors =
    Object.keys(fieldErrors).length > 0 ||
    Object.values(officialErrors).some((errorMap) => Object.keys(errorMap).length > 0);

  const markFieldTouched = (field: keyof CommitteeFormState) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const markOfficialTouched = (
    targetId: string,
    field: "name" | "phoneNumber" | "citizenshipNumber"
  ) => {
    setTouchedOfficials((current) => ({
      ...current,
      [targetId]: {
        ...current[targetId],
        [field]: true,
      },
    }));
  };

  const getFieldError = (field: keyof CommitteeFormState) =>
    didAttemptSubmit || touchedFields[field] ? fieldErrors[field] : undefined;

  const getOfficialError = (
    targetId: string,
    field: "name" | "phoneNumber" | "citizenshipNumber"
  ) =>
    didAttemptSubmit || touchedOfficials[targetId]?.[field]
      ? officialErrors[targetId]?.[field]
      : undefined;

  const handleOfficialChange = (
    targetId: string,
    field: "name" | "phoneNumber" | "citizenshipNumber",
    value: string
  ) => {
    const nextValue =
      field === "phoneNumber" ? sanitizeTenDigitPhone(value) : value;

    setOfficials((current) =>
      current.map((official) =>
        official.id === targetId ? { ...official, [field]: nextValue } : official
      )
    );
  };

  const addMember = () => {
    setOfficials((current) => [...current, createOfficial("MEMBER")]);
  };

  const removeMember = (targetId: string) => {
    setOfficials((current) =>
      current.filter((official) => official.id !== targetId)
    );
    setTouchedOfficials((current) => {
      const next = { ...current };
      delete next[targetId];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setDidAttemptSubmit(true);
    if (hasErrors) {
      return;
    }

    updateCommittee(
      {
        id,
        ...formData,
        formedDate: new Date(formData.formedDate).toISOString(),
        officials: officials.map(
          ({ role, name, phoneNumber, citizenshipNumber }) => ({
            role,
            name,
            phoneNumber,
            citizenshipNumber,
          })
        ),
      },
      {
        onSuccess: () => router.push(`/dashboard/committees/${id}`),
      }
    );
  };

  const presidentName =
    officials.find((official) => official.role === "PRESIDENT")?.name || "Not set";
  const memberCount = officials.filter((official) => official.role === "MEMBER").length;
  const errorCount =
    Object.keys(fieldErrors).length +
    Object.values(officialErrors).reduce(
      (total, errorMap) => total + Object.keys(errorMap).length,
      0
    );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_44%,#fff7ed_100%)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_42%,#eff6ff_72%,#fff7ed_100%)] p-4 shadow-[0_18px_55px_-38px_rgba(5,150,105,0.9)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-emerald-200 bg-white/85 text-emerald-700 shadow-sm hover:bg-emerald-50"
              asChild
            >
              <Link href={`/dashboard/committees/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  Edit Committee
                </h1>
                <ApprovalStatusBadge status={committee.approvalStatus} />
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {committee.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-800"
            >
              <CalendarDays className="h-3 w-3" />
              {formData.fiscalYear}
            </Badge>
            <Badge
              variant="outline"
              className="border-cyan-200 bg-cyan-50 text-cyan-800"
            >
              <Users className="h-3 w-3" />
              {officials.length} officials
            </Badge>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <div className="space-y-6">
            {didAttemptSubmit && hasErrors ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review required</AlertTitle>
                <AlertDescription>
                  {errorCount} field{errorCount === 1 ? "" : "s"} need attention
                  before this committee can be updated.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className="overflow-hidden border-emerald-200/80 bg-white/95 shadow-[0_18px_45px_-34px_rgba(16,185,129,0.7)]">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/80">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Users className="h-4 w-4" />
                    </span>
                    Basic information
                  </CardTitle>
                  <CardDescription>
                    Committee identity, address, fiscal year, and bank details.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
                <FieldShell
                  htmlFor="name"
                  label="Committee name"
                  error={getFieldError("name")}
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <Input
                    id="name"
                    value={formData.name}
                    onBlur={() => markFieldTouched("name")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("name"))}
                    className="h-10"
                  />
                </FieldShell>

                <FieldShell
                  htmlFor="address"
                  label="Address"
                  error={getFieldError("address")}
                  icon={<Landmark className="h-4 w-4" />}
                >
                  <Input
                    id="address"
                    value={formData.address}
                    onBlur={() => markFieldTouched("address")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("address"))}
                    className="h-10"
                  />
                </FieldShell>

                <FieldShell
                  htmlFor="fiscalYear"
                  label="Fiscal year"
                  description="Format: 2082/083"
                  error={getFieldError("fiscalYear")}
                  icon={<CalendarDays className="h-4 w-4" />}
                >
                  <Input
                    id="fiscalYear"
                    value={formData.fiscalYear}
                    onBlur={() => markFieldTouched("fiscalYear")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        fiscalYear: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("fiscalYear"))}
                    className="h-10"
                  />
                </FieldShell>

                <FieldShell
                  htmlFor="formedDate"
                  label="Formed date"
                  error={getFieldError("formedDate")}
                  icon={<CalendarDays className="h-4 w-4" />}
                >
                  <Input
                    id="formedDate"
                    type="date"
                    value={formData.formedDate}
                    onBlur={() => markFieldTouched("formedDate")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        formedDate: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("formedDate"))}
                    className="h-10"
                  />
                </FieldShell>

                <FieldShell
                  htmlFor="bankName"
                  label="Bank name"
                  error={getFieldError("bankName")}
                  icon={<CreditCard className="h-4 w-4" />}
                >
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onBlur={() => markFieldTouched("bankName")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("bankName"))}
                    className="h-10"
                  />
                </FieldShell>

                <FieldShell
                  htmlFor="accountNumber"
                  label="Account number"
                  error={getFieldError("accountNumber")}
                  icon={<CreditCard className="h-4 w-4" />}
                >
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onBlur={() => markFieldTouched("accountNumber")}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(getFieldError("accountNumber"))}
                    className="h-10"
                  />
                </FieldShell>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-sky-200/80 bg-white/95 shadow-[0_18px_45px_-34px_rgba(14,165,233,0.65)]">
              <CardHeader className="border-b border-sky-100 bg-sky-50/80">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                    Officials
                  </CardTitle>
                  <CardDescription>
                    Leadership roles and committee member contact records.
                  </CardDescription>
                </div>
                <CardAction>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                    onClick={addMember}
                  >
                    <Plus className="h-4 w-4" /> Add member
                  </Button>
                </CardAction>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                {officials.map((official) => {
                  const nameError = getOfficialError(official.id, "name");
                  const phoneError = getOfficialError(official.id, "phoneNumber");
                  const citizenshipError = getOfficialError(
                    official.id,
                    "citizenshipNumber"
                  );
                  const hasOfficialError = Boolean(
                    nameError || phoneError || citizenshipError
                  );

                  return (
                    <section
                      key={official.id}
                      className={cn(
                        "rounded-lg border border-l-4 p-4 shadow-xs transition-colors",
                        ROLE_ROW_CLASSNAMES[official.role],
                        hasOfficialError && "border-destructive/50 bg-destructive/5"
                      )}
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={ROLE_BADGE_CLASSNAMES[official.role]}
                          >
                            {ROLE_LABELS[official.role]}
                          </Badge>
                          <span className="truncate text-sm font-medium">
                            {official.name || "Unnamed official"}
                          </span>
                        </div>

                        {official.role === "MEMBER" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="hover:bg-rose-50"
                            onClick={() => removeMember(official.id)}
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <FieldShell
                          label="Full name"
                          error={nameError}
                          icon={<UserRound className="h-4 w-4" />}
                        >
                          <Input
                            value={official.name}
                            onBlur={() => markOfficialTouched(official.id, "name")}
                            onChange={(event) =>
                              handleOfficialChange(
                                official.id,
                                "name",
                                event.target.value
                              )
                            }
                            aria-invalid={Boolean(nameError)}
                            className="h-10"
                          />
                        </FieldShell>

                        <FieldShell
                          label="Phone number"
                          description={`${official.phoneNumber.length}/${TEN_DIGIT_PHONE_LENGTH} digits`}
                          error={phoneError}
                          icon={<Phone className="h-4 w-4" />}
                        >
                          <Input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            maxLength={TEN_DIGIT_PHONE_LENGTH}
                            pattern="[0-9]*"
                            value={official.phoneNumber}
                            onBlur={() =>
                              markOfficialTouched(official.id, "phoneNumber")
                            }
                            onChange={(event) =>
                              handleOfficialChange(
                                official.id,
                                "phoneNumber",
                                event.target.value
                              )
                            }
                            aria-invalid={Boolean(phoneError)}
                            className="h-10"
                          />
                        </FieldShell>

                        <FieldShell
                          label="Citizenship no."
                          error={citizenshipError}
                          icon={<CreditCard className="h-4 w-4" />}
                        >
                          <Input
                            value={official.citizenshipNumber}
                            onBlur={() =>
                              markOfficialTouched(
                                official.id,
                                "citizenshipNumber"
                              )
                            }
                            onChange={(event) =>
                              handleOfficialChange(
                                official.id,
                                "citizenshipNumber",
                                event.target.value
                              )
                            }
                            aria-invalid={Boolean(citizenshipError)}
                            className="h-10"
                          />
                        </FieldShell>
                      </div>
                    </section>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden border-teal-200/80 bg-white/95 shadow-[0_18px_45px_-34px_rgba(13,148,136,0.7)]">
              <CardHeader className="border-b border-teal-100 bg-teal-50/80">
                <CardTitle className="text-base">Summary</CardTitle>
                <CardDescription>Current committee snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                    <span className="text-xs font-medium text-emerald-700">President</span>
                    <span className="max-w-[150px] truncate font-medium">
                      {presidentName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-sky-100 bg-sky-50/80 p-3">
                      <span className="text-xs font-medium text-sky-700">Members</span>
                      <p className="mt-1 text-lg font-semibold">{memberCount}</p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
                      <span className="text-xs font-medium text-amber-700">
                        Fiscal year
                      </span>
                      <p className="mt-1 truncate font-semibold">
                        {formData.fiscalYear}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border border-orange-100 bg-orange-50/70 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-100 text-orange-700">
                      <Landmark className="h-4 w-4" />
                    </span>
                    Bank details
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-orange-950">
                    {formData.bankName}
                  </p>
                  <p className="truncate font-mono text-xs text-orange-700">
                    {formData.accountNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-indigo-200/70 bg-white/95 shadow-[0_18px_45px_-34px_rgba(79,70,229,0.55)]">
              <CardContent className="space-y-3 bg-indigo-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <ApprovalStatusBadge status={committee.approvalStatus} />
                </div>
                {hasErrors && didAttemptSubmit ? (
                  <p className="text-xs text-destructive">
                    Resolve the highlighted fields to save changes.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Changes will refresh committee-linked pages after save.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 border-t border-indigo-100 bg-white p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-stone-200 bg-white hover:bg-stone-50"
                  asChild
                >
                  <Link href={`/dashboard/committees/${id}`}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </CardFooter>
            </Card>
          </aside>
        </form>
      </div>
    </div>
  );
}
