import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentBlock, loginBlock } from "@/lib/access";
import { notifyRegistration } from "@/lib/notify-admin";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        // Only someone who knows the password is told why they cannot come in.
        const blocked = loginBlock(user.role, user.accountStatus);
        if (blocked) throw new Error(blocked);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        if (account?.provider === "google") {
          // Google profile doesn't carry our role — look it up from DB
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true },
          });
          token.id = dbUser?.id ?? user.id;
          token.role = dbUser?.role ?? "CLIENT";
        } else {
          token.role = (user as { role: string }).role;
        }
      } else if (token.id) {
        // Every later request: a login that was blocked, or is still waiting for approval, is signed out here (an error clears the session).
        const why = await currentBlock(String(token.id), async (id) => {
          const u = await prisma.user.findUnique({ where: { id }, select: { role: true, accountStatus: true } });
          return u ? { role: u.role, accountStatus: u.accountStatus } : null;
        });
        if (why) throw new Error(why);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          // A first Google sign-in is a new client sign-up: it waits for approval like any other.
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "User",
              role: "CLIENT",
              avatar: user.image,
              emailVerified: true,
              accountStatus: "PENDING",
            },
          });
          notifyRegistration({ name: user.name || "User", email: user.email!, role: "CLIENT" }).catch(() => undefined);
          return "/login?error=PENDING_APPROVAL";
        }
        const blocked = loginBlock(existing.role, existing.accountStatus);
        if (blocked) return `/login?error=${blocked}`;
      }
      return true;
    },
  },
};
