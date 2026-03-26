"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { toAdDate } from "@/lib/date-utils";

import {
  useUserCommittee,
  useUpdateUserCommittee,
} from "@/hooks/user-committee/useUserCommittees";

export default function EditCommitteePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: committee, isLoading } = useUserCommittee(id);
  const { mutate: updateCommittee, isPending } =
    useUpdateUserCommittee();

  const [formData, setFormData] = useState<any>(null);
  const [officials, setOfficials] = useState<any[]>([]);
  const [bsDate, setBsDate] = useState("");

  // ✅ Prefill when data loads
  useEffect(() => {
    if (committee) {
      setFormData({
        name: committee.name,
        address: committee.address,
        fiscalYear: committee.fiscalYear,
        formedDate: committee.formedDate.split("T")[0],
        bankName: committee.bankName,
        accountNumber: committee.accountNumber,
      });

      setOfficials(
        committee.officials.map((o: any) => ({
          id: o.id, // preserve DB id
          role: o.role,
          name: o.name,
          phoneNumber: o.phoneNumber,
          citizenshipNumber: o.citizenshipNumber || "",
        }))
      );
    }
  }, [committee]);

  if (isLoading || !formData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleOfficialChange = (
    id: string,
    field: string,
    value: string
  ) => {
    setOfficials((prev) =>
      prev.map((official) =>
        official.id === id
          ? { ...official, [field]: value }
          : official
      )
    );
  };

  const addMember = () => {
    setOfficials([
      ...officials,
      {
        id: crypto.randomUUID(),
        role: "MEMBER",
        name: "",
        phoneNumber: "",
        citizenshipNumber: "",
      },
    ]);
  };

  const removeMember = (id: string) => {
    setOfficials(
      officials.filter((official) => official.id !== id)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      formedDate: new Date(
        formData.formedDate
      ).toISOString(),
      officials: officials
        .filter((o) => o.name.trim() !== "")
        .map(({ id, ...rest }) => rest),
    };

    updateCommittee(
      { id, data: payload },
      {
        onSuccess: () =>
          router.push(`/dashboard/committees/${id}`),
      }
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/committees/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Edit Committee
          </h2>
          <p className="text-muted-foreground">
            Update committee details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update general details.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Fiscal Year</Label>
              <Input
                value={formData.fiscalYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fiscalYear: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Formed Date (AD)</Label>
              <Input
                type="date"
                value={formData.formedDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    formedDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Bank Name</Label>
              <Input
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Account Number</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountNumber: e.target.value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Officials */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>Officials</CardTitle>
              <CardDescription>
                Edit members and citizenship numbers.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMember}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {officials.map((official) => (
              <div
                key={official.id}
                className="grid md:grid-cols-4 gap-4 p-4 border rounded-lg"
              >
                <Input value={official.role} disabled />

                <Input
                  value={official.name}
                  onChange={(e) =>
                    handleOfficialChange(
                      official.id,
                      "name",
                      e.target.value
                    )
                  }
                />

                <Input
                  value={official.phoneNumber}
                  onChange={(e) =>
                    handleOfficialChange(
                      official.id,
                      "phoneNumber",
                      e.target.value
                    )
                  }
                />

                <Input
                  value={official.citizenshipNumber || ""}
                  onChange={(e) =>
                    handleOfficialChange(
                      official.id,
                      "citizenshipNumber",
                      e.target.value
                    )
                  }
                  placeholder="Citizenship No."
                />

                {official.role === "MEMBER" && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      removeMember(official.id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update Committee
          </Button>
        </div>
      </form>
    </div>
  );
}