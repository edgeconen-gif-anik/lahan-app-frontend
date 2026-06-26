"use client";

import { FuelForm } from "../fuel-form";
import { useCreateFuelLog } from "@/hooks/fuel/useFuelLogs";
import type { FuelLogPayload } from "@/lib/schema/fuel/fuel";

export default function NewFuelLogPage() {
  const { mutate: createFuelLog, isPending } = useCreateFuelLog();

  const handleSubmit = (payload: FuelLogPayload) => {
    createFuelLog(payload);
  };

  return (
    <FuelForm mode="create" isSubmitting={isPending} onSubmit={handleSubmit} />
  );
}
