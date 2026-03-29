import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { getGoogleOAuthConfig } from "@/lib/auth/google-auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000";

const {
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  authBaseUrl,
  redirectUri: googleRedirectUri,
  setupMessage: googleSetupMessage,
} = getGoogleOAuthConfig();

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const res = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: credentials?.email,
          password: credentials?.password,
        });

        const user = res.data;
        return user && user.accessToken ? user : null;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            "Credentials login failed:",
            error.response.status,
            error.response.data
          );
        } else {
          console.error("Credentials login failed:", error);
        }
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  if (!authBaseUrl) {
    console.warn(
      `Google OAuth is configured with credentials, but no stable auth base URL was found. ${googleSetupMessage}`
    );
  }

  providers.unshift(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!account.id_token) {
        console.error("Google login failed: missing Google ID token");
        return "/login?error=GoogleTokenMissing";
      }

      try {
        const res = await axios.post(`${BACKEND_URL}/auth/google-login`, {
          token: account.id_token,
          email: user.email,
          name: user.name,
          image: user.image,
        });

        const backendUser = res.data;

        user.id = backendUser.id;
        user.role = backendUser.role;
        user.accessToken = backendUser.accessToken;

        return true;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            "Google backend sync failed:",
            error.response.status,
            error.response.data
          );
        } else {
          console.error("Google backend sync failed:", error);
        }

        return "/login?error=GoogleSyncFailed";
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        if (token.id) {
          session.user.id = token.id;
        }
        if (token.role) {
          session.user.role = token.role;
        }
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

if (googleRedirectUri) {
  console.info(`Google OAuth redirect URI: ${googleRedirectUri}`);
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
