import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        } catch {
          // DB 미연결 시 개발용 하드코딩 폴백
          if (
            email === process.env.SEED_ADMIN_EMAIL &&
            password === process.env.SEED_ADMIN_PASSWORD
          ) {
            return {
              id: "owner-hardcoded",
              email,
              name: "관리자",
              role: "OWNER" as const,
            };
          }
          return null;
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      try {
        await createAuditLog({
          actorId: user.id,
          action: "SIGN_IN",
          entityType: "User",
          entityId: user.id,
        });
      } catch (e) {
        // AuditLog 실패는 로그인 자체를 막지 않음
        console.error("[AuditLog] signIn 기록 실패:", e);
      }
    },
  },
});
