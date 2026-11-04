import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { asChoice, asPracticeChoice, suggestCategory } from "@/lib/tools/service";
import { isAssetType } from "@/lib/tools/taxonomy";
import { suggestPractice } from "@/lib/tools/practice";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";
import { loadBase, loadSkills, realFormBuilder } from "@/lib/forms/server";
import { readingsFromElements, sanitiseElements } from "@/lib/forms/source";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const limiter = rateLimit({ limit: 20, windowSeconds: 3600 });

/**
 * POST /api/admin/forms/build  { request, name?, audience?, category, practice, elements?, warnings?, baseSlug? }
 * Step 2. Builds the form with the AI and saves it as a DRAFT (or NEEDS_REVIEW) in the catalogue. Nothing is published: a person
 * reviews it in Tools marketplace first. Returns the quality result and the source-coverage report.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many forms built this hour. Please try again later." }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const choice = asChoice(b.category);
  const category = choice === "Auto" ? suggestCategory("") : choice;
  const pChoice = asPracticeChoice(b.practice);
  const practice = pChoice === "Auto" ? suggestPractice("") : pChoice;

  const elements = sanitiseElements(b.elements);
  const readings = elements.length ? readingsFromElements(elements, Array.isArray(b.warnings) ? (b.warnings as string[]) : []) : undefined;
  let base = null;
  if (typeof b.baseSlug === "string" && b.baseSlug) {
    base = await loadBase(b.baseSlug);
    if (!base) return NextResponse.json({ error: "That template cannot be used as a base (it is a hand-built tool or is archived). Choose another or build without one." }, { status: 400 });
  }

  const skills = await loadSkills();
  const out = await realFormBuilder()({
    request: str(b.request, 4000), audience: str(b.audience, 400), name: str(b.name, 160), category, practice, assetType: isAssetType(b.assetType) ? b.assetType : undefined, readings, base, ...skills,
  });
  if (out.kind === "ai_down") return NextResponse.json({ error: out.reason, code: "AI_DOWN" }, { status: 503 });
  if (out.kind === "failed") return NextResponse.json({ error: out.reason, code: "BUILD_FAILED" }, { status: 502 });

  const saved = await prismaRepo.saveTool(out.tool);
  await audit(auth.user.id, "form_built", saved.slug, { mode: (out.tool.provenance as { formBuilder?: { mode?: string } } | null)?.formBuilder?.mode ?? null, elements: elements.length, baseSlug: base?.slug ?? null });
  return NextResponse.json({
    slug: saved.slug, name: saved.name, status: saved.status, quality: saved.quality, notes: out.notes,
    coverage: out.coverage ? { counts: out.coverage.counts, assumptions: out.coverage.assumptions, approximations: out.coverage.approximations, items: out.coverage.items.filter((i) => i.status !== "structure") } : null,
  });
});
