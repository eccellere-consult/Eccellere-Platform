import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasPermission, type UserRole } from "@/lib/rbac";

/**
 * Who counts as a PAID user, for working with their own data in the tools: filling in a worksheet, AI help, building a custom toolkit.
 *
 *  - The Eccellere team (any login that may open the admin area) always counts, so the team can test and support.
 *  - A client counts when they have at least one PAID order, or a subscription that is ACTIVE and not yet past its end date.
 *  - Everyone else (signed in but never paid) can still see the worked example and download the blank template; the sample is never saved.
 *
 * One rule, used by every route that saves or generates something for the person. The pure part is tested; the database part only
 * gathers the two facts it needs.
 */
export interface PaidFacts { role: string; paidOrders: number; activeSubscriptions: number }

export function isPaid(f: PaidFacts): boolean {
  if (hasPermission(f.role as UserRole, "admin:access")) return true;
  return f.paidOrders > 0 || f.activeSubscriptions > 0;
}

export const PAID_MESSAGE =
  "Filling in your own data, AI help and saving your work need a paid plan. The worked example and the blank template stay free. See the Pricing page to unlock.";

export async function hasPaidAccess(userId: string, role: string, now: Date = new Date()): Promise<boolean> {
  if (hasPermission(role as UserRole, "admin:access")) return true;
  const [paidOrders, activeSubscriptions] = await Promise.all([
    prisma.order.count({ where: { userId, status: "PAID" } }),
    prisma.subscription.count({ where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: now } } }),
  ]);
  return isPaid({ role, paidOrders, activeSubscriptions });
}

/** null when the person may continue; otherwise the answer to send (402, with a code the page can recognise). */
export async function paidGate(userId: string, role?: string): Promise<NextResponse | null> {
  try {
    const r = role ?? (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role ?? "CLIENT";
    if (await hasPaidAccess(userId, r)) return null;
  } catch (e) {
    // If the check itself fails (database down) say so, rather than letting unpaid use through or showing a false "pay" message.
    console.error("[paid] access check failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We could not check your plan just now. Please try again in a minute.", code: "PAID_CHECK_FAILED" }, { status: 503 });
  }
  return NextResponse.json({ error: PAID_MESSAGE, code: "PAID_REQUIRED" }, { status: 402 });
}
