import { z } from "zod";
import { ApprovalStatusEnum } from "@/lib/schema/approval";

//
// ─── ENUMS ───────────────────────────────────────────────────────────────────
// Must match backend ContractStatus and Designation enums exactly
//

export const ContractStatusEnum = z.enum([
  "NOT_STARTED",
  "AGREEMENT",
  "WORKORDER",
  "WORKINPROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const DesignationEnum = z.enum([
  "ASSISTANT_SUB_ENGINEER",
  "SUB_ENGINEER",
  "ENGINEER",
]);

//
// ─── SHARED USER SHAPE ───────────────────────────────────────────────────────
// Used wherever a user is embedded (siteIncharge, user/committee rep)
//

export const EmbeddedUserSchema = z.object({
  id:          z.string(),
  name:        z.string().nullable(),
  designation: DesignationEnum.nullable().optional(),
});

export type EmbeddedUser = z.infer<typeof EmbeddedUserSchema>;

//
// ─── RELATION SCHEMAS ────────────────────────────────────────────────────────
// Match the `select` shapes in CONTRACT_INCLUDE on the backend
//

export const ContractProjectSchema = z.object({
  id:   z.string(),
  name: z.string(),
  sNo:  z.string().nullable().optional(),
  // ✅ siteIncharge on the project (inherited)
  siteIncharge: EmbeddedUserSchema.nullable().optional(),
});

export const ContractCompanySchema = z.object({
  id:        z.string(),
  name:      z.string(),
  panNumber: z.number().optional(), // ✅ number — matches Prisma Int field
});

export const ContractUserCommitteeSchema = z.object({
  id:   z.string(),
  name: z.string(),
});

//
// ─── NESTED DOCUMENTS ────────────────────────────────────────────────────────
// Match Agreement and WorkOrder models exactly
//

export const AgreementSchema = z.object({
  id:                  z.string(),
  contractId:          z.string(),
  agreementDate:       z.string(), // ISO string
  content:             z.string(),
  amount:              z.number(),
  contractorSignatory: z.string().nullable().optional(),
  officeSignatory:     z.string().nullable().optional(),
  witnessName:         z.string().nullable().optional(),
  contractorSignedAt:  z.string().nullable().optional(), // ✅ added — exists in schema
  officeSignedAt:      z.string().nullable().optional(), // ✅ added — exists in schema
  createdAt:           z.string(),
  updatedAt:           z.string(),
});

export const WorkOrderSchema = z.object({
  id:                  z.string(),
  contractId:          z.string(),
  issuedDate:          z.string(),                        // ✅ added — @default(now()) in schema
  workCompletionDate:  z.string(),
  content:             z.string(),
  contractorSignatory: z.string().nullable().optional(),
  officeSignatory:     z.string().nullable().optional(),
  witnessName:         z.string().nullable().optional(),
  createdAt:           z.string(),
  updatedAt:           z.string(),
});

//
// ─── MAIN CONTRACT RESPONSE ──────────────────────────────────────────────────
// Matches the full shape returned by CONTRACT_INCLUDE in contract.service.ts
//

