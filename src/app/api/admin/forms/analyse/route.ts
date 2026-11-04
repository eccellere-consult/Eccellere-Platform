import { NextRequest, NextResponse } from "next/server";
import { ExtractError } from "@/lib/tools/extract";
import { generateText } from "@/lib/ai/gateway";
import { aiReady, toolsGuard, writeAuth } from "@/lib/tools/server";
import { readSources, sourcePages } from "@/lib/forms/source";
import { makeImageReader } from "@/lib/forms/image";
import { findTemplates } from "@/lib/forms/templateSearch";
import { templateCandidates } from "@/lib/forms/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const limiter = rateLimit({ limit: 40, windowSeconds: 3600 });
const MAX_FILES = 12;

/**
 * POST /api/admin/forms/analyse  (multipart: files[], request); files may be pictures
 * Step 1 of the Form Builder. Reads the uploaded files into numbered source elements (nothing is saved, and the files are not kept),
 * and finds the best existing templates for what was asked. The page shows both, then calls /build.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!(await limiter.check(auth.user.id)).success) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const request = typeof form.get("request") === "string" ? String(form.get("request")).slice(0, 4000) : "";
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Upload at most ${MAX_FILES} files for one form.` }, { status: 400 });
  if (!files.length && !request.trim()) return NextResponse.json({ error: "Describe the form you need, or upload a document." }, { status: 400 });

  let readings: Awaited<ReturnType<typeof readSources>> = [];
  if (files.length) {
    try {
      // pictures are transcribed by a vision AI; without AI the reader is absent and a picture gets a plain-words refusal
      const readImage = (await aiReady()) ? makeImageReader((a) => generateText(a)) : undefined;
      readings = await readSources(await Promise.all(files.map(async (f) => ({ name: f.name, data: Buffer.from(await f.arrayBuffer()) }))), { readImage });
    } catch (e) {
      if (e instanceof ExtractError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.code === "TOO_LARGE" ? 413 : e.code === "UNSUPPORTED" ? 415 : 422 });
      throw e;
    }
  }
  const elements = readings.flatMap((r) => r.elements);

  // What to search the catalogue with: the request, and for an upload the file names and its headings and first questions.
  const hints = elements.filter((e) => e.kind === "heading" || e.kind === "question").slice(0, 20).map((e) => e.text);
  const query = [request, ...readings.map((r) => r.fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")), ...hints].join(" ");
  const found = await findTemplates({ request: query, candidates: await templateCandidates(), generate: (await aiReady()) ? (a) => generateText(a) : undefined });

  const counts: Record<string, number> = {};
  for (const e of elements) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
  return NextResponse.json({
    aiReady: await aiReady(),
    files: readings.map((r) => ({ name: r.fileName, kind: r.kind, elements: r.elements.length, warnings: r.warnings, truncated: r.truncated })),
    elements,
    pages: sourcePages(readings).map((p) => ({ n: p.n, file: p.file, sheet: p.sheet, hidden: p.hidden, items: p.ids.length })),
    counts,
    warnings: readings.flatMap((r) => r.warnings),
    templates: found.matches,
    templatesByAi: found.usedAi,
  });
});
