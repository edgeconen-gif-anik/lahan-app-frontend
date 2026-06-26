"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Fuel, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContracts } from "@/hooks/contract/useContracts";
import { useProjects } from "@/hooks/project/useProjects";
import { useUsers } from "@/hooks/user/useUsers";
import type { Project } from "@/lib/schema";
import type {
  FuelLog,
  FuelLogPayload,
  FuelLogSource,
  FuelType,
} from "@/lib/schema/fuel/fuel";
import { FUEL_SOURCE_LABEL, FUEL_TYPE_LABEL } from "@/lib/schema/fuel/fuel";

type FuelFormValues = {
  userId: string;
  projectId: string;
  contractId: string;
  source: FuelLogSource;
  fuelType: FuelType;
  quantityLiters: string;
  ratePerLiter: string;
  vehicleNumber: string;
  odometerReading: string;
  purpose: string;
  logDate: string;
  remarks: string;
};

type FuelFormProps = {
  defaultFuelLog?: FuelLog;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onSubmit: (payload: FuelLogPayload) => void;
};

const today = new Date().toISOString().slice(0, 10);

function isoDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : today;
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FuelForm({
  defaultFuelLog,
  isSubmitting,
  mode,
  onSubmit,
}: FuelFormProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [form, setForm] = useState<FuelFormValues>({
    userId: defaultFuelLog?.userId ?? "",
    projectId: defaultFuelLog?.projectId ?? "",
    contractId: defaultFuelLog?.contractId ?? "",
    source: defaultFuelLog?.source ?? "REQUEST_FORM",
    fuelType: defaultFuelLog?.fuelType ?? "DIESEL",
    quantityLiters: defaultFuelLog?.quantityLiters
      ? String(defaultFuelLog.quantityLiters)
      : "",
    ratePerLiter: defaultFuelLog?.ratePerLiter
      ? String(defaultFuelLog.ratePerLiter)
      : "",
    vehicleNumber: defaultFuelLog?.vehicleNumber ?? "",
    odometerReading: defaultFuelLog?.odometerReading
      ? String(defaultFuelLog.odometerReading)
      : "",
    purpose: defaultFuelLog?.purpose ?? "",
    logDate: isoDateInput(defaultFuelLog?.logDate),
    remarks: defaultFuelLog?.remarks ?? "",
  });
  const [searchUser, setSearchUser] = useState("");
  const [searchProject, setSearchProject] = useState("");

  const { data: users, isLoading: isLoadingUsers } = useUsers(
    { search: searchUser || undefined, limit: 50 },
    { enabled: Boolean(isAdmin) },
  );
  const { data: projects, isLoading: isLoadingProjects } = useProjects({
    search: searchProject || undefined,
    limit: 50,
    sortBy: "sNo",
    sortOrder: "asc",
  });
  const { data: contracts = [], isLoading: isLoadingContracts } = useContracts({
    projectId: form.projectId || undefined,
  });

  const selectedProjectContracts = useMemo(
    () =>
      form.projectId
        ? contracts.filter((contract) => contract.projectId === form.projectId)
        : contracts,
    [contracts, form.projectId],
  );

  const estimatedTotal = useMemo(() => {
    const quantity = Number(form.quantityLiters);
    const rate = Number(form.ratePerLiter);
    if (!Number.isFinite(quantity) || !Number.isFinite(rate)) return null;
    if (quantity <= 0 || rate <= 0) return null;
    return quantity * rate;
  }, [form.quantityLiters, form.ratePerLiter]);

  const handleChange = (
    field: keyof FuelFormValues,
    value: FuelFormValues[keyof FuelFormValues],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "projectId" ? { contractId: "" } : {}),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: FuelLogPayload = {
      ...(isAdmin && form.userId ? { userId: form.userId } : {}),
      projectId: form.projectId || null,
      contractId: form.contractId || null,
      source: form.source,
      fuelType: form.fuelType,
      quantityLiters: Number(form.quantityLiters),
      ...(numberOrUndefined(form.ratePerLiter)
        ? { ratePerLiter: Number(form.ratePerLiter) }
        : {}),
      vehicleNumber: emptyToUndefined(form.vehicleNumber) ?? null,
      odometerReading: numberOrUndefined(form.odometerReading),
      purpose: form.purpose.trim(),
      logDate: form.logDate,
      remarks: emptyToUndefined(form.remarks) ?? null,
    };

    onSubmit(payload);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/fuel">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Fuel className="h-7 w-7 text-primary" />
            {mode === "create" ? "New Fuel Log" : "Edit Fuel Log"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record fuel issued from request forms, logbooks, or app entries.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          {isAdmin ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <input
                type="search"
                value={searchUser}
                onChange={(event) => setSearchUser(event.target.value)}
                placeholder="Search users..."
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
              <select
                value={form.userId}
                onChange={(event) => handleChange("userId", event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Current user</option>
                {(users?.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email || user.id}
                    {user.designation ? ` (${user.designation})` : ""}
                  </option>
                ))}
              </select>
              {isLoadingUsers ? (
                <p className="text-xs text-muted-foreground">
                  Loading users...
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Source</label>
            <select
              value={form.source}
              onChange={(event) =>
                handleChange("source", event.target.value as FuelLogSource)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              {Object.entries(FUEL_SOURCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fuel Type</label>
            <select
              value={form.fuelType}
              onChange={(event) =>
                handleChange("fuelType", event.target.value as FuelType)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              {Object.entries(FUEL_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Log Date</label>
            <input
              type="date"
              value={form.logDate}
              onChange={(event) => handleChange("logDate", event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <input
              type="search"
              value={searchProject}
              onChange={(event) => setSearchProject(event.target.value)}
              placeholder="Search projects..."
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
            <select
              value={form.projectId}
              onChange={(event) =>
                handleChange("projectId", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">No project link</option>
              {((projects?.data ?? []) as Project[]).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.sNo ? `${project.sNo} - ` : ""}
                  {project.name}
                </option>
              ))}
            </select>
            {isLoadingProjects ? (
              <p className="text-xs text-muted-foreground">
                Loading projects...
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contract</label>
            <select
              value={form.contractId}
              onChange={(event) =>
                handleChange("contractId", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">No contract link</option>
              {selectedProjectContracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber}
                  {contract.project?.name ? ` - ${contract.project.name}` : ""}
                </option>
              ))}
            </select>
            {isLoadingContracts ? (
              <p className="text-xs text-muted-foreground">
                Loading contracts...
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity (liters)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.quantityLiters}
              onChange={(event) =>
                handleChange("quantityLiters", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rate Per Liter</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ratePerLiter}
              onChange={(event) =>
                handleChange("ratePerLiter", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground">
              {estimatedTotal == null
                ? "Total amount will remain blank unless a rate is provided."
                : `Estimated total: Rs. ${estimatedTotal.toLocaleString()}`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Number</label>
            <input
              type="text"
              value={form.vehicleNumber}
              onChange={(event) =>
                handleChange("vehicleNumber", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Odometer Reading</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.odometerReading}
              onChange={(event) =>
                handleChange("odometerReading", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(event) => handleChange("purpose", event.target.value)}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
              placeholder="Purpose of fuel use"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(event) => handleChange("remarks", event.target.value)}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/fuel">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Submit Fuel Log"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
