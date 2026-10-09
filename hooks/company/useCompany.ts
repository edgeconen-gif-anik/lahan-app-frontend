import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  fiscalYear?: string;
}) => {
  return useQuery<Company[]>({
    queryKey: ["companies", params],
    queryFn: () => companyService.getAll(params),
  });
};

/** Server-paged companies for the list page. */
export const useCompaniesPage = (
  params: Parameters<typeof companyService.getPage>[0],
) => {
  return useQuery({
    queryKey: ["companies", "page", params],
    queryFn: () => companyService.getPage(params),
    placeholderData: keepPreviousData,
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companyService.getOne(id),
    enabled: !!id,
  });
};

export const useVerifyCompanyOfficer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.verifyOfficer,
    onSuccess: () => {
      toast.success("Historical officer verified and saved");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to verify officer")),
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

/** Approves several companies in small batches and shows one summary toast. */
export const useBulkApproveCompanies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      let approved = 0;

      for (let index = 0; index < ids.length; index += 5) {
        const results = await Promise.allSettled(
          ids.slice(index, index + 5).map((id) => companyService.approve(id)),
        );
        approved += results.filter((result) => result.status === "fulfilled").length;
      }

      return { approved, failed: ids.length - approved };
    },
    onSuccess: ({ approved, failed }) => {
      if (failed === 0) {
        toast.success(`${approved} compan${approved === 1 ? "y" : "ies"} approved`);
      } else {
        toast.warning(`${approved} approved, ${failed} could not be approved`);
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to approve companies"));
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
