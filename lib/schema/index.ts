// types/index.ts

export enum ProjectStatus {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum ProjectImplantedThrough {
  COMP = "COMP", // Matches Prisma Enum
  USER_COMMITTEE = "USER_COMMITTEE",
}

// Minimal types for relations to avoid circular dependencies
export interface SlimCompany {
  id: string;
  name: string;
}

export interface SlimCommittee {
  id: string;
  name: string;
}

export interface SlimUser {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  sNo?: string | null; // 👈 FIX: Added sNo to the frontend Project type
  name: string;
  type: string;
  budgetCode: string;
  source: string;
  fiscalYear: string;
  
  // Budgets are numbers in frontend (converted from Decimal by backend)
  allocatedBudget: number;
  internalBudget: number;
  centralBudget: number;
  provinceBudget: number;

  status: ProjectStatus;
  implantedThrough?: ProjectImplantedThrough;

  // Relations (These might be null depending on implantedThrough)
  companyId?: string;
  company?: SlimCompany;

  userCommitteeId?: string;
  userCommittee?: SlimCommittee;

  projectManagerId?: string;
  projectManager?: SlimUser;

  siteInchargeId?: string;
  siteIncharge?: SlimUser;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// types/index.ts (or lib/schema.ts)

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus | string; 
  fiscalYear?: string;
  search?: string;
  
  // 👇 FIX: Add "sNo" to this list!
  sortBy?: "createdAt" | "allocatedBudget" | "name" | "sNo"; 
  sortOrder?: "asc" | "desc";
}