"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useCreateFuelLog, useFuelLog } from "@/hooks/fuel/useFuelLogs";
import type { FuelLog, FuelLogPayload } from "@/lib/schema/fuel/fuel";
import { FuelForm } from "../fuel-form";

function NewFuelLogContent() {
  const { mutate: createFuelLog, isPending } = useCreateFuelLog();
  const copyFromId = useSearchParams().get("from") ?? "";
  const { data: source, isLoading, isError } = useFuelLog(copyFromId);

  const handleSubmit = (payload: FuelLogPayload) => {
    createFuelLog(payload);
  };

  if (copyFromId && isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" role="status" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Copy what usually repeats (vehicle, fuel type, project, purpose, rate) and
  // leave out what changes every time (quantity, odometer, date, remarks).
  const template: FuelLog | undefined = source
    ? {
        ...source,
        quantityLiters: 0,
        odometerReading: null,
        remarks: null,
        logDate: "",
      }
    : undefined;

  const notice = template
    ? "Copied from an earlier entry. Enter today's quantity, odometer reading and date."
    : copyFromId && isError
      ? "The entry to copy could not be loaded, so you are starting with a blank form."
      : undefined;

  return (
    <FuelForm
      mode="create"
      isSubmitting={isPending}
      onSubmit={handleSubmit}
      defaultFuelLog={template}
      notice={notice}
    />
  );
}

export default function NewFuelLogPage() {
  return (
    <Suspense fallback={null}>
      <NewFuelLogContent />
    </Suspense>
  );
}
