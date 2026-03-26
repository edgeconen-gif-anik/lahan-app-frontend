// \lib\schema\company\schema.ts

import { z } from "zod";

export const CompanyCategoryEnum = z.enum([
  "WORKS",
  "SUPPLY",
  "CONSULTING",
  "OTHER",
]);

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),

  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .length(10, "PAN must be 10 characters"),

  address: z.string().min(5, "Address is too short"),

  contactPerson: z.string().optional(),

  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, "Must be a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),

  email: z.string().email("Invalid email").optional().or(z.literal("")),

  category: CompanyCategoryEnum.default("WORKS"),

  registrationRequestDate: z.coerce
    .date({ error: "Request date is required" })
    .optional(),

  registrationDate: z.coerce.date().optional(),

  remarks: z.string().optional(),
});

/* ============================= */
/* ✅ FORM TYPE (for react-hook-form) */
/* ============================= */

export type CompanyFormValues = z.infer<typeof companySchema>;

/* ============================= */
/* ✅ DOMAIN TYPE (for API / table / list page) */
/* ============================= */

export type Company = CompanyFormValues & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/* ============================= */
/* ✅ ENUM TYPE (clean TS enum union) */
/* ============================= */

export type CompanyCategory = z.infer<typeof CompanyCategoryEnum>;