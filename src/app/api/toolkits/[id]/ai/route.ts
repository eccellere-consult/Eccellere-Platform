import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, asBlueprint } from "@/lib/toolkit/server";
import { draftFields } from "@/lib/toolkit/ai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const aiLimiter = rateLimit({ limit: 40, windowSeconds: 3600 });
const MAX_FIELDS = 14;

/**
 * POST /api/toolkits/[id]/ai
 * Body: { sectionId: string, moduleId?: string, onlyEmpty?: boolean }
 * Returns suggestions only. Nothing is saved: the client reviews each one and
 * saves it with provenance "AI-suggested" (skill s4 step 4/8).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") {
    return NextResponse.json({ error: "This kit is submitted. Reopen it to make changes." }, { status: 409 });
  }
  if (!aiLimiter.check(userId).success) {
    return NextResponse.json({ error: "AI draft limit reached for now. Please try again later." }, { status: 429 });
  }

  let body: { sectionId?: string; moduleId?: string; onlyEmpty?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const bp = asBlueprint(kit.blueprint);
  const section = bp.sections.find((s) => s.id === body.sectionId);
  if (!section) return NextResponse.json({ error: "Unknown section." }, { status: 422 });

  const [responses, evidence] = await Promise.all([
    prisma.kitResponse.findMany({ where: { kitId: id }, select: { fieldId: true, value: true } }),
    prisma.kitEvidence.findMany({
      where: { kitId: id, status: "EXTRACTED" },
      select: { fileName: true, extractedText: true },
    }),
  ]);
  const answers: Record<string, string> = {};
  for (const r of responses) answers[r.fieldId] = r.value == null ? "" : String(r.value);

  const onlyEmpty = body.onlyEmpty !== false;
  const fields = section.fields
    .filter((f) => f.aiDraftable)
    .filter((f) => (body.moduleId ? f.module === body.moduleId : true))
    .filter((f) => (onlyEmpty ? !answers[f.id]?.trim() : true))
    .slice(0, MAX_FIELDS);

  if (!fields.length) {
    return NextResponse.json({ suggestions: [], available: true, note: "Nothing left to draft here." });
  }

  const result = await draftFields({
    blueprint: bp,
    fields,
    contextText: kit.contextText ?? "",
    problemText: kit.problemText ?? "",
    evidence: evidence.map((e) => ({ fileName: e.fileName, text: e.extractedText ?? "" })),
    answers,
  });

  if (!result.available) {
    return NextResponse.json(
      { suggestions: [], available: false, note: "AI drafting is not available right now. You can complete this section yourself." },
      { status: 200 },
    );
  }
  return NextResponse.json({
    suggestions: result.suggestions,
    available: true,
    note: result.suggestions.length ? undefined : "AI could not draft these from the information provided. Add more context or evidence and try again.",
  });
}
