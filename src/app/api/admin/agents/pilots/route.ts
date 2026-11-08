import { NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { installPilots } from "@/lib/agents/pilots";
import { audit, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/agents/pilots
 * Adds the pilot agents' tools to the Tools marketplace as "needs review". Tools already there are left alone, so it is safe to press again.
 * Nothing becomes visible to clients until a person reviews and publishes each tool.
 */
export const POST = toolsGuard(async () => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const r = await installPilots(prismaRepo);
  await audit(auth.user.id, "agent_pilots_installed", "agent-pilots", { added: r.added.length, skipped: r.skipped.length, refused: r.refused.length });
  return NextResponse.json(r);
});
