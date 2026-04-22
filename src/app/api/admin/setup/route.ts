import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/setup
 * One-time endpoint to grant ADMIN role to a user.
 * Protected by ADMIN_SETUP_TOKEN env var — remove from env after use.
 *
 * Body: { email: string, token: string }
 */
export async function POST(req: NextRequest) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN;
  if (!setupToken) {
    return NextResponse.json({ error: "Setup endpoint disabled" }, { status: 403 });
  }

  let body: { email?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.token || body.token !== setupToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
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
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updated });
}

/** GET /api/admin/setup — list all users and their roles (setup token required as query param) */
export async function GET(req: NextRequest) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN;
  if (!setupToken) {
    return NextResponse.json({ error: "Setup endpoint disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== setupToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}
