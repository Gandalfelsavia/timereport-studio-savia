import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types/next-auth";

// Configurazione "edge-safe": nessun import di driver database qui dentro,
// così può essere usata anche dal middleware (che gira in edge runtime).
export default {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
