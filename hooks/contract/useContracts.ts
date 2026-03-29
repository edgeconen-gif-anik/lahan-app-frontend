// hooks/contract/useContracts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { contractService } from "@/services/contract/contractService";
import { projectService } from "@/services/project/projectService";
import type {
  Contract,
  CreateContractPayload,
  UpdateContractPayload,
} from "@/lib/schema/contract/contract";
import { deriveProjectStatusFromContracts } from "@/lib/project-status";
import { isApprovedStatus } from "@/lib/schema/approval";

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
const PROJECT_QUERY_KEY = ["projects"] as const;
const USER_QUERY_KEY = ["users"] as const;
const USER_COMMITTEE_QUERY_KEY = ["userCommittees"] as const;

async function syncProjectStatus(projectId: string) {
  const contracts = await contractService.getAll({ projectId });
  const approvedContracts = contracts.filter((contract) =>
    isApprovedStatus(contract.approvalStatus)
  );
  const status = deriveProjectStatusFromContracts(approvedContracts);

  await projectService.update({
    id: projectId,
    payload: { status },
  });
}

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

    onSuccess: async (data) => {
      try {
        await syncProjectStatus(data.projectId);
      } catch (error) {
        console.error("Failed to sync project status after contract creation:", error);
        toast.error(
          "Contract created, but the related project status could not be refreshed."
        );
      }

      const isApproved = isApprovedStatus(data.approvalStatus);

      toast.success(
        isApproved
          ? "Contract created successfully!"
          : "Contract submitted for admin approval"
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() }),
        queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_COMMITTEE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumber() }),
      ]);

      router.push(
        isApproved ? `/dashboard/contracts/${data.id}` : "/dashboard/contracts"
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create contract"));
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractPayload }) =>
      contractService.update(id, data),

    onMutate: ({ id }) => {
      const previousContract = queryClient.getQueryData<Contract>(
        CONTRACT_KEYS.detail(id)
      );

      return { previousContract };
    },

    onSuccess: async (data, variables, context) => {
      const relatedProjectIds = Array.from(
        new Set(
          [
            context?.previousContract?.projectId,
            variables.data.projectId,
            data.projectId,
          ].filter((projectId): projectId is string => Boolean(projectId))
        )
      );

      try {
        await Promise.all(
          relatedProjectIds.map((projectId) => syncProjectStatus(projectId))
        );
      } catch (error) {
        console.error("Failed to sync project status after contract update:", error);
        toast.error(
          "Contract updated, but the related project status could not be refreshed."
        );
      }

      const isApproved = isApprovedStatus(data.approvalStatus);

      toast.success(
        isApproved
          ? "Contract updated successfully!"
          : "Contract changes submitted for admin approval"
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: CONTRACT_KEYS.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() }),
        queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_COMMITTEE_QUERY_KEY }),
      ]);

      if (!isApproved) {
        router.push("/dashboard/contracts");
      }
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

export const useApproveContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contractService.approve(id),
    onSuccess: async (data) => {
      try {
        await syncProjectStatus(data.projectId);
      } catch (error) {
        console.error("Failed to sync project status after contract approval:", error);
      }

      toast.success("Contract approved");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.lists() }),
        queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_COMMITTEE_QUERY_KEY }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to approve contract"));
    },
  });
};
