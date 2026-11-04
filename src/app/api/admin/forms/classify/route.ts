import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gateway";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { aiReady, audit, readAuth, toolsGuard, writeAuth } from "@/lib/tools/server";
import { aiRefine, approveClassification, catalogue } from "@/lib/tools/classify";
import { ASSET_TYPES, AREAS, TOOL_SECTORS } from "@/lib/tools/taxonomy";
import { DEEP_ENOUGH } from "@/lib/tools/depth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** GET /api/admin/forms/classify - every live-or-draft tool with its type, areas, sectors and depth against its type's standard. */
export const GET = toolsGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  return NextResponse.json({ types: ASSET_TYPES, areas: AREAS, sectors: TOOL_SECTORS, deepEnough: DEEP_ENOUGH, aiReady: await aiReady(), rows: await catalogue(prismaRepo) });
});

/** PATCH { changes: [{slug, type, areas, sectors}] } - a person approves classifications. Content, status and review are not touched. */
export const PATCH = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => null)) as { changes?: { slug?: unknown; type?: unknown; areas?: unknown; sectors?: unknown }[] } | null;
  const changes = Array.isArray(body?.changes) ? body!.changes.slice(0, 300) : [];
  if (!changes.length) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  let saved = 0;
  const skipped: string[] = [];
  for (const c of changes) {
    const slug = typeof c.slug === "string" ? c.slug : "";
    const done = slug ? await approveClassification(prismaRepo, slug, c, auth.user.id) : null;
    if (done) saved++; else skipped.push(slug || "?");
  }
  await audit(auth.user.id, "tool.classify", "*", { saved, skipped: skipped.length });
  return NextResponse.json({ saved, skipped });
});

/** POST { slugs } - asks the AI to refine the guesses for those tools. Returns suggestions only; nothing is saved until a person approves. */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await aiReady())) return NextResponse.json({ error: "No AI provider is switched on. The rule-based suggestions are still available.", code: "AI_DOWN" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { slugs?: unknown } | null;
  const slugs = new Set(Array.isArray(body?.slugs) ? body!.slugs.filter((s): s is string => typeof s === "string").slice(0, 25) : []);
  const rows = (await catalogue(prismaRepo)).filter((r) => slugs.has(r.slug));
  if (!rows.length) return NextResponse.json({ error: "Choose at least one tool." }, { status: 400 });
  const suggestions = await aiRefine((a) => generateText(a), rows);
  if (!suggestions.length) return NextResponse.json({ error: "The AI did not give a usable answer. Try again.", code: "AI_FAILED" }, { status: 502 });
  return NextResponse.json({ suggestions });
});
