// app/dashboard/projects/[id]/page.tsx
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useProject, useDeleteProject } from "@/hooks/project/useProjects";
import { useContracts } from "@/hooks/contract/useContracts";
import { deriveProjectStatusFromContracts } from "@/lib/project-status";
import { Calendar, DollarSign, Briefcase, User, MapPin, Trash2 } from "lucide-react";

export default function ProjectProfilePage() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id as string);
  const { data: contracts = [], isLoading: isContractsLoading } = useContracts({
    projectId: id as string,
  });
  const { mutate: deleteProject } = useDeleteProject();

  const displayStatus = useMemo(() => {
    if (!project) {
      return "NOT_STARTED";
    }

    if (isContractsLoading) {
      return project.status;
    }

    return deriveProjectStatusFromContracts(contracts);
  }, [contracts, isContractsLoading, project]);

  if (isLoading) return <div className="p-10 text-center">Loading details...</div>;
  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">Budget Code: {project.budgetCode} | {project.fiscalYear}</p>
        </div>
        <button 
          onClick={() => confirm("Are you sure?") && deleteProject(project.id)}
          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white p-2 rounded-md transition"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Breakdown */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign size={20} />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Total Allocated</h3>
            </div>
            <p className="text-3xl font-bold">रू {project.allocatedBudget.toLocaleString()}</p>
          </div>
          
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Source Contributions</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Internal</span>
                <span className="font-semibold">रू {project.internalBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Central</span>
                <span className="font-semibold">रू {project.centralBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Province</span>
                <span className="font-semibold">रू {project.provinceBudget?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm text-muted-foreground mb-2">Current Status</span>
          <div className="text-2xl font-black text-primary">{displayStatus}</div>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: displayStatus === 'COMPLETED' ? '100%' : displayStatus === 'ONGOING' ? '50%' : displayStatus === 'ARCHIVED' ? '100%' : '5%' }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stakeholders */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Briefcase size={20} /> Stakeholders
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><User size={20}/></div>
              <div>
                <p className="text-xs text-muted-foreground">Managed By</p>
                <p className="font-medium">{project.implantedThrough === 'COMP' ? 'Company' : 'User Committee'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><MapPin size={20}/></div>
              <div>
                <p className="text-xs text-muted-foreground">Implementation Detail</p>
                <p className="font-medium">{project.company?.name || project.userCommittee?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline/Meta */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={20} /> Project Meta
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Fiscal Year</p>
              <p className="font-medium">{project.fiscalYear}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="font-medium">{project.source}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
