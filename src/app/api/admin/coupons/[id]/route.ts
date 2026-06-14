import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN", "MARKETPLACE_ADMIN"].includes(role);
}

// PATCH /api/admin/coupons/[id] — update coupon
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    code,
    description,
    discountType,
    discountValue,
    maxUses,
    minOrderAmount,
    applicableCategories,
    applicableSectors,
    validFrom,
    validUntil,
    isActive,
  } = body as Record<string, unknown>;

  // If code is changing, check uniqueness
  if (code && String(code).toUpperCase() !== existing.code) {
    const conflict = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
    if (conflict) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(code !== undefined && { code: String(code).toUpperCase().trim() }),
      ...(description !== undefined && { description: description ? String(description) : null }),
      ...(discountType !== undefined && { discountType: String(discountType) }),
      ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
      ...(maxUses !== undefined && { maxUses: maxUses ? Number(maxUses) : null }),
      ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null }),
      ...(applicableCategories !== undefined && { applicableCategories: applicableCategories as string[] }),
      ...(applicableSectors !== undefined && { applicableSectors: applicableSectors as string[] }),
      ...(validFrom !== undefined && { validFrom: new Date(String(validFrom)) }),
      ...(validUntil !== undefined && { validUntil: new Date(String(validUntil)) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });

  return NextResponse.json({ coupon });
}

// DELETE /api/admin/coupons/[id] — delete coupon
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent deletion of coupons that have been used
  if (existing.usedCount > 0) {
    // Deactivate instead of delete to preserve order history
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: "Coupon deactivated (has redemptions — cannot delete)" });
  }

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
