//D:\Lahan Project APP\client\services\project\projectService.ts
import api from "@/lib/api";
import { Project,ProjectQueryParams,ProjectResponse } from "@/lib/schema";
import { ProjectFormValues } from "@/lib/schema/project.schema";

export const projectService = {
  // 1. Get All (Paginated)
 getAll: async (params: ProjectQueryParams) => {
    const query = new URLSearchParams();
    // ... your existing appends
    if (params.search) query.append('search', params.search); 
    
    // 👇 ADD THESE LINES
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await api.get(`/projects?${query.toString()}`);
    return response.data;
  },

  // 2. Get One (Detail)
  getOne: async (id: string) => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  // 3. Create
  create: async (payload: ProjectFormValues) => {
    const { data } = await api.post<Project>("/projects", payload);
    return data;
  },

  // 4. Update
  update: async ({ id, payload }: { id: string; payload: Partial<ProjectFormValues> }) => {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload);
    return data;
  },

  // 5. Delete
  delete: async (id: string) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  // 6. CSV Import
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await api.post("/projects/import/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
};