import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { draftNext, removeRun, removeRunItem, resumeJob, retryFailed } from "@/lib/tools/service";
import { readAuth, realDrafter, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/tools/jobs/:id - the run and every name in it with its status. */
export const GET = toolsGuard(async (_req: NextRequest, ctx: Ctx) => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const found = await prismaRepo.getJob(id);
  if (!found) return NextResponse.json({ error: "That run was not found." }, { status: 404 });
  return NextResponse.json({
    job: found.job,
    items: found.items.map((i) => ({ id: i.id, name: i.name, category: i.category, groupName: i.groupName, slug: i.slug, status: i.status, error: i.error, attempts: i.attempts })),
  });
});

/**
 * POST /api/admin/tools/jobs/:id  { action: "step" | "resume" | "retry" }
 * "step" drafts ONE name and returns. The admin page calls it in a loop, three at a time, so a closed tab simply stops the run
 * and "resume" carries on from the names still waiting.
 */
export const POST = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  let body: { action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  switch (body.action) {
    case "step": {
      const step = await draftNext(prismaRepo, id, realDrafter());
      return NextResponse.json(step);
    }
    case "resume":
      await resumeJob(prismaRepo, id);
      return NextResponse.json({ ok: true });
    case "retry":
      return NextResponse.json({ requeued: await retryFailed(prismaRepo, id) });
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
});

/** DELETE /api/admin/tools/jobs/:id  removes the whole run; DELETE /api/admin/tools/jobs/:id?item=<id> removes one name from it. Tools already drafted stay. */
export const DELETE = toolsGuard(async (req: NextRequest, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const item = new URL(req.url).searchParams.get("item");
  if (item) await removeRunItem(prismaRepo, id, item);
  else await removeRun(prismaRepo, id);
  return NextResponse.json({ ok: true });
});
