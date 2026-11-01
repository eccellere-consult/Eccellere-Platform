import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PROVIDERS, normalizeSettings } from "@/lib/ai/providers";
import { SETTINGS_KEY, clearAiSettingsCache, loadAiSettings, providerStatus } from "@/lib/ai/gateway";

export const dynamic = "force-dynamic";

/** GET /api/admin/ai-settings - current toggles/selection and which keys are configured (never the keys). */
export async function GET() {
  const auth = await requirePermission("admin:settings:read");
  if (auth.error) return auth.error;
  clearAiSettingsCache();
  const settings = await loadAiSettings();
  const status = providerStatus();
  return NextResponse.json({
    settings,
    providers: PROVIDERS.map((p) => ({
      id: p.id,
      label: p.label,
      note: p.note,
      envKey: p.envKey,
      defaultModel: p.defaultModel,
      keyConfigured: status.find((s) => s.id === p.id)?.keyConfigured ?? false,
    })),
  });
}

/** PUT /api/admin/ai-settings - save toggles, models, primary and fallback order. */
export async function PUT(req: NextRequest) {
  const auth = await requirePermission("admin:settings:write");
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const next = normalizeSettings((body as { settings?: unknown })?.settings);

  const anyUsable = PROVIDERS.some((p) => next.providers[p.id].enabled && (process.env[p.envKey] ?? "").trim());
  await prisma.aiSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: next as never, updatedBy: auth.user.id },
    update: { value: next as never, updatedBy: auth.user.id },
  });
  await prisma.auditLog
    .create({
      data: {
        userId: auth.user.id,
        action: "ai_settings_updated",
        entityType: "AiSetting",
        entityId: SETTINGS_KEY,
        details: { primary: next.primary, enabled: PROVIDERS.filter((p) => next.providers[p.id].enabled).map((p) => p.id) } as never,
      },
    })
    .catch(() => {});
  clearAiSettingsCache();
  return NextResponse.json({
    ok: true,
    settings: next,
    warning: anyUsable ? undefined : "No enabled provider has an API key configured, so AI features will be unavailable.",
  });
}
