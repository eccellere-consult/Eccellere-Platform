import { NextResponse } from "next/server";
import { hasAnyPermission, requirePermission, type UserRole } from "@/lib/rbac";
import { loadDashboard } from "@/lib/admin/loaders";

export const dynamic = "force-dynamic";

/** GET: the real numbers for the admin Dashboard. Money figures are included only for logins that may see orders or finance. */
export async function GET() {
  const auth = await requirePermission("admin:access");
  if (auth.error) return auth.error;
  try {
    const withMoney = hasAnyPermission(auth.user.role as UserRole, ["admin:finance:read", "admin:orders:read"]);
    return NextResponse.json(await loadDashboard(new Date(), withMoney));
  } catch (e) {
    console.error("[admin/dashboard]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The dashboard numbers could not be read from the database. Please try again." }, { status: 503 });
  }
}
