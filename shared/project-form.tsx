"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useCompanies } from "@/hooks/company/useCompany";
import { useSystemSetup } from "@/hooks/setup/useSetup";
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { useUsers } from "@/hooks/user/useUsers";
import {
  projectSchema,
  type ProjectFormValues,
} from "@/lib/schema/project.schema";
import { cn } from "@/lib/utils";

type ProjectFormMode = "create" | "edit";

type ProjectFormProps = {
  defaultValues?: Partial<ProjectFormValues>;
  isSubmitting?: boolean;
  mode: ProjectFormMode;
  onSubmit: (values: ProjectFormValues) => void;
  submitLabel?: string;
};

type ProjectFormState = {
  sNo: string;
  name: string;
  type: string;
  budgetCode: string;
  fiscalYear: string;
  source: string;
  allocatedBudget: string;
  internalBudget: string;
  centralBudget: string;
  provinceBudget: string;
  status: "NOT_STARTED" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  implantedThrough: "" | "COMP" | "USER_COMMITTEE";
  companyId: string;
  userCommitteeId: string;
  siteInchargeId: string;
};

type FieldErrors = Partial<Record<keyof ProjectFormState, string>>;

const EMPTY_FORM_STATE: ProjectFormState = {
  sNo: "",
  name: "",
  type: "",
  budgetCode: "",
  fiscalYear: "",
  source: "",
  allocatedBudget: "",
  internalBudget: "",
  centralBudget: "",
  provinceBudget: "",
  status: "NOT_STARTED",
  implantedThrough: "",
  companyId: "",
  userCommitteeId: "",
  siteInchargeId: "",
};

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

function stringifyValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function buildFormState(defaultValues?: Partial<ProjectFormValues>): ProjectFormState {
  if (!defaultValues) {
    return EMPTY_FORM_STATE;
  }

  return {
    sNo: stringifyValue(defaultValues.sNo),
    name: stringifyValue(defaultValues.name),
    type: stringifyValue(defaultValues.type),
    budgetCode: stringifyValue(defaultValues.budgetCode),
    fiscalYear: stringifyValue(defaultValues.fiscalYear),
    source: stringifyValue(defaultValues.source),
    allocatedBudget: stringifyValue(defaultValues.allocatedBudget),
    internalBudget: stringifyValue(defaultValues.internalBudget),
    centralBudget: stringifyValue(defaultValues.centralBudget),
    provinceBudget: stringifyValue(defaultValues.provinceBudget),
    status: defaultValues.status ?? "NOT_STARTED",
    implantedThrough: defaultValues.implantedThrough ?? "",
    companyId: stringifyValue(defaultValues.companyId),
    userCommitteeId: stringifyValue(defaultValues.userCommitteeId),
    siteInchargeId: stringifyValue(defaultValues.siteInchargeId),
  };
}

function nullableTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMap(error: unknown): FieldErrors {
  if (!error || typeof error !== "object" || !("flatten" in error)) {
    return {};
  }

  const flattened = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();

  return Object.entries(flattened.fieldErrors).reduce<FieldErrors>(
    (errors, [field, messages]) => {
      if (messages?.[0]) {
        errors[field as keyof ProjectFormState] = messages[0];
      }

      return errors;
    },
    {}
  );
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
  className,
  error,
  htmlFor,
  icon,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  error?: string;
  htmlFor: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <Label htmlFor={htmlFor}>{label}</Label>
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function ProjectForm({
  defaultValues,
  isSubmitting = false,
  mode,
  onSubmit,
  submitLabel,
}: ProjectFormProps) {
  const { data: setup } = useSystemSetup();
  const { data: companies = [] } = useCompanies({ limit: 200 });
  const { data: committeesData } = useUserCommittees({ limit: 200 });
  const { data: usersData } = useUsers({ limit: 200 });

  const [formData, setFormData] = useState<ProjectFormState>(() =>
    buildFormState(defaultValues)
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);

  const committees = committeesData?.data ?? [];
  const users = usersData?.data ?? [];
  const effectiveFiscalYear =
    formData.fiscalYear ||
    (mode === "create" ? setup?.currentFiscalYear ?? "" : "");
  const effectiveFormData = {
    ...formData,
    fiscalYear: effectiveFiscalYear,
  };

  const budgetTotal = useMemo(() => {
    return ["internalBudget", "centralBudget", "provinceBudget"].reduce(
      (sum, key) => sum + Number(formData[key as keyof ProjectFormState] || 0),
      0
    );
  }, [formData]);

  const handleChange = (
    field: keyof ProjectFormState,
    value: ProjectFormState[keyof ProjectFormState]
  ) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };

      if (field === "implantedThrough") {
        if (value === "COMP") {
          next.userCommitteeId = "";
        } else if (value === "USER_COMMITTEE") {
          next.companyId = "";
        } else {
          next.companyId = "";
          next.userCommitteeId = "";
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidAttemptSubmit(true);

    const result = projectSchema.safeParse(effectiveFormData);

    if (!result.success) {
      setErrors(getErrorMap(result.error));
      return;
    }

    const implantedThrough = result.data.implantedThrough || null;

    const payload: ProjectFormValues = {
      ...result.data,
      sNo: nullableTrimmed(formData.sNo),
      name: result.data.name.trim(),
      type: result.data.type.trim(),
      budgetCode: result.data.budgetCode.trim(),
      fiscalYear: result.data.fiscalYear.trim(),
      source: result.data.source.trim(),
      implantedThrough,
      companyId:
        implantedThrough === "COMP" ? nullableTrimmed(formData.companyId) : null,
      userCommitteeId:
        implantedThrough === "USER_COMMITTEE"
          ? nullableTrimmed(formData.userCommitteeId)
          : null,
      siteInchargeId: nullableTrimmed(formData.siteInchargeId),
    };

    setErrors({});
    onSubmit(payload);
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {didAttemptSubmit && hasErrors ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review required</AlertTitle>
          <AlertDescription>
            Fix the highlighted project fields before saving.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Project Details
          </CardTitle>
          <CardDescription>Core registry information for this project.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FieldShell
            htmlFor="sNo"
            label="S. No."
            error={errors.sNo}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <Input
              id="sNo"
              value={formData.sNo}
              onChange={(event) => handleChange("sNo", event.target.value)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="fiscalYear"
            label="Fiscal Year"
            error={errors.fiscalYear}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <Input
              id="fiscalYear"
              value={effectiveFiscalYear}
              onChange={(event) => handleChange("fiscalYear", event.target.value)}
              placeholder="2082/083"
              aria-invalid={Boolean(errors.fiscalYear)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="name"
            label="Project Name"
            error={errors.name}
            icon={<ClipboardList className="h-4 w-4" />}
            className="md:col-span-2"
          >
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => handleChange("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="type"
            label="Project Type"
            error={errors.type}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <Input
              id="type"
              value={formData.type}
              onChange={(event) => handleChange("type", event.target.value)}
              aria-invalid={Boolean(errors.type)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="budgetCode"
            label="Budget Code"
            error={errors.budgetCode}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <Input
              id="budgetCode"
              value={formData.budgetCode}
              onChange={(event) => handleChange("budgetCode", event.target.value)}
              aria-invalid={Boolean(errors.budgetCode)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="source"
            label="Budget Source"
            error={errors.source}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <Input
              id="source"
              value={formData.source}
              onChange={(event) => handleChange("source", event.target.value)}
              aria-invalid={Boolean(errors.source)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="status"
            label="Status"
            error={errors.status}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <select
              id="status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={formData.status}
              onChange={(event) => handleChange("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleDollarSign className="h-4 w-4 text-primary" />
            Budget
          </CardTitle>
          <CardDescription>Allocated amount and source-wise split.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FieldShell
            htmlFor="allocatedBudget"
            label="Allocated Budget"
            error={errors.allocatedBudget}
            icon={<CircleDollarSign className="h-4 w-4" />}
          >
            <Input
              id="allocatedBudget"
              type="number"
              min="0"
              step="0.01"
              value={formData.allocatedBudget}
              onChange={(event) =>
                handleChange("allocatedBudget", event.target.value)
              }
              aria-invalid={Boolean(errors.allocatedBudget)}
            />
          </FieldShell>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Source Split</p>
            <p className="mt-1 text-2xl font-semibold">
              Rs. {budgetTotal.toLocaleString()}
            </p>
          </div>

          <FieldShell
            htmlFor="internalBudget"
            label="Internal Budget"
            error={errors.internalBudget}
            icon={<CircleDollarSign className="h-4 w-4" />}
          >
            <Input
              id="internalBudget"
              type="number"
              min="0"
              step="0.01"
              value={formData.internalBudget}
              onChange={(event) =>
                handleChange("internalBudget", event.target.value)
              }
              aria-invalid={Boolean(errors.internalBudget)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="centralBudget"
            label="Central Budget"
            error={errors.centralBudget}
            icon={<CircleDollarSign className="h-4 w-4" />}
          >
            <Input
              id="centralBudget"
              type="number"
              min="0"
              step="0.01"
              value={formData.centralBudget}
              onChange={(event) =>
                handleChange("centralBudget", event.target.value)
              }
              aria-invalid={Boolean(errors.centralBudget)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="provinceBudget"
            label="Province Budget"
            error={errors.provinceBudget}
            icon={<CircleDollarSign className="h-4 w-4" />}
          >
            <Input
              id="provinceBudget"
              type="number"
              min="0"
              step="0.01"
              value={formData.provinceBudget}
              onChange={(event) =>
                handleChange("provinceBudget", event.target.value)
              }
              aria-invalid={Boolean(errors.provinceBudget)}
            />
          </FieldShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Assignment
          </CardTitle>
          <CardDescription>Implementation partner and site incharge.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FieldShell
            htmlFor="implantedThrough"
            label="Implemented Through"
            error={errors.implantedThrough}
            icon={<Building2 className="h-4 w-4" />}
          >
            <select
              id="implantedThrough"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={formData.implantedThrough}
              onChange={(event) =>
                handleChange("implantedThrough", event.target.value)
              }
            >
              <option value="">Not assigned</option>
              <option value="COMP">Company</option>
              <option value="USER_COMMITTEE">User Committee</option>
            </select>
          </FieldShell>

          <FieldShell
            htmlFor="siteInchargeId"
            label="Site Incharge"
            error={errors.siteInchargeId}
            icon={<UserRound className="h-4 w-4" />}
          >
            <select
              id="siteInchargeId"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={formData.siteInchargeId}
              onChange={(event) =>
                handleChange("siteInchargeId", event.target.value)
              }
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email || user.id}
                  {user.designation ? ` - ${user.designation.replace(/_/g, " ")}` : ""}
                </option>
              ))}
            </select>
          </FieldShell>

          {formData.implantedThrough === "COMP" ? (
            <FieldShell
              htmlFor="companyId"
              label="Company"
              error={errors.companyId}
              icon={<Building2 className="h-4 w-4" />}
              className="md:col-span-2"
            >
              <select
                id="companyId"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.companyId}
                onChange={(event) => handleChange("companyId", event.target.value)}
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : null}

          {formData.implantedThrough === "USER_COMMITTEE" ? (
            <FieldShell
              htmlFor="userCommitteeId"
              label="User Committee"
              error={errors.userCommitteeId}
              icon={<UserRound className="h-4 w-4" />}
              className="md:col-span-2"
            >
              <select
                id="userCommitteeId"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.userCommitteeId}
                onChange={(event) =>
                  handleChange("userCommitteeId", event.target.value)
                }
              >
                <option value="">Select user committee</option>
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSubmitting ? "Saving..." : submitLabel ?? "Save Project"}
        </Button>
      </div>
    </form>
  );
}
