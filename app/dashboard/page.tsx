"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  Clock3,
  FileText,
  PlusCircle,
  Users,
  Wallet,
} from "lucide-react";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserDashboard } from "@/hooks/project/use-dashboard";
import { useUsers } from "@/hooks/user/useUsers";
import { companyService } from "@/services/company/company.service";
import { contractService } from "@/services/contract/contractService";
import { fuelService } from "@/services/fuel/fuelService";
import { userCommitteeService } from "@/services/user-committe/userCommittee.service";

type PendingTask = {
  id: string;
  type: string;
  title: string;
  meta: string;
  href: string;
};

function formatMoney(value?: number) {
  return `Rs. ${(value ?? 0).toLocaleString("en-IN")}`;
}

function formatLabel(value?: string | null) {
  return value ? value.replace(/_/g, " ").toLowerCase() : "Not assigned";
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusClasses(status?: string) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (status === "ONGOING") return "bg-sky-100 text-sky-700";
  if (status === "ARCHIVED") return "bg-zinc-100 text-zinc-700";
  return "bg-amber-100 text-amber-700";
}

export default function DashboardLandingPage() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading } = useUserDashboard();
  const [showPendingTasks, setShowPendingTasks] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const stats = dashboardData?.stats;
  const completionRate = stats?.completionRate ?? 0;

  const { data: pendingUsers, isLoading: isLoadingUsers } = useUsers(
    { approvalStatus: "PENDING", limit: 100 },
    { enabled: isAdmin }
  );

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["dashboard", "pending-approvals", "companies"],
    queryFn: () =>
      companyService.getAll({ approvalStatus: "PENDING", limit: 100 }),
    enabled: isAdmin,
  });

  const { data: committees = [], isLoading: isLoadingCommittees } = useQuery({
    queryKey: ["dashboard", "pending-approvals", "committees"],
    queryFn: () =>
      userCommitteeService.getAllRegistered({
        approvalStatus: "PENDING",
        limit: 100,
      }),
    enabled: isAdmin,
  });

  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["dashboard", "pending-approvals", "contracts"],
    queryFn: () => contractService.getAll({ approvalStatus: "PENDING" }),
    enabled: isAdmin,
  });

  const { data: fuelLogs, isLoading: isLoadingFuelLogs } = useQuery({
    queryKey: ["dashboard", "pending-approvals", "fuel-logs"],
    queryFn: () =>
      fuelService.getAll({
        approvalStatus: "PENDING",
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: isAdmin,
  });

  const pendingTasks = useMemo<PendingTask[]>(() => {
    if (!isAdmin) return [];

    const userTasks =
      pendingUsers?.data.map((pendingUser) => ({
        id: `user-${pendingUser.id}`,
        type: "User approval",
        title: pendingUser.name || pendingUser.email || "Unnamed user",
        meta: pendingUser.email || "Awaiting role and designation approval",
        href: "/dashboard/users",
      })) ?? [];

    const companyTasks = companies.map((company) => ({
      id: `company-${company.id}`,
      type: "Company approval",
      title: company.name,
      meta: company.address,
      href: `/dashboard/companies/${company.id}`,
    }));

    const committeeTasks = committees.map((committee) => ({
      id: `committee-${committee.id}`,
      type: "Committee approval",
      title: committee.name,
      meta: [committee.fiscalYear, committee.address].filter(Boolean).join(" · "),
      href: `/dashboard/committees/${committee.id}`,
    }));

    const contractTasks = contracts.map((contract) => ({
      id: `contract-${contract.id}`,
      type: "Contract approval",
      title: contract.contractNumber,
      meta:
        contract.project?.name ||
        contract.company?.name ||
        contract.userCommittee?.name ||
        "Contract awaiting approval",
      href: `/dashboard/contracts/${contract.id}`,
    }));

    const fuelTasks =
      fuelLogs?.data.map((fuelLog) => ({
        id: `fuel-${fuelLog.id}`,
        type: "Fuel approval",
        title: fuelLog.project?.name || fuelLog.contract?.contractNumber || fuelLog.purpose,
        meta: `${fuelLog.fuelType} · ${fuelLog.quantityLiters} L`,
        href: "/dashboard/fuel",
      })) ?? [];

    return [
      ...committeeTasks,
      ...companyTasks,
      ...contractTasks,
      ...fuelTasks,
      ...userTasks,
    ];
  }, [companies, committees, contracts, fuelLogs, isAdmin, pendingUsers]);

  const isLoadingPendingTasks =
    isAdmin &&
    (isLoadingCompanies ||
      isLoadingCommittees ||
      isLoadingContracts ||
      isLoadingFuelLogs ||
      isLoadingUsers);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 xl:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      helper: `${stats?.ongoingProjects ?? 0} ongoing`,
      icon: Briefcase,
      color: "text-sky-700",
    },
    {
      label: "Completed Projects",
      value: stats?.completedProjects ?? 0,
      helper: `${completionRate}% completion rate`,
      icon: BadgeCheck,
      color: "text-emerald-700",
    },
    {
      label: "Total Budget",
      value: formatMoney(stats?.totalBudget),
      helper: "Allocated portfolio value",
      icon: Wallet,
      color: "text-violet-700",
    },
    {
      label: "Your Contracts",
      value: stats?.totalManagedContracts ?? 0,
      helper: `${stats?.totalSiteInchargeProjects ?? 0} assigned projects`,
      icon: FileText,
      color: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-14 w-14 border">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              Overview
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.name || "User"} · {formatLabel(user?.role)} ·{" "}
              {formatLabel(dashboardData?.userProfile.designation)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/projects">
              <Briefcase className="h-4 w-4" />
              Projects
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <PlusCircle className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-700" />
                Pending Tasks
              </CardTitle>
              <CardDescription>
                Approval items waiting for admin action.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={showPendingTasks ? "secondary" : "outline"}
              onClick={() => setShowPendingTasks((current) => !current)}
            >
              {isLoadingPendingTasks ? "Loading..." : pendingTasks.length}
              pending
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          {showPendingTasks && (
            <CardContent>
              {isLoadingPendingTasks ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : pendingTasks.length ? (
                <div className="divide-y rounded-md border">
                  {pendingTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={task.href}
                      className="flex flex-col gap-3 p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{task.type}</Badge>
                          <ApprovalStatusBadge status="PENDING" />
                        </div>
                        <p className="truncate font-medium leading-5">
                          {task.title}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {task.meta}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  No pending approvals right now.
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="truncate text-2xl font-semibold">
                {item.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.helper}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Completed Projects</CardTitle>
                <CardDescription>
                  Latest finished projects across the portfolio.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/projects">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.completedProjects.length ? (
              <div className="divide-y">
                {dashboardData.completedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="flex flex-col gap-3 py-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium leading-5">{project.name}</p>
                        <Badge
                          variant="secondary"
                          className={getStatusClasses(project.status)}
                        >
                          {formatLabel(project.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.sNo ? `S.No ${project.sNo} · ` : ""}
                        {project.fiscalYear} · In-charge:{" "}
                        {project.siteIncharge?.name || "Not assigned"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatMoney(project.allocatedBudget)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No completed projects found.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 3 Users</CardTitle>
            <CardDescription>
              Users with the maximum assigned projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.topUsersByProjects.length ? (
              dashboardData.topUsersByProjects.map((topUser, index) => (
                <div key={topUser.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={topUser.image || ""} />
                    <AvatarFallback>{getInitials(topUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {topUser.name || "Unnamed user"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatLabel(topUser.designation)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {topUser.projectCount}
                    </p>
                    <p className="text-xs text-muted-foreground">projects</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No user assignments found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-600"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Not Started</p>
                <p className="mt-1 text-lg font-semibold">
                  {stats?.notStartedProjects ?? 0}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Archived</p>
                <p className="mt-1 text-lg font-semibold">
                  {stats?.archivedProjects ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Your Recent Projects</CardTitle>
            <CardDescription>
              Latest projects assigned to you as site in-charge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentProjects.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {dashboardData.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="rounded-md border p-4 transition hover:bg-muted/40"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-medium leading-5">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.fiscalYear}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={getStatusClasses(project.status)}
                      >
                        {formatLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatMoney(project.allocatedBudget)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No assigned projects found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <ClipboardCheck className="h-5 w-5 text-emerald-700" />
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-semibold">{stats?.completedProjects ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Clock3 className="h-5 w-5 text-sky-700" />
          <div>
            <p className="text-sm text-muted-foreground">Ongoing</p>
            <p className="font-semibold">{stats?.ongoingProjects ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-violet-700" />
          <div>
            <p className="text-sm text-muted-foreground">Active Users Ranked</p>
            <p className="font-semibold">
              {dashboardData?.topUsersByProjects.length ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
