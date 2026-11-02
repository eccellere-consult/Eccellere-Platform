import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { VersionConflict, getFillin, saveFillin, undoFieldChange } from "@/lib/tools/service";
import { realAiDeps, toolsGuard, userTool } from "@/lib/tools/server";
import { aiAnalyse, aiFill } from "@/lib/tools/ai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ slug: string }> };
const limiter = rateLimit({ limit: 40, windowSeconds: 3600 });

const FAIL_STATUS = { AI_DOWN: 503, NOTHING_TO_DO: 422, UNUSABLE: 502, CUT_OFF: 502 } as const;

/**
 * POST /api/tools/:slug/ai  { action: "fill" | "analyse" | "undo", brief?, expectedVersion }
 * Everything the AI writes is saved here, by the server, the moment it is produced (never left to the browser), and only if it was
 * complete and readable. A fill keeps the previous answers once so it can be undone.
 */
export const POST = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const u = await userTool(slug);
  if ("error" in u) return u.error;
  let body: { action?: unknown; brief?: unknown; expectedVersion?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const expected = Number.isInteger(body.expectedVersion) ? (body.expectedVersion as number) : null;
  const current = await getFillin(prismaRepo, u.userId, slug);

  try {
    if (body.action === "undo") {
      const record = await undoFieldChange(prismaRepo, u.userId, slug);
      if (!record) return NextResponse.json({ error: "There is nothing to undo." }, { status: 422 });
      return NextResponse.json({ record });
    }
    if (body.action !== "fill" && body.action !== "analyse") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    if (!limiter.check(u.userId).success) return NextResponse.json({ error: "AI help limit reached for now. Please try again later." }, { status: 429 });
    if (expected !== null && current && expected !== current.version) throw new VersionConflict(current);

    const fields = (current?.fields ?? []).map((f) => ({ label: f.label, value: f.value, source: f.source }));
    if (body.action === "fill") {
      const r = await aiFill(realAiDeps, { tool: u.def, current: fields, brief: typeof body.brief === "string" ? body.brief.slice(0, 8000) : "" });
      if (!r.ok) return NextResponse.json({ error: r.reason, code: r.code }, { status: FAIL_STATUS[r.code] });
      const record = await saveFillin(prismaRepo, u.userId, slug, { fields: r.fields }, { expectedVersion: current ? current.version : 0, snapshotReason: "ai" });
      return NextResponse.json({ record, drafted: r.drafted });
    }
    const r = await aiAnalyse(realAiDeps, { tool: u.def, fields });
    if (!r.ok) return NextResponse.json({ error: r.reason, code: r.code }, { status: FAIL_STATUS[r.code] });
    const record = await saveFillin(
      prismaRepo, u.userId, slug,
      { analysis: r.analysis, recommendations: r.recommendations, actionables: r.actionables },
      { expectedVersion: current ? current.version : 0 },
    );
    return NextResponse.json({ record, provider: r.provider });
  } catch (e) {
    if (e instanceof VersionConflict) return NextResponse.json({ error: e.message, code: e.code, record: e.current }, { status: 409 });
    throw e;
  }
}, "user");
