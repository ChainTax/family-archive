// auth.config.ts — Edge Runtime 호환 (Prisma/bcrypt 미포함)
// middleware.ts가 이 파일만 import → Edge에서 JWT 검증만 수행
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: "OWNER" | "EDITOR" | "VIEWER" }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "OWNER" | "EDITOR" | "VIEWER";
      }
      return session;
    },
  },
  // providers는 auth.ts에서만 추가 (Credentials는 Edge에서 불필요)
  providers: [],
} satisfies NextAuthConfig;
