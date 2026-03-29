"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Calendar, DollarSign, MapPin, Trash2, User } from "lucide-react";
import { useContracts } from "@/hooks/contract/useContracts";
import { useDeleteProject, useProject } from "@/hooks/project/useProjects";
import { deriveProjectStatusFromContracts } from "@/lib/project-status";
import { toNepaliDate } from "@/lib/date-utils";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { ContractStatusBadge } from "@/components/contract-status-badge";

export default function ProjectProfilePage() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id as string);
  const { data: contracts = [], isLoading: isContractsLoading } = useContracts({
    projectId: id as string,
  });
  const { mutate: deleteProject } = useDeleteProject();

  const displayStatus = useMemo(() => {
    if (!project) return "NOT_STARTED";
    if (isContractsLoading) return project.status;
    return deriveProjectStatusFromContracts(contracts);
  }, [contracts, isContractsLoading, project]);

  if (isLoading) {
    return <div className="p-10 text-center">Loading details...</div>;
  }

  if (!project) {
    return <div className="p-10 text-center">Project not found.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            Budget Code: {project.budgetCode} | Fiscal Year: {project.fiscalYear}
          </div>
          <h1 className="mt-1 text-4xl font-bold">{project.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Project Status: {displayStatus}
            </span>
            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              Contracts: {contracts.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => confirm("Are you sure?") && deleteProject(project.id)}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          Delete Project
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <DollarSign className="h-5 w-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">Allocated Budget</h3>
            </div>
            <p className="text-3xl font-bold">Rs. {project.allocatedBudget.toLocaleString()}</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Source Contributions
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Internal</span>
                <span className="font-semibold">Rs. {project.internalBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Central</span>
                <span className="font-semibold">Rs. {project.centralBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span>Province</span>
                <span className="font-semibold">Rs. {project.provinceBudget?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Stakeholders
          </h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Implemented Through</p>
                <p className="font-medium">
                  {project.implantedThrough === "COMP" ? "Company" : "User Committee"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Implementor</p>
                <p className="font-medium">
                  {project.company?.name || project.userCommittee?.name || "Not assigned"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Project Type</p>
                <p className="font-medium">{project.type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-primary" />
            Contract Milestones
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contract statuses here stay synced with the contract list page.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contract
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Milestone
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Visibility
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timeline
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No contracts linked to this project yet.
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="border-t">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-mono font-semibold text-primary">
                          {contract.contractNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rs. {Number(contract.contractAmount).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-5 py-4">
                      <ApprovalStatusBadge status={contract.approvalStatus} />
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div>Start: {toNepaliDate(contract.startDate) ?? "-"}</div>
                      <div className="text-muted-foreground">
                        Intended End: {toNepaliDate(contract.intendedCompletionDate) ?? "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                      >
                        View Contract
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
