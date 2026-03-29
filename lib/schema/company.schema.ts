import { z } from "zod";
import { ApprovalStatus } from "@/lib/schema/approval";

export const CompanyCategoryEnum = z.enum(["WORKS", "SUPPLY", "CONSULTING", "OTHER"]);

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  panNumber: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format. Must be 10 characters: 5 letters, 4 digits, 1 letter")
    .min(10, "PAN must be 10 characters")
    .max(10, "PAN must be 10 characters")
    .or(z.string().regex(/^\d{9}$/, "PAN must be exactly 9 digits")),
  address: z.string().min(5, "Address is too short"),
  voucherNo: z.string().optional(),
  contactPerson: z.string().optional(),
  phoneNumber: z.string()
    .regex(/^\d{10}$/, "Must be a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  category: CompanyCategoryEnum,
  registrationRequestDate: z.date({
    message: "Registration request date is required and must be a valid date",
  }),
  registrationDate: z.date().optional().nullable(),
  remarks: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export interface CompanyCounts {
  contracts?: number;
  projects?: number;
}

export interface Company
  extends Omit<CompanyFormValues, "registrationRequestDate" | "registrationDate"> {
  id: string;
  registrationRequestDate: string;
  registrationDate?: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt?: string | null;
  isContracted: boolean;
  panVerified: boolean;
  _count?: CompanyCounts;
  createdAt: string;
  updatedAt: string;
}

export const getCompanyContractCount = (
  company: Company,
  derivedContractCount = 0,
) => Math.max(company._count?.contracts ?? 0, derivedContractCount);

export const getCompanyIsContracted = (
  company: Company,
  derivedContractCount = 0,
) => company.isContracted || getCompanyContractCount(company, derivedContractCount) > 0;
