"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, CompanyFormValues, CompanyCategoryEnum } from "@/lib/schema/company.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toFormalNepaliDate } from "@/lib/date-utils";

interface CompanyFormProps {
  defaultValues?: Partial<CompanyFormValues>;
  onSubmit: (data: CompanyFormValues) => void;
  isLoading?: boolean;
  buttonText: string;
}

export function CompanyForm({ defaultValues, onSubmit, isLoading = false, buttonText }: CompanyFormProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "Lahan, Siraha",
      category: "WORKS",
      panNumber: "",
      voucherNo: "", // ✅ ADDED default value
      contactPerson: "",
      phoneNumber: "",
      email: "",
      remarks: "",
      registrationRequestDate: undefined,
      registrationDate: undefined,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: "",
        address: "Lahan, Siraha",
        category: "WORKS",
        panNumber: "",
        voucherNo: "", // ✅ ADDED reset value
        contactPerson: "",
        phoneNumber: "",
        email: "",
        remarks: "",
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  const watchedRequestDate = form.watch("registrationRequestDate");
  const watchedRegDate = form.watch("registrationDate");

  const formatDateForInput = (date: Date | undefined | null): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: Date | undefined) => void
  ) => {
    const val = e.target.value;
    if (!val) {
      onChange(undefined);
      return;
    }
    const [year, month, day] = val.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    onChange(isNaN(date.getTime()) ? undefined : date);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* ── Section 1: Basic Details ── */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
            Company Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ABC Construction Pvt Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN / VAT Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 123456789"
                      maxLength={10} 
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ ADDED: Voucher Number Field */}
            <FormField
              control={form.control}
              name="voucherNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VCH-12345" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CompanyCategoryEnum.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="City, District" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section 2: Registration Dates ── */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Registration Dates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="registrationRequestDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Request Date (A.D.) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => handleDateChange(e, field.onChange)}
                    />
                  </FormControl>
                  <div className="h-6 mt-1">
                    {watchedRequestDate && !isNaN(new Date(watchedRequestDate).getTime()) ? (
                      <div className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block">
                        BS: {toFormalNepaliDate(watchedRequestDate)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Select date for Nepali conversion</span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Registration Approval Date (A.D.)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => handleDateChange(e, field.onChange)}
                    />
                  </FormControl>
                  <div className="h-6 mt-1">
                    {watchedRegDate && !isNaN(new Date(watchedRegDate).getTime()) ? (
                      <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 inline-block">
                        BS: {toFormalNepaliDate(watchedRegDate)}
                      </div>
                    ) : null}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section 3: Contact Info ── */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person / Proprietor</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="98xxxxxxxx"
                      maxLength={10}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="company@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Remarks ── */}
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks / Notes</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Any additional details..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end md:justify-start">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto min-w-[150px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </div>

      </form>
    </Form>
  );
}