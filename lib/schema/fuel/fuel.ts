import { z } from "zod";
import { ApprovalStatusEnum } from "@/lib/schema/approval";

export const FuelLogSourceEnum = z.enum(["REQUEST_FORM", "LOGBOOK", "APP"]);
export const FuelTypeEnum = z.enum(["PETROL", "DIESEL"]);

export const EmbeddedFuelUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
});

export const EmbeddedFuelProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  sNo: z.string().nullable().optional(),
  fiscalYear: z.string().nullable().optional(),
});

export const EmbeddedFuelContractSchema = z.object({
  id: z.string(),
  contractNumber: z.string(),
  projectId: z.string(),
  fiscalYear: z.string().nullable().optional(),
});

export const FuelLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requestedById: z.string(),
  approvedById: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  contractId: z.string().nullable().optional(),
  source: FuelLogSourceEnum,
  fuelType: FuelTypeEnum,
  quantityLiters: z.coerce.number(),
  ratePerLiter: z.coerce.number().nullable().optional(),
  totalAmount: z.coerce.number().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  odometerReading: z.number().nullable().optional(),
  purpose: z.string(),
  logDate: z.string(),
  approvalStatus: ApprovalStatusEnum,
  approvedAt: z.string().nullable().optional(),
  rejectedAt: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: EmbeddedFuelUserSchema.optional(),
  requestedBy: EmbeddedFuelUserSchema.optional(),
  approvedBy: EmbeddedFuelUserSchema.nullable().optional(),
  project: EmbeddedFuelProjectSchema.nullable().optional(),
  contract: EmbeddedFuelContractSchema.nullable().optional(),
});

export const FuelLogListResponseSchema = z.object({
  data: z.array(FuelLogSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    lastPage: z.number(),
  }),
});

export const FuelLogPayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
  source: FuelLogSourceEnum,
  fuelType: FuelTypeEnum,
  quantityLiters: z.number().positive(),
  ratePerLiter: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  vehicleNumber: z.string().optional().nullable(),
  odometerReading: z.number().int().nonnegative().optional(),
  purpose: z.string().min(3),
  logDate: z.string(),
  remarks: z.string().optional().nullable(),
});

export const FuelLogUpdatePayloadSchema = FuelLogPayloadSchema.partial();

export type FuelLog = z.infer<typeof FuelLogSchema>;
export type FuelLogListResponse = z.infer<typeof FuelLogListResponseSchema>;
export type FuelLogPayload = z.infer<typeof FuelLogPayloadSchema>;
export type FuelLogUpdatePayload = z.infer<typeof FuelLogUpdatePayloadSchema>;
export type FuelLogSource = z.infer<typeof FuelLogSourceEnum>;
export type FuelType = z.infer<typeof FuelTypeEnum>;

export type FuelLogQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  requestedById?: string;
  projectId?: string;
  contractId?: string;
  source?: FuelLogSource;
  fuelType?: FuelType;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "logDate" | "quantityLiters" | "totalAmount";
  sortOrder?: "asc" | "desc";
};

export const FUEL_SOURCE_LABEL: Record<FuelLogSource, string> = {
  REQUEST_FORM: "Request Form",
  LOGBOOK: "Logbook",
  APP: "App",
};

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
};
