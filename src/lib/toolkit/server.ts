import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Blueprint } from "./engine";

export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

/** Loads a kit only if it belongs to the user (tenant isolation). */
export async function loadOwnedKit(id: string, userId: string) {
  return prisma.customKit.findFirst({ where: { id, userId } });
}

export const asBlueprint = (v: unknown): Blueprint => v as Blueprint;
