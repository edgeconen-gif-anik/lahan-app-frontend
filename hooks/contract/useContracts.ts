// hooks/contract/useContracts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { contractService } from "@/services/contract/contractService";
import type {
  CreateContractPayload,
  UpdateContractPayload,
} from "@/lib/schema/contract/contract";

type ContractListParams = {
  projectId?: string;
  companyId?: string;
  userCommitteeId?: string;
  userId?: string;
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

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CONTRACT_KEYS = {
  all:        ["contracts"] as const,
  lists:      ()            => [...CONTRACT_KEYS.all, "list"]          as const,
  list:       (p?: ContractListParams) => [...CONTRACT_KEYS.lists(), p] as const,
  details:    ()            => [...CONTRACT_KEYS.all, "detail"]        as const,
  detail:     (id: string)  => [...CONTRACT_KEYS.details(), id]        as const,
  nextNumber: ()            => [...CONTRACT_KEYS.all, "next-number"]   as const,
};

const COMPANY_QUERY_KEY = ["companies"] as const;

// ─── Read ─────────────────────────────────────────────────────────────────────

export const useContracts = (params?: ContractListParams) => {
  return useQuery({
    queryKey: CONTRACT_KEYS.list(params),
    queryFn:  () => contractService.getAll(params),
  });
};

export const useContract = (id: string) => {
  return useQuery({
    queryKey: CONTRACT_KEYS.detail(id),
    queryFn:  () => contractService.getOne(id),
    enabled:  !!id,
  });
};

/**
 * Fetches the next suggested sequential contract number from the server.
 * staleTime/gcTime = 0: never serve a cached number — it changes after every create/delete.
 */
export const useNextContractNumber = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: CONTRACT_KEYS.nextNumber(),
    queryFn:  contractService.getNextNumber,
    staleTime: 0,
    gcTime:    0,
    retry:     false,
  });

  return {
    contractNumber: data?.contractNumber ?? "",
    sequence:       data?.sequence       ?? 0,
    isLoading,
    isError,
    refetch,
  };
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (payload: CreateContractPayload) =>
      contractService.create(payload),

    onSuccess: (data) => {
      toast.success("Contract created successfully!");
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
      // Bust next-number so the next new-contract form gets a fresh suggestion
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumber() });
      router.push(`/dashboard/contracts/${data.id}`);
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create contract"));
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractPayload }) =>
      contractService.update(id, data),

    onSuccess: (_data, variables) => {
      toast.success("Contract updated successfully!");
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update contract"));
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (id: string) => contractService.delete(id),

    onSuccess: () => {
      toast.success("Contract deleted successfully!");
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumber() });
      router.push("/dashboard/contracts");
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete contract"));
    },
  });
};
