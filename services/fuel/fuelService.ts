import api from "@/lib/api";
import {
  FuelLog,
  FuelLogListResponse,
  FuelLogListResponseSchema,
  FuelLogPayload,
  FuelLogQueryParams,
  FuelLogSchema,
  FuelLogUpdatePayload,
} from "@/lib/schema/fuel/fuel";

export const fuelService = {
  getAll: async (
    params: FuelLogQueryParams = {},
  ): Promise<FuelLogListResponse> => {
    const { data } = await api.get("/fuel-logs", { params });
    return FuelLogListResponseSchema.parse(data);
  },

  getOne: async (id: string): Promise<FuelLog> => {
    const { data } = await api.get(`/fuel-logs/${id}`);
    return FuelLogSchema.parse(data);
  },

  create: async (payload: FuelLogPayload): Promise<FuelLog> => {
    const { data } = await api.post("/fuel-logs", payload);
    return FuelLogSchema.parse(data);
  },

  update: async (
    id: string,
    payload: FuelLogUpdatePayload,
  ): Promise<FuelLog> => {
    const { data } = await api.patch(`/fuel-logs/${id}`, payload);
    return FuelLogSchema.parse(data);
  },

  approve: async (id: string, remarks?: string): Promise<FuelLog> => {
    const { data } = await api.patch(`/fuel-logs/${id}/approve`, {
      remarks: remarks || undefined,
    });
    return FuelLogSchema.parse(data);
  },

  reject: async (id: string, remarks?: string): Promise<FuelLog> => {
    const { data } = await api.patch(`/fuel-logs/${id}/reject`, {
      remarks: remarks || undefined,
    });
    return FuelLogSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fuel-logs/${id}`);
  },
};
