import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { companyService } from "@/services/company/company.service";
import { Company } from "@/lib/schema/company.schema";

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

export const useCompanies = (params?: {
  search?: string;
  limit?: number;
  page?: number;
}) => {
  return useQuery<Company[]>({
    queryKey: ["companies", params],
    queryFn: () => companyService.getAll(params),
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companyService.getOne(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: companyService.create,
    onSuccess: (company) => {
      toast.success(
        company.approvalStatus === "APPROVED"
          ? "Company registered successfully"
          : "Company submitted for admin approval"
      );
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      router.push("/dashboard/companies");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to register company"));
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: companyService.update,
    onSuccess: (company) => {
      toast.success(
        company.approvalStatus === "APPROVED"
          ? "Company details updated"
          : "Company changes submitted for admin approval"
      );
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      router.push("/dashboard/companies");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update company"));
    },
  });
};

export const useApproveCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.approve,
    onSuccess: () => {
      toast.success("Company approved");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to approve company"));
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => {
      toast.success("Company deleted");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete company"));
    },
  });
};
