import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fuelService } from "@/services/fuel/fuelService";
import type {
  FuelLog,
  FuelLogPayload,
  FuelLogQueryParams,
  FuelLogUpdatePayload,
} from "@/lib/schema/fuel/fuel";

type MutationError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as MutationError)?.response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : (message ?? fallback);
}

export const FUEL_KEYS = {
  all: ["fuel-logs"] as const,
  lists: () => [...FUEL_KEYS.all, "list"] as const,
  list: (params: FuelLogQueryParams) => [...FUEL_KEYS.lists(), params] as const,
  details: () => [...FUEL_KEYS.all, "detail"] as const,
  detail: (id: string) => [...FUEL_KEYS.details(), id] as const,
};

export function useFuelLogs(params: FuelLogQueryParams = {}) {
  return useQuery({
    queryKey: FUEL_KEYS.list(params),
    queryFn: () => fuelService.getAll(params),
    placeholderData: keepPreviousData,
  });
}

export function useFuelLog(id: string) {
  return useQuery({
    queryKey: FUEL_KEYS.detail(id),
    queryFn: () => fuelService.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCreateFuelLog() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: FuelLogPayload) => fuelService.create(payload),
    onSuccess: async (fuelLog) => {
      toast.success(
        fuelLog.approvalStatus === "APPROVED"
          ? "Fuel log saved"
          : "Fuel log submitted for approval",
      );
      await queryClient.invalidateQueries({ queryKey: FUEL_KEYS.lists() });
      router.push("/dashboard/fuel");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to save fuel log"));
    },
  });
}

export function useUpdateFuelLog() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FuelLogUpdatePayload;
    }) => fuelService.update(id, payload),
    onSuccess: async (fuelLog) => {
      toast.success(
        fuelLog.approvalStatus === "APPROVED"
          ? "Fuel log updated"
          : "Fuel log submitted for approval",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FUEL_KEYS.lists() }),
        queryClient.invalidateQueries({
          queryKey: FUEL_KEYS.detail(fuelLog.id),
        }),
      ]);
      router.push("/dashboard/fuel");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update fuel log"));
    },
  });
}

export function useApproveFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      fuelService.approve(id, remarks),
    onSuccess: async (fuelLog: FuelLog) => {
      toast.success("Fuel log approved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FUEL_KEYS.lists() }),
        queryClient.invalidateQueries({
          queryKey: FUEL_KEYS.detail(fuelLog.id),
        }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to approve fuel log"));
    },
  });
}

export function useRejectFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      fuelService.reject(id, remarks),
    onSuccess: async (fuelLog: FuelLog) => {
      toast.success("Fuel log rejected");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FUEL_KEYS.lists() }),
        queryClient.invalidateQueries({
          queryKey: FUEL_KEYS.detail(fuelLog.id),
        }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to reject fuel log"));
    },
  });
}

export function useDeleteFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fuelService.delete(id),
    onSuccess: async () => {
      toast.success("Fuel log deleted");
      await queryClient.invalidateQueries({ queryKey: FUEL_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete fuel log"));
    },
  });
}
