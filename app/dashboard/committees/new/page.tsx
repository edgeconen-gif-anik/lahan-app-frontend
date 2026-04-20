"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { toAdDate } from "@/lib/date-utils";
import { useCreateUserCommittee } from "@/hooks/user-committee/useUserCommittees";
import { sanitizeTenDigitPhone, TEN_DIGIT_PHONE_LENGTH } from "@/lib/validation/phone";
import {
  type CommitteeFormState,
  type CommitteeOfficialDraft,
  validateCommitteeForm,
  validateCommitteeOfficials,
} from "@/lib/validation/user-committee";

type TouchedFieldMap = Partial<Record<keyof CommitteeFormState | "bsDate", boolean>>;
type OfficialTouchedMap = Record<
  string,
  Partial<Record<"name" | "phoneNumber" | "citizenshipNumber", boolean>>
>;

const INITIAL_FORM_DATA: CommitteeFormState = {
  name: "",
  address: "",
  fiscalYear: "2082/083",
  formedDate: "",
  bankName: "",
  accountNumber: "",
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

function formatBsDateInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 4) return digitsOnly;
  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
}

export default function RegisterCommitteePage() {
  const { mutate: createCommittee, isPending } = useCreateUserCommittee();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [bsDate, setBsDate] = useState("");
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState<TouchedFieldMap>({});
  const [touchedOfficials, setTouchedOfficials] = useState<OfficialTouchedMap>({});
  const [officials, setOfficials] = useState<CommitteeOfficialDraft[]>([
    createOfficial("PRESIDENT"),
    createOfficial("SECRETARY"),
    createOfficial("TREASURER"),
  ]);

  const fieldErrors = useMemo(
    () => validateCommitteeForm(formData, { requireBsDate: true, bsDate }),
    [formData, bsDate]
  );
  const officialErrors = useMemo(
    () => validateCommitteeOfficials(officials),
    [officials]
  );

  const hasErrors =
    Object.keys(fieldErrors).length > 0 ||
    Object.values(officialErrors).some((errorMap) => Object.keys(errorMap).length > 0);

  const markFieldTouched = (field: keyof TouchedFieldMap) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const markOfficialTouched = (
    id: string,
    field: "name" | "phoneNumber" | "citizenshipNumber"
  ) => {
    setTouchedOfficials((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: true,
      },
    }));
  };

  const getFieldError = (field: keyof TouchedFieldMap) =>
    didAttemptSubmit || touchedFields[field] ? fieldErrors[field] : undefined;

  const getOfficialError = (
    id: string,
    field: "name" | "phoneNumber" | "citizenshipNumber"
  ) =>
    didAttemptSubmit || touchedOfficials[id]?.[field]
      ? officialErrors[id]?.[field]
      : undefined;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBsDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatBsDateInput(event.target.value);
    setBsDate(value);

    const adDate = toAdDate(value);
    setFormData((current) => ({
      ...current,
      formedDate: adDate ? adDate.toISOString().split("T")[0] : "",
    }));
  };

  const handleOfficialChange = (
    id: string,
    field: "name" | "phoneNumber" | "citizenshipNumber",
    value: string
  ) => {
    const nextValue =
      field === "phoneNumber" ? sanitizeTenDigitPhone(value) : value;

    setOfficials((current) =>
      current.map((official) =>
        official.id === id ? { ...official, [field]: nextValue } : official
      )
    );
  };

  const addMember = () => {
    setOfficials((current) => [...current, createOfficial("MEMBER")]);
  };

  const removeMember = (id: string) => {
    setOfficials((current) => current.filter((official) => official.id !== id));
    setTouchedOfficials((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidAttemptSubmit(true);

    if (hasErrors) {
      return;
    }

    createCommittee({
      ...formData,
      formedDate: new Date(formData.formedDate).toISOString(),
      officials: officials.map(({ id, ...official }) => official),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/committees">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Register Committee</h2>
          <p className="text-muted-foreground">
            Complete the committee details and validate official contact numbers inline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the general details of the user committee.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Committee Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onBlur={() => markFieldTouched("name")}
                onChange={handleInputChange}
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
                name="address"
                value={formData.address}
                onBlur={() => markFieldTouched("address")}
                onChange={handleInputChange}
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
                name="fiscalYear"
                placeholder="2082/083"
                value={formData.fiscalYear}
                onBlur={() => markFieldTouched("fiscalYear")}
                onChange={handleInputChange}
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
              <Label htmlFor="formedDateBs">Formed Date (BS)</Label>
              <Input
                id="formedDateBs"
                value={bsDate}
                onBlur={() => markFieldTouched("bsDate")}
                onChange={handleBsDateChange}
                placeholder="YYYY-MM-DD"
                aria-invalid={Boolean(getFieldError("bsDate") || getFieldError("formedDate"))}
              />
              {formData.formedDate ? (
                <p className="text-xs text-muted-foreground">
                  AD Equivalent: {formData.formedDate}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter a valid BS date to auto-fill the AD date.
                </p>
              )}
              {(getFieldError("bsDate") || getFieldError("formedDate")) && (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("bsDate") ?? getFieldError("formedDate")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onBlur={() => markFieldTouched("bankName")}
                onChange={handleInputChange}
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
                name="accountNumber"
                value={formData.accountNumber}
                onBlur={() => markFieldTouched("accountNumber")}
                onChange={handleInputChange}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Committee Officials</CardTitle>
              <CardDescription>
                Each official must have a valid 10-digit mobile number.
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
                  className="grid gap-4 rounded-lg border bg-muted/50 p-4 md:grid-cols-4"
                >
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={official.role}
                      disabled
                      className="bg-muted capitalize"
                    />
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
            Fix the highlighted validation errors before saving the committee.
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/committees">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Saving..." : "Save Committee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
