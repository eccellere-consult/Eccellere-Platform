import { NextResponse } from "next/server";
import { readAuth, writeAuth } from "@/lib/tools/server";
import { audit } from "@/lib/tools/server";
import { everyAgent } from "@/lib/agents/catalogue";
import { pilotByAgent } from "@/lib/agents/pilots";
import { prismaEditRepo } from "@/lib/agents/editRepo";
import { cleanEdit } from "@/lib/agents/overrides";
import { agentGuard } from "@/lib/agents/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };
const known = (slug: string) => everyAgent().some((a) => a.slug === slug);

/** GET /api/admin/agents/<slug>: the saved versions of this agent's edits, newest first. */
export const GET = agentGuard(async (_req: Request, ctx: Ctx) => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  if (!known(slug)) return NextResponse.json({ error: "That agent was not found." }, { status: 404 });
  return NextResponse.json({ history: await prismaEditRepo.history(slug) });
});

/**
 * PUT /api/admin/agents/<slug>: save this agent's wording. An empty box means "use the default"; saving everything empty resets the agent.
 * Only wording can be changed here, never a formula. Suppliers, process, customers and refresh apply to pilots only.
 */
export const PUT = agentGuard(async (req: Request, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  if (!known(slug)) return NextResponse.json({ error: "That agent was not found." }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  if (!pilotByAgent(slug)) for (const k of ["suppliers", "process", "customers", "refresh"]) delete body[k];
  const c = cleanEdit(slug, body);
  if (!c.ok) return NextResponse.json({ error: c.errors.join(" "), errors: c.errors }, { status: 400 });
  const version = await prismaEditRepo.save(slug, c.edit, auth.user.id);
  await audit(auth.user.id, "agent_edited", slug, { version });
  return NextResponse.json({ ok: true, version });
});

/** DELETE /api/admin/agents/<slug>: put the default wording back. The reset is kept in the history. */
export const DELETE = agentGuard(async (_req: Request, ctx: Ctx) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  if (!known(slug)) return NextResponse.json({ error: "That agent was not found." }, { status: 404 });
  const version = await prismaEditRepo.save(slug, null, auth.user.id);
  await audit(auth.user.id, "agent_reset", slug, { version });
  return NextResponse.json({ ok: true, version });
});
