import { describe, expect, it } from 'vitest';
import { summarisePayments, splitAssignments, summariseAnalytics, type PayoutRow } from '@/lib/specialist/summary';

const now = new Date('2026-11-10T00:00:00Z');
const p = (o: Partial<PayoutRow>): PayoutRow => ({ id: 'x', grossAmount: 100, platformFee: 20, tdsAmount: 10, netAmount: 70, description: 'd', sourceType: 'ASSET_SALE', status: 'PROCESSED', scheduledDate: new Date('2026-11-01T00:00:00Z'), processedAt: new Date('2026-11-02T00:00:00Z'), ...o });

describe('specialist earnings', () => {
  const rows = [
    p({ id: '1', netAmount: 700, grossAmount: 1000 }),
    p({ id: '2', netAmount: 350, grossAmount: 500, processedAt: new Date('2026-10-05T00:00:00Z'), sourceType: 'ASSIGNMENT' }),
    p({ id: '3', netAmount: 210, grossAmount: 300, status: 'SCHEDULED', processedAt: null, scheduledDate: new Date('2026-11-30T00:00:00Z') }),
    p({ id: '4', netAmount: 999, status: 'ON_HOLD', processedAt: null, scheduledDate: new Date('2026-11-20T00:00:00Z') }),
    p({ id: '5', netAmount: 888, status: 'FAILED', processedAt: null }),
  ];
  const s = summarisePayments(rows, now);
  it('adds only paid payouts into "paid so far" and this month', () => {
    expect(s.paidTotal).toBe(1050);
    expect(s.thisMonthPaid).toBe(700);
  });
  it('counts scheduled, processing and on-hold as on its way, and never a failed one', () => { expect(s.pendingTotal).toBe(210 + 999); });
  it('the next payout is the earliest scheduled one and ignores one on hold', () => { expect(s.nextPayout).toEqual({ amount: 210, date: new Date('2026-11-30T00:00:00Z') }); });
  it('buckets paid money into the last six months', () => {
    expect(s.monthly).toHaveLength(6);
    expect(s.monthly.at(-1)).toMatchObject({ label: 'Nov', value: 700 });
    expect(s.monthly.at(-2)).toMatchObject({ label: 'Oct', value: 350 });
  });
  it('shares gross by source and the shares add to about 100', () => {
    const g = s.breakdown.find((b) => b.source === 'ASSET_SALE')!;
    expect(g.gross).toBe(1000 + 300 + 100); // payouts 1, 3 and 4
    expect(s.breakdown.reduce((a, b) => a + b.sharePct, 0)).toBeGreaterThan(99.8);
  });
  it('an empty list gives zeros and no next payout, not made-up figures', () => {
    const e = summarisePayments([], now);
    expect([e.paidTotal, e.pendingTotal, e.thisMonthPaid]).toEqual([0, 0, 0]);
    expect(e.nextPayout).toBeNull();
    expect(e.breakdown).toEqual([]);
  });
});

describe('specialist assignments', () => {
  const r = (id: string, status: string, due: string | null, fee: number | null) => ({ id, title: id, status, dueDate: due ? new Date(due) : null, agreedFee: fee, clientName: 'c' });
  it('splits active from completed, soonest due first, and totals the active fees', () => {
    const out = splitAssignments([r('a', 'IN_PROGRESS', '2026-12-01', 1000), r('b', 'ACCEPTED', '2026-11-15', 500), r('c', 'COMPLETED', '2026-09-01', 900), r('d', 'CANCELLED', null, 300), r('e', 'REQUESTED', null, 200), r('f', 'DELIVERED', null, null)]);
    expect(out.active.map((x) => x.id)).toEqual(['b', 'a', 'f']);
    expect(out.completed.map((x) => x.id)).toEqual(['c']);
    expect(out.activeValue).toBe(1500);
  });
});

describe('specialist analytics', () => {
  const a = (id: string, v: number, pu: number, rt: number | null, rev: number) => ({ id, title: id, status: 'PUBLISHED', totalViews: v, totalPurchases: pu, averageRating: rt, totalRevenue: rev });
  it('totals, averages only the ratings that exist, and converts purchases per 100 views', () => {
    const s = summariseAnalytics([a('x', 200, 10, 4.5, 5000), a('y', 100, 5, null, 2000), a('z', 100, 0, 0, 0)], [{ at: new Date('2026-11-03T00:00:00Z'), amount: 1500 }], now);
    expect(s.views).toBe(400);
    expect(s.purchases).toBe(15);
    expect(s.avgRating).toBe(4.5);
    expect(s.conversionPct).toBe(3.8); // 15 / 400 = 3.75 -> 3.8
    expect(s.revenue).toBe(7000);
    expect(s.monthlySales.at(-1)!.value).toBe(1500);
    expect(s.assets[0].id).toBe('x');
  });
  it('shows no rating and no conversion rather than 0 when there is nothing to base them on', () => {
    const s = summariseAnalytics([], [], now);
    expect(s.avgRating).toBeNull();
    expect(s.conversionPct).toBeNull();
  });
});
