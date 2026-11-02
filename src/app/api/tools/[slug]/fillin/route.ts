import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { VersionConflict, getFillin, saveFillin } from "@/lib/tools/service";
import { toolsGuard, userTool } from "@/lib/tools/server";
import { canonicaliseClientFields, cleanClientFields } from "@/lib/strategyHubAi";
import { structureOf } from "@/lib/tools/ai";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** GET /api/tools/:slug/fillin - the signed-in person's saved work in this tool (null if none yet). */
export const GET = toolsGuard(async (_req: NextRequest, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const u = await userTool(slug);
  if ("error" in u) return u.error;
  return NextResponse.json({ record: await getFillin(prismaRepo, u.userId, slug) });
}, "user");

/**
 * PUT /api/tools/:slug/fillin  { fields, expectedVersion }
 * Autosave. `expectedVersion` is the version this tab last saw (0 for the first save); if another tab saved in between, the answer is
 * 409 with the stored work, and nothing is overwritten.
 */
export const PUT = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const u = await userTool(slug);
  if ("error" in u) return u.error;
  let body: { fields?: unknown; expectedVersion?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const expected = Number.isInteger(body.expectedVersion) ? (body.expectedVersion as number) : null;
  if (expected === null) return NextResponse.json({ error: "Reload the page and try again." }, { status: 400 });
  const fields = canonicaliseClientFields(structureOf(u.def), cleanClientFields(body.fields)).map((f) => ({ label: f.label, value: f.value, source: f.source || "Manual" }));
  try {
    const record = await saveFillin(prismaRepo, u.userId, slug, { fields }, { expectedVersion: expected });
    return NextResponse.json({ record });
  } catch (e) {
    if (e instanceof VersionConflict) return NextResponse.json({ error: e.message, code: e.code, record: e.current }, { status: 409 });
    throw e;
  }
}, "user");
