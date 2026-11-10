// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderCount = vi.fn();
const subCount = vi.fn();
const userFind = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: { order: { count: (a: unknown) => orderCount(a) }, subscription: { count: (a: unknown) => subCount(a) }, user: { findUnique: (a: unknown) => userFind(a) } } }));

import { isPaid, hasPaidAccess, paidGate, PAID_MESSAGE } from '@/lib/paid';

beforeEach(() => { orderCount.mockReset(); subCount.mockReset(); userFind.mockReset(); });

describe('who counts as a paid user', () => {
  it('the Eccellere team always does', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN']) expect(isPaid({ role, paidOrders: 0, activeSubscriptions: 0 })).toBe(true);
  });
  it('a client with no paid order and no active subscription does not', () => {
    expect(isPaid({ role: 'CLIENT', paidOrders: 0, activeSubscriptions: 0 })).toBe(false);
    expect(isPaid({ role: 'SPECIALIST', paidOrders: 0, activeSubscriptions: 0 })).toBe(false);
  });
  it('a client with a paid order, or an active subscription, does', () => {
    expect(isPaid({ role: 'CLIENT', paidOrders: 1, activeSubscriptions: 0 })).toBe(true);
    expect(isPaid({ role: 'CLIENT', paidOrders: 0, activeSubscriptions: 1 })).toBe(true);
  });
});

describe('the database check', () => {
  it('asks only for PAID orders and for ACTIVE subscriptions that have not ended', async () => {
    orderCount.mockResolvedValue(0); subCount.mockResolvedValue(0);
    const now = new Date('2026-11-10T00:00:00Z');
    expect(await hasPaidAccess('u1', 'CLIENT', now)).toBe(false);
    expect(orderCount).toHaveBeenCalledWith({ where: { userId: 'u1', status: 'PAID' } });
    expect(subCount).toHaveBeenCalledWith({ where: { userId: 'u1', status: 'ACTIVE', currentPeriodEnd: { gt: now } } });
  });
  it('does not touch the database for the team', async () => {
    expect(await hasPaidAccess('a1', 'ADMIN')).toBe(true);
    expect(orderCount).not.toHaveBeenCalled();
  });
});

describe('the gate', () => {
  it('lets a paid client through (null)', async () => {
    orderCount.mockResolvedValue(2); subCount.mockResolvedValue(0);
    expect(await paidGate('u1', 'CLIENT')).toBeNull();
  });
  it('answers 402 PAID_REQUIRED with a plain message for an unpaid client', async () => {
    orderCount.mockResolvedValue(0); subCount.mockResolvedValue(0);
    const res = (await paidGate('u1', 'CLIENT'))!;
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: PAID_MESSAGE, code: 'PAID_REQUIRED' });
  });
  it('looks up the role when only the user id is known', async () => {
    userFind.mockResolvedValue({ role: 'ADMIN' });
    expect(await paidGate('a1')).toBeNull();
    userFind.mockResolvedValue({ role: 'CLIENT' });
    orderCount.mockResolvedValue(0); subCount.mockResolvedValue(0);
    expect((await paidGate('u2'))!.status).toBe(402);
  });
  it('says "try again" (503), not "pay", when the check itself fails', async () => {
    orderCount.mockRejectedValue(new Error('db down'));
    subCount.mockResolvedValue(0);
    const res = (await paidGate('u1', 'CLIENT'))!;
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('PAID_CHECK_FAILED');
  });
});
