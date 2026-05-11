import { z } from "zod";

// Enum Options for Select Inputs
export const ProjectStatusEnum = z.enum(["NOT_STARTED", "ONGOING", "COMPLETED", "ARCHIVED"]);
export const ProjectImplantedThroughEnum = z.enum(["COMP", "USER_COMMITTEE"]);

// Base Fields that apply to all projects
const baseProjectSchema = z.object({
  sNo: z.string().optional().or(z.literal("")).nullable(),
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1, "Type is required"), // e.g., "Road", "Building"
  budgetCode: z.string().min(1, "Budget Code is required"),
  fiscalYear: z.string().regex(/^\d{4}\s*[/-]\s*\d{2,3}$/, "Format: 2080/081 or 2080/81"),
  source: z.string().min(1, "Source is required"),
  
  allocatedBudget: z.coerce.number().min(1, "Budget must be greater than 0"),
  internalBudget: z.coerce.number().optional().default(0),
  centralBudget: z.coerce.number().optional().default(0),
  provinceBudget: z.coerce.number().optional().default(0),

  status: ProjectStatusEnum.default("NOT_STARTED"),

  // Staff Relations: Allow valid UUIDs, undefined, or empty strings
  projectManagerId: z.string().uuid().optional().or(z.literal("")).nullable(),
  siteInchargeId: z.string().uuid().optional().or(z.literal("")).nullable(),
  
  // Define these here so they exist in the type, but validate them in superRefine
  implantedThrough: ProjectImplantedThroughEnum.optional().or(z.literal("")).nullable(),
  companyId: z.string().uuid("Invalid UUID").optional().or(z.literal("")).nullable(),
  userCommitteeId: z.string().uuid("Invalid UUID").optional().or(z.literal("")).nullable(),
});

// Conditional Logic using superRefine for optimal form compatibility
export const projectSchema = baseProjectSchema.superRefine((data, ctx) => {
  // IF Implanted = COMP -> Require companyId
  if (data.implantedThrough === "COMP") {
    if (!data.companyId || data.companyId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyId"], // Attaches the error directly to the companyId field
        message: "Please select a company",
      });
    }
  }

  // IF Implanted = USER_COMMITTEE -> Require userCommitteeId
  if (data.implantedThrough === "USER_COMMITTEE") {
    if (!data.userCommitteeId || data.userCommitteeId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userCommitteeId"], // Attaches the error directly to the userCommitteeId field
        message: "Please select a user committee",
      });
    }
  }
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
