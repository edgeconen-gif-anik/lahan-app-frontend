// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role?: string; // Optional: If you want role in session
    } & DefaultSession["user"];
    accessToken?: string; // <--- The fix: Add this!
    error?: string;
  }

  interface User {
    id: string;
    accessToken?: string; // Add this to the User type as well
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    role?: string;
    id?: string;
    error?: string;
  }
}