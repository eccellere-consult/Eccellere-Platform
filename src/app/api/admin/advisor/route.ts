import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/toolkit/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PROTECTED_KEY, SWITCH_KEY, advisorEnabled, protectedNames } from "@/lib/advisor/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/advisor - whether the Advisor is on, and how many protected names are listed (the names themselves are returned to admins only). */
async function GET_() {
  const auth = await requirePermission("admin:settings:read");
  if (auth.error) return auth.error;
  return NextResponse.json({ enabled: await advisorEnabled(), envDisabled: process.env.ADVISOR_DISABLED === "1", protectedNames: await protectedNames() });
}

/** PUT /api/admin/advisor { enabled?, protectedNames? } - the kill switch and the list of names the identity guard must always remove. */
async function PUT_(req: NextRequest) {
  const auth = await requirePermission("admin:settings:write");
  if (auth.error) return auth.error;
  let body: { enabled?: unknown; protectedNames?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (typeof body.enabled === "boolean") {
    await prisma.aiSetting.upsert({ where: { key: SWITCH_KEY }, create: { key: SWITCH_KEY, value: { enabled: body.enabled }, updatedBy: auth.user.id }, update: { value: { enabled: body.enabled }, updatedBy: auth.user.id } });
  }
  if (Array.isArray(body.protectedNames)) {
    const names = [...new Set(body.protectedNames.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter((n) => n.length >= 2 && n.length <= 120))].slice(0, 5000);
    await prisma.aiSetting.upsert({ where: { key: PROTECTED_KEY }, create: { key: PROTECTED_KEY, value: { names }, updatedBy: auth.user.id }, update: { value: { names }, updatedBy: auth.user.id } });
  }
  // The audit record says what changed, never the names themselves.
  await prisma.auditLog.create({ data: { userId: auth.user.id, action: "advisor.settings", entityType: "AiSetting", entityId: "advisor", details: { enabled: typeof body.enabled === "boolean" ? body.enabled : undefined, protectedNamesCount: Array.isArray(body.protectedNames) ? body.protectedNames.length : undefined } as never } }).catch(() => {});
  return NextResponse.json({ ok: true, enabled: await advisorEnabled(), protectedCount: (await protectedNames()).length });
}

export const GET = guard(GET_);
export const PUT = guard(PUT_);
