import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";
import { makeAllOnline, type BatchSummary } from "@/lib/marketplace/batch";
import { makeOnlineForAsset } from "@/lib/marketplace/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const limiter = rateLimit({ limit: 6, windowSeconds: 3600 });
const MAX_ASSETS = 300;

type Job = { owner: string; startedAt: number; done?: number; total?: number; result?: { status: number; body: Record<string, unknown> } };
const jobs: Map<string, Job> = ((globalThis as unknown as { __makeAllOnlineJobs?: Map<string, Job> }).__makeAllOnlineJobs ??= new Map());
const TTL_MS = 60 * 60_000;

async function run(userId: string, job: Job): Promise<void> {
  const assets = await prisma.asset.findMany({
    where: { status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, take: MAX_ASSETS,
    select: { slug: true, title: true, description: true, fileUrls: true },
  });
  job.total = assets.length; job.done = 0;
  const summary: BatchSummary = await makeAllOnline(assets, (a) => makeOnlineForAsset(assets.find((x) => x.slug === a.slug)!), (done) => { job.done = done; });
  await audit(userId, "toolkits_made_online_batch", "all", { counts: summary.counts, total: summary.total });
  job.result = { status: 200, body: { summary } };
}

/**
 * POST /api/admin/assets/make-online-all
 * Builds a fill-online DRAFT, with no AI (free), for every published marketplace item that has a readable file and no online version yet, one after
 * another. Answers at once with a job id; GET ?job=<id> shows progress and then the per-toolkit result. Nothing is published.
 */
export const POST = toolsGuard(async () => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many batch runs this hour. Please try again later." }, { status: 429 });
  for (const [k, j] of jobs) if (Date.now() - j.startedAt > TTL_MS) jobs.delete(k);
  const id = randomUUID();
  const job: Job = { owner: auth.user.id, startedAt: Date.now() };
  jobs.set(id, job);
  void run(auth.user.id, job).catch((e) => { job.result = { status: 500, body: { error: e instanceof Error && e.message ? `The run stopped: ${e.message}` : "The run stopped unexpectedly. Please try again." } }; });
  return NextResponse.json({ jobId: id }, { status: 202 });
});

export const GET = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const key = req.nextUrl.searchParams.get("job") ?? "";
  const job = jobs.get(key);
  if (!job || job.owner !== auth.user.id) return NextResponse.json({ error: "This run was interrupted (the server restarted) or has expired. Please start it again.", code: "JOB_LOST" }, { status: 404 });
  if (!job.result) return NextResponse.json({ running: true, done: job.done ?? 0, total: job.total ?? 0 }, { status: 202 });
  jobs.delete(key);
  return NextResponse.json(job.result.body, { status: job.result.status });
});
