"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowLeft, FolderKanban } from "lucide-react";

import { AdminRequired } from "@/components/admin-required";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useUpdateProject } from "@/hooks/project/useProjects";
import type { ProjectFormValues } from "@/lib/schema/project.schema";
import { ProjectForm } from "@/shared/project-form";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: project, isLoading, isError } = useProject(id);
  const { mutate: updateProject, isPending } = useUpdateProject();

  const handleSubmit = (values: ProjectFormValues) => {
    updateProject(
      { id, payload: values },
      {
        onSuccess: () => router.push(`/dashboard/projects/${id}`),
      }
    );
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminRequired />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project not found</AlertTitle>
          <AlertDescription>
            This project could not be loaded for editing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const defaultValues: Partial<ProjectFormValues> = {
    sNo: project.sNo ?? "",
    name: project.name,
    type: project.type,
    budgetCode: project.budgetCode,
    fiscalYear: project.fiscalYear,
    source: project.source,
    allocatedBudget: project.allocatedBudget,
    internalBudget: project.internalBudget,
    centralBudget: project.centralBudget,
    provinceBudget: project.provinceBudget,
    status: project.status,
    implantedThrough: project.implantedThrough ?? "",
    companyId: project.companyId ?? project.company?.id ?? "",
    userCommitteeId: project.userCommitteeId ?? project.userCommittee?.id ?? "",
    siteInchargeId: project.siteInchargeId ?? project.siteIncharge?.id ?? "",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/projects/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <FolderKanban className="h-7 w-7 text-primary" />
              Edit Project
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {project.name}
            </p>
          </div>
        </div>
      </div>

      <ProjectForm
        key={project.id}
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}
