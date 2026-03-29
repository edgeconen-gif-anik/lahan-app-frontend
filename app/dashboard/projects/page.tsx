"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUp,
  Filter,
  Plus,
  Search,
} from "lucide-react";

import { useContracts } from "@/hooks/contract/useContracts";
import { useProjects } from "@/hooks/project/useProjects";
import { Project } from "@/lib/schema";
import {
  deriveProjectStatusFromContracts,
  type ProjectStatus,
} from "@/lib/project-status";
import { projectService } from "@/services/project/projectService";

type SortColumn = "sNo" | "name" | "allocatedBudget" | "createdAt";

type DisplayProject = Project & {
  contractCount: number;
  displayStatus: ProjectStatus;
};

export default function ProjectLandingPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortColumn>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useProjects({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });
  const { data: contracts = [] } = useContracts();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await projectService.importCsv(file);
      toast.success(`Imported ${res.inserted} projects successfully!`);
      window.location.reload();
    } catch {
      toast.error("Failed to import CSV");
    }
  };

  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / limit) : 1;

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setPage(1);
  };

  const handleRowClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="ml-1 text-muted-foreground/50" />;
    }

    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-primary" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-primary" />
    );
  };

  const getStatusClasses = (status: ProjectStatus) => {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "ONGOING") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "ARCHIVED") {
      return "bg-zinc-100 text-zinc-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const contractsByProjectId = new Map<string, typeof contracts>();
  for (const contract of contracts) {
    const relatedContracts = contractsByProjectId.get(contract.projectId) ?? [];
    relatedContracts.push(contract);
    contractsByProjectId.set(contract.projectId, relatedContracts);
  }

  const displayedProjects: DisplayProject[] = (data?.data ?? [])
    .map((project: Project) => {
      const relatedContracts = contractsByProjectId.get(project.id) ?? [];
      const displayStatus: ProjectStatus =
        relatedContracts.length > 0
          ? deriveProjectStatusFromContracts(relatedContracts)
          : project.status;

      return {
        ...project,
        contractCount: relatedContracts.length,
        displayStatus,
      };
    })
    .filter(
      (project: DisplayProject) =>
        !statusFilter || project.displayStatus === statusFilter
    );

  const ongoingCount = displayedProjects.filter(
    (project) => project.displayStatus === "ONGOING"
  ).length;
  const completedCount = displayedProjects.filter(
    (project) => project.displayStatus === "COMPLETED"
  ).length;
  const archivedCount = displayedProjects.filter(
    (project) => project.displayStatus === "ARCHIVED"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition">
            <FileUp size={18} />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <Link
            href="/dashboard/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            <Plus size={18} />
            Create Project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Loaded Projects</p>
          <p className="text-2xl font-bold mt-1">{displayedProjects.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total available: {data?.meta?.total || 0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ongoing</p>
          <p className="text-2xl font-bold mt-1 text-blue-700">{ongoingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Completed: {completedCount} · Archived: {archivedCount}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Contracted Projects</p>
          <p className="text-2xl font-bold mt-1">
            {
              displayedProjects.filter((project) => project.contractCount > 0)
                .length
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Live status comes from related contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-lg border">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Name, S.No, or Budget Code..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 bg-background"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={16} />
          <span>
            Showing {displayedProjects.length} loaded projects · Page {page}
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th
                  className="p-4 font-medium w-20 cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("sNo")}
                >
                  <div className="flex items-center">
                    S. No. {getSortIcon("sNo")}
                  </div>
                </th>
                <th
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Project Name {getSortIcon("name")}
                  </div>
                </th>
                <th className="p-4 font-medium">Budget Code</th>
                <th className="p-4 font-medium">Fiscal Year</th>
                <th
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition select-none"
                  onClick={() => handleSort("allocatedBudget")}
                >
                  <div className="flex items-center">
                    Total Budget {getSortIcon("allocatedBudget")}
                  </div>
                </th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : displayedProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                displayedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b hover:bg-muted/30 transition cursor-pointer"
                    onClick={() => handleRowClick(project.id)}
                  >
                    <td className="p-4 text-sm font-bold text-primary">
                      {project.sNo || "-"}
                    </td>
                    <td className="p-4 font-semibold whitespace-normal min-w-[250px]">
                      <div className="space-y-1">
                        <div>{project.name}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {project.contractCount > 0
                            ? `${project.contractCount} contract${
                                project.contractCount > 1 ? "s" : ""
                              }`
                            : "No contracts yet"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono">
                      {project.budgetCode || "-"}
                    </td>
                    <td className="p-4 text-sm">{project.fiscalYear}</td>
                    <td className="p-4 text-sm">
                      à¤°à¥‚ {project.allocatedBudget.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClasses(
                          project.displayStatus
                        )}`}
                      >
                        {project.displayStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td
                      className="p-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="inline-flex items-center p-2 hover:bg-muted rounded-full"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (data?.meta?.total || 0) > limit && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <button
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
