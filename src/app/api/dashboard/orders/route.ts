import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/orders — returns the logged-in user's order history from DB
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    const dbOrders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        currency: true,
        paymentGateway: true,
        createdAt: true,
        invoiceUrl: true,
        items: {
          select: {
            asset: {
              select: {
                id: true,
                title: true,
                slug: true,
                serviceDomain: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const orders = dbOrders.map((o) => {
      const firstItem = o.items[0];
      return {
        id: o.orderNumber,
        dbId: o.id,
        asset: firstItem?.asset?.title ?? "Unknown Asset",
        assetSlug: firstItem?.asset?.slug ?? "",
        assetId: firstItem?.asset?.id ?? "",
        category: firstItem?.asset?.serviceDomain ?? firstItem?.asset?.category ?? "General",
        date: new Date(o.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        amount: `₹${o.totalAmount.toLocaleString("en-IN")}`,
        payment: o.paymentGateway ?? "Online",
        status: o.status === "PAID" ? "completed"
          : o.status === "PENDING" ? "processing"
          : o.status === "REFUNDED" || o.status === "PARTIALLY_REFUNDED" ? "refunded"
          : "processing",
        invoice: !!o.invoiceUrl,
        invoiceUrl: o.invoiceUrl ?? null,
      };
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[dashboard/orders] DB error:", err);
    return NextResponse.json({ orders: [], dbError: String(err) });
  }
}
