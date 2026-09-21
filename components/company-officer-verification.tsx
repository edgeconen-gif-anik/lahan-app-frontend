"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useVerifyCompanyOfficer } from "@/hooks/company/useCompany";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CompanyOfficerVerification({ id, updatedAt }: { id: string; updatedAt: string }) {
  const { data: session } = useSession();
  const mutation = useVerifyCompanyOfficer();
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [evidence, setEvidence] = useState("");
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "");

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-background p-6">
      <h1 className="text-xl font-semibold">Historical officer verification required</h1>
      <p>The registering officer was not saved for this record. An administrator must check the original certificate or appointment record before this certificate can be printed.</p>
      {isAdmin && (
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ id, expectedUpdatedAt: updatedAt, registrationOfficerName: name.trim(), registrationOfficerDesignation: designation.trim(), evidence: evidence.trim() });
        }}>
          <div className="space-y-2">
            <Label htmlFor="historical-officer">Officer name on the original record</Label>
            <Input id="historical-officer" required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="historical-designation">Designation at registration</Label>
            <Input id="historical-designation" required maxLength={200} value={designation} onChange={(event) => setDesignation(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="historical-evidence">Supporting document reference and reason</Label>
            <Input id="historical-evidence" required minLength={10} maxLength={2000} value={evidence} onChange={(event) => setEvidence(event.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">This is a permanent, one-time entry. Your user ID, verification time and document reference will be retained for audit.</p>
          <Button disabled={mutation.isPending || !name.trim() || !designation.trim() || evidence.trim().length < 10}>Verify and save officer</Button>
        </form>
      )}
    </div>
  );
}
