import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSession } from "next-auth/react";

export interface DashboardData {
  userProfile: {
    name: string;
    designation: string;
    email: string;
  };
  stats: {
    totalManagedProjects: number;
    totalSiteInchargeProjects: number;
  };
  recentActivity: Array<{
    id: string;
    name: string;
    status: string;
    allocatedBudget: number;
  }>;
}

export const useUserDashboard = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: async () => {
      // Calls your NestJS endpoint: GET /users/:id/dashboard
      const { data } = await api.get<DashboardData>(`/users/${userId}/dashboard`);
      return data;
    },
    // Only fetch if we are logged in
    enabled: !!userId, 
  });
};