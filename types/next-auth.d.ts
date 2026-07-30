// types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/auth/roles";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role?: AppRole;
    } & DefaultSession["user"];
    accessToken?: string; // <--- The fix: Add this!
    error?: string;
    sessionStartedAt?: number;
  }

  interface User {
    id: string;
    accessToken?: string; // Add this to the User type as well
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    role?: AppRole;
    id?: string;
    error?: string;
    sessionStartedAt?: number;
  }
}
