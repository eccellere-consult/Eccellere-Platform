import { describe, expect, it } from 'vitest';
import { costAccepted, planAiBatch } from '@/lib/marketplace/batchAi';
import type { EstimateResult } from '@/lib/marketplace/makeOnline';

const asset = (n: number) => ({ slug: `t${n}`, title: `Toolkit ${n}`, description: 'd' });

describe('planning a batch of AI builds', () => {
  it('prices only what will be built, skips what cannot be, and leaves the rest for later', async () => {
    const results: Record<string, EstimateResult> = {
      t1: { kind: 'estimate', chars: 30000 }, t2: { kind: 'exists', slug: 't2' }, t3: { kind: 'no_file' },
      t4: { kind: 'unreadable', reason: 'scanned PDF' }, t5: { kind: 'estimate', chars: 30000 }, t6: { kind: 'estimate', chars: 30000 },
    };
    const plan = await planAiBatch([1, 2, 3, 4, 5, 6].map(asset), async (a) => results[a.slug], 2);
    expect(plan.rows.map((r) => r.slug)).toEqual(['t1', 't5']);
    expect(plan.leftForLater).toBe(1);
    expect(plan.skipped.map((s) => s.slug)).toEqual(['t2', 't3', 't4']);
    expect(plan.skipped[2].why).toBe('scanned PDF');
    expect(plan.highUsd).toBeGreaterThan(plan.lowUsd);
    expect(plan.highUsd).toBeCloseTo(plan.rows.reduce((s, r) => s + r.highUsd, 0), 1);
    expect(plan.text).toMatch(/2 toolkits will be built/);
  });
  it('never plans more than the hard limit, and a read that throws is skipped, not fatal', async () => {
    const plan = await planAiBatch(Array.from({ length: 40 }, (_, i) => asset(i)), async (a) => { if (a.slug === 't0') throw new Error('boom'); return { kind: 'estimate', chars: 1000 } as EstimateResult; }, 999);
    expect(plan.rows).toHaveLength(25);
    expect(plan.skipped[0]).toMatchObject({ slug: 't0', why: 'boom' });
  });
  it('says plainly when there is nothing to build', async () => {
    const plan = await planAiBatch([asset(1)], async () => ({ kind: 'no_file' }) as EstimateResult);
    expect(plan.rows).toHaveLength(0);
    expect(plan.text).toMatch(/nothing to build/);
  });
  it('only runs when the person accepted at least the top figure', () => {
    expect(costAccepted({ highUsd: 1.5 }, 1.5)).toBe(true);
    expect(costAccepted({ highUsd: 1.5 }, 1.49)).toBe(false);
    expect(costAccepted({ highUsd: 1.5 }, undefined)).toBe(false);
    expect(costAccepted({ highUsd: 1.5 }, '2')).toBe(false);
  });
});
