import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  setupService,
  UpdateSystemSetupPayload,
} from "@/services/setup/setupService";

export const SETUP_KEYS = {
  all: ["setup"] as const,
  settings: () => [...SETUP_KEYS.all, "settings"] as const,
  fiscalYears: () => [...SETUP_KEYS.all, "fiscal-years"] as const,
};

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

export const useSystemSetup = () => {
  return useQuery({
    queryKey: SETUP_KEYS.settings(),
    queryFn: setupService.get,
  });
};

export const useFiscalYears = () => {
  return useQuery({
    queryKey: SETUP_KEYS.fiscalYears(),
    queryFn: setupService.getFiscalYears,
  });
};

export const useUpdateSystemSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSystemSetupPayload) => setupService.update(payload),
    onSuccess: async () => {
      toast.success("Setup saved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SETUP_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["userCommittees"] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to save setup"));
    },
  });
};
