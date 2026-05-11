"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AdminRequired() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Admin access required</AlertTitle>
        <AlertDescription>
          Project creation and editing are available only to admin users.
        </AlertDescription>
      </Alert>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/dashboard/projects">Back to projects</Link>
      </Button>
    </div>
  );
}
