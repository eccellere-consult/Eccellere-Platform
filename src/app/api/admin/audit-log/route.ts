import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { loadAuditLog } from "@/lib/admin/auditLog";

export const dynamic = "force-dynamic";

/** GET ?q=&entityType=&action=&page= : the real audit trail (who did what, when), newest first, 50 per page. */
export async function GET(req: NextRequest) {
  const auth = await requirePermission("admin:audit:read");
  if (auth.error) return auth.error;
  const p = req.nextUrl.searchParams;
  try {
    return NextResponse.json(await loadAuditLog({ q: p.get("q") ?? "", entityType: p.get("entityType") ?? "", action: p.get("action") ?? "", page: Number(p.get("page") ?? 1) }));
  } catch (e) {
    console.error("[admin/audit-log]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The audit log could not be read from the database. Please try again." }, { status: 503 });
  }
}
