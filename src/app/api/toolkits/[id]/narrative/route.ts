import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, asBlueprint, guard } from "@/lib/toolkit/server";
import {
  draftNarrative, narrativeSpec, narrativeFieldId, narrativeFailureNote, sanitiseClientNarrative, unsupportedFigures,
} from "@/lib/toolkit/narrative";
import { answersText, analysisDigest, type StoredRow } from "@/lib/toolkit/narrative-digest";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const limiter = rateLimit({ limit: 60, windowSeconds: 3600 });

const seqOf = (v: unknown): number => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 100 ? n : 0;
};

/** Everything the narrative may draw on, so figures can be checked against it. */
async function loadInputs(id: string, kit: { blueprint: unknown; problemText: string | null; contextText: string | null }) {
  const bp = asBlueprint(kit.blueprint);
  const [rows, evidence] = await Promise.all([
    prisma.kitResponse.findMany({ where: { kitId: id }, select: { fieldId: true, value: true, provenance: true, confidence: true } }),
    prisma.kitEvidence.findMany({ where: { kitId: id, status: "EXTRACTED" }, select: { fileName: true, extractedText: true } }),
  ]);
  const stored = rows as StoredRow[];
  return {
    bp,
    problemText: kit.problemText ?? "",
    contextText: kit.contextText ?? "",
    answers: answersText(bp, stored),
    analysis: analysisDigest(bp, stored),
    evidence: evidence.map((e) => ({ fileName: e.fileName, text: e.extractedText ?? "" })),
  };
}

const groundingOf = (i: Awaited<ReturnType<typeof loadInputs>>) =>
  [i.problemText, i.contextText, i.answers, i.analysis, i.bp.industry, i.bp.topic, ...i.evidence.map((e) => e.text)].join("\n");

/**
 * POST /api/toolkits/[id]/narrative   { seq }
 * Drafts the AI narrative for one section, grounded in the client's inputs and the computed
 * analysis, and saves it as an AI-suggested draft the client can edit. Never touches other sections.
 */
async function POST_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") return NextResponse.json({ error: "This kit is submitted. Reopen it to make changes." }, { status: 409 });
  if (!limiter.check(userId).success) return NextResponse.json({ error: "Narrative limit reached for now. Please try again later." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { seq?: unknown };
  const seq = seqOf(body.seq);
  const bpType = asBlueprint(kit.blueprint).type;
  if (!seq || !narrativeSpec(bpType, seq)) return NextResponse.json({ error: "This section has no narrative." }, { status: 422 });

  const inputs = await loadInputs(id, kit);
  const result = await draftNarrative({
    blueprint: inputs.bp, seq, problemText: inputs.problemText, contextText: inputs.contextText,
    answers: inputs.answers, analysis: inputs.analysis, evidence: inputs.evidence,
  });
  if (!result.text) {
    return NextResponse.json({ text: null, available: result.available, note: narrativeFailureNote(result) }, { status: 200 });
  }

  const value = { text: result.text, unsupported: result.unsupported, provider: result.provider ?? null, model: result.model ?? null, generatedAt: new Date().toISOString() };
  await prisma.kitResponse.upsert({
    where: { kitId_fieldId: { kitId: id, fieldId: narrativeFieldId(seq) } },
    create: { kitId: id, fieldId: narrativeFieldId(seq), value: value as never, provenance: "AI-suggested", confidence: "Low" },
    update: { value: value as never, provenance: "AI-suggested", confidence: "Low", version: { increment: 1 } },
  });
  await prisma.customKit.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  return NextResponse.json({ ...value, provenance: "AI-suggested" });
}

/**
 * PUT /api/toolkits/[id]/narrative   { seq, text, confirm? }
 * Saves the client's edit (provenance Client-entered) or confirms the AI text as it is (Client-confirmed).
 * Figures not found in the inputs are re-checked every time.
 */
async function PUT_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") return NextResponse.json({ error: "This kit is submitted. Reopen it to make changes." }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as { seq?: unknown; text?: unknown; confirm?: unknown };
  const seq = seqOf(body.seq);
  if (!seq || !narrativeSpec(asBlueprint(kit.blueprint).type, seq)) return NextResponse.json({ error: "This section has no narrative." }, { status: 422 });
  const text = sanitiseClientNarrative(String(body.text ?? ""));
  if (!text) return NextResponse.json({ error: "The narrative is empty. Use Remove to delete it." }, { status: 422 });

  const inputs = await loadInputs(id, kit);
  const existing = await prisma.kitResponse.findUnique({ where: { kitId_fieldId: { kitId: id, fieldId: narrativeFieldId(seq) } } });
  const prev = (existing?.value ?? {}) as { provider?: string | null; model?: string | null };
  const value = { text, unsupported: unsupportedFigures(text, groundingOf(inputs)), provider: prev.provider ?? null, model: prev.model ?? null, editedAt: new Date().toISOString() };
  const provenance = body.confirm === true ? "Client-confirmed" : "Client-entered";
  await prisma.kitResponse.upsert({
    where: { kitId_fieldId: { kitId: id, fieldId: narrativeFieldId(seq) } },
    create: { kitId: id, fieldId: narrativeFieldId(seq), value: value as never, provenance },
    update: { value: value as never, provenance, confidence: null, version: { increment: 1 } },
  });
  return NextResponse.json({ ...value, provenance });
}

/** DELETE /api/toolkits/[id]/narrative?seq=14 : removes the narrative for one section. */
async function DELETE_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") return NextResponse.json({ error: "This kit is submitted. Reopen it to make changes." }, { status: 409 });
  const seq = seqOf(req.nextUrl.searchParams.get("seq"));
  if (!seq) return NextResponse.json({ error: "Unknown section." }, { status: 422 });
  await prisma.kitResponse.deleteMany({ where: { kitId: id, fieldId: narrativeFieldId(seq) } });
  return NextResponse.json({ removed: true });
}

export const POST = guard(POST_);
export const PUT = guard(PUT_);
export const DELETE = guard(DELETE_);
