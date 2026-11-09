import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";
import type { MakeOnlineResult } from "@/lib/marketplace/makeOnline";
import { makeOnlineForAsset } from "@/lib/marketplace/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const limiter = rateLimit({ limit: 20, windowSeconds: 3600 });

type Done = { status: number; body: Record<string, unknown> };
type Job = { owner: string; startedAt: number; done?: Done };
const jobs: Map<string, Job> = ((globalThis as unknown as { __makeOnlineJobs?: Map<string, Job> }).__makeOnlineJobs ??= new Map());
const TTL_MS = 30 * 60_000;

const WORDS: Record<Exclude<MakeOnlineResult["kind"], "ok">, { status: number; text: (r: never) => string }> = {
  exists: { status: 409, text: () => "This toolkit already has an online version. Find it in Admin > Tools." },
  no_file: { status: 422, text: () => "This toolkit has no file on the server to read, so there is nothing to build the online version from." },
  unreadable: { status: 422, text: (r: { reason: string }) => r.reason as never },
  ai_down: { status: 503, text: (r: { reason: string }) => r.reason as never },
  failed: { status: 502, text: (r: { reason: string }) => r.reason as never },
};

async function run(userId: string, assetId: string): Promise<Done> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { slug: true, title: true, description: true, fileUrls: true } });
  if (!asset) return { status: 404, body: { error: "Toolkit not found." } };
  const r = await makeOnlineForAsset(asset);
  if (r.kind === "ok") {
    await audit(userId, "toolkit_made_online", r.slug, { assetId });
    return { status: 200, body: { slug: r.slug, name: r.name, status: r.status, notes: r.notes } };
  }
  const w = WORDS[r.kind];
  return { status: w.status, body: { error: w.text(r as never), code: r.kind.toUpperCase() } };
}

/**
 * POST /api/admin/assets/<id>/make-online
 * Starts building a fill-online DRAFT from the toolkit's own file and answers at once with a job id (a build can take minutes and the host cuts a
 * request at about a minute). The draft is saved for review under the toolkit's own slug; nothing is published.
 */
export const POST = toolsGuard(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many builds this hour. Please try again later." }, { status: 429 });
  const { id: assetId } = await ctx.params;
  for (const [k, j] of jobs) if (Date.now() - j.startedAt > TTL_MS) jobs.delete(k);
  const id = randomUUID();
  const job: Job = { owner: auth.user.id, startedAt: Date.now() };
  jobs.set(id, job);
  void run(auth.user.id, assetId)
    .then((d) => { job.done = d; })
    .catch((e) => { job.done = { status: 500, body: { error: e instanceof Error && e.message ? `The build stopped: ${e.message}` : "The build stopped unexpectedly. Please try again." } }; });
  return NextResponse.json({ jobId: id }, { status: 202 });
});

/** GET ?job=<id>: still running (202), or the finished result with its own status code. */
export const GET = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const key = req.nextUrl.searchParams.get("job") ?? "";
  const job = jobs.get(key);
  if (!job || job.owner !== auth.user.id) return NextResponse.json({ error: "This build was interrupted (the server restarted) or has expired. Please try again.", code: "JOB_LOST" }, { status: 404 });
  if (!job.done) return NextResponse.json({ running: true, seconds: Math.round((Date.now() - job.startedAt) / 1000) }, { status: 202 });
  jobs.delete(key);
  return NextResponse.json(job.done.body, { status: job.done.status });
});
