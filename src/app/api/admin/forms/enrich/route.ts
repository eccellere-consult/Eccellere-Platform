import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gateway";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { ToolsError } from "@/lib/tools/service";
import { fixTool } from "@/lib/tools/repair";
import { depthOf, enrichInstruction } from "@/lib/tools/depth";
import { rowOf } from "@/lib/tools/classify";
import { aiReady, audit, loadSkillInfo, toolsGuard, writeAuth } from "@/lib/tools/server";
import { isCodeDefinition } from "@/lib/tools/runtime";
import type { DeclarativeTool } from "@/lib/strategyModels/declarative";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST { slug } - brings one tool up to the standard depth of its type. The gaps are worked out here from the definition; the existing
 * "Modify with AI" step does the rewrite, refuses a worse result, and puts the tool back to "needs review". A person still reviews it.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const tool = slug ? await prismaRepo.getToolBySlug(slug) : null;
  if (!tool) return NextResponse.json({ error: "That tool was not found." }, { status: 404 });
  if (isCodeDefinition(tool.definition)) return NextResponse.json({ error: "This is a hand-built Strategy Hub tool. It is not changed with AI." }, { status: 409 });
  if (!(await aiReady())) return NextResponse.json({ error: "No AI provider is switched on, so the tool cannot be enriched yet.", code: "AI_DOWN" }, { status: 503 });
  const row = rowOf(tool);
  const before = depthOf(row.classification.type, tool.definition as DeclarativeTool);
  if (!before.gaps.length) return NextResponse.json({ applied: false, before: before.score, after: before.score, notes: ["Already meets the standard depth for its type."] });
  try {
    const skill = await loadSkillInfo("draft");
    const r = await fixTool(prismaRepo, slug, (a) => generateText(a), {
      instruction: enrichInstruction(row.classification.type, before.gaps, { areas: row.classification.areas, sectors: row.classification.sectors }),
      skill: skill.isCustom ? skill.text : undefined,
    });
    const after = depthOf(row.classification.type, r.tool.definition as DeclarativeTool);
    await audit(auth.user.id, "tool.enrich", slug, { applied: r.applied, before: before.score, after: after.score });
    return NextResponse.json({ applied: r.applied, before: before.score, after: after.score, notes: r.notes });
  } catch (e) {
    if (e instanceof ToolsError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.code === "AI_DOWN" ? 503 : e.code === "NOT_FOUND" ? 404 : 409 });
    throw e;
  }
});
