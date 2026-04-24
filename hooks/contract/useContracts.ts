// hooks/contract/useContracts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { contractService } from "@/services/contract/contractService";
import { projectService } from "@/services/project/projectService";
import type {
  Contract,
  CreateContractPayload,
  ContractStatus,
  NextContractNumberResponse,
  ProjectUpdatePayload,
  UpdateContractPayload,
} from "@/lib/schema/contract/contract";
import { deriveProjectStatusFromContracts } from "@/lib/project-status";
import { isApprovedStatus } from "@/lib/schema/approval";
import { CONTRACT_STATUS_LABEL } from "@/components/contract-status-badge";

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

type ContractNumberSource = "server" | "local" | "unavailable";

type ContractNumberPattern = {
  prefix: string;
  width: number;
  count: number;
  maxSequence: number;
};

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as MutationError)?.response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : (message ?? fallback);
}

function parseContractNumber(value?: string | null) {
  if (!value) return null;

  const match = value.trim().match(/^(.*?)(\d+)$/);
  if (!match) return null;

  return {
    prefix: match[1],
    sequence: Number(match[2]),
    width: match[2].length,
  };
}

function formatContractNumber(prefix: string, width: number, sequence: number) {
  return `${prefix}${String(sequence).padStart(width, "0")}`;
}

function buildContractNumberPatterns(contracts: Contract[]) {
  const patterns = new Map<string, ContractNumberPattern>();

  for (const contract of contracts) {
    const parsed = parseContractNumber(contract.contractNumber);
    if (!parsed) continue;

    const existing = patterns.get(parsed.prefix);
    if (existing) {
      existing.count += 1;
      existing.width = Math.max(existing.width, parsed.width);
      existing.maxSequence = Math.max(existing.maxSequence, parsed.sequence);
      continue;
    }

    patterns.set(parsed.prefix, {
      prefix: parsed.prefix,
      width: parsed.width,
      count: 1,
      maxSequence: parsed.sequence,
    });
  }

  return Array.from(patterns.values()).sort((a, b) =>
    b.count - a.count ||
    b.maxSequence - a.maxSequence ||
    b.width - a.width
  );
}

function pickFallbackPattern(
  patterns: ContractNumberPattern[],
  preferredPrefix?: string
) {
  if (preferredPrefix) {
    const preferred = patterns.find((pattern) => pattern.prefix === preferredPrefix);
    if (preferred) return preferred;
  }

  if (patterns.length === 1) return patterns[0] ?? null;

  return patterns.find((pattern) => pattern.count > 1) ?? null;
}

function resolveNextContractNumber(
  serverData: NextContractNumberResponse | undefined,
  contracts: Contract[]
) {
  const patterns = buildContractNumberPatterns(contracts);
  const serverParsed = parseContractNumber(serverData?.contractNumber);
  const serverSequence = serverData?.sequence ?? serverParsed?.sequence ?? 0;

  if (serverParsed) {
    const matchingPattern = patterns.find(
      (pattern) => pattern.prefix === serverParsed.prefix
    );
    const nextSequence = matchingPattern
      ? Math.max(serverSequence, matchingPattern.maxSequence + 1)
      : serverSequence;
    const width = matchingPattern
      ? Math.max(serverParsed.width, matchingPattern.width)
      : serverParsed.width;

    return {
      contractNumber: formatContractNumber(serverParsed.prefix, width, nextSequence),
      sequence: nextSequence,
      source: nextSequence === serverSequence ? "server" : "local",
    } satisfies {
      contractNumber: string;
      sequence: number;
      source: ContractNumberSource;
    };
  }

  if (serverData?.contractNumber) {
    return {
      contractNumber: serverData.contractNumber,
      sequence: serverSequence,
      source: "server",
    } satisfies {
      contractNumber: string;
      sequence: number;
      source: ContractNumberSource;
    };
  }

  const fallbackPattern = pickFallbackPattern(patterns);

  if (fallbackPattern) {
    const nextSequence = fallbackPattern.maxSequence + 1;

    return {
      contractNumber: formatContractNumber(
        fallbackPattern.prefix,
        fallbackPattern.width,
        nextSequence
      ),
      sequence: nextSequence,
      source: "local",
    } satisfies {
      contractNumber: string;
      sequence: number;
      source: ContractNumberSource;
    };
  }

  return {
    contractNumber: "",
    sequence: 0,
    source: "unavailable",
  } satisfies {
    contractNumber: string;
    sequence: number;
    source: ContractNumberSource;
  };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CONTRACT_KEYS = {
  all:        ["contracts"] as const,
  lists:      ()            => [...CONTRACT_KEYS.all, "list"]          as const,
  list:       (p?: ContractListParams) => [...CONTRACT_KEYS.lists(), p] as const,
  details:    ()            => [...CONTRACT_KEYS.all, "detail"]        as const,
  detail:     (id: string)  => [...CONTRACT_KEYS.details(), id]        as const,
  nextNumbers: ()           => [...CONTRACT_KEYS.all, "next-number"]   as const,
  nextNumber: (projectId?: string) =>
    [...CONTRACT_KEYS.nextNumbers(), projectId ?? null] as const,
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
export const useNextContractNumber = (projectId?: string) => {
  const {
    data,
    isLoading: isLoadingServerNumber,
    isError: isServerNumberError,
    refetch: refetchServerNumber,
  } = useQuery({
    queryKey: CONTRACT_KEYS.nextNumber(projectId),
    queryFn:  () => contractService.getNextNumber({ projectId }),
    staleTime: 0,
    gcTime:    0,
    retry:     false,
  });

  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    isError: isContractsError,
    refetch: refetchContracts,
  } = useContracts();

  const resolved = resolveNextContractNumber(data, contracts);

  return {
    contractNumber: resolved.contractNumber,
    sequence:       resolved.sequence,
    source:         resolved.source,
    isLoading:      isLoadingServerNumber || isLoadingContracts,
    isError:        resolved.source === "unavailable" && isServerNumberError && isContractsError,
    refetch:        () => Promise.all([refetchServerNumber(), refetchContracts()]),
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
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumbers() }),
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
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumbers() }),
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

export const useProjectUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdatePayload }) =>
      contractService.projectUpdate(id, data),
    onSuccess: async (data, variables) => {
      try {
        await syncProjectStatus(data.projectId);
      } catch (error) {
        console.error("Failed to sync project status after contract completion:", error);
        toast.error(
          "Contract completed, but the related project status could not be refreshed."
        );
      }

      toast.success(
        data.completionCode
          ? `Contract completed. Completion code: ${data.completionCode}`
          : "Contract completed successfully!"
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
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to complete contract"));
    },
  });
};

export const useUpdateContractStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ContractStatus;
    }) => contractService.update(id, { status }),
    onSuccess: async (data, variables) => {
      try {
        await syncProjectStatus(data.projectId);
      } catch (error) {
        console.error("Failed to sync project status after contract status update:", error);
      }

      toast.success(
        `Contract moved to ${CONTRACT_STATUS_LABEL[variables.status]}`
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
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update contract status"));
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
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.nextNumbers() });
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
        queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.details() }),
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
