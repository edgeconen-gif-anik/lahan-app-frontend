// app/dashboard/users/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUsers } from "@/hooks/user/useUsers";
import {
  Search,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  HardHat,
  ShieldCheck,
} from "lucide-react";
import { UserListItem, Designation, Role } from "@/lib/schema/user/user";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const ROLE_COLOR: Record<Role, string> = {
  CREATOR:  "bg-blue-100 text-blue-700",
  REVIEWER: "bg-yellow-100 text-yellow-700",
  ADMIN:    "bg-purple-100 text-purple-700",
};

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [search,      setSearch]      = useState("");
  const [designation, setDesignation] = useState("");
  const [role,        setRole]        = useState("");
  const [page,        setPage]        = useState(1);
  const LIMIT = 12;

  const { data, isLoading, isError } = useUsers(
    {
      search:      search      || undefined,
      designation: designation || undefined,
      role:        role        || undefined,
      page,
      limit: LIMIT,
    },
    { enabled: isAdmin }
  );

  const users    = data?.data    ?? [];
  const meta     = data?.meta;
  const lastPage = meta?.lastPage ?? 1;

  // Reset to page 1 on filter change
  const handleSearch      = (v: string) => { setSearch(v);      setPage(1); };
  const handleDesignation = (v: string) => { setDesignation(v); setPage(1); };
  const handleRole        = (v: string) => { setRole(v);        setPage(1); };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-md">
          <AlertCircle size={18} />
          Only admins can view the users dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} total users` : "Loading..."}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>

        {/* Designation filter */}
        <select
          value={designation}
          onChange={(e) => handleDesignation(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">All Designations</option>
          <option value="ASSISTANT_SUB_ENGINEER">Asst. Sub-Engineer</option>
          <option value="SUB_ENGINEER">Sub-Engineer</option>
          <option value="ENGINEER">Engineer</option>
        </select>

        {/* Role filter */}
        <select
          value={role}
          onChange={(e) => handleRole(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">All Roles</option>
          <option value="CREATOR">Creator</option>
          <option value="REVIEWER">Reviewer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-md">
          <AlertCircle size={18} /> Failed to load users.
        </div>
      )}

      {/* ── Grid ── */}
      {!isLoading && !isError && (
        <>
          {users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>No users found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-md border hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {lastPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="p-2 rounded-md border hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── UserCard component ───────────────────────────────────────────────────────

function UserCard({ user, onClick }: { user: UserListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-card border rounded-lg p-4 hover:shadow-md hover:border-primary/40 transition-all space-y-3"
    >
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} image={user.image} />
        <div className="min-w-0">
          <p className="font-semibold truncate">{user.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email ?? "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {user.designation && (
          <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
            <HardHat size={11} />
            {DESIGNATION_LABEL[user.designation]}
          </span>
        )}
        {user.role && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role]}`}>
            <ShieldCheck size={11} />
            {ROLE_LABEL[user.role]}
          </span>
        )}
      </div>
    </button>
  );
}
