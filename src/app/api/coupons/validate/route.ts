import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/coupons/validate
 * Body: { code: string; orderAmount: number; category?: string; sector?: string }
 * Returns: { valid: true; discountAmount: number; discountType: string; discountValue: number; couponId: string }
 *        | { valid: false; reason: string }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "Invalid request" }, { status: 400 });
  }

  const { code, orderAmount, category, sector } = body as {
    code?: string;
    orderAmount?: number;
    category?: string;
    sector?: string;
  };

  if (!code || typeof orderAmount !== "number") {
    return NextResponse.json({ valid: false, reason: "code and orderAmount are required" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!coupon) return NextResponse.json({ valid: false, reason: "Invalid coupon code" });
  if (!coupon.isActive) return NextResponse.json({ valid: false, reason: "This coupon is no longer active" });

  const now = new Date();
  if (now < coupon.validFrom) return NextResponse.json({ valid: false, reason: "Coupon is not valid yet" });
  if (now > coupon.validUntil) return NextResponse.json({ valid: false, reason: "Coupon has expired" });

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, reason: "Coupon usage limit reached" });
  }

  if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
    return NextResponse.json({
      valid: false,
      reason: `Minimum order of ₹${coupon.minOrderAmount.toLocaleString("en-IN")} required`,
    });
  }

  // Category/sector restriction check (empty array = applies to all)
  const cats = coupon.applicableCategories as string[];
  const secs = coupon.applicableSectors as string[];
  if (cats.length > 0 && category && !cats.includes(category)) {
    return NextResponse.json({ valid: false, reason: "Coupon not valid for this asset category" });
  }
  if (secs.length > 0 && sector && !secs.includes(sector)) {
    return NextResponse.json({ valid: false, reason: "Coupon not valid for this sector" });
  }

  // Calculate discount
  let discountAmount: number;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  });
}
