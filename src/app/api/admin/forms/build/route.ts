import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { asChoice, asPracticeChoice, suggestCategory } from "@/lib/tools/service";
import { isAssetType } from "@/lib/tools/taxonomy";
import { suggestPractice } from "@/lib/tools/practice";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";
import { loadBase, loadSkills, realFormBuilder } from "@/lib/forms/server";
import { readingsFromElements, sanitiseElements } from "@/lib/forms/source";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const limiter = rateLimit({ limit: 20, windowSeconds: 3600 });

type Done = { status: number; body: Record<string, unknown> };
type Job = { owner: string; startedAt: number; done?: Done };
const jobs: Map<string, Job> = ((globalThis as unknown as { __formJobs?: Map<string, Job> }).__formJobs ??= new Map());
const TTL_MS = 30 * 60_000;

async function runBuild(userId: string, b: Record<string, unknown>): Promise<Done> {
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const choice = asChoice(b.category);
  const category = choice === "Auto" ? suggestCategory("") : choice;
  const pChoice = asPracticeChoice(b.practice);
  const practice = pChoice === "Auto" ? suggestPractice("") : pChoice;

  const elements = sanitiseElements(b.elements);
  const readings = elements.length ? readingsFromElements(elements, Array.isArray(b.warnings) ? (b.warnings as string[]) : []) : undefined;
  let base = null;
  if (typeof b.baseSlug === "string" && b.baseSlug) {
    base = await loadBase(b.baseSlug);
    if (!base) return { status: 400, body: { error: "That template cannot be used as a base (it is a hand-built tool or is archived). Choose another or build without one." } };
  }

  const skills = await loadSkills();
  const out = await realFormBuilder()({
    request: str(b.request, 4000), audience: str(b.audience, 400), name: str(b.name, 160), category, practice, assetType: isAssetType(b.assetType) ? b.assetType : undefined, readings, base, ...skills,
  });
  if (out.kind === "ai_down") return { status: 503, body: { error: out.reason, code: "AI_DOWN" } };
  if (out.kind === "failed") return { status: 502, body: { error: out.reason, code: "BUILD_FAILED" } };

  const saved = await prismaRepo.saveTool(out.tool);
  await audit(userId, "form_built", saved.slug, { mode: (out.tool.provenance as { formBuilder?: { mode?: string } } | null)?.formBuilder?.mode ?? null, elements: elements.length, baseSlug: base?.slug ?? null });
  return {
    status: 200,
    body: {
      slug: saved.slug, name: saved.name, status: saved.status, quality: saved.quality, notes: out.notes,
      coverage: out.coverage ? { counts: out.coverage.counts, assumptions: out.coverage.assumptions, approximations: out.coverage.approximations, items: out.coverage.items.filter((i) => i.status !== "structure") } : null,
    },
  };
}

/**
 * POST /api/admin/forms/build  { request, name?, audience?, category, practice, elements?, warnings?, baseSlug? }
 * Step 2. Starts building the form with the AI and answers at once with a job id, because a build can take several minutes and the web
 * host cuts any single request that runs about a minute ("The server took too long to respond"). The page then asks GET ?job=<id> every
 * few seconds. The finished form is saved as a DRAFT (or NEEDS_REVIEW); nothing is published: a person reviews it first.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many forms built this hour. Please try again later." }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  for (const [id, j] of jobs) if (Date.now() - j.startedAt > TTL_MS) jobs.delete(id);
  const id = randomUUID();
  const job: Job = { owner: auth.user.id, startedAt: Date.now() };
  jobs.set(id, job);
  void runBuild(auth.user.id, b)
    .then((d) => { job.done = d; })
    .catch((e) => { job.done = { status: 500, body: { error: e instanceof Error && e.message ? `The build stopped: ${e.message}` : "The build stopped unexpectedly. Please try again." } }; });
  return NextResponse.json({ jobId: id }, { status: 202 });
});

/** GET /api/admin/forms/build?job=<id>: still running (202), or the finished result with its own status code. */
export const GET = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const job = jobs.get(req.nextUrl.searchParams.get("job") ?? "");
  if (!job || job.owner !== auth.user.id) return NextResponse.json({ error: "This build was interrupted (the server restarted) or has expired. Please build again.", code: "JOB_LOST" }, { status: 404 });
  if (!job.done) return NextResponse.json({ running: true, seconds: Math.round((Date.now() - job.startedAt) / 1000) }, { status: 202 });
  jobs.delete(req.nextUrl.searchParams.get("job") ?? "");
  return NextResponse.json(job.done.body, { status: job.done.status });
});