export const ContractSchema = z.object({
  id:             z.string(),
  contractNumber: z.string(),
  contractAmount: z.number(),

  startDate:              z.string(), // ISO
  intendedCompletionDate: z.string(), // ISO
  actualCompletionDate:   z.string().nullable().optional(),

  status:  ContractStatusEnum,
  approvalStatus: ApprovalStatusEnum,
  approvedAt: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),

  // Foreign keys
  projectId:       z.string(),
  companyId:       z.string().nullable().optional(),
  userCommitteeId: z.string().nullable().optional(),
  userID:          z.string().nullable().optional(), // ✅ userID — matches Prisma field exactly
  siteInchargeId:  z.string().nullable().optional(), // ✅ added — new field on Contract

  // Relations (all optional — may be null depending on contract type)
  project:       ContractProjectSchema.nullable().optional(),
  company:       ContractCompanySchema.nullable().optional(),
  userCommittee: ContractUserCommitteeSchema.nullable().optional(),
  user:          EmbeddedUserSchema.nullable().optional(),        // committee rep
  siteIncharge:  EmbeddedUserSchema.nullable().optional(),        // ✅ direct site incharge

  agreement: AgreementSchema.nullable().optional(),
  workOrder:  WorkOrderSchema.nullable().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

//
// ─── PAYLOAD SCHEMAS (FRONTEND → BACKEND) ────────────────────────────────────
// Must match CreateContractSchema / UpdateContractSchema in contract.dto.ts
//

export const AgreementPayloadSchema = z.object({
  agreementDate:       z.string(),
  content:             z.string().min(10),
  amount:              z.number().positive(),
  contractorSignatory: z.string().optional(),
  officeSignatory:     z.string().optional(),
  witnessName:         z.string().optional(),
});

export const WorkOrderPayloadSchema = z.object({
  workCompletionDate:  z.string(),
  content:             z.string().min(10),
  contractorSignatory: z.string().optional(),
  officeSignatory:     z.string().optional(),
  witnessName:         z.string().optional(),
});

export const CreateContractPayloadSchema = z
  .object({
    projectId:       z.string().uuid(),
    companyId:       z.string().uuid().optional(),
    userCommitteeId: z.string().uuid().optional(),
    userID:          z.string().uuid().optional(), // ✅ userID — committee rep
    siteInchargeId:  z.string().uuid().optional(), // ✅ added

    contractNumber:  z.string().min(1),
    contractAmount:  z.number().positive(),

    startDate:              z.string(),
    intendedCompletionDate: z.string(),
    actualCompletionDate:   z.string().optional(),

    remarks: z.string().optional(),

    agreement: AgreementPayloadSchema.optional(),
    workOrder:  WorkOrderPayloadSchema.optional(),
  })

  // Must have either company or committee
  .refine((d) => !!(d.companyId ?? d.userCommitteeId), {
    message: "Either companyId or userCommitteeId is required",
    path: ["companyId"],
  })

  // intendedCompletionDate must be after startDate
  .refine(
    (d) =>
      !d.startDate ||
      !d.intendedCompletionDate ||
      new Date(d.intendedCompletionDate) > new Date(d.startDate),
    {
      message: "intendedCompletionDate must be after startDate",
      path: ["intendedCompletionDate"],
    },
  )

  // actualCompletionDate must be after startDate (if provided)
  .refine(
    (d) =>
      !d.startDate ||
      !d.actualCompletionDate ||
      new Date(d.actualCompletionDate) > new Date(d.startDate),
    {
      message: "actualCompletionDate must be after startDate",
      path: ["actualCompletionDate"],
    },
  );

export const UpdateContractPayloadSchema = z
  .object({
    projectId:       z.string().uuid().optional(),
    companyId:       z.string().uuid().optional(),
    userCommitteeId: z.string().uuid().optional(),
    userID:          z.string().uuid().optional(), // ✅ userID — matches Prisma field
    siteInchargeId:  z.string().uuid().optional(), // ✅ added

    contractNumber:  z.string().min(1).optional(),
    contractAmount:  z.number().positive().optional(),

    startDate:              z.string().optional(),
    intendedCompletionDate: z.string().optional(),
    actualCompletionDate:   z.string().optional(),

    remarks: z.string().optional(),

    agreement: AgreementPayloadSchema.partial().optional(),
    workOrder:  WorkOrderPayloadSchema.partial().optional(),
  })

  // intendedCompletionDate must be after startDate (if both provided)
  .refine(
    (d) =>
      !d.startDate ||
      !d.intendedCompletionDate ||
      new Date(d.intendedCompletionDate) > new Date(d.startDate),
    {
      message: "intendedCompletionDate must be after startDate",
      path: ["intendedCompletionDate"],
    },
  )

  // actualCompletionDate must be after startDate (if both provided)
  .refine(
    (d) =>
      !d.startDate ||
      !d.actualCompletionDate ||
      new Date(d.actualCompletionDate) > new Date(d.startDate),
    {
      message: "actualCompletionDate must be after startDate",
      path: ["actualCompletionDate"],
    },
  );

//
// ─── INFERRED TYPES ──────────────────────────────────────────────────────────
//

export type Contract               = z.infer<typeof ContractSchema>;
export type CreateContractPayload  = z.infer<typeof CreateContractPayloadSchema>;
export type UpdateContractPayload  = z.infer<typeof UpdateContractPayloadSchema>;
export type AgreementPayload       = z.infer<typeof AgreementPayloadSchema>;
export type WorkOrderPayload       = z.infer<typeof WorkOrderPayloadSchema>;

//
// ─── UTILITY ─────────────────────────────────────────────────────────────────
//

export const NextContractNumberResponseSchema = z.object({
  contractNumber: z.string(),
  sequence:       z.number(),
});

export type NextContractNumberResponse = z.infer<typeof NextContractNumberResponseSchema>;
