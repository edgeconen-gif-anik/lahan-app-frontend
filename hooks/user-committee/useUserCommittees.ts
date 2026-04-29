import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  userCommitteeService,
  UserCommitteeListParams,
  UserCommitteeListResponse,
  UserCommitteeMutationPayload,
  UserCommitteeRecord,
} from "@/services/user-committe/userCommittee.service";

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

function isUserCommitteeListResponse(value: unknown): value is UserCommitteeListResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as UserCommitteeListResponse).data)
  );
}

export const useUserCommittees = (params?: UserCommitteeListParams) => {
  return useQuery({
    queryKey: ["userCommittees", params],
    queryFn: () => userCommitteeService.getAll(params),
  });
};

export const useUserCommittee = (id: string) => {
  return useQuery({
    queryKey: ["userCommittees", id],
    queryFn: () => userCommitteeService.getOne(id),
    enabled: !!id,
  });
};

export const useCreateUserCommittee = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: UserCommitteeMutationPayload) =>
      userCommitteeService.create(payload),
    onSuccess: (committee: UserCommitteeRecord) => {
      toast.success(
        committee.approvalStatus === "APPROVED"
          ? "User Committee created successfully!"
          : "User Committee submitted for admin approval"
      );
      queryClient.invalidateQueries({ queryKey: ["userCommittees"] });
      router.push("/dashboard/committees");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create User Committee"));
    },
  });
};

export const useUpdateUserCommittee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserCommitteeMutationPayload & { id: string }) =>
      userCommitteeService.update(payload),
    onSuccess: async (committee: UserCommitteeRecord) => {
      toast.success(
        committee.approvalStatus === "APPROVED"
          ? "User Committee details updated!"
          : "User Committee changes submitted for admin approval"
      );
      queryClient.setQueryData(["userCommittees", committee.id], committee);
      queryClient.setQueriesData<unknown>(
        { queryKey: ["userCommittees"] },
        (current: unknown) => {
          if (!isUserCommitteeListResponse(current)) return current;

          return {
            ...current,
            data: current.data.map((item) =>
              item.id === committee.id ? committee : item
            ),
          };
        }
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userCommittees"] }),
        queryClient.invalidateQueries({ queryKey: ["contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update User Committee"));
    },
  });
};

export const useApproveUserCommittee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userCommitteeService.approve(id),
    onSuccess: async () => {
      toast.success("User Committee approved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userCommittees"] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to approve User Committee"));
    },
  });
};

export const useDeleteUserCommittee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userCommitteeService.delete(id),
    onSuccess: () => {
      toast.success("User Committee deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["userCommittees"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete User Committee"));
    },
  });
};
