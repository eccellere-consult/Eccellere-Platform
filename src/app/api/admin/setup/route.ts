import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = [
  "CLIENT",
  "SPECIALIST",
  "ADMIN",
  "SUPER_ADMIN",
  "CONTENT_ADMIN",
  "MARKETPLACE_ADMIN",
  "CRM_ADMIN",
  "FINANCE_ADMIN",
] as const;
type ValidRole = (typeof VALID_ROLES)[number];

/** Accepts ADMIN_SETUP_TOKEN (if set) OR NEXTAUTH_SECRET as the auth token */
function getValidToken(): string | null {
  return process.env.ADMIN_SETUP_TOKEN ?? process.env.NEXTAUTH_SECRET ?? null;
}

/**
 * POST /api/admin/setup
 * Assign any role to a user.
 * Token = ADMIN_SETUP_TOKEN env var (or NEXTAUTH_SECRET as fallback).
 *
 * Body: { email: string, token: string, role?: ValidRole }
 * role defaults to "ADMIN" if omitted.
 */
export async function POST(req: NextRequest) {
  const validToken = getValidToken();
  if (!validToken) {
    return NextResponse.json({ error: "Setup endpoint disabled" }, { status: 403 });
  }

  let body: { email?: string; token?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.token || body.token !== validToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const targetRole: ValidRole = (body.role as ValidRole) ?? "ADMIN";
  if (!VALID_ROLES.includes(targetRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { email: body.email },
    data: { role: targetRole },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updated });
}

/** GET /api/admin/setup — list all users and their roles (token required as query param) */
export async function GET(req: NextRequest) {
  const validToken = getValidToken();
  if (!validToken) {
    return NextResponse.json({ error: "Setup endpoint disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== validToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}
