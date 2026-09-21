"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Loader2,
  Save,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useFiscalYears,
  useSystemSetup,
  useUpdateSystemSetup,
  useOfficerAssignments,
} from "@/hooks/setup/useSetup";

const FISCAL_YEAR_PATTERN = /^\d{4}\s*[/-]\s*\d{2,3}$/;

export default function SetupPage() {
  const { data: session } = useSession();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
    session?.user?.role ?? "",
  );
  const { data: setup, isLoading } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const { mutate: updateSetup, isPending } = useUpdateSystemSetup();
  const { data: assignments = [], isError: historyError } = useOfficerAssignments(isAdmin);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [changeReason, setChangeReason] = useState("");

  const [draft, setDraft] = useState<{
    chiefAdministrativeOfficerName?: string;
    currentFiscalYear?: string;
    sectionChiefName?: string;
    registrationOfficerName?: string;
    registrationOfficerDesignation?: string;
  }>({});
  const [didSubmit, setDidSubmit] = useState(false);

  const currentFiscalYear =
    draft.currentFiscalYear ?? setup?.currentFiscalYear ?? "";
  const chiefAdministrativeOfficerName =
    draft.chiefAdministrativeOfficerName ??
    setup?.chiefAdministrativeOfficerName ??
    "";
  const sectionChiefName =
    draft.sectionChiefName ?? setup?.sectionChiefName ?? "";
  const registrationOfficerName =
    draft.registrationOfficerName ?? setup?.registrationOfficerName ?? "";
  const registrationOfficerDesignation =
    draft.registrationOfficerDesignation ??
    setup?.registrationOfficerDesignation ??
    "";

  const fiscalYearError = useMemo(() => {
    if (!didSubmit) return "";
    return FISCAL_YEAR_PATTERN.test(currentFiscalYear.trim())
      ? ""
      : "Use YYYY/YYY or YYYY/YY format.";
  }, [currentFiscalYear, didSubmit]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidSubmit(true);

    if (!FISCAL_YEAR_PATTERN.test(currentFiscalYear.trim())) {
      return;
    }

    updateSetup({
      officerEffectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      officerChangeReason: changeReason.trim() || undefined,
      currentFiscalYear: currentFiscalYear.trim(),
      chiefAdministrativeOfficerName:
        chiefAdministrativeOfficerName.trim() || null,
      sectionChiefName: sectionChiefName.trim() || null,
      registrationOfficerName: registrationOfficerName.trim() || null,
      registrationOfficerDesignation:
        registrationOfficerDesignation.trim() || null,
    }, { onSuccess: () => { setDraft({}); setEffectiveFrom(""); setChangeReason(""); } });
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Admin access required
            </CardTitle>
            <CardDescription>
              Setup can only be changed by an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the active fiscal year and default official names used across new
          contracts and printable documents.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Fiscal Year
            </CardTitle>
            <CardDescription>
              New entries default to this fiscal year. Old records stay saved
              under their original year and can still be viewed by selecting it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currentFiscalYear">Current fiscal year</Label>
              <Input
                id="currentFiscalYear"
                value={currentFiscalYear}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    currentFiscalYear: event.target.value,
                  }))
                }
                placeholder="YYYY/YYY"
                aria-invalid={Boolean(fiscalYearError)}
              />
              {fiscalYearError ? (
                <p className="text-xs font-medium text-destructive">
                  {fiscalYearError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Accepted formats: YYYY/YYY, YYYY/YY, or YYYY-YYY.
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chiefAdministrativeOfficerName">
                  Chief Administrative Officer
                </Label>
                <Input
                  id="chiefAdministrativeOfficerName"
                  value={chiefAdministrativeOfficerName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      chiefAdministrativeOfficerName: event.target.value,
                    }))
                  }
                  placeholder="प्रमुख प्रशासकीय अधिकृतको नाम"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionChiefName">Section Chief</Label>
                <Input
                  id="sectionChiefName"
                  value={sectionChiefName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sectionChiefName: event.target.value,
                    }))
                  }
                  placeholder="शाखा प्रमुखको नाम"
                />
              </div>
            </div>

            <div className="border-t pt-5">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Company Registration Certificate
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official shown in the signature section of company
                  registration certificates.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationOfficerName">
                    Registration Officer Name
                  </Label>
                  <Input
                    id="registrationOfficerName"
                    value={registrationOfficerName}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        registrationOfficerName: event.target.value,
                      }))
                    }
                    placeholder="दर्ता गर्ने अधिकारीको नाम"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationOfficerDesignation">
                    Registration Officer Designation
                  </Label>
                  <Input
                    id="registrationOfficerDesignation"
                    value={registrationOfficerDesignation}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        registrationOfficerDesignation: event.target.value,
                      }))
                    }
                    placeholder="दर्ता गर्ने अधिकारीको पद"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-5">
              <p className="text-sm text-muted-foreground">Officer changes take effect when saved. Each appointment lasts until the next recorded appointment, including changes within the same fiscal year. Saved document officers remain unchanged.</p>
              <Label htmlFor="officer-effective-from">Historical appointment start (AD, local time; optional)</Label>
              <Input id="officer-effective-from" type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
              <p className="text-xs text-muted-foreground">For a historical appointment, enter all four official fields as they were at that time. It ends at the next entry below. Existing certificates require individual verification; history entries do not rewrite them.</p>
              <Label htmlFor="officer-change-reason">Appointment order / supporting document reference</Label>
              <Input id="officer-change-reason" value={changeReason} required={Boolean(effectiveFrom)} minLength={10} maxLength={2000} onChange={(event) => setChangeReason(event.target.value)} />
            </div>
            <div className="flex justify-end">
              <span className="sr-only">Save officer assignment and fiscal year</span>
              <Button type="submit" disabled={isPending || isLoading}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save setup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Available Years
            </CardTitle>
            <CardDescription>
              Registered years are retained even when they have no records yet,
              so switching the active year never removes another year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fiscalYears.length ? (
              <div className="flex flex-wrap gap-2">
                {fiscalYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        currentFiscalYear: year,
                      }))
                    }
                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No fiscal years found yet.
              </p>
            )}
          </CardContent>
        </Card>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>Officer assignment history</CardTitle>
          <CardDescription>Newest first. Each start time is inclusive; the next appointment ends that period. The migration baseline confirms settings only from its recorded time.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {historyError ? <p>Unable to load officer history. Refresh to try again.</p> : (
            <table className="w-full text-left text-sm">
              <thead><tr><th className="p-2">Effective from (local)</th><th className="p-2">Registration officer / designation</th><th className="p-2">Chief administrative officer / section chief</th><th className="p-2">Audit reference</th></tr></thead>
              <tbody>{assignments.map((assignment) => (
                <tr key={assignment.id} className="border-t">
                  <td className="p-2">{new Date(assignment.effectiveFrom).toLocaleString()}</td>
                  <td className="p-2">{assignment.registrationOfficerName || "—"}<br />{assignment.registrationOfficerDesignation || "—"}</td>
                  <td className="p-2">{assignment.chiefAdministrativeOfficerName || "—"}<br />{assignment.sectionChiefName || "—"}</td>
                  <td className="p-2">{assignment.reason || "Settings change / migration baseline"}<br /><span className="text-xs text-muted-foreground">{assignment.recordedById || "Migration"} · {new Date(assignment.recordedAt).toLocaleString()}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
