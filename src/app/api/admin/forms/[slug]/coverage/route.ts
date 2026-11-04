import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { assess } from "@/lib/tools/standards";
import { audit, readAuth, toolsGuard, writeAuth } from "@/lib/tools/server";
import { isCodeDefinition } from "@/lib/tools/runtime";
import { recordEdit } from "@/lib/tools/service";
import { confirmExclusions, coverageErrors, coverageWarnings, recheck, type Coverage } from "@/lib/forms/reconcile";
import type { DeclarativeTool } from "@/lib/strategyModels/declarative";
import type { ToolRecord } from "@/lib/tools/repo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };

const storedCoverage = (t: ToolRecord): Coverage | null => {
  const fb = (t.provenance as { formBuilder?: { coverage?: Coverage | null } } | null)?.formBuilder;
  return fb?.coverage && Array.isArray(fb.coverage.items) ? fb.coverage : null;
};

const view = (c: Coverage) => ({ counts: c.counts, assumptions: c.assumptions, approximations: c.approximations, items: c.items.filter((i) => i.status !== "structure") });

/** GET /api/admin/forms/:slug/coverage - the source-coverage report saved with a form built from an upload. */
export const GET = toolsGuard(async (_req: NextRequest, ctx: Ctx) => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  const t = await prismaRepo.getToolBySlug(slug);
  if (!t) return NextResponse.json({ error: "That form was not found." }, { status: 404 });
  const c = storedCoverage(t);
  if (!c) return NextResponse.json({ error: "This form was not built from an uploaded document, so there is no coverage report." }, { status: 404 });
  return NextResponse.json({ name: t.name, status: t.status, coverage: view(c) });
});

/**
 * PATCH /api/admin/forms/:slug/coverage  { exclude?: string[], reason?: string, recheck?: boolean }
 * A person confirms that some source items are left out on purpose (with a reason), or asks for the check to be run again after the
 * form was edited. The quality result is updated; editing a form that was already marked reviewed sends it back to review.
 */
export const PATCH = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  let b: { exclude?: unknown; reason?: unknown; recheck?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const t = await prismaRepo.getToolBySlug(slug);
  if (!t) return NextResponse.json({ error: "That form was not found." }, { status: 404 });
  const cov = storedCoverage(t);
  if (!cov || isCodeDefinition(t.definition)) return NextResponse.json({ error: "This form has no coverage report." }, { status: 404 });
  const tool = t.definition as DeclarativeTool;

  let next = cov;
  const ids = Array.isArray(b.exclude) ? b.exclude.filter((x): x is string => typeof x === "string").slice(0, 700) : [];
  if (b.recheck === true) next = recheck(next, tool);
  if (ids.length) {
    const reason = typeof b.reason === "string" ? b.reason : "";
    if (!reason.trim()) return NextResponse.json({ error: "Say why these items are being left out. The reason is kept with the form." }, { status: 400 });
    next = confirmExclusions(next, ids, reason);
  }
  if (next === cov) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

  // Rebuild the quality list: the form's own checks, plus the (now current) coverage lines. Older coverage lines are replaced.
  const fresh = assess(tool);
  const keep = (t.quality?.warnings ?? []).filter((w) => !/^(Source coverage:|Approximated:)/.test(w) && !fresh.warnings.includes(w));
  const quality = { ...fresh, warnings: [...fresh.warnings, ...keep, ...coverageWarnings(next)], errors: [...fresh.errors, ...(coverageErrors(next) ? [coverageErrors(next) as string] : [])] };
  const fb = (t.provenance as { formBuilder: Record<string, unknown> }).formBuilder;
  await prismaRepo.saveTool({
    slug: t.slug, name: t.name, category: t.category, groupName: t.groupName, practice: t.practice, definition: t.definition,
    does: t.does, whenToUse: t.whenToUse, whenNotToUse: t.whenNotToUse, quality,
    provenance: { ...(t.provenance ?? {}), formBuilder: { ...fb, coverage: next } },
  });
  const updated = await recordEdit(prismaRepo, slug, quality);
  await audit(auth.user.id, ids.length ? "form_items_excluded" : "form_coverage_rechecked", slug, { count: ids.length });
  return NextResponse.json({ status: updated.status, quality, coverage: view(next) });
});
