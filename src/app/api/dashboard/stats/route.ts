import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/dashboard/stats — client dashboard KPIs, recent orders, recent assets, assignments
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          clientProfile: {
            select: {
              id: true,
              assignments: {
                where: {
                  status: { in: ["IN_PROGRESS", "ACCEPTED", "MATCHED"] },
                },
                select: {
                  id: true,
                  title: true,
                  dueDate: true,
                  status: true,
                  specialist: {
                    select: { user: { select: { name: true } } },
                  },
                },
                orderBy: { dueDate: "asc" },
                take: 5,
              },
            },
          },
          orders: {
            where: { status: "PAID" },
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              createdAt: true,
              items: {
                select: {
                  totalPrice: true,
                  asset: {
                    select: {
                      id: true,
                      slug: true,
                      title: true,
                      category: true,
                      components: true,
                      averageRating: true,
                      author: {
                        select: { user: { select: { name: true } } },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          assessments: {
            select: { totalScore: true, maxScore: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 5000)
      ),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // KPIs
    const totalSpent = user.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const allAssetIds = new Set(
      user.orders.flatMap((o) => o.items.map((i) => i.asset.id))
    );
    const assetsPurchased = allAssetIds.size;

    const activeAssignments = user.clientProfile?.assignments.length ?? 0;

    const latestAssessment = user.assessments[0] ?? null;
    const aiReadinessScore = latestAssessment
      ? Math.round((latestAssessment.totalScore / latestAssessment.maxScore) * 100)
      : null;

    // Recent orders (last 4)
    const recentOrders = user.orders.slice(0, 4).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      amount: o.totalAmount,
      createdAt: o.createdAt,
      assets: o.items.map((i) => i.asset.title),
    }));

    // Recently purchased assets (last 3 unique)
    const seenIds = new Set<string>();
    const recentAssets: {
      id: string;
      slug: string;
      title: string;
      category: string;
      components: unknown;
      averageRating: number | null;
      specialistName: string;
      purchasedAt: Date;
    }[] = [];
    for (const order of user.orders) {
      for (const item of order.items) {
        if (!seenIds.has(item.asset.id)) {
          seenIds.add(item.asset.id);
          recentAssets.push({
            id: item.asset.id,
            slug: item.asset.slug,
            title: item.asset.title,
            category: item.asset.category,
            components: item.asset.components,
            averageRating: item.asset.averageRating,
            specialistName: item.asset.author.user.name,
            purchasedAt: order.createdAt,
          });
        }
        if (recentAssets.length >= 3) break;
      }
      if (recentAssets.length >= 3) break;
    }

    // Upcoming assignments
    const upcomingAssignments = (user.clientProfile?.assignments ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      specialistName: a.specialist?.user.name ?? "Unassigned",
      dueDate: a.dueDate,
      status: a.status,
    }));

    return NextResponse.json({
      name: user.name,
      kpis: {
        totalSpent,
        assetsPurchased,
        activeAssignments,
        aiReadinessScore,
      },
      recentOrders,
      recentAssets,
      upcomingAssignments,
    });
  } catch (err) {
    console.error("[dashboard/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
