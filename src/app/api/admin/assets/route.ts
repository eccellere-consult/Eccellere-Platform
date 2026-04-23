import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SPECIALIST_ADMIN";
}

// GET /api/admin/assets — list all assets, optionally filtered by status
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status"); // e.g. "SUBMITTED"

  const assets = await prisma.asset.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      serviceDomain: true,
      category: true,
      status: true,
      price: true,
      totalPurchases: true,
      averageRating: true,
      createdAt: true,
      components: true,
      downloadEnabled: true,
      author: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ assets });
}

// PATCH /api/admin/assets — approve or reject an asset
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; action?: string; reviewNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, action, reviewNotes } = body;
  if (!id || !action) {
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
  }

  // ── Toggle download access ──────────────────────────────────────────────────
  if (action === "enable-download" || action === "disable-download") {
    const asset = await prisma.asset.update({
      where: { id },
      data: { downloadEnabled: action === "enable-download" },
      select: { id: true, title: true, downloadEnabled: true },
    });
    return NextResponse.json({ success: true, asset });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve', 'reject', 'enable-download', or 'disable-download'" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "PUBLISHED" : "REVISIONS_REQUESTED";

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      status: newStatus as never,
      reviewedBy: session.user?.email ?? undefined,
      reviewNotes: reviewNotes ?? undefined,
      publishedAt: action === "approve" ? new Date() : undefined,
    },
    select: { id: true, title: true, status: true },
  });

  return NextResponse.json({ success: true, asset });
}
