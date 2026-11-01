import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/toolkit/server";
import { requirePermission } from "@/lib/rbac";
import { PROVIDER_BY_ID, hasKey, type ProviderId } from "@/lib/ai/providers";
import { generateText, clearAiSettingsCache } from "@/lib/ai/gateway";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const testLimiter = rateLimit({ limit: 20, windowSeconds: 600 });

/**
 * POST /api/admin/ai-settings/test  { provider }
 * Sends one tiny fixed prompt to a single provider to verify its key and model.
 * No user data is sent. Returns only pass/fail and the model name.
 */
async function POST_(req: NextRequest) {
  const auth = await requirePermission("admin:settings:write");
  if (auth.error) return auth.error;
  if (!testLimiter.check(auth.user.id).success) {
    return NextResponse.json({ error: "Too many tests. Please wait a few minutes." }, { status: 429 });
  }

  const { provider } = (await req.json().catch(() => ({}))) as { provider?: string };
  if (!provider || !(provider in PROVIDER_BY_ID)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 422 });
  }
  const def = PROVIDER_BY_ID[provider as ProviderId];
  if (!hasKey(def, process.env)) {
    return NextResponse.json({ ok: false, reason: `${def.envKey} is not set on the server.` });
  }
  clearAiSettingsCache();
  const diag: string[] = [];
  const out = await generateText({
    system: "You are a connectivity check. Reply with the single word OK.",
    user: "Reply OK",
    maxTokens: 10,
    timeoutMs: 15000,
    only: def.id,
    diag,
  });
  return out
    ? NextResponse.json({ ok: true, model: out.model })
    : NextResponse.json({ ok: false, reason: diag.length ? diag.join("; ") : "The provider rejected the request (invalid key, wrong model name, or no access)." });
}

export const POST = guard(POST_);
