import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { asChoice, asPracticeChoice, previewImport, startImport } from "@/lib/tools/service";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

const MAX_TEXT = 200_000;

/**
 * POST /api/admin/tools/import  { text, category, label?, dryRun? }
 * `text` is the pasted, typed or uploaded list (one tool per line). With dryRun it only reports what would happen.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  let body: { text?: unknown; category?: unknown; practice?: unknown; brief?: unknown; label?: unknown; dryRun?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return NextResponse.json({ error: "Add at least one tool name." }, { status: 400 });
  if (text.length > MAX_TEXT) return NextResponse.json({ error: "That list is too large. Split it into smaller lists." }, { status: 413 });
  const choice = asChoice(body.category);
  const practice = asPracticeChoice(body.practice);
  const brief = typeof body.brief === "string" ? body.brief.slice(0, 80_000) : "";

  if (body.dryRun === true) return NextResponse.json(await previewImport(prismaRepo, text, choice, practice, brief.trim().length));

  const started = await startImport(prismaRepo, auth.user.id, text, choice, typeof body.label === "string" ? body.label : undefined, practice, brief);
  await audit(auth.user.id, "tools_import_started", started.jobId, { queued: started.queued, category: choice });
  return NextResponse.json(started);
});
