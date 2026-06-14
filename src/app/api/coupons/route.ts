import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/coupons
 * Returns publicly visible active coupons (code, description, discountType,
 * discountValue, minOrderAmount, validUntil).
 * Does NOT expose internal IDs or usage counts.
 */
export async function GET() {
  const now = new Date();
  const rows = await prisma.coupon.findMany({
    where: {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
    select: {
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minOrderAmount: true,
      validUntil: true,
      maxUses: true,
      usedCount: true,
    },
    orderBy: { discountValue: "desc" },
  });

  // Filter out exhausted coupons in JS (can't compare two columns in Prisma WHERE)
  const coupons = rows
    .filter((c) => c.maxUses === null || c.usedCount < c.maxUses)
    .map(({ maxUses: _m, usedCount: _u, ...rest }) => rest); // strip internal counts

  return NextResponse.json({ coupons });
}
