import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET: every login (newest first, up to 1,000) with its role and access status. Never returns passwords or tokens. */
export async function GET() {
  const auth = await requirePermission("admin:users:read");
  if (auth.error) return auth.error;
  try {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { id: true, name: true, email: true, role: true, accountStatus: true, isActive: true, createdAt: true, lastLoginAt: true },
    });
    return NextResponse.json({
      me: auth.user.id,
      canChangeRoles: auth.user.role === "SUPER_ADMIN",
      users: rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString(), lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null })),
    });
  } catch (e) {
    console.error("[admin/users]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The users could not be read from the database. Please try again." }, { status: 503 });
  }
}
