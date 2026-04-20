"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUserCommittee,
  useUpdateUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";
import { sanitizeTenDigitPhone, TEN_DIGIT_PHONE_LENGTH } from "@/lib/validation/phone";
import {
  type CommitteeFormState,
  type CommitteeOfficialDraft,
  validateCommitteeForm,
  validateCommitteeOfficials,
} from "@/lib/validation/user-committee";

type TouchedFieldMap = Partial<Record<keyof CommitteeFormState, boolean>>;
type OfficialTouchedMap = Record<
  string,
  Partial<Record<"name" | "phoneNumber" | "citizenshipNumber", boolean>>
>;

function createOfficial(role: CommitteeOfficialDraft["role"]): CommitteeOfficialDraft {
  return {
    id: crypto.randomUUID(),
    role,
    name: "",
    phoneNumber: "",
    citizenshipNumber: "",
  };
}

export default function EditCommitteePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: committee, isLoading } = useUserCommittee(id);
  const { mutate: updateCommittee, isPending } = useUpdateUserCommittee();

  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState<TouchedFieldMap>({});
  const [touchedOfficials, setTouchedOfficials] = useState<OfficialTouchedMap>({});
  const [formData, setFormData] = useState<CommitteeFormState | null>(null);
  const [officials, setOfficials] = useState<CommitteeOfficialDraft[]>([]);

  useEffect(() => {
    if (!committee) return;

    setFormData({
      name: committee.name,
      address: committee.address,
      fiscalYear: committee.fiscalYear,
      formedDate: committee.formedDate.split("T")[0],
      bankName: committee.bankName,
      accountNumber: committee.accountNumber,
    });

    setOfficials(
      committee.officials.map((official) => ({
        id: official.id ?? crypto.randomUUID(),
        role: official.role,
        name: official.name,
        phoneNumber: sanitizeTenDigitPhone(official.phoneNumber),
        citizenshipNumber: official.citizenshipNumber || "",
      }))
    );
  }, [committee]);

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
    if (!formData) return;

    setDidAttemptSubmit(true);
    if (hasErrors) {
      return;
    }

    updateCommittee(
      {
        id,
        data: {
          ...formData,
          formedDate: new Date(formData.formedDate).toISOString(),
          officials: officials.map(({ id: officialId, ...official }) => official),
        },
      },
      {
        onSuccess: () => router.push(`/dashboard/committees/${id}`),
      }
    );
  };

  if (isLoading || !formData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/committees/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Committee</h2>
          <p className="text-muted-foreground">
            Update the committee details and validate official phone numbers inline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update general details.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onBlur={() => markFieldTouched("name")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, name: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("name"))}
              />
              {getFieldError("name") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("name")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onBlur={() => markFieldTouched("address")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, address: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("address"))}
              />
              {getFieldError("address") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("address")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Input
                id="fiscalYear"
                value={formData.fiscalYear}
                onBlur={() => markFieldTouched("fiscalYear")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, fiscalYear: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("fiscalYear"))}
              />
              <p className="text-xs text-muted-foreground">
                Use the format `2082/083`.
              </p>
              {getFieldError("fiscalYear") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("fiscalYear")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="formedDate">Formed Date (AD)</Label>
              <Input
                id="formedDate"
                type="date"
                value={formData.formedDate}
                onBlur={() => markFieldTouched("formedDate")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, formedDate: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("formedDate"))}
              />
              {getFieldError("formedDate") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("formedDate")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onBlur={() => markFieldTouched("bankName")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, bankName: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("bankName"))}
              />
              {getFieldError("bankName") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("bankName")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onBlur={() => markFieldTouched("accountNumber")}
                onChange={(event) =>
                  setFormData((current) =>
                    current
                      ? { ...current, accountNumber: event.target.value }
                      : current
                  )
                }
                aria-invalid={Boolean(getFieldError("accountNumber"))}
              />
              {getFieldError("accountNumber") && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("accountNumber")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Officials</CardTitle>
              <CardDescription>
                Edit members, phone numbers, and citizenship numbers.
              </CardDescription>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addMember}>
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {officials.map((official) => {
              const nameError = getOfficialError(official.id, "name");
              const phoneError = getOfficialError(official.id, "phoneNumber");
              const citizenshipError = getOfficialError(
                official.id,
                "citizenshipNumber"
              );

              return (
                <div
                  key={official.id}
                  className="grid gap-4 rounded-lg border p-4 md:grid-cols-4"
                >
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={official.role} disabled className="capitalize" />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={official.name}
                      onBlur={() => markOfficialTouched(official.id, "name")}
                      onChange={(event) =>
                        handleOfficialChange(official.id, "name", event.target.value)
                      }
                      aria-invalid={Boolean(nameError)}
                    />
                    {nameError && (
                      <p className="text-xs font-medium text-destructive">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={TEN_DIGIT_PHONE_LENGTH}
                      pattern="[0-9]*"
                      value={official.phoneNumber}
                      onBlur={() => markOfficialTouched(official.id, "phoneNumber")}
                      onChange={(event) =>
                        handleOfficialChange(
                          official.id,
                          "phoneNumber",
                          event.target.value
                        )
                      }
                      aria-invalid={Boolean(phoneError)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {official.phoneNumber.length}/{TEN_DIGIT_PHONE_LENGTH} digits
                    </p>
                    {phoneError && (
                      <p className="text-xs font-medium text-destructive">{phoneError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Citizenship No.</Label>
                    <Input
                      value={official.citizenshipNumber}
                      onBlur={() =>
                        markOfficialTouched(official.id, "citizenshipNumber")
                      }
                      onChange={(event) =>
                        handleOfficialChange(
                          official.id,
                          "citizenshipNumber",
                          event.target.value
                        )
                      }
                      placeholder="Citizenship No."
                      aria-invalid={Boolean(citizenshipError)}
                    />
                    {citizenshipError && (
                      <p className="text-xs font-medium text-destructive">
                        {citizenshipError}
                      </p>
                    )}
                  </div>

                  {official.role === "MEMBER" && (
                    <div className="md:col-span-4">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMember(official.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Member
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {didAttemptSubmit && hasErrors && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Fix the highlighted validation errors before updating the committee.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Update Committee
          </Button>
        </div>
      </form>
    </div>
  );
}
