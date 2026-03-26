// lib/services/user/userService.ts
import api from "@/lib/api"; // ✅ uses your axios instance with auth interceptor
import {
  UserListResponse,
  UserProfile,
  UserDashboard,
  UserListResponseSchema,
  UserProfileSchema,
  UserDashboardSchema,
} from "@/lib/schema/user/user"

// ─── Query params for GET /users ──────────────────────────────────────────────
export interface UserListParams {
  search?:      string;
  designation?: string;
  role?:        string;
  page?:        number;
  limit?:       number;
}

// ─── User API service ─────────────────────────────────────────────────────────

export const userService = {

  // GET /users?search=&designation=&role=&page=&limit=
  async getAll(params: UserListParams = {}): Promise<UserListResponse> {
    const { data } = await api.get("/users", { params });
    return UserListResponseSchema.parse(data);
  },

  // GET /users/:id/profile
  async getProfile(id: string): Promise<UserProfile> {
    const { data } = await api.get(`/users/${id}/profile`);
    return UserProfileSchema.parse(data);
  },

  // GET /users/:id/dashboard
  async getDashboard(id: string): Promise<UserDashboard> {
    const { data } = await api.get(`/users/${id}/dashboard`);
    return UserDashboardSchema.parse(data);
  },

  // GET /users/:id
  async getOne(id: string) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
};