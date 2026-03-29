// app/dashboard/users/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/hooks/user/useUsers";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  HardHat,
  ShieldCheck,
  FolderOpen,
  FileText,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Calendar,
} from "lucide-react";
import {
  ProfileProject,
  ManagedContract,
  Designation,
  Role,
} from "@/lib/schema/user/user";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DESIGNATION_LABEL: Record<Designation, string> = {
  ASSISTANT_SUB_ENGINEER: "Asst. Sub-Engineer",
  SUB_ENGINEER:           "Sub-Engineer",
  ENGINEER:               "Engineer",
};

const ROLE_LABEL: Record<Role, string> = {
  CREATOR:  "Creator",
  REVIEWER: "Reviewer",
  ADMIN:    "Admin",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED:    "Not Started",
  AGREEMENT:      "Agreement",
  WORKORDER:      "Work Order",
  WORKINPROGRESS: "In Progress",
  COMPLETED:      "Completed",
  ARCHIVED:       "Archived",
};

const CONTRACT_STATUS_COLOR: Record<string, string> = {
  NOT_STARTED:    "bg-gray-100 text-gray-600",
  AGREEMENT:      "bg-blue-100 text-blue-700",
  WORKORDER:      "bg-indigo-100 text-indigo-700",
  WORKINPROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:      "bg-green-100 text-green-700",
  ARCHIVED:       "bg-orange-100 text-orange-700",
};

