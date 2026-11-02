import { NextRequest, NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { bulkAction, type BulkAction } from "@/lib/tools/service";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

const ACTIONS: BulkAction[] = ["delete", "archive", "review", "expose", "withdraw"];

/**
 * POST /api/admin/tools/bulk  { action, slugs }
 * Delete, archive, mark reviewed, expose to clients or withdraw many tools at once. Each tool follows exactly the same rules as on its own
 * screen; one that cannot be done (with the reason) never stops the others. AI fixes are done one tool at a time from the page.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  let body: { action?: unknown; slugs?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const action = ACTIONS.find((a) => a === body.action);
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s): s is string => typeof s === "string") : [];
  if (!action) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (slugs.length === 0) return NextResponse.json({ error: "Select at least one tool." }, { status: 400 });
  const results = await bulkAction(prismaRepo, action, slugs, auth.user.id);
  await audit(auth.user.id, `tools_bulk_${action}`, "bulk", { ok: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length });
  return NextResponse.json({ results });
});
