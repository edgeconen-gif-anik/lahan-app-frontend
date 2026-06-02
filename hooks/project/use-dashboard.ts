import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSession } from "next-auth/react";

export interface DashboardData {
  userProfile: {
    id: string;
    name: string;
    designation: string;
    email: string;
  };
  stats: {
    totalProjects: number;
    totalBudget: number;
    internalBudget: number;
    centralBudget: number;
    provinceBudget: number;
    completedProjects: number;
    ongoingProjects: number;
    notStartedProjects: number;
    archivedProjects: number;
    completionRate: number;
    totalSiteInchargeProjects: number;
    totalManagedContracts: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    allocatedBudget: number;
    fiscalYear: string;
  }>;
  recentContracts: Array<{
    id: string;
    contractNumber: string;
    contractAmount: number;
    status: string;
    project: {
      id: string;
      name: string;
    };
  }>;
  completedProjects: Array<{
    id: string;
    name: string;
    status: string;
    allocatedBudget: number;
    fiscalYear: string;
    sNo: string | null;
    siteIncharge: {
      id: string;
      name: string | null;
      designation: string | null;
      image: string | null;
    } | null;
  }>;
  topUsersByProjects: Array<{
    id: string;
    name: string | null;
    email: string | null;
    designation: string | null;
    image: string | null;
    projectCount: number;
    contractCount: number;
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
