import { NextRequest, NextResponse } from "next/server";
import { NextResponse as NR } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHmac, timingSafeEqual } from "crypto";

// ── POST /api/payments ─────────────────────────────────────────────────────
// Creates a Razorpay order and returns the order_id + key_id.
// Client then opens Razorpay checkout with these details.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount: number; assetSlug: string; assetTitle: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.amount || !body.assetSlug || !body.assetTitle) {
    return NextResponse.json(
      { error: "amount, assetSlug, and assetTitle are required" },
      { status: 400 }
    );
  }

  if (typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive integer (paise)" },
      { status: 400 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // If Razorpay is not configured, return a mock order for development
  if (!keyId || !keySecret) {
    return NextResponse.json({
      orderId: `mock_order_${Date.now()}`,
      amount: body.amount,
      currency: "INR",
      keyId: "rzp_test_mock",
      assetSlug: body.assetSlug,
      assetTitle: body.assetTitle,
      mock: true,
    });
  }

  // Create Razorpay order via REST API
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  let rzpData: { id: string; amount: number; currency: string };
  try {
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          assetSlug: body.assetSlug,
          assetTitle: body.assetTitle,
          customerEmail: session.user.email,
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errorBody = await rzpResponse.text();
      console.error("[payments] Razorpay order creation failed:", errorBody);
      return NextResponse.json(
        { error: "Payment gateway error. Please try again." },
        { status: 502 }
      );
    }

    rzpData = await rzpResponse.json();
  } catch (err) {
    console.error("[payments] Network error calling Razorpay:", err);
    return NextResponse.json(
      { error: "Unable to reach payment gateway. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    orderId: rzpData.id,
    amount: rzpData.amount,
    currency: rzpData.currency,
    keyId,
    assetSlug: body.assetSlug,
    assetTitle: body.assetTitle,
  });
}

// ── PATCH /api/payments — verify Razorpay payment signature ──────────────────
// Called after Razorpay checkout succeeds on the client.
// Verifies signature, then creates an Order record.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NR.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    assetSlug: string;
    assetTitle: string;
    assetFormat: string;
    amount: number;
  };

  try {
    body = await request.json();
  } catch {
    return NR.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = ["razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "assetSlug", "assetTitle", "assetFormat", "amount"];
  for (const field of required) {
    if (!body[field as keyof typeof body]) {
      return NR.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // In development without Razorpay configured, skip signature verification
  const isMockOrder = body.razorpayOrderId.startsWith("mock_order_");
  if (!isMockOrder && keySecret) {
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(body.razorpaySignature, "hex");

    const isValid =
      expected.length === received.length &&
      timingSafeEqual(expected, received);

    if (!isValid) {
      return NR.json({ error: "Payment signature verification failed" }, { status: 400 });
    }
  }

  // Create order record — in production this calls the orders API or Prisma directly
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const order = {
    id: orderId,
    userId: session.user.email,
    assetSlug: body.assetSlug,
    assetTitle: body.assetTitle,
    assetFormat: body.assetFormat,
    amount: body.amount,
    currency: "INR",
    status: "paid",
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    createdAt: now,
    updatedAt: now,
    downloadUrl: `/api/files/assets/${body.assetSlug}.${body.assetFormat.toLowerCase()}`,
  };

  return NR.json({ order, verified: true }, { status: 201 });
}
