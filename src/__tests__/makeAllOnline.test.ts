// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeAllOnline } from '@/lib/marketplace/batch';
import type { MakeOnlineResult } from '@/lib/marketplace/makeOnline';

const a = (n: number) => ({ slug: `kit-${n}`, title: `Kit ${n}`, description: 'd' });

describe('make all toolkits online', () => {
  it('goes through every toolkit in order, never stops for one that fails, and counts each outcome', async () => {
    const results: Record<string, MakeOnlineResult | Error> = {
      'kit-1': { kind: 'ok', slug: 'kit-1', name: 'Kit 1', status: 'NEEDS_REVIEW', notes: [] },
      'kit-2': { kind: 'exists', slug: 'kit-2' },
      'kit-3': { kind: 'no_file' },
      'kit-4': { kind: 'unreadable', reason: 'No text could be read from that PDF.' },
      'kit-5': new Error('boom'),
    };
    const seen: number[] = [];
    const s = await makeAllOnline([1, 2, 3, 4, 5].map(a), async (x) => { const r = results[x.slug]; if (r instanceof Error) throw r; return r; }, (d) => seen.push(d));
    expect(s.total).toBe(5);
    expect(s.counts).toEqual({ ok: 1, exists: 1, no_file: 1, unreadable: 1, ai_down: 0, failed: 1 });
    expect(s.rows.map((r) => r.slug)).toEqual(['kit-1', 'kit-2', 'kit-3', 'kit-4', 'kit-5']);
    expect(s.rows[3].detail).toBe('No text could be read from that PDF.');
    expect(s.rows[4]).toMatchObject({ kind: 'failed', detail: 'boom' });
    expect(seen).toEqual([1, 2, 3, 4, 5]);
  });
  it('handles an empty list', async () => {
    const s = await makeAllOnline([], async () => ({ kind: 'no_file' }));
    expect(s).toMatchObject({ total: 0, rows: [] });
  });
});
