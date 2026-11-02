import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { editTool, redraftTool } from "@/lib/tools/review";
import { markReviewed, publishTool, setToolCategory, unpublishTool } from "@/lib/tools/service";
import { audit, readAuth, realDrafter, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ slug: string }> };

/** GET /api/admin/tools/:slug - the whole tool (definition, quality, standards, provenance) for the review screen. */
export const GET = toolsGuard(async (_req: NextRequest, ctx: Ctx) => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  const tool = await prismaRepo.getToolBySlug(slug);
  if (!tool) return NextResponse.json({ error: "That tool was not found." }, { status: 404 });
  return NextResponse.json({ tool });
});

/** PATCH /api/admin/tools/:slug  { category?, edits? } - move to another section, or correct the wording. */
export const PATCH = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  let body: { category?: unknown; edits?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  let tool = null;
  if (typeof body.category === "string") tool = await setToolCategory(prismaRepo, slug, body.category);
  if (body.edits && typeof body.edits === "object") tool = await editTool(prismaRepo, slug, body.edits as Record<string, never>);
  if (!tool) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  await audit(auth.user.id, "tool_edited", slug, { category: body.category ?? null, edited: !!body.edits });
  return NextResponse.json({ tool });
});

/** POST /api/admin/tools/:slug  { action: "review" | "publish" | "unpublish" | "redraft" } */
export const POST = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  let body: { action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  switch (body.action) {
    case "review": {
      const tool = await markReviewed(prismaRepo, slug, auth.user.id);
      await audit(auth.user.id, "tool_reviewed", slug);
      return NextResponse.json({ tool });
    }
    case "publish": {
      const tool = await publishTool(prismaRepo, slug);
      await audit(auth.user.id, "tool_published", slug);
      return NextResponse.json({ tool });
    }
    case "unpublish": {
      const tool = await unpublishTool(prismaRepo, slug);
      await audit(auth.user.id, "tool_unpublished", slug);
      return NextResponse.json({ tool });
    }
    case "redraft": {
      const r = await redraftTool(prismaRepo, slug, realDrafter());
      if (r.paused) return NextResponse.json({ error: r.paused, code: "AI_DOWN" }, { status: 503 });
      if (r.failed) return NextResponse.json({ error: r.failed, code: "DRAFT_FAILED" }, { status: 502 });
      await audit(auth.user.id, "tool_redrafted", slug);
      return NextResponse.json({ tool: r.tool });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
});
