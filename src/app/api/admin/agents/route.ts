import { NextResponse } from "next/server";
import { readAuth } from "@/lib/tools/server";
import { prismaEditRepo } from "@/lib/agents/editRepo";
import { agentGuard, listAgents } from "@/lib/agents/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/agents: every agent with its default wording and any saved edit. Works (with no edits) before the tables exist. */
export const GET = agentGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  return NextResponse.json({ agents: await listAgents(prismaEditRepo) });
});
