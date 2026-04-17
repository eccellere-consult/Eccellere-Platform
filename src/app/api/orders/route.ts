import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type Order = {
  id: string;
  userId: string;
  assetSlug: string;
  assetTitle: string;
  assetFormat: string;
  amount: number; // in paise
  currency: "INR";
  status: "pending" | "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
  licenceType: "personal" | "business" | "enterprise";
};

// In-memory store — replace with Prisma in production
const orders: Order[] = [
  {
    id: "ORD-2041",
    userId: "demo-user",
    assetSlug: "msme-growth-strategy-playbook",
    assetTitle: "MSME Growth Strategy Playbook",
    assetFormat: "PDF",
    amount: 249900,
    currency: "INR",
    status: "paid",
    razorpayPaymentId: "pay_demo_001",
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-04-10T09:02:00.000Z",
    downloadUrl: "/api/files/assets/msme-growth-strategy-playbook.pdf",
    licenceType: "business",
  },
  {
    id: "ORD-2038",
    userId: "demo-user",
    assetSlug: "ai-readiness-assessment-toolkit",
    assetTitle: "AI Readiness Assessment Toolkit",
    assetFormat: "Excel",
    amount: 199900,
    currency: "INR",
    status: "paid",
    razorpayPaymentId: "pay_demo_002",
    createdAt: "2026-04-06T14:00:00.000Z",
    updatedAt: "2026-04-06T14:01:30.000Z",
    downloadUrl: "/api/files/assets/ai-readiness-assessment-toolkit.xlsx",
    licenceType: "business",
  },
];

// ── GET /api/orders — list orders for authenticated user ─────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  // In production: filter by session.user.id via Prisma
  let result = orders.filter((o) => o.userId === "demo-user");
  if (status) {
    result = result.filter((o) => o.status === status);
  }

  const total = result.length;
  const paginated = result.slice(offset, offset + limit);

  return NextResponse.json({ orders: paginated, total, limit, offset });
}

// ── POST /api/orders — create a new order record (after payment verification) ─
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    assetSlug: string;
    assetTitle: string;
    assetFormat: string;
    amount: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    licenceType?: "personal" | "business" | "enterprise";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const required = ["assetSlug", "assetTitle", "assetFormat", "amount", "razorpayOrderId", "razorpayPaymentId"];
  for (const field of required) {
    if (!body[field as keyof typeof body]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  if (typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive integer (paise)" }, { status: 400 });
  }

  const id = `ORD-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id,
    userId: session.user.email,
    assetSlug: body.assetSlug,
    assetTitle: body.assetTitle,
    assetFormat: body.assetFormat,
    amount: body.amount,
    currency: "INR",
    status: "paid",
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    licenceType: body.licenceType ?? "personal",
    createdAt: now,
    updatedAt: now,
    downloadUrl: `/api/files/assets/${body.assetSlug}.${body.assetFormat.toLowerCase()}`,
  };

  orders.push(newOrder);

  return NextResponse.json({ order: newOrder }, { status: 201 });
}
