// hooks/user/useUsers.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { userService, UserListParams } from "@/services/user/user.service"

// ─── Query key factory ────────────────────────────────────────────────────────
export const userKeys = {
  all:       ()         => ["users"]                          as const,
  list:      (p: UserListParams) => ["users", "list", p]     as const,
  profile:   (id: string) => ["users", "profile",   id]      as const,
  dashboard: (id: string) => ["users", "dashboard", id]      as const,
};

// ─── GET /users (paginated list) ─────────────────────────────────────────────
export function useUsers(
  params: UserListParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:    userKeys.list(params),
    queryFn:     () => userService.getAll(params),
    placeholderData: keepPreviousData, // keeps previous page visible while next loads
    staleTime:   30_000,
    enabled: options?.enabled ?? true,
  });
}

// ─── GET /users/:id/profile ───────────────────────────────────────────────────
export function useUserProfile(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.profile(id),
    queryFn:  () => userService.getProfile(id),
    enabled:  Boolean(id) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

// ─── GET /users/:id/dashboard ─────────────────────────────────────────────────
export function useUserDashboard(id: string) {
  return useQuery({
    queryKey: userKeys.dashboard(id),
    queryFn:  () => userService.getDashboard(id),
    enabled:  !!id,
    staleTime: 30_000,
  });
}
