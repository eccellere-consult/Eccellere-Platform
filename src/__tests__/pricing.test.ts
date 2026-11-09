import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, applyClasses, cleanClasses, parseRules, planPrices, priceFor } from '@/lib/marketplace/pricing';

describe('marketplace pricing by classification', () => {
  it('adds the scope price and the recency price', () => {
    expect(priceFor(DEFAULT_RULES, { scope: 'function', recency: 'traditional' })).toBe(299 + 599);
    expect(priceFor(DEFAULT_RULES, { scope: 'enterprise', recency: 'ondemand' })).toBe(599 + 999);
  });
  it('leaves unclassified or half-classified assets alone', () => {
    const rows = planPrices(
      [{ id: 'a', title: 'A', price: 100 }, { id: 'b', title: 'B', price: 100 }, { id: 'c', title: 'C', price: 898 }],
      { b: { scope: 'function' }, c: { scope: 'function', recency: 'traditional' } },
      DEFAULT_RULES,
    );
    expect(rows.map((r) => r.reason)).toEqual(['unclassified', 'unclassified', 'same']);
    expect(rows.every((r) => !r.changed)).toBe(true);
    expect(rows[0].next).toBeNull();
  });
  it('shows old and new for a change', () => {
    const [r] = planPrices([{ id: 'a', title: 'A', price: 100 }], { a: { scope: 'enterprise', recency: 'ondemand' } }, DEFAULT_RULES);
    expect(r).toMatchObject({ old: 100, next: 1598, changed: true, reason: 'change' });
  });
  it('sets one dimension for many assets without disturbing the other', () => {
    const out = applyClasses({ a: { recency: 'ondemand' } }, ['a', 'b'], { scope: 'function' });
    expect(out).toEqual({ a: { recency: 'ondemand', scope: 'function' }, b: { scope: 'function' } });
  });
  it('ignores values it does not know', () => {
    expect(applyClasses({}, ['a'], { scope: 'galaxy' as never })).toEqual({});
    expect(cleanClasses({ a: { scope: 'nope', recency: 'ondemand' }, b: 5 })).toEqual({ a: { recency: 'ondemand' } });
  });
  it('accepts only whole rupee prices', () => {
    expect(parseRules(DEFAULT_RULES).ok).toBe(true);
    for (const bad of [{ scope: { function: -1, enterprise: 1 }, recency: { traditional: 1, ondemand: 1 } }, { scope: { function: 1.5, enterprise: 1 }, recency: { traditional: 1, ondemand: 1 } }, { scope: { function: 1, enterprise: 1 } }, null]) {
      expect(parseRules(bad).ok).toBe(false);
    }
  });
});
