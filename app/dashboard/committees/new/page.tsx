"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { toAdDate } from "@/lib/date-utils";
import { useCreateUserCommittee } from "@/hooks/user-committee/useUserCommittees";

export default function RegisterCommitteePage() {
  const { mutate: createCommittee, isPending } =
    useCreateUserCommittee();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    fiscalYear: "2082/083",
    formedDate: "",
    bankName: "",
    accountNumber: "",
  });

  const [bsDate, setBsDate] = useState("");

  const [officials, setOfficials] = useState([
    {
      id: crypto.randomUUID(),
      role: "PRESIDENT",
      name: "",
      phoneNumber: "",
      citizenshipNumber: "",
    },
    {
      id: crypto.randomUUID(),
      role: "SECRETARY",
      name: "",
      phoneNumber: "",
      citizenshipNumber: "",
    },
    {
      id: crypto.randomUUID(),
      role: "TREASURER",
      name: "",
      phoneNumber: "",
      citizenshipNumber: "",
    },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBsDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setBsDate(value);

    const adDate = toAdDate(value);

    if (adDate) {
      setFormData((prev) => ({
        ...prev,
        formedDate: adDate.toISOString().split("T")[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        formedDate: "",
      }));
    }
  };

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

    if (!formData.formedDate) {
      alert(
        "Please enter a valid Formed Date in BS (YYYY-MM-DD)."
      );
      return;
    }

    const payload = {
      ...formData,
      formedDate: new Date(
        formData.formedDate
      ).toISOString(),
      officials: officials
        .filter((o) => o.name.trim() !== "")
        .map(({ id, ...rest }) => rest),
    };

    createCommittee(payload);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/committees">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Register Committee
          </h2>
          <p className="text-muted-foreground">
            अनुसूची १ बमोजिम उपभोक्ता समितिको दर्ता
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Committee Details */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the general details of the user committee.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Committee Name</Label>
              <Input
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                name="address"
                required
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Fiscal Year</Label>
              <Input
                name="fiscalYear"
                required
                value={formData.fiscalYear}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Formed Date (BS)</Label>
              <Input
                value={bsDate}
                onChange={handleBsDateChange}
                placeholder="YYYY-MM-DD"
                required
              />
              {formData.formedDate && (
                <p className="text-xs text-muted-foreground">
                  AD Equivalent: {formData.formedDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                name="bankName"
                required
                value={formData.bankName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                name="accountNumber"
                required
                value={formData.accountNumber}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Officials Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Committee Officials</CardTitle>
              <CardDescription>
                Assign roles and contact details.
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
                className="grid md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border"
              >
                <div>
                  <Label>Role</Label>
                  <Input
                    value={official.role}
                    disabled={official.role !== "MEMBER"}
                    className="bg-muted capitalize"
                  />
                </div>

                <div>
                  <Label>Full Name</Label>
                  <Input
                    required
                    value={official.name}
                    onChange={(e) =>
                      handleOfficialChange(
                        official.id,
                        "name",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    required
                    value={official.phoneNumber}
                    onChange={(e) =>
                      handleOfficialChange(
                        official.id,
                        "phoneNumber",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Citizenship No.</Label>
                  <Input
                    value={official.citizenshipNumber}
                    onChange={(e) =>
                      handleOfficialChange(
                        official.id,
                        "citizenshipNumber",
                        e.target.value
                      )
                    }
                  />
                </div>

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

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/committees">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isPending ? "Saving..." : "Save Committee"}
          </Button>
        </div>
      </form>
    </div>
  );
}