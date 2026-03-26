// lib/schema/user/user.ts
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// WHY z.coerce.number() ?
// Prisma Decimal fields ALWAYS serialize to strings in JSON responses
// e.g. contractAmount: "678982" not 678982
// z.coerce.number() handles BOTH string and number input safely.
// z.number() would reject the string and throw → isError = true on the page.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DesignationEnum = z.enum([
  "ASSISTANT_SUB_ENGINEER",
  "SUB_ENGINEER",
  "ENGINEER",
]);

export const RoleEnum = z.enum(["CREATOR", "REVIEWER", "ADMIN"]);

export const ProjectStatusEnum = z.enum([
  "NOT_STARTED",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
]);

export const ContractStatusEnum = z.enum([
  "NOT_STARTED",
  "AGREEMENT",
  "WORKORDER",
  "WORKINPROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export type Designation = z.infer<typeof DesignationEnum>;
export type Role        = z.infer<typeof RoleEnum>;

// ─── Embedded shapes ─────────────────────────────────────────────────────────

export const EmbeddedProjectSchema = z.object({
  id:     z.string(),
  name:   z.string(),
  sNo:    z.string().nullable().optional(),
  status: ProjectStatusEnum,
});

export const EmbeddedCompanySchema = z.object({
  id:   z.string(),
  name: z.string(),
});

export const EmbeddedCommitteeSchema = z.object({
  id:   z.string(),
  name: z.string(),
});

// ─── Contract inside a project (siteInchargeProjects.contracts) ──────────────

export const ProjectContractSchema = z.object({
  id:                     z.string(),
  contractNumber:         z.string(),
  contractAmount:         z.coerce.number(), // ✅ Prisma Decimal → comes as string
  status:                 ContractStatusEnum,
  startDate:              z.string(),
  intendedCompletionDate: z.string(),
  actualCompletionDate:   z.string().nullable().optional(),
  remarks:                z.string().nullable().optional(),
  createdAt:              z.string(),
  siteIncharge: z.object({
    id:          z.string(),
    name:        z.string().nullable(),
    designation: DesignationEnum.nullable().optional(),
  }).nullable().optional(),
  company:       EmbeddedCompanySchema.nullable().optional(),
  userCommittee: EmbeddedCommitteeSchema.nullable().optional(),
  agreement:     z.object({ id: z.string(), agreementDate: z.string() }).nullable().optional(),
  workOrder:     z.object({ id: z.string(), issuedDate: z.string() }).nullable().optional(),
});

// ─── Project with computed stats (from getProfile) ───────────────────────────

export const ProfileProjectSchema = z.object({
  id:              z.string(),
  name:            z.string(),
  sNo:             z.string().nullable().optional(),
  status:          ProjectStatusEnum,
  fiscalYear:      z.string(),
  budgetCode:      z.string(),
  allocatedBudget: z.coerce.number(), // ✅ Prisma Decimal
  internalBudget:  z.coerce.number(), // ✅ Prisma Decimal
  centralBudget:   z.coerce.number(), // ✅ Prisma Decimal
  provinceBudget:  z.coerce.number(), // ✅ Prisma Decimal
  // Computed by backend service
  contractCount:      z.number(),
  totalContractValue: z.number(),
  statusBreakdown:    z.record(z.string(), z.number()),
  contracts:          z.array(ProjectContractSchema),
});

// ─── Managed contract (from managedContracts) ────────────────────────────────

export const ManagedContractSchema = z.object({
  id:                     z.string(),
  contractNumber:         z.string(),
  contractAmount:         z.coerce.number(), // ✅ Prisma Decimal
  status:                 ContractStatusEnum,
  startDate:              z.string(),
  intendedCompletionDate: z.string(),
  actualCompletionDate:   z.string().nullable().optional(),
  project:       EmbeddedProjectSchema.nullable().optional(),
  company:       EmbeddedCompanySchema.nullable().optional(),
  userCommittee: EmbeddedCommitteeSchema.nullable().optional(),
});

// ─── Profile summary ─────────────────────────────────────────────────────────

export const ProfileSummarySchema = z.object({
  totalProjectsAsSiteIncharge:      z.number(),
  totalContractsAsSiteIncharge:     z.number(),
  totalContractValueAsSiteIncharge: z.number(),
  totalProjectContracts:            z.number(),
  totalProjectContractValue:        z.number(),
});

// ─── User list item (from GET /users) ────────────────────────────────────────

export const UserListItemSchema = z.object({
  id:            z.string(),
  name:          z.string().nullable(),
  email:         z.string().nullable(),
  role:          RoleEnum.nullable().optional(),
  designation:   DesignationEnum.nullable().optional(),
  image:         z.string().nullable().optional(),
  createdAt:     z.string(),
  updatedAt:     z.string(),
  emailVerified: z.string().nullable().optional(),
});

// ─── User profile (from GET /users/:id/profile) ──────────────────────────────

export const UserProfileSchema = z.object({
  id:          z.string(),
  name:        z.string().nullable(),
  email:       z.string().nullable(),
  role:        RoleEnum.nullable().optional(),
  designation: DesignationEnum.nullable().optional(),
  image:       z.string().nullable().optional(),
  createdAt:   z.string(),
  summary:     ProfileSummarySchema,
  siteInchargeProjects: z.array(ProfileProjectSchema),
  managedContracts:     z.array(ManagedContractSchema),
});

// ─── Dashboard (from GET /users/:id/dashboard) ───────────────────────────────

export const UserDashboardSchema = z.object({
  userProfile: z.object({
    id:          z.string(),
    name:        z.string().nullable(),
    designation: DesignationEnum.nullable().optional(),
    email:       z.string().nullable(),
  }),
  stats: z.object({
    totalSiteInchargeProjects: z.number(),
    totalManagedContracts:     z.number(),
  }),
  recentProjects: z.array(z.object({
    id:              z.string(),
    name:            z.string(),
    status:          ProjectStatusEnum,
    allocatedBudget: z.coerce.number(), // ✅ Prisma Decimal
    fiscalYear:      z.string(),
  })),
  recentContracts: z.array(z.object({
    id:             z.string(),
    contractNumber: z.string(),
    contractAmount: z.coerce.number(), // ✅ Prisma Decimal
    status:         ContractStatusEnum,
    project:        EmbeddedProjectSchema.nullable().optional(),
  })),
});

// ─── Paginated list response (from GET /users) ───────────────────────────────

export const UserListResponseSchema = z.object({
  data: z.array(UserListItemSchema),
  meta: z.object({
    total:    z.number(),
    page:     z.number(),
    lastPage: z.number(),
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type UserListItem     = z.infer<typeof UserListItemSchema>;
export type UserProfile      = z.infer<typeof UserProfileSchema>;
export type UserDashboard    = z.infer<typeof UserDashboardSchema>;
export type ProfileProject   = z.infer<typeof ProfileProjectSchema>;
export type ManagedContract  = z.infer<typeof ManagedContractSchema>;
export type ProfileSummary   = z.infer<typeof ProfileSummarySchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;