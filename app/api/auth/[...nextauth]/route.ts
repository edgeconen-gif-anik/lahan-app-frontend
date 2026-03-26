import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

// ✅ FORCE IPv4 to avoid "Connection Refused" errors
const BACKEND_URL = "http://127.0.0.1:5000";

export const authOptions: NextAuthOptions = {
  // 1. Secret is REQUIRED for production (and to avoid some weird dev errors)
  secret: process.env.NEXTAUTH_SECRET, 
  
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log(`🔵 [Credentials] Attempting login for: ${credentials?.email}`);
          console.log(`🔵 [Credentials] Target Backend: ${BACKEND_URL}/auth/login`);

          const res = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });

          const user = res.data;

          if (user && user.accessToken) {
            console.log("🟢 [Credentials] Success!");
            return user;
          }
          
          console.log("🟡 [Credentials] Failed: Backend returned 200 but no token.");
          return null;

        } catch (error: any) {
          console.error("🔴 [Credentials] ERROR:");
          if (error.code === 'ECONNREFUSED') {
             console.error("   ❌ Connection Refused! Check if NestJS is running on Port 5000.");
             console.error("   ❌ Trying to reach:", `${BACKEND_URL}/auth/login`);
          } else if (error.response) {
             console.error("   ❌ Backend rejected login:", error.response.status, error.response.data);
          } else {
             console.error("   ❌ Unknown Error:", error.message);
          }
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Credentials Login Processing
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.role = user.role;
      }

      // 2. Google Login Processing
      if (account && account.provider === "google") {
        try {
          console.log("🔵 [Google] Attempting to sync with NestJS...");
          
          // TRY to sync with backend, but DO NOT CRASH if it fails
          const res = await axios.post(`${BACKEND_URL}/auth/google-login`, {
            token: account.id_token,
            email: token.email,
            name: token.name,
            image: token.picture
          });

          const backendUser = res.data;
          token.accessToken = backendUser.accessToken;
          token.id = backendUser.id;
          token.role = backendUser.role;
          console.log("🟢 [Google] Sync Success!");

        } catch (error) {
          console.error("🟡 [Google] Backend Sync Failed. Logging in with Google info only.");
          console.error("   (Have you created the /auth/google-login route in NestJS yet?)");
          
          // Fallback: Allow login, but user won't have a backend token yet
          // This allows you to at least see the dashboard
          token.accessToken = "temporary-google-token"; 
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };