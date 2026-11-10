import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { loadFinance } from "@/lib/admin/loaders";

export const dynamic = "force-dynamic";

/** GET: the real revenue, refunds, payouts and recent transactions for Admin > Finance. */
export async function GET() {
  const auth = await requirePermission("admin:finance:read");
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(await loadFinance(new Date()));
  } catch (e) {
    console.error("[admin/finance]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The finance numbers could not be read from the database. Please try again." }, { status: 503 });
  }
}
