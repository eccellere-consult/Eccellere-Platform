import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, asBlueprint, guard } from "@/lib/toolkit/server";
import { overallProgress, scoreDiagnostic, type StoredResponse } from "@/lib/toolkit/engine";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/toolkits/[id]/submit
 * Body: { approvedBy: string }. A named human must approve; AI never approves.
 * Freezes a snapshot (blueprint + responses + evidence manifest + scores).
 */
async function POST_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") {
    return NextResponse.json({ error: "Already submitted." }, { status: 409 });
  }

  let body: { approvedBy?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const approvedBy = String(body.approvedBy ?? "").trim().slice(0, 120);
  if (approvedBy.length < 2) {
    return NextResponse.json({ error: "Enter the name of the person approving this report." }, { status: 422 });
  }

  const bp = asBlueprint(kit.blueprint);
  const [rows, evidence] = await Promise.all([
    prisma.kitResponse.findMany({ where: { kitId: id } }),
    prisma.kitEvidence.findMany({
      where: { kitId: id },
      select: { id: true, fileName: true, contentType: true, size: true, status: true },
    }),
  ]);
  const responses: Record<string, StoredResponse> = {};
  for (const r of rows) responses[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance };

  const progress = overallProgress(bp, responses);
  if (!progress.readyToSubmit) {
    return NextResponse.json(
      { error: "Some required answers are still missing.", missingSections: progress.missingSections },
      { status: 422 },
    );
  }

  const aiFieldCount = rows.filter((r) => r.provenance === "AI-suggested").length;
  const snapshot = {
    blueprint: bp,
    responses: rows.map((r) => ({
      fieldId: r.fieldId,
      value: r.value,
      provenance: r.provenance,
      confidence: r.confidence,
      sourceRef: r.sourceRef,
    })),
    evidence,
    scores: bp.type === "DIAGNOSTIC" ? scoreDiagnostic(bp, responses) : null,
    meta: {
      kitId: id,
      title: kit.title,
      industry: kit.industry,
      kitType: kit.kitType,
      recommendedType: kit.recommendedType,
      mode: kit.mode,
      version: kit.version,
      aiAssistedFields: aiFieldCount,
      unconfirmedAiFields: aiFieldCount,
      generatedAt: new Date().toISOString(),
    },
  };

  const [submission] = await prisma.$transaction([
    prisma.kitSubmission.create({
      data: { kitId: id, version: kit.version, snapshot: snapshot as never, approvedBy },
      select: { id: true, submittedAt: true },
    }),
    prisma.customKit.update({ where: { id }, data: { status: "SUBMITTED" } }),
  ]);
  return NextResponse.json({ ok: true, submission });
}

export const POST = guard(POST_);
