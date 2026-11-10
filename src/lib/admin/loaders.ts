/**
 * The real numbers behind the admin Dashboard and Finance screens, read from the database. Money is whole rupees. Every figure is a
 * count or a sum of stored rows; a figure that cannot be worked out (for example a percentage with no earlier month) is returned as null,
 * never invented. The helpers that shape the numbers live in ./stats and are tested on their own.
 */
import { prisma } from '@/lib/prisma';
import { ago, describeAudit, monthBuckets, pctChange, type MonthBucket } from './stats';

const startOfMonth = (d: Date, back = 0) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1));

export interface DashboardData {
  generatedAt: string;
  money: null | {
    totalRevenue: number;
    thisMonth: number;
    monthChange: string | null;
    months: MonthBucket[];
    topAssets: { title: string; sales: number; revenue: number }[];
  };
  counts: { activeClients: number; newClientsThisMonth: number; activeSpecialists: number; assetsToReview: number; specialistApplications: number; clientsAwaitingApproval: number };
  activity: { action: string; detail: string; time: string }[];
}

export async function loadDashboard(now: Date, withMoney: boolean): Promise<DashboardData> {
  const monthStart = startOfMonth(now);
  const tenAgo = startOfMonth(now, 9);

  const [activeClients, newClients, activeSpecialists, assetsToReview, applications, awaiting, logs] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT', isActive: true, accountStatus: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: monthStart } } }),
    prisma.specialistProfile.count({ where: { status: 'ACTIVE' } }),
    prisma.asset.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.specialistProfile.count({ where: { status: { in: ['APPLIED', 'UNDER_REVIEW'] } } }),
    prisma.user.count({ where: { role: 'CLIENT', accountStatus: 'PENDING' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { action: true, entityType: true, entityId: true, createdAt: true } }),
  ]);

  let money: DashboardData['money'] = null;
  if (withMoney) {
    const [total, orders, grouped] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: tenAgo } }, select: { totalAmount: true, createdAt: true }, take: 20000 }),
      prisma.orderItem.groupBy({ by: ['assetId'], where: { order: { status: 'PAID' } }, _sum: { totalPrice: true, quantity: true }, orderBy: { _sum: { totalPrice: 'desc' } }, take: 5 }),
    ]);
    const titles = grouped.length ? await prisma.asset.findMany({ where: { id: { in: grouped.map((g) => g.assetId) } }, select: { id: true, title: true } }) : [];
    const titleOf = new Map(titles.map((t) => [t.id, t.title]));
    const months = monthBuckets(orders.map((o) => ({ at: o.createdAt, amount: o.totalAmount })), now, 10);
    const thisMonth = months[months.length - 1]?.value ?? 0;
    const lastMonth = months[months.length - 2]?.value ?? 0;
    money = {
      totalRevenue: total._sum.totalAmount ?? 0,
      thisMonth,
      monthChange: pctChange(thisMonth, lastMonth),
      months,
      topAssets: grouped.map((g) => ({ title: titleOf.get(g.assetId) ?? 'Removed toolkit', sales: g._sum.quantity ?? 0, revenue: g._sum.totalPrice ?? 0 })),
    };
  }

  return {
    generatedAt: now.toISOString(),
    money,
    counts: { activeClients, newClientsThisMonth: newClients, activeSpecialists, assetsToReview, specialistApplications: applications, clientsAwaitingApproval: awaiting },
    activity: logs.map((l) => ({ ...describeAudit(l.action, l.entityType, l.entityId), time: ago(l.createdAt, now) })),
  };
}

export interface Txn { id: string; type: 'sale' | 'refund' | 'payout'; description: string; amount: number; at: string }
export interface FinanceData {
  generatedAt: string;
  totalRevenue: number;
  thisMonth: number;
  monthChange: string | null;
  months: MonthBucket[];
  pendingPayouts: { amount: number; specialists: number };
  refunds: { total: number; thisMonthCount: number };
  collected: { subtotal: number; gst: number; discounts: number; total: number; orders: number };
  transactions: Txn[];
}

export async function loadFinance(now: Date): Promise<FinanceData> {
  const monthStart = startOfMonth(now);
  const tenAgo = startOfMonth(now, 9);
  const [paid, orders, refunded, refundsThisMonth, pending, pendingWho, sales, refundRows, payoutRows] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true, subtotal: true, gstAmount: true, discountAmount: true }, _count: true }),
    prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: tenAgo } }, select: { totalAmount: true, createdAt: true }, take: 20000 }),
    prisma.order.aggregate({ where: { status: 'REFUNDED' }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { refundedAt: { gte: monthStart } } }),
    prisma.payout.aggregate({ where: { status: { in: ['SCHEDULED', 'PROCESSING', 'ON_HOLD'] } }, _sum: { netAmount: true } }),
    prisma.payout.groupBy({ by: ['specialistProfileId'], where: { status: { in: ['SCHEDULED', 'PROCESSING', 'ON_HOLD'] } } }),
    prisma.order.findMany({ where: { status: 'PAID' }, orderBy: { createdAt: 'desc' }, take: 20, select: { orderNumber: true, totalAmount: true, createdAt: true, items: { take: 1, select: { asset: { select: { title: true } } } } } }),
    prisma.order.findMany({ where: { refundedAt: { not: null } }, orderBy: { refundedAt: 'desc' }, take: 10, select: { orderNumber: true, totalAmount: true, refundedAt: true } }),
    prisma.payout.findMany({ where: { status: 'PROCESSED' }, orderBy: { processedAt: 'desc' }, take: 10, select: { id: true, netAmount: true, description: true, processedAt: true } }),
  ]);
  const months = monthBuckets(orders.map((o) => ({ at: o.createdAt, amount: o.totalAmount })), now, 10);
  const thisMonth = months[months.length - 1]?.value ?? 0;
  const txns: Txn[] = [
    ...sales.map((o): Txn => ({ id: o.orderNumber, type: 'sale', description: o.items[0]?.asset?.title ?? 'Order', amount: o.totalAmount, at: o.createdAt.toISOString() })),
    ...refundRows.filter((o) => o.refundedAt).map((o): Txn => ({ id: o.orderNumber, type: 'refund', description: `Refund of order ${o.orderNumber}`, amount: -o.totalAmount, at: (o.refundedAt as Date).toISOString() })),
    ...payoutRows.filter((p) => p.processedAt).map((p): Txn => ({ id: p.id.slice(-8), type: 'payout', description: p.description, amount: -p.netAmount, at: (p.processedAt as Date).toISOString() })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
  return {
    generatedAt: now.toISOString(),
    totalRevenue: paid._sum.totalAmount ?? 0,
    thisMonth,
    monthChange: pctChange(thisMonth, months[months.length - 2]?.value ?? 0),
    months,
    pendingPayouts: { amount: pending._sum.netAmount ?? 0, specialists: pendingWho.length },
    refunds: { total: refunded._sum.totalAmount ?? 0, thisMonthCount: refundsThisMonth },
    collected: { subtotal: paid._sum.subtotal ?? 0, gst: paid._sum.gstAmount ?? 0, discounts: paid._sum.discountAmount ?? 0, total: paid._sum.totalAmount ?? 0, orders: paid._count },
    transactions: txns,
  };
}
