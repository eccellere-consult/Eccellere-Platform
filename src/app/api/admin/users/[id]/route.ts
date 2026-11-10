import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { forgetAccess } from "@/lib/access";
import { ACCOUNT_ACTIONS, checkUserChange, type Change } from "@/lib/admin/userRules";

export const dynamic = "force-dynamic";

/**
 * PATCH { role } or { action: "approve" | "block" | "unblock" }. The rules (only a Super admin changes roles, nobody changes
 * themselves, the last Super admin is protected) live in lib/admin/userRules.ts. Every change is written to the audit log.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("admin:users:write");
  if (auth.error) return auth.error;
  let body: { role?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const change: Change | null = typeof body.role === "string" ? { kind: "role", role: body.role }
    : typeof body.action === "string" ? { kind: "account", action: body.action as keyof typeof ACCOUNT_ACTIONS } : null;
  if (!change) return NextResponse.json({ error: "Say what to change: a role, or an action." }, { status: 400 });

  const { id } = await ctx.params;
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, name: true, accountStatus: true } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const supers = await prisma.user.count({ where: { role: "SUPER_ADMIN", accountStatus: "APPROVED", isActive: true } });
    const verdict = checkUserChange({ id: auth.user.id, role: auth.user.role }, target, change, supers);
    if (!verdict.ok) return NextResponse.json({ error: verdict.error }, { status: verdict.status });

    if (change.kind === "role") {
      await prisma.user.update({ where: { id }, data: { role: change.role as never } });
      await prisma.auditLog.create({ data: { userId: auth.user.id, action: "user_role_changed", entityType: "User", entityId: id, details: { from: target.role, to: change.role } as never } }).catch(() => {});
    } else {
      const next = ACCOUNT_ACTIONS[change.action];
      await prisma.user.update({ where: { id }, data: { accountStatus: next, ...(next === "APPROVED" ? { approvedAt: new Date(), approvedBy: auth.user.id } : {}) } });
      await prisma.auditLog.create({ data: { userId: auth.user.id, action: "user_status_changed", entityType: "User", entityId: id, details: { from: target.accountStatus, to: next } as never } }).catch(() => {});
    }
    forgetAccess(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users/patch]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The change could not be saved. Please try again." }, { status: 503 });
  }
}
