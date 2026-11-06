import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "CRM_ADMIN" ||
    role === "SPECIALIST_ADMIN"
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clients;
  try {
    clients = await Promise.race([
      prisma.user.findMany({
        where: { role: "CLIENT" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          accountStatus: true,
          createdAt: true,
          clientProfile: {
            select: {
              companyName: true,
              sector: true,
              revenueRange: true,
              city: true,
              state: true,
              onboardingComplete: true,
            },
          },
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              plan: {
                select: { name: true },
              },
            },
          },
          orders: {
            select: {
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 5000)
      ),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/clients] DB error:", message);
    return NextResponse.json(
      { error: "Service temporarily unavailable", detail: message },
      { status: 503 }
    );
  }

  // Compute total revenue from paid orders
  const mapped = clients.map((u) => {
    const totalRevenue = u.orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

    const sub = u.subscriptions[0];
    const profile = u.clientProfile;

    const status = !u.isActive
      ? "churned"
      : profile?.onboardingComplete
      ? "active"
      : "onboarding";

    return {
      id: u.id,
      name: profile?.companyName || u.name,
      email: u.email,
      sector: profile?.sector || "—",
      city: profile?.city || "",
      state: profile?.state || "",
      status,
      approval: u.accountStatus,
      plan: sub?.plan?.name || "—",
      revenue: totalRevenue > 0
        ? `₹${totalRevenue.toLocaleString("en-IN")}`
        : "₹0",
      joined: new Date(u.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
    };
  });

  return NextResponse.json({ clients: mapped });
}