function formatCurrency(n: number) {
  if (n >= 10_000_000) return `रू ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `रू ${(n / 100_000).toFixed(2)} L`;
  return `रू ${n.toLocaleString("ne-NP")}`;
}

function toDateDisplay(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return <img src={image} alt={name ?? ""} className="w-16 h-16 rounded-full object-cover ring-2 ring-border" />;
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl ring-2 ring-border">
      {initials}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: string | number;
  sub?:  string;
  icon:  React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${color} shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Contract Row (inside a project group) ────────────────────────────────────

function ContractRow({ contract }: {
  contract: {
    id: string;
    contractNumber: string;
    contractAmount: number;
    status: string;
    startDate: string;
    intendedCompletionDate: string;
    actualCompletionDate?: string | null;
    company?:       { name: string } | null;
    userCommittee?: { name: string } | null;
  };
}) {
  const isCompleted = contract.status === "COMPLETED";

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 text-sm flex-wrap
      ${isCompleted ? "bg-green-50/50 border-green-200" : "bg-card"}`}
    >
      <FileText size={14} className="text-muted-foreground shrink-0" />

      <span className="font-mono text-xs font-semibold">{contract.contractNumber}</span>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_STATUS_COLOR[contract.status]}`}>
        {isCompleted && "✓ "}{CONTRACT_STATUS_LABEL[contract.status]}
      </span>

      {(contract.company || contract.userCommittee) && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {contract.company
            ? <><Building2 size={11} />{contract.company.name}</>
            : <><Users size={11} />{contract.userCommittee?.name}</>
          }
        </span>
      )}

      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
        <Calendar size={11} />
        {toDateDisplay(contract.startDate)} → {toDateDisplay(
          contract.actualCompletionDate ?? contract.intendedCompletionDate
        )}
      </span>

      <span className="text-xs font-bold">
        {formatCurrency(Number(contract.contractAmount))}
      </span>
    </div>
  );
}

// ─── Project Group (contracts grouped under their project) ────────────────────

function ProjectGroup({
  projectName,
  projectSNo,
  projectStatus,
  contracts,
}: {
  projectName:   string;
  projectSNo?:   string | null;
  projectStatus: string;
  contracts: Array<{
    id: string;
    contractNumber: string;
    contractAmount: number;
    status: string;
    startDate: string;
    intendedCompletionDate: string;
    actualCompletionDate?: string | null;
    company?:       { name: string } | null;
    userCommittee?: { name: string } | null;
  }>;
}) {
  const [open, setOpen] = useState(true);

  const allCompleted  = contracts.every((c) => c.status === "COMPLETED");
  const anyCompleted  = contracts.some((c) => c.status === "COMPLETED");
  const totalValue    = contracts.reduce((s, c) => s + Number(c.contractAmount), 0);
  const completedValue = contracts
    .filter((c) => c.status === "COMPLETED")
    .reduce((s, c) => s + Number(c.contractAmount), 0);

  return (
    <div className={`border rounded-xl overflow-hidden
      ${allCompleted ? "border-green-300" : "border-border"}`}
    >
      {/* Project header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
          ${allCompleted ? "bg-green-50 hover:bg-green-100/70" : "bg-muted/30 hover:bg-muted/60"}`}
      >
        <FolderOpen size={15} className={allCompleted ? "text-green-600" : "text-muted-foreground"} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {projectSNo && (
              <span className="text-xs font-mono bg-background border px-1.5 py-0.5 rounded">
                #{projectSNo}
              </span>
            )}
            <span className="font-semibold text-sm truncate">{projectName}</span>
            {allCompleted && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span>{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</span>
            <span>Total: <span className="font-medium text-foreground">{formatCurrency(totalValue)}</span></span>
            {anyCompleted && !allCompleted && (
              <span className="text-green-600">
                {formatCurrency(completedValue)} completed
              </span>
            )}
          </div>
        </div>

        <span className="text-muted-foreground shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* Contracts list */}
      {open && (
        <div className="px-4 py-3 space-y-2 border-t bg-background">
          {contracts.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: profile, isLoading, isError } = useUserProfile(userId, {
    enabled: isAdmin,
  });

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border flex items-center gap-2">
          <AlertCircle size={18} /> Only admins can view user profiles here.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border flex items-center gap-2">
          <AlertCircle size={18} /> Failed to load user profile.
        </div>
      </div>
    );
  }

  const { summary, siteInchargeProjects, managedContracts } = profile;

  // ── Merge both sources into one unified project map ───────────────────────
  //
  // Source 1: siteInchargeProjects (projects where user is site incharge)
  //           → already has contracts nested inside
  // Source 2: managedContracts (contracts directly assigned to user)
  //           → grouped by their project on the fly here

  type UnifiedProject = {
    id:     string;
    name:   string;
    sNo?:   string | null;
    status: string;
    contracts: Array<{
      id: string;
      contractNumber: string;
      contractAmount: number;
      status: string;
      startDate: string;
      intendedCompletionDate: string;
      actualCompletionDate?: string | null;
      company?:       { id: string; name: string } | null;
      userCommittee?: { id: string; name: string } | null;
    }>;
  };

  const projectMap = new Map<string, UnifiedProject>();

  // Add siteInchargeProjects first
  siteInchargeProjects.forEach((p) => {
    projectMap.set(p.id, {
      id:        p.id,
      name:      p.name,
      sNo:       p.sNo,
      status:    p.status,
      contracts: p.contracts.map((c) => ({
        id:                     c.id,
        contractNumber:         c.contractNumber,
        contractAmount:         Number(c.contractAmount),
        status:                 c.status,
        startDate:              c.startDate,
        intendedCompletionDate: c.intendedCompletionDate,
        actualCompletionDate:   c.actualCompletionDate,
        company:                c.company,
        userCommittee:          c.userCommittee,
      })),
    });
  });

  // Merge managedContracts — add to existing project or create new group
  managedContracts.forEach((c) => {
    if (!c.project) return;
    const key = c.project.id;

    const contractEntry = {
      id:                     c.id,
      contractNumber:         c.contractNumber,
      contractAmount:         Number(c.contractAmount),
      status:                 c.status,
      startDate:              c.startDate,
      intendedCompletionDate: c.intendedCompletionDate,
      actualCompletionDate:   c.actualCompletionDate ?? null,
      company:                c.company ?? null,
      userCommittee:          c.userCommittee ?? null,
    };

    if (projectMap.has(key)) {
      // Avoid duplicates — check by contract id
      const existing = projectMap.get(key)!;
      if (!existing.contracts.find((ec) => ec.id === c.id)) {
        existing.contracts.push(contractEntry);
      }
    } else {
      projectMap.set(key, {
        id:        c.project.id,
        name:      c.project.name,
        sNo:       c.project.sNo,
        status:    c.project.status,
        contracts: [contractEntry],
      });
    }
  });

  const allProjects   = Array.from(projectMap.values());
  const completedProjects = allProjects.filter((p) =>
    p.contracts.length > 0 && p.contracts.every((c) => c.status === "COMPLETED")
  );
  const ongoingProjects = allProjects.filter((p) =>
    !p.contracts.every((c) => c.status === "COMPLETED")
  );

  const totalContractValue = allProjects.reduce(
    (s, p) => s + p.contracts.reduce((cs, c) => cs + Number(c.contractAmount), 0),
    0,
  );
  const completedContractValue = allProjects.reduce(
    (s, p) => s + p.contracts
      .filter((c) => c.status === "COMPLETED")
      .reduce((cs, c) => cs + Number(c.contractAmount), 0),
    0,
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7">

      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* ── Profile Header ── */}
      <div className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <UserAvatar name={profile.name} image={profile.image} />
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold">{profile.name ?? "Unnamed User"}</h1>
          <p className="text-sm text-muted-foreground">{profile.email ?? "—"}</p>
          <div className="flex flex-wrap gap-2">
            {profile.designation && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-muted px-3 py-1 rounded-full">
                <HardHat size={13} />
                {DESIGNATION_LABEL[profile.designation]}
              </span>
            )}
            {profile.role && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                <ShieldCheck size={13} />
                {ROLE_LABEL[profile.role]}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          Joined {toDateDisplay(profile.createdAt)}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={allProjects.length}
          sub={`${completedProjects.length} completed`}
          icon={<FolderOpen size={18} />}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Total Contracts"
          value={allProjects.reduce((s, p) => s + p.contracts.length, 0)}
          sub={formatCurrency(totalContractValue)}
          icon={<FileText size={18} />}
          color="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          label="Completed Value"
          value={formatCurrency(completedContractValue)}
          sub={`${completedProjects.length} fully done`}
          icon={<CheckCircle2 size={18} />}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="In Progress"
          value={ongoingProjects.length}
          sub={formatCurrency(totalContractValue - completedContractValue) + " remaining"}
          icon={<TrendingUp size={18} />}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* ── Ongoing Projects ── */}
      {ongoingProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            Ongoing Projects
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({ongoingProjects.length})
            </span>
          </h2>
          <div className="space-y-3">
            {ongoingProjects.map((p) => (
              <ProjectGroup
                key={p.id}
                projectName={p.name}
                projectSNo={p.sNo}
                projectStatus={p.status}
                contracts={p.contracts}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Completed Projects ── */}
      {completedProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 size={17} className="text-green-600" />
            Completed Projects
            <span className="text-sm font-normal text-muted-foreground">
              ({completedProjects.length})
            </span>
          </h2>
          <div className="space-y-3">
            {completedProjects.map((p) => (
              <ProjectGroup
                key={p.id}
                projectName={p.name}
                projectSNo={p.sNo}
                projectStatus={p.status}
                contracts={p.contracts}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {allProjects.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No projects or contracts assigned yet.</p>
        </div>
      )}

    </div>
  );
}
