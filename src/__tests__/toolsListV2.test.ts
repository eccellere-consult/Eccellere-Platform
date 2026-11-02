import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseToolList } from '@/lib/tools/service';
import { HUB_PLACEMENT, PRACTICES } from '@/lib/tools/practice';
import { ALL_SEED } from '@/lib/seedStrategyFrameworks';

describe('consulting library list v2', () => {
  const text = readFileSync(path.join(__dirname, '../../docs/tools-marketplace/TOOL_LIST_v2_consulting.md'), 'utf8');
  const r = parseToolList(text, 'Auto', 'Auto');

  it('is a clean list with no repeats and nothing the Strategy Hub already has', () => {
    expect(r.duplicates).toEqual([]);
    expect(new Set(r.entries.map((e) => e.slug)).size).toBe(r.entries.length);
    const hubNames = new Set(ALL_SEED.filter((s) => HUB_PLACEMENT[s.toolId]).map((s) => s.name.toLowerCase()));
    const hubSlugs = new Set(Object.keys(HUB_PLACEMENT));
    for (const e of r.entries) {
      expect(hubSlugs.has(e.slug), e.name).toBe(false);
      expect(hubNames.has(e.name.toLowerCase()), e.name).toBe(false);
    }
  });

  it('covers every consulting practice', () => {
    const per: Record<string, number> = {};
    for (const e of r.entries) per[e.practice] = (per[e.practice] ?? 0) + 1;
    for (const p of PRACTICES) expect(per[p] ?? 0, p).toBeGreaterThan(5);
    expect(r.entries.length).toBeGreaterThan(200);
  });

  it('reports no stray lines as tools', () => {
    expect(r.skipped.every((s) => s.line.length > 0)).toBe(true);
    expect(r.entries.every((e) => e.name.length <= 80 && !/[`]/.test(e.name))).toBe(true);
  });
});
