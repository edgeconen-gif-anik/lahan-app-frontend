"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarDays,
  Loader2,
  RotateCcw,
  Save,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useFiscalYears,
  useOfficerAssignments,
  useSystemSetup,
  useUpdateSystemSetup,
} from "@/hooks/setup/useSetup";
import { useRole } from "@/lib/auth/use-role";

const FISCAL_YEAR_PATTERN = /^\d{4}\s*[/-]\s*\d{2,3}$/;

const setupSchema = z
  .object({
    currentFiscalYear: z
      .string()
      .trim()
      .regex(FISCAL_YEAR_PATTERN, "Use YYYY/YYY or YYYY/YY format, e.g. 2082/083."),
    chiefAdministrativeOfficerName: z.string(),
    sectionChiefName: z.string(),
    registrationOfficerName: z.string(),
    registrationOfficerDesignation: z.string(),
    officerEffectiveFrom: z.string(),
    officerChangeReason: z.string().max(2000, "Keep the reference under 2000 characters."),
  })
  .superRefine((values, context) => {
    // A back-dated appointment must say which order or document it follows.
    if (values.officerEffectiveFrom && values.officerChangeReason.trim().length < 10) {
      context.addIssue({
        code: "custom",
        path: ["officerChangeReason"],
        message: "Enter the appointment order or document reference (at least 10 characters).",
      });
    }
  });

type SetupFormValues = z.infer<typeof setupSchema>;

const EMPTY_VALUES: SetupFormValues = {
  currentFiscalYear: "",
  chiefAdministrativeOfficerName: "",
  sectionChiefName: "",
  registrationOfficerName: "",
  registrationOfficerDesignation: "",
  officerEffectiveFrom: "",
  officerChangeReason: "",
};

