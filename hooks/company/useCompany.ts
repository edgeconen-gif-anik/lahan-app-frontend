// client\hooks\company\useCompany.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company/company.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Queries (Reading Data) ---

// ✅ Updated to accept params
import { Company } from "@/lib/schema/company.schema"; // add this import

export const useCompanies = (params?: { search?: string; limit?: number; page?: number }) => {
  return useQuery<Company[]>({ // 👈 add generic here
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

// --- Mutations (Modifying Data) ---
// ... (Keep useCreateCompany, useUpdateCompany, and useDeleteCompany exactly as they are) ...

// --- Mutations (Modifying Data) ---

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      toast.success("Company registered successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] }); // Refresh list
      router.push("/dashboard/companies");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register company");
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: companyService.update,
    onSuccess: () => {
      toast.success("Company details updated");
      queryClient.invalidateQueries({ queryKey: ["companies"] }); // Refresh list
      router.back(); // Go back to previous page
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update company");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete company");
    },
  });
};