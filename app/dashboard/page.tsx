"use client";

import { useSession } from "next-auth/react";
import { useUserDashboard } from "@/hooks/project/use-dashboard"; // Import Hook
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, ShieldCheck, Mail, PlusCircle, FileText, Loader2
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLandingPage() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading } = useUserDashboard(); // Fetch Real Data

  const user = session?.user;
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : "U";

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Use Real Stats from Backend (with fallbacks to 0)
  const stats = [
    { 
      label: "Managed Projects", 
      value: dashboardData?.stats.totalManagedProjects || 0, 
      icon: Briefcase, 
      color: "text-blue-600" 
    },
    { 
      label: "Site In-Charge", 
      value: dashboardData?.stats.totalSiteInchargeProjects || 0, 
      icon: FileText, 
      color: "text-orange-600" 
    },
    // Example static stat (since backend doesn't send contracts yet)
    { 
      label: "System Role", 
      value: user?.role || "STAFF", 
      icon: ShieldCheck, 
      color: "text-green-600" 
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-white dark:bg-slate-950 p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-4 border-slate-100">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1 capitalize">
                <ShieldCheck className="h-3.5 w-3.5" /> {dashboardData?.userProfile.designation || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <Link href="/dashboard/projects/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {/* 2. Real Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Updated just now
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Recent Activity (Real Data) */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Projects</CardTitle>
            <CardDescription>Projects you are currently managing.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((project) => (
                  <div key={project.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">Budget: Rs. {project.allocatedBudget?.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100">
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active projects found.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}