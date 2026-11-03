import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { advise, LIMITS, type Turn } from "@/lib/advisor/respond";
import { loadDeps } from "@/lib/advisor/server";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const limiter = rateLimit({ limit: 20, windowSeconds: 300 });

/**
 * POST /api/dashboard/advisor  { message, history? }
 * Signed-in clients only. Returns the whole answer after the identity scan (nothing is streamed). The client's business type is
 * read on the server; the company name is never sent to the model.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Please sign in to use the Advisor." }, { status: 401 });

  const gate = await limiter.check(`advisor:${session.user.email}`);
  if (!gate.success) return NextResponse.json({ error: "You are sending questions quickly. Please wait a minute and try again." }, { status: 429 });

  let body: { message?: unknown; history?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.message !== "string" || !body.message.trim()) return NextResponse.json({ error: "Please type a question." }, { status: 400 });

  const history: Turn[] = Array.isArray(body.history)
    ? body.history
        .filter((t): t is Turn => !!t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
        .slice(-LIMITS.turns)
        .map((t) => ({ role: t.role, text: t.text.slice(0, LIMITS.turn) }))
    : [];

  let industry: string | undefined;
  try {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { clientProfile: { select: { businessType: true } } } });
    industry = u?.clientProfile?.businessType || undefined;
  } catch { /* context is optional */ }

  const advice = await advise({ message: body.message, history, context: { industry, page: "dashboard/advisor" } }, await loadDeps());
  return NextResponse.json(advice);
}
