import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";
import { estimateForAsset, makeOnlineForAsset } from "@/lib/marketplace/server";
import { makeAllOnline, type BatchSummary } from "@/lib/marketplace/batch";
import { costAccepted, planAiBatch, type AiBatchPlan } from "@/lib/marketplace/batchAi";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// AI builds cost money, so this has its own, low limit.
const limiter = rateLimit({ limit: 4, windowSeconds: 3600 });

type Asset = { slug: string; title: string; description: string; fileUrls: unknown };
type Job = { owner: string; startedAt: number; kind: "plan" | "run"; done?: number; total?: number; result?: { status: number; body: Record<string, unknown> } };
type Ticket = { owner: string; at: number; plan: AiBatchPlan; assets: Asset[]; used: boolean };
const g = globalThis as unknown as { __aiBatchJobs?: Map<string, Job>; __aiBatchTickets?: Map<string, Ticket> };
const jobs: Map<string, Job> = (g.__aiBatchJobs ??= new Map());
const tickets: Map<string, Ticket> = (g.__aiBatchTickets ??= new Map());
const TTL_MS = 60 * 60_000;

async function plan(userId: string, job: Job, limit: number): Promise<void> {
  const assets: Asset[] = await prisma.asset.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, take: 400, select: { slug: true, title: true, description: true, fileUrls: true } });
  job.total = assets.length; job.done = 0;
  const bySlug = new Map(assets.map((a) => [a.slug, a]));
  const p = await planAiBatch(assets, async (a) => { const r = await estimateForAsset(bySlug.get(a.slug)!); job.done = (job.done ?? 0) + 1; return r; }, limit);
  const ticket = randomUUID();
  tickets.set(ticket, { owner: userId, at: Date.now(), plan: p, assets: p.rows.map((r) => bySlug.get(r.slug)!), used: false });
  job.result = { status: 200, body: { ticket, plan: p } };
}

async function run(userId: string, job: Job, t: Ticket): Promise<void> {
  job.total = t.assets.length; job.done = 0;
  const bySlug = new Map(t.assets.map((a) => [a.slug, a]));
  const summary: BatchSummary = await makeAllOnline(t.assets, (a) => makeOnlineForAsset(bySlug.get(a.slug)!, { useAi: true }), (done) => { job.done = done; });
  await audit(userId, "toolkits_made_online_with_ai_batch", "batch", { counts: summary.counts, total: summary.total, agreedUpToUsd: t.plan.highUsd });
  job.result = { status: 200, body: { summary } };
}

/**
 * POST { action: "plan", limit? }              how many toolkits would be built and the worst-case TOTAL cost (no AI is called, free)
 * POST { action: "run", ticket, acceptedUsd }  builds exactly the toolkits in that plan with the best AI model, only if acceptedUsd is at least the plan's top figure
 * Each answers at once with a job id; GET ?job=<id> gives progress and then the result. Drafts only: nothing is published.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => ({}))) as { action?: unknown; limit?: unknown; ticket?: unknown; acceptedUsd?: unknown };
  for (const [k, j] of jobs) if (Date.now() - j.startedAt > TTL_MS) jobs.delete(k);
  for (const [k, t] of tickets) if (Date.now() - t.at > TTL_MS) tickets.delete(k);

  if (body.action === "plan") {
    const id = randomUUID();
    const job: Job = { owner: auth.user.id, startedAt: Date.now(), kind: "plan" };
    jobs.set(id, job);
    void plan(auth.user.id, job, Number(body.limit) || 0).catch((e) => { job.result = { status: 500, body: { error: e instanceof Error && e.message ? `The plan stopped: ${e.message}` : "The plan stopped unexpectedly. Please try again." } }; });
    return NextResponse.json({ jobId: id }, { status: 202 });
  }

  if (body.action === "run") {
    const t = typeof body.ticket === "string" ? tickets.get(body.ticket) : undefined;
    if (!t || t.owner !== auth.user.id) return NextResponse.json({ error: "This plan has expired or the server restarted. Please make the plan again, so you see the cost again.", code: "PLAN_LOST" }, { status: 404 });
    if (t.used) return NextResponse.json({ error: "This plan was already run. Make a new plan to run it again.", code: "PLAN_USED" }, { status: 409 });
    if (t.plan.rows.length === 0) return NextResponse.json({ error: "There is nothing to build in this plan." }, { status: 422 });
    if (!costAccepted(t.plan, body.acceptedUsd)) return NextResponse.json({ error: "Please look at the estimated cost and confirm it before the AI is used.", code: "COST_NOT_ACCEPTED" }, { status: 400 });
    if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many AI batch runs this hour. Please try again later." }, { status: 429 });
    t.used = true;
    const id = randomUUID();
    const job: Job = { owner: auth.user.id, startedAt: Date.now(), kind: "run" };
    jobs.set(id, job);
    void run(auth.user.id, job, t).catch((e) => { job.result = { status: 500, body: { error: e instanceof Error && e.message ? `The run stopped: ${e.message}` : "The run stopped unexpectedly. Please try again." } }; });
    return NextResponse.json({ jobId: id }, { status: 202 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
});

export const GET = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const key = req.nextUrl.searchParams.get("job") ?? "";
  const job = jobs.get(key);
  if (!job || job.owner !== auth.user.id) return NextResponse.json({ error: "This run was interrupted (the server restarted) or has expired. Please start again.", code: "JOB_LOST" }, { status: 404 });
  if (!job.result) return NextResponse.json({ running: true, kind: job.kind, done: job.done ?? 0, total: job.total ?? 0 }, { status: 202 });
  jobs.delete(key);
  return NextResponse.json(job.result.body, { status: job.result.status });
});
