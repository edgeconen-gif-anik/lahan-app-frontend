"use client";
import React, { useState, useEffect } from "react";
import { useProjects } from "@/hooks/project/useProjects";
import { projectService } from "@/services/project/projectService";
import { Project } from "@/lib/schema";
import { 
  Plus, Search, FileUp, Filter, 
  Eye, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Helper type for our valid sort columns
type SortColumn = "sNo" | "name" | "allocatedBudget" | "createdAt";

export default function ProjectLandingPage() {
  const router = useRouter();
  
  // 1. Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // 2. Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;

  // 3. Sorting State (Default to newest first)
  const [sortBy, setSortBy] = useState<SortColumn>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce Effect: Waits 500ms after the user stops typing to update the actual search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on a new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Data (Now including sorting parameters)
  const { data, isLoading } = useProjects({
    page,
    limit,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined, 
    sortBy,
    sortOrder,
  });

  // Handle CSV Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await projectService.importCsv(file);
      toast.success(`Imported ${res.inserted} projects successfully!`);
      // Reload to fetch the fresh database S.No assignments
      window.location.reload(); 
    } catch (err) {
      toast.error("Failed to import CSV");
    }
  };

  // Calculate total pages safely
  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / limit) : 1;

  // Function to handle row click mapping to the profile page
  const handleRowClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  // Helper function to toggle sorting
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sorting changes
  };

  // Helper component to render sort icons
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="text-muted-foreground/50 ml-1" />;
    return sortOrder === "asc" ? 
      <ArrowUp size={14} className="text-primary ml-1" /> : 
      <ArrowDown size={14} className="text-primary ml-1" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition">
            <FileUp size={18} />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <Link href="/dashboard/projects/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            <Plus size={18} />
            Create Project
          </Link>
        </div>
      </div>

      {/* Filters section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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
        </select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={16} />
          <span>Showing {data?.data?.length || 0} of {data?.meta?.total || 0} projects</span>
        </div>
      </div>

      {/* Projects Table */}
      <div className="border rounded-lg overflow-hidden bg-card flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                {/* SORTABLE: S.No */}
                <th 
                  className="p-4 font-medium w-20 cursor-pointer hover:bg-muted/80 transition group select-none"
                  onClick={() => handleSort("sNo")}
                >
                  <div className="flex items-center">
                    S. No. <SortIcon column="sNo" />
                  </div>
                </th>
                
                {/* SORTABLE: Project Name */}
                <th 
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition group select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Project Name <SortIcon column="name" />
                  </div>
                </th>

                <th className="p-4 font-medium">Budget Code</th>
                <th className="p-4 font-medium">Fiscal Year</th>
                
                {/* SORTABLE: Total Budget */}
                <th 
                  className="p-4 font-medium cursor-pointer hover:bg-muted/80 transition group select-none"
                  onClick={() => handleSort("allocatedBudget")}
                >
                  <div className="flex items-center">
                    Total Budget <SortIcon column="allocatedBudget" />
                  </div>
                </th>

                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Loading projects...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No projects found.</td></tr>
              ) : (
                data?.data.map((project: Project) => (
                  <tr 
                    key={project.id} 
                    className="border-b hover:bg-muted/30 transition cursor-pointer"
                    onClick={() => handleRowClick(project.id)}
                  >
                    <td className="p-4 text-sm font-bold text-primary">
                      {project.sNo || "-"}
                    </td>
                    <td className="p-4 font-semibold whitespace-normal min-w-[250px]">{project.name}</td>
                    <td className="p-4 text-sm font-mono">{project.budgetCode || "-"}</td>
                    <td className="p-4 text-sm">{project.fiscalYear}</td>
                    <td className="p-4 text-sm">रू {project.allocatedBudget.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        project.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center p-2 hover:bg-muted rounded-full">
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && (data?.meta?.total || 0) > limit && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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