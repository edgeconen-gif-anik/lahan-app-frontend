// D:\Lahan Project APP\client\hooks\committee\useUserCommittees.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userCommitteeService } from "@/services/user-committe/userCommittee.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Queries (Reading Data) ---

export const useUserCommittees = (params?: { search?: string; fiscalYear?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["userCommittees", params],
    queryFn: () => userCommitteeService.getAll(params),
  });
};

export const useUserCommittee = (id: string) => {
  return useQuery({
    queryKey: ["userCommittees", id],
    queryFn: () => userCommitteeService.getOne(id),
    enabled: !!id, // Only run if ID is present
  });
};

// --- Mutations (Modifying Data) ---

export const useCreateUserCommittee = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: userCommitteeService.create,
    onSuccess: () => {
      toast.success("User Committee created successfully!");
      queryClient.invalidateQueries({ queryKey: ["userCommittees"] }); // Refresh list
      router.push("/dashboard/committees"); // Adjust routing path as needed
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create User Committee");
    },
  });
};

export const useUpdateUserCommittee = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: userCommitteeService.update,
    onSuccess: () => {
      toast.success("User Committee details updated!");
      queryClient.invalidateQueries({ queryKey: ["userCommittees"] }); // Refresh lists
      router.back(); // Go back to previous page
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update User Committee");
    },
  });
};

export const useDeleteUserCommittee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userCommitteeService.delete,
    onSuccess: () => {
      toast.success("User Committee deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["userCommittees"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete User Committee");
    },
  });
};