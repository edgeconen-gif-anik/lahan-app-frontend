// hooks/project/useProjects.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { projectService } from "@/services/project/projectService";
import { ProjectQueryParams } from "@/lib/schema"; // Ensure this is updated (see below)
import { toast } from "sonner"; 
import { useRouter } from "next/navigation";

// Keys for caching
const PROJECT_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEYS.all, "list"] as const,
  // Automatically caches based on the new `search` param when passed in
  list: (params: ProjectQueryParams) => [...PROJECT_KEYS.lists(), params] as const,
  details: () => [...PROJECT_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
};

// ================================
// 1. Fetch Projects (List)
// ================================
export const useProjects = (params: ProjectQueryParams = {}) => {
  return useQuery({
    queryKey: PROJECT_KEYS.list(params),
    queryFn: () => projectService.getAll(params),
    placeholderData: keepPreviousData, 
  });
};

// ================================
// 2. Fetch Single Project
// ================================
export const useProject = (id: string) => {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projectService.getOne(id),
    enabled: !!id, 
  });
};

// ================================
// 3. Create Project Mutation
// ================================
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: projectService.create,
    onSuccess: (data) => {
      toast.success(`Project "${data.name}" created!`);
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      router.push(`/dashboard/projects/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create project");
    },
  });
};

// ================================
// 4. Update Project Mutation
// ================================
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.update,
    onSuccess: (data) => {
      toast.success("Project updated successfully");
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update project");
    },
  });
};

// ================================
// 5. Delete Project Mutation
// ================================
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      router.push("/dashboard/projects");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete");
    },
  });
};