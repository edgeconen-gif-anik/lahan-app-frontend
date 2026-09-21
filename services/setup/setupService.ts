import api from "@/lib/api";

export type SystemSetup = {
  id: string;
  currentFiscalYear: string;
  chiefAdministrativeOfficerName?: string | null;
  sectionChiefName?: string | null;
  registrationOfficerName?: string | null;
  registrationOfficerDesignation?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSystemSetupPayload = {
  officerEffectiveFrom?: string;
  officerChangeReason?: string;
  currentFiscalYear: string;
  chiefAdministrativeOfficerName?: string | null;
  sectionChiefName?: string | null;
  registrationOfficerName?: string | null;
  registrationOfficerDesignation?: string | null;
};

export type OfficerAssignment = Omit<SystemSetup, "currentFiscalYear" | "createdAt" | "updatedAt"> & {
  effectiveFrom: string;
  recordedAt: string;
  recordedById: string | null;
  reason: string | null;
};

export const setupService = {
  getOfficerAssignments: async (): Promise<OfficerAssignment[]> => {
    const { data } = await api.get<OfficerAssignment[]>("/setup/officer-assignments");
    return data;
  },
  get: async (): Promise<SystemSetup> => {
    const { data } = await api.get<SystemSetup>("/setup");
    return data;
  },

  getFiscalYears: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>("/setup/fiscal-years");
    return data;
  },

  update: async (payload: UpdateSystemSetupPayload): Promise<SystemSetup> => {
    const { data } = await api.patch<SystemSetup>("/setup", payload);
    return data;
  },
};
