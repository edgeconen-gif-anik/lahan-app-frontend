import api from "@/lib/api";

export type SystemSetup = {
  id: string;
  currentFiscalYear: string;
  chiefAdministrativeOfficerName?: string | null;
  sectionChiefName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSystemSetupPayload = {
  currentFiscalYear: string;
  chiefAdministrativeOfficerName?: string | null;
  sectionChiefName?: string | null;
};

export const setupService = {
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
