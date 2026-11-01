import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, guard } from "@/lib/toolkit/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/toolkits/[id] - kit, blueprint, responses, evidence, latest submission */
async function GET_(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [responses, evidence, submission] = await Promise.all([
    prisma.kitResponse.findMany({
      where: { kitId: id },
      select: { fieldId: true, value: true, provenance: true, confidence: true, sourceRef: true, updatedAt: true },
    }),
    prisma.kitEvidence.findMany({
      where: { kitId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, contentType: true, size: true, status: true, createdAt: true },
    }),
    prisma.kitSubmission.findFirst({
      where: { kitId: id },
      orderBy: { submittedAt: "desc" },
      select: { id: true, version: true, approvedBy: true, submittedAt: true, snapshot: true },
    }),
  ]);
  return NextResponse.json({ kit, responses, evidence, submission });
}

/** DELETE /api/toolkits/[id] - owner removes the kit and its data */
async function DELETE_(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.customKit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const GET = guard(GET_);
export const DELETE = guard(DELETE_);
