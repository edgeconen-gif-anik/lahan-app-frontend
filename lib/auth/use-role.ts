"use client";

import { useSession } from "next-auth/react";

import { isAdminRole, isSuperAdminRole } from "@/lib/auth/roles";

/** Single place to read the signed-in user's role and permissions. */
export function useRole() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return {
    role,
    isAdmin: isAdminRole(role),
    isSuperAdmin: isSuperAdminRole(role),
    isLoading: status === "loading",
  };
}