export default function SetupPage() {
  const { isAdmin } = useRole();
  const { data: setup, isLoading } = useSystemSetup();
  const { data: fiscalYears = [] } = useFiscalYears();
  const { mutate: updateSetup, isPending } = useUpdateSystemSetup();
  const { data: assignments = [], isError: historyError } = useOfficerAssignments(isAdmin);
  const [pendingValues, setPendingValues] = useState<SetupFormValues | null>(null);

  // The form always mirrors the saved setup; it resets when the saved data
  // changes (first load, or right after a successful save).
  const savedValues = useMemo<SetupFormValues>(
    () => ({
      ...EMPTY_VALUES,
      currentFiscalYear: setup?.currentFiscalYear ?? "",
      chiefAdministrativeOfficerName: setup?.chiefAdministrativeOfficerName ?? "",
      sectionChiefName: setup?.sectionChiefName ?? "",
      registrationOfficerName: setup?.registrationOfficerName ?? "",
      registrationOfficerDesignation: setup?.registrationOfficerDesignation ?? "",
    }),
    [setup],
  );

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    values: savedValues,
    defaultValues: EMPTY_VALUES,
  });
  const { isDirty } = form.formState;

  const save = (values: SetupFormValues) => {
    updateSetup(
      {
        officerEffectiveFrom: values.officerEffectiveFrom
          ? new Date(values.officerEffectiveFrom).toISOString()
          : undefined,
        officerChangeReason: values.officerChangeReason.trim() || undefined,
        currentFiscalYear: values.currentFiscalYear.trim(),
        chiefAdministrativeOfficerName: values.chiefAdministrativeOfficerName.trim() || null,
        sectionChiefName: values.sectionChiefName.trim() || null,
        registrationOfficerName: values.registrationOfficerName.trim() || null,
        registrationOfficerDesignation: values.registrationOfficerDesignation.trim() || null,
      },
      { onSettled: () => setPendingValues(null) },
    );
  };

  const handleSubmit = (values: SetupFormValues) => {
    // Changing the active year changes the default of every list and new
    // record, so confirm it explicitly.
    if (setup && values.currentFiscalYear.trim() !== setup.currentFiscalYear) {
      setPendingValues(values);
      return;
    }
    save(values);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Admin access required
            </CardTitle>
            <CardDescription>Setup can only be changed by an administrator.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ConfirmDialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingValues(null);
        }}
        title="Change the active fiscal year?"
        description={
          <>
            New entries and every list will default to{" "}
            <span className="font-semibold text-foreground">
              {pendingValues?.currentFiscalYear.trim()}
            </span>{" "}
            instead of {setup?.currentFiscalYear}. Existing records stay under their original
            year.
          </>
        }
        confirmLabel="Change fiscal year"
        isPending={isPending}
        onConfirm={() => pendingValues && save(pendingValues)}
      />

      <PageHeader
        title="System Setup"
        description="Set the active fiscal year and default official names used across new contracts and printable documents."
      />

      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid gap-6 lg:grid-cols-[1fr_320px]"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Fiscal Year
              </CardTitle>
              <CardDescription>
                New entries default to this fiscal year. Old records stay saved under their
                original year and can still be viewed by selecting it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="currentFiscalYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current fiscal year</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY/YYY" {...field} />
                    </FormControl>
                    <FormDescription>
                      Accepted formats: YYYY/YYY, YYYY/YY, or YYYY-YYY.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="chiefAdministrativeOfficerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Administrative Officer</FormLabel>
                      <FormControl>
                        <Input placeholder="प्रमुख प्रशासकीय अधिकृतको नाम" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionChiefName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Chief</FormLabel>
                      <FormControl>
                        <Input placeholder="शाखा प्रमुखको नाम" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-5">
                <div className="mb-4">
                  <h3 className="font-semibold">Company Registration Certificate</h3>
                  <p className="text-xs text-muted-foreground">
                    Official shown in the signature section of company registration certificates.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="registrationOfficerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Officer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="दर्ता गर्ने अधिकारीको नाम" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registrationOfficerDesignation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Officer Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="दर्ता गर्ने अधिकारीको पद" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-5">
                <p className="text-sm text-muted-foreground">
                  Officer changes take effect when saved. Each appointment lasts until the next
                  recorded appointment, including changes within the same fiscal year. Saved
                  document officers remain unchanged.
                </p>

                <FormField
                  control={form.control}
                  name="officerEffectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historical appointment start (AD, local time; optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        For a historical appointment, enter all four official fields as they were
                        at that time. It ends at the next entry below. Existing certificates
                        require individual verification; history entries do not rewrite them.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="officerChangeReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment order / supporting document reference</FormLabel>
                      <FormControl>
                        <Input maxLength={2000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
                {isDirty ? (
                  <span className="mr-auto text-xs text-muted-foreground" aria-live="polite">
                    You have unsaved changes.
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || isPending}
                  onClick={() => form.reset(savedValues)}
                >
                  <RotateCcw />
                  Discard changes
                </Button>
                <Button type="submit" disabled={!isDirty || isPending || isLoading}>
                  {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Save setup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Available Years
              </CardTitle>
              <CardDescription>
                Registered years are retained even when they have no records yet, so switching the
                active year never removes another year.
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
                        form.setValue("currentFiscalYear", year, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fiscal years found yet.</p>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Officer assignment history</CardTitle>
          <CardDescription>
            Newest first. Each start time is inclusive; the next appointment ends that period. The
            migration baseline confirms settings only from its recorded time.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {historyError ? (
            <p>Unable to load officer history. Refresh to try again.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Effective from (local)</th>
                  <th className="p-2">Registration officer / designation</th>
                  <th className="p-2">Chief administrative officer / section chief</th>
                  <th className="p-2">Audit reference</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t">
                    <td className="p-2">{new Date(assignment.effectiveFrom).toLocaleString()}</td>
                    <td className="p-2">
                      {assignment.registrationOfficerName || "—"}
                      <br />
                      {assignment.registrationOfficerDesignation || "—"}
                    </td>
                    <td className="p-2">
                      {assignment.chiefAdministrativeOfficerName || "—"}
                      <br />
                      {assignment.sectionChiefName || "—"}
                    </td>
                    <td className="p-2">
                      {assignment.reason || "Settings change / migration baseline"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {assignment.recordedById || "Migration"} ·{" "}
                        {new Date(assignment.recordedAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
