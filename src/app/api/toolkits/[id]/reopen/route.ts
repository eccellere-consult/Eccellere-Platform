import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, guard } from "@/lib/toolkit/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/toolkits/[id]/reopen - unlock a submitted kit as a new version. Prior submissions are preserved. */
async function POST_(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Kit is not submitted." }, { status: 409 });
  }
  const updated = await prisma.customKit.update({
    where: { id },
    data: { status: "IN_PROGRESS", version: { increment: 1 } },
    select: { id: true, version: true },
  });
  return NextResponse.json({ ok: true, ...updated });
}

export const POST = guard(POST_);
