import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gateway";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { suggestTools } from "@/lib/tools/repair";
import { toolsGuard, writeAuth } from "@/lib/tools/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const limiter = rateLimit({ limit: 30, windowSeconds: 3600 });

/**
 * POST /api/admin/tools/suggest  { topic, practice?, count?, have? }
 * "Suggest tools with AI": the AI proposes well-known tools for a topic, leaving out anything already in the catalogue or in `have`
 * (the names already in the list box). The names come back for the administrator to edit; nothing is drafted or saved.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!limiter.check(auth.user.id).success) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  let body: { topic?: unknown; practice?: unknown; count?: unknown; have?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const existing = (await prismaRepo.listTools()).map((t) => t.name);
  const have = Array.isArray(body.have) ? body.have.filter((x): x is string => typeof x === "string").slice(0, 400) : [];
  const r = await suggestTools((a) => generateText(a), {
    topic: typeof body.topic === "string" ? body.topic : "",
    practice: typeof body.practice === "string" ? body.practice : undefined,
    count: typeof body.count === "number" ? body.count : undefined,
    existing: [...existing, ...have],
  });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 422 });
  return NextResponse.json({ tools: r.tools });
});
