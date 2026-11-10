import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarisePayments, splitAssignments, summariseAnalytics, type PaymentsSummary, type AnalyticsSummary, type AssignmentRow } from "./summary";

/** The signed-in specialist's profile id, or null (not signed in, or not a specialist). */
export async function specialistProfileId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email }, select: { specialistProfile: { select: { id: true } } } });
  return u?.specialistProfile?.id ?? null;
}

export async function loadPayments(profileId: string, now = new Date()): Promise<PaymentsSummary> {
  const rows = await prisma.payout.findMany({
    where: { specialistProfileId: profileId },
    select: { id: true, grossAmount: true, platformFee: true, tdsAmount: true, netAmount: true, description: true, sourceType: true, status: true, scheduledDate: true, processedAt: true },
    orderBy: { scheduledDate: "desc" },
    take: 500,
  });
  return summarisePayments(rows, now);
}

export async function loadAssignments(profileId: string) {
  const rows = await prisma.assignment.findMany({
    where: { specialistProfileId: profileId },
    select: { id: true, title: true, status: true, dueDate: true, agreedFee: true, client: { select: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const mapped: AssignmentRow[] = rows.map((r) => ({ id: r.id, title: r.title, status: r.status, dueDate: r.dueDate, agreedFee: r.agreedFee, clientName: r.client?.user?.name ?? "Client" }));
  return splitAssignments(mapped);
}

export async function loadAnalytics(profileId: string, now = new Date()): Promise<AnalyticsSummary> {
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const [assets, items] = await Promise.all([
    prisma.asset.findMany({
      where: { authorId: profileId },
      select: { id: true, title: true, status: true, totalViews: true, totalPurchases: true, averageRating: true, totalRevenue: true },
    }),
    prisma.orderItem.findMany({
      where: { asset: { authorId: profileId }, order: { status: "PAID", createdAt: { gte: since } } },
      select: { totalPrice: true, order: { select: { createdAt: true } } },
    }),
  ]);
  return summariseAnalytics(assets, items.map((i) => ({ at: i.order.createdAt, amount: i.totalPrice })), now);
}
