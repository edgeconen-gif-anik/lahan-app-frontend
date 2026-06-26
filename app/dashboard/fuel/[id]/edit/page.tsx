"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FuelForm } from "../../fuel-form";
import { useFuelLog, useUpdateFuelLog } from "@/hooks/fuel/useFuelLogs";
import type { FuelLogPayload } from "@/lib/schema/fuel/fuel";

export default function EditFuelLogPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: fuelLog, isLoading, isError } = useFuelLog(id);
  const { mutate: updateFuelLog, isPending } = useUpdateFuelLog();

  const handleSubmit = (payload: FuelLogPayload) => {
    updateFuelLog({ id, payload });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !fuelLog) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/fuel">
            <ArrowLeft className="h-4 w-4" /> Back to fuel logs
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fuel log not found</AlertTitle>
          <AlertDescription>
            This fuel log could not be loaded for editing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin && fuelLog.approvalStatus === "APPROVED") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/fuel">
            <ArrowLeft className="h-4 w-4" /> Back to fuel logs
          </Link>
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Approved fuel log</AlertTitle>
          <AlertDescription>
            Approved fuel logs can only be changed by an admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <FuelForm
      key={fuelLog.id}
      mode="edit"
      defaultFuelLog={fuelLog}
      isSubmitting={isPending}
      onSubmit={handleSubmit}
    />
  );
}
