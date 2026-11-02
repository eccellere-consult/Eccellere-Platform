import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gateway";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { completeTool, confirmOriginator, editTool, redraftTool } from "@/lib/tools/review";
import { archiveTool, deleteTool, markReviewed, publishTool, restoreTool, setToolCategory, setToolPractice, unpublishTool } from "@/lib/tools/service";
import { audit, loadSkillInfo, readAuth, realDrafter, toolsGuard, writeAuth } from "@/lib/tools/server";
import { fixTool } from "@/lib/tools/repair";
import { toRuntime } from "@/lib/tools/runtime";

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
  // A hand-built tool is shown from its model; the browser gets the reference card and a diagram, not code.
  const rt = toRuntime(tool);
  const handBuilt = rt?.code
    ? { reference: rt.reference, diagramSvg: rt.diagramSvg, sections: rt.def.sections.map((s) => ({ key: s.key, title: s.title, summary: s.summary, parts: s.parts.map((p) => ({ key: p.key, label: p.label, kind: p.kind, help: p.help })) })), code: rt.code }
    : null;
  return NextResponse.json({ tool: rt?.code ? { ...tool, definition: null } : tool, handBuilt });
});

/** PATCH /api/admin/tools/:slug  { category?, practice?, edits? } - move to another section or practice, or correct the wording. */
export const PATCH = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  let body: { category?: unknown; practice?: unknown; edits?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  let tool = null;
  if (typeof body.category === "string") tool = await setToolCategory(prismaRepo, slug, body.category);
  if (typeof body.practice === "string") tool = await setToolPractice(prismaRepo, slug, body.practice);
  if (body.edits && typeof body.edits === "object") tool = await editTool(prismaRepo, slug, body.edits as Record<string, never>);
  if (!tool) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  await audit(auth.user.id, "tool_edited", slug, { category: body.category ?? null, practice: body.practice ?? null, edited: !!body.edits });
  return NextResponse.json({ tool });
});

/**
 * POST /api/admin/tools/:slug  { action }
 *   review            "Looks right": adds the tool to the Consulting library
 *   publish           expose to clients (the marketplace)
 *   unpublish         withdraw from clients; stays in the Consulting library
 *   archive / restore retire a tool everywhere / bring it back to the library
 *   redraft           draft again from the name (optional new context in `brief`)
 *   complete          add a missing diagram, worked example or suggested originator
 *   confirm-originator  record who is credited with the method: the AI's suggestion as it is, or the reviewer's own `name` and `year`
 */
export const POST = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  let body: { action?: unknown; brief?: unknown; name?: unknown; year?: unknown; instruction?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const done = async (action: string, tool: unknown, extra: Record<string, unknown> = {}) => {
    await audit(auth.user.id, `tool_${action}`, slug);
    return NextResponse.json({ tool, ...extra });
  };
  switch (body.action) {
    case "review": return done("reviewed", await markReviewed(prismaRepo, slug, auth.user.id));
    case "publish": return done("published", await publishTool(prismaRepo, slug));
    case "unpublish": return done("unpublished", await unpublishTool(prismaRepo, slug));
    case "archive": return done("archived", await archiveTool(prismaRepo, slug));
    case "restore": return done("restored", await restoreTool(prismaRepo, slug));
    case "confirm-originator":
      return done("originator_confirmed", await confirmOriginator(prismaRepo, slug, {
        name: typeof body.name === "string" ? body.name : undefined,
        year: typeof body.year === "string" ? body.year : undefined,
      }));
    case "complete": {
      const r = await completeTool(prismaRepo, slug, (a) => generateText(a));
      return done("completed", r.tool, { added: r.added, notes: r.notes });
    }
    case "fix": {
      // "Fix with AI" (no instruction) corrects the listed problems; "Modify with AI" (an instruction) changes the page as asked
      const skill = await loadSkillInfo("draft");
      const r = await fixTool(prismaRepo, slug, (a) => generateText(a), {
        instruction: typeof body.instruction === "string" ? body.instruction : "",
        skill: skill.isCustom ? skill.text : undefined,
      });
      return done("fixed", r.tool, { applied: r.applied, before: r.before, after: r.after, notes: r.notes });
    }
    case "redraft": {
      const r = await redraftTool(prismaRepo, slug, realDrafter(), typeof body.brief === "string" ? body.brief.slice(0, 16000) : undefined);
      if (r.paused) return NextResponse.json({ error: r.paused, code: "AI_DOWN" }, { status: 503 });
      if (r.failed) return NextResponse.json({ error: r.failed, code: "DRAFT_FAILED" }, { status: 502 });
      return done("redrafted", r.tool);
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
});

/** DELETE /api/admin/tools/:slug - remove a tool for good (not while live for clients, and not once anyone has saved work in it). */
export const DELETE = toolsGuard(async (_req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  await deleteTool(prismaRepo, slug);
  await audit(auth.user.id, "tool_deleted", slug);
  return NextResponse.json({ ok: true });
});
