import { describe, expect, it } from 'vitest';
import { ago, describeAudit, inr, monthBuckets, pctChange, toCsv } from '@/lib/admin/stats';
import { checkUserChange } from '@/lib/admin/userRules';

const NOW = new Date('2026-11-10T10:00:00Z');

describe('admin numbers', () => {
  it('formats rupees the Indian way', () => {
    expect(inr(2485000)).toBe('₹24,85,000');
    expect(inr(0)).toBe('₹0');
  });
  it('buckets by month, oldest first, with empty months at 0', () => {
    const b = monthBuckets([
      { at: new Date('2026-11-02T00:00:00Z'), amount: 1000 }, { at: new Date('2026-11-09T00:00:00Z'), amount: 500 },
      { at: new Date('2026-09-15T00:00:00Z'), amount: 700 }, { at: new Date('2025-01-01T00:00:00Z'), amount: 99999 },
    ], NOW, 3);
    expect(b.map((x) => [x.label, x.value])).toEqual([['Sep', 700], ['Oct', 0], ['Nov', 1500]]);
  });
  it('gives a percentage only when there is an earlier figure', () => {
    expect(pctChange(112, 100)).toBe('+12.0%');
    expect(pctChange(90, 100)).toBe('-10.0%');
    expect(pctChange(50, 0)).toBeNull();
  });
  it('says how long ago in plain words', () => {
    expect(ago(new Date('2026-11-10T09:48:00Z'), NOW)).toBe('12 min ago');
    expect(ago(new Date('2026-11-09T09:00:00Z'), NOW)).toBe('yesterday');
    expect(ago(new Date('2026-11-10T09:59:50Z'), NOW)).toBe('just now');
  });
  it('turns an audit row into readable words', () => {
    expect(describeAudit('user_role_changed', 'User', 'u1').action).toBe('User role changed');
    expect(describeAudit('some_new_thing', 'X', 'y').action).toBe('Some new thing');
  });
  it('writes safe CSV', () => {
    expect(toCsv([['a,b', 'say "hi"', 3]])).toBe('"a,b","say ""hi""","3"');
  });
});

describe('who may change which user', () => {
  const sa = { id: 'sa1', role: 'SUPER_ADMIN' };
  const admin = { id: 'ad1', role: 'ADMIN' };
  it('only a Super admin changes roles', () => {
    expect(checkUserChange(admin, { id: 'c1', role: 'CLIENT' }, { kind: 'role', role: 'ADMIN' }, 2)).toMatchObject({ ok: false, status: 403 });
    expect(checkUserChange(sa, { id: 'c1', role: 'CLIENT' }, { kind: 'role', role: 'ADMIN' }, 2)).toEqual({ ok: true });
  });
  it('nobody changes themselves', () => {
    expect(checkUserChange(sa, { id: 'sa1', role: 'SUPER_ADMIN' }, { kind: 'role', role: 'ADMIN' }, 2)).toMatchObject({ ok: false });
    expect(checkUserChange(sa, { id: 'sa1', role: 'SUPER_ADMIN' }, { kind: 'account', action: 'block' }, 2)).toMatchObject({ ok: false });
  });
  it('protects the last Super admin', () => {
    expect(checkUserChange(sa, { id: 'sa2', role: 'SUPER_ADMIN' }, { kind: 'role', role: 'ADMIN' }, 1)).toMatchObject({ ok: false, status: 409 });
    expect(checkUserChange(sa, { id: 'sa2', role: 'SUPER_ADMIN' }, { kind: 'account', action: 'block' }, 1)).toMatchObject({ ok: false, status: 409 });
    expect(checkUserChange(sa, { id: 'sa2', role: 'SUPER_ADMIN' }, { kind: 'role', role: 'ADMIN' }, 2)).toEqual({ ok: true });
  });
  it('does not set roles that need a profile or do not exist', () => {
    expect(checkUserChange(sa, { id: 'c1', role: 'CLIENT' }, { kind: 'role', role: 'SPECIALIST' }, 2)).toMatchObject({ ok: false, status: 400 });
    expect(checkUserChange(sa, { id: 'c1', role: 'CLIENT' }, { kind: 'role', role: 'ROOT' }, 2)).toMatchObject({ ok: false, status: 400 });
    expect(checkUserChange(sa, { id: 's1', role: 'SPECIALIST' }, { kind: 'role', role: 'CLIENT' }, 2)).toMatchObject({ ok: false, status: 409 });
  });
  it('lets an Admin approve or block a client but not a Super admin', () => {
    expect(checkUserChange(admin, { id: 'c1', role: 'CLIENT' }, { kind: 'account', action: 'approve' }, 2)).toEqual({ ok: true });
    expect(checkUserChange(admin, { id: 'sa1', role: 'SUPER_ADMIN' }, { kind: 'account', action: 'block' }, 2)).toMatchObject({ ok: false, status: 403 });
  });
});
