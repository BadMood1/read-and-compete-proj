import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Единая конфигурация авторизации для Route Handler и Server Components.
export const { auth, handlers, signIn, signOut } = NextAuth({
  // Разрешаем Auth.js строить callback URL из host текущего запроса.
  trustHost: true,

  // Адаптер сохраняет пользователей, OAuth-аккаунты и сессии в PostgreSQL.
  adapter: PrismaAdapter(prisma),

  // Auth.js автоматически читает AUTH_GITHUB_* и AUTH_GOOGLE_* из .env.
  providers: [GitHub, Google],

  callbacks: {
    // При database-сессиях Auth.js передаёт сюда пользователя из Prisma.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
