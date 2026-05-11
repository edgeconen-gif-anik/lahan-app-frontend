"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, FolderPlus } from "lucide-react";

import { AdminRequired } from "@/components/admin-required";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateProject } from "@/hooks/project/useProjects";
import type { ProjectFormValues } from "@/lib/schema/project.schema";
import { ProjectForm } from "@/shared/project-form";

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { mutate: createProject, isPending } = useCreateProject();

  const handleSubmit = (values: ProjectFormValues) => {
    createProject(values);
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <FolderPlus className="h-7 w-7 text-primary" />
              New Project
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a project manually to the municipal project registry.
            </p>
          </div>
        </div>
      </div>

      <ProjectForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        submitLabel="Create Project"
      />
    </div>
  );
}
