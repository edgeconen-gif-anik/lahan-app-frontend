"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays, Loader2, Save, ShieldAlert, UserRound } from "lucide-react";
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
} from "@/hooks/setup/useSetup";

const FISCAL_YEAR_PATTERN = /^\d{4}\s*[/-]\s*\d{2,3}$/;

export default function SetupPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: setup, isLoading } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const { mutate: updateSetup, isPending } = useUpdateSystemSetup();

  const [draft, setDraft] = useState<{
    chiefAdministrativeOfficerName?: string;
    currentFiscalYear?: string;
    sectionChiefName?: string;
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

  const fiscalYearError = useMemo(() => {
    if (!didSubmit) return "";
    return FISCAL_YEAR_PATTERN.test(currentFiscalYear.trim())
      ? ""
      : "Use a fiscal year like 2082/083 or 2082/83.";
  }, [currentFiscalYear, didSubmit]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidSubmit(true);

    if (!FISCAL_YEAR_PATTERN.test(currentFiscalYear.trim())) {
      return;
    }

    updateSetup({
      currentFiscalYear: currentFiscalYear.trim(),
      chiefAdministrativeOfficerName:
        chiefAdministrativeOfficerName.trim() || null,
      sectionChiefName: sectionChiefName.trim() || null,
    });
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

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
                placeholder="2082/083"
                aria-invalid={Boolean(fiscalYearError)}
              />
              {fiscalYearError ? (
                <p className="text-xs font-medium text-destructive">
                  {fiscalYearError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Accepted formats: 2082/083, 2082/83, 2082-083.
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

            <div className="flex justify-end">
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
              Years found from projects, committees, and the active setting.
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
    </div>
  );
}
