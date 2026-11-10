import { monthBuckets, type MonthBucket } from '@/lib/admin/stats';

/**
 * Pure summaries for the specialist's Earnings, Assignments and Analytics screens. Nothing here reads a database or a clock;
 * the caller passes the rows and `now`, so every figure is tested with fixed data. Money is whole rupees.
 */
export interface PayoutRow { id: string; grossAmount: number; platformFee: number; tdsAmount: number; netAmount: number; description: string; sourceType: string; status: string; scheduledDate: Date; processedAt: Date | null }

export interface PaymentsSummary {
  paidTotal: number;
  pendingTotal: number;
  thisMonthPaid: number;
  nextPayout: { amount: number; date: Date } | null;
  monthly: MonthBucket[];
  /** Gross by where the money came from, largest first, with each share of the total gross. */
  breakdown: { source: string; gross: number; sharePct: number }[];
  history: PayoutRow[];
}

const PENDING = new Set(['SCHEDULED', 'PROCESSING', 'ON_HOLD']);

export function summarisePayments(payouts: PayoutRow[], now: Date): PaymentsSummary {
  const paid = payouts.filter((p) => p.status === 'PROCESSED');
  const pending = payouts.filter((p) => PENDING.has(p.status));
  const at = (p: PayoutRow) => p.processedAt ?? p.scheduledDate;
  const sameMonth = (d: Date) => d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  const upcoming = pending.filter((p) => p.status !== 'ON_HOLD').sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0];

  const gross = new Map<string, number>();
  for (const p of paid.concat(pending)) gross.set(p.sourceType, (gross.get(p.sourceType) ?? 0) + p.grossAmount);
  const grossTotal = [...gross.values()].reduce((a, b) => a + b, 0);

  return {
    paidTotal: paid.reduce((s, p) => s + p.netAmount, 0),
    pendingTotal: pending.reduce((s, p) => s + p.netAmount, 0),
    thisMonthPaid: paid.filter((p) => sameMonth(at(p))).reduce((s, p) => s + p.netAmount, 0),
    nextPayout: upcoming ? { amount: upcoming.netAmount, date: upcoming.scheduledDate } : null,
    monthly: monthBuckets(paid.map((p) => ({ at: at(p), amount: p.netAmount })), now, 6),
    breakdown: [...gross.entries()].sort((a, b) => b[1] - a[1]).map(([source, g]) => ({ source, gross: g, sharePct: grossTotal > 0 ? Math.round((g / grossTotal) * 1000) / 10 : 0 })),
    history: [...payouts].sort((a, b) => at(b).getTime() - at(a).getTime()),
  };
}

const ACTIVE = new Set(['MATCHED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'UNDER_REVIEW']);
export interface AssignmentRow { id: string; title: string; status: string; dueDate: Date | null; agreedFee: number | null; clientName: string }

export function splitAssignments(rows: AssignmentRow[]): { active: AssignmentRow[]; completed: AssignmentRow[]; activeValue: number } {
  const byDue = (a: AssignmentRow, b: AssignmentRow) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);
  const active = rows.filter((r) => ACTIVE.has(r.status)).sort(byDue);
  const completed = rows.filter((r) => r.status === 'COMPLETED').sort((a, b) => byDue(b, a));
  return { active, completed, activeValue: active.reduce((s, r) => s + (r.agreedFee ?? 0), 0) };
}

export interface AssetStat { id: string; title: string; status: string; totalViews: number; totalPurchases: number; averageRating: number | null; totalRevenue: number }

export interface AnalyticsSummary {
  views: number;
  purchases: number;
  /** Average of the ratings that exist; null when no asset has one yet (never shown as 0). */
  avgRating: number | null;
  /** Purchases per 100 views; null when there are no views. */
  conversionPct: number | null;
  revenue: number;
  monthlySales: MonthBucket[];
  assets: AssetStat[];
}

export function summariseAnalytics(assets: AssetStat[], sales: { at: Date; amount: number }[], now: Date): AnalyticsSummary {
  const views = assets.reduce((s, a) => s + a.totalViews, 0);
  const purchases = assets.reduce((s, a) => s + a.totalPurchases, 0);
  const rated = assets.filter((a) => a.averageRating !== null && a.averageRating > 0);
  return {
    views,
    purchases,
    avgRating: rated.length ? Math.round((rated.reduce((s, a) => s + (a.averageRating as number), 0) / rated.length) * 10) / 10 : null,
    conversionPct: views > 0 ? Math.round((purchases / views) * 1000) / 10 : null,
    revenue: assets.reduce((s, a) => s + a.totalRevenue, 0),
    monthlySales: monthBuckets(sales, now, 6),
    assets: [...assets].sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalViews - a.totalViews),
  };
}
