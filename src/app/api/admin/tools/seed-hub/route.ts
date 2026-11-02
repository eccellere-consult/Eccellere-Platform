import { NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { seedHubTools } from "@/lib/tools/hub";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/tools/seed-hub
 * Adds the 36 hand-built Strategy Hub tools to the Consulting library (with their hand-drawn diagrams and worked examples). Tools already
 * in the library are left alone, so it is safe to press again. They are visible to the Eccellere team only until you expose them to clients.
 */
export const POST = toolsGuard(async () => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const r = await seedHubTools(prismaRepo, auth.user.id);
  await audit(auth.user.id, "tools_hub_seeded", "strategy-hub", { added: r.added.length, skipped: r.skipped.length });
  return NextResponse.json(r);
});
