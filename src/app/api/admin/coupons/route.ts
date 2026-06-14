import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN", "MARKETPLACE_ADMIN"].includes(role);
}

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

// POST /api/admin/coupons — create a new coupon
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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

  if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
    return NextResponse.json({ error: "Missing required fields: code, discountType, discountValue, validFrom, validUntil" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).toUpperCase().trim(),
      description: description ? String(description) : null,
      discountType: String(discountType),
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      applicableCategories: (applicableCategories as string[]) ?? [],
      applicableSectors: (applicableSectors as string[]) ?? [],
      validFrom: new Date(String(validFrom)),
      validUntil: new Date(String(validUntil)),
      isActive: isActive !== false,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
