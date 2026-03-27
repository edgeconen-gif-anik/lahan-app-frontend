import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

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
      } catch (error: any) {
        if (error.response) {
          console.error("Credentials login failed:", error.response.status, error.response.data);
        } else {
          console.error("Credentials login failed:", error.message);
        }
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
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
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.role = user.role;
      }

      if (account && account.provider === "google") {
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/google-login`, {
            token: account.id_token,
            email: token.email,
            name: token.name,
            image: token.picture,
          });

          const backendUser = res.data;
          token.accessToken = backendUser.accessToken;
          token.id = backendUser.id;
          token.role = backendUser.role;
        } catch (error: any) {
          if (error.response) {
            console.error("Google backend sync failed:", error.response.status, error.response.data);
          } else {
            console.error("Google backend sync failed:", error.message);
          }

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
