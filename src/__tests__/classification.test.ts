import { describe, expect, it } from 'vitest';
import { cleanClassification, readClassification, shapeOf, suggestClassification, suggestType } from '@/lib/tools/taxonomy';
import { checksFor, depthOf, enrichInstruction } from '@/lib/tools/depth';
import { aiRefine, approveClassification, catalogue, rowOf } from '@/lib/tools/classify';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import type { DeclarativeTool } from '@/lib/strategyModels/declarative';

const sug = (name: string, extra: Record<string, unknown> = {}) => suggestClassification({ name, ...extra });

describe('classification rules', () => {
  it('puts the three examples from the brief in the right type', () => {
    expect(sug('Growth Mindset Survey').type).toBe('survey');
    expect(sug('Manufacturing Diagnostic').type).toBe('toolkit');
    expect(sug('Business Case').type).toBe('aid');
    expect(sug('Business Valuation').type).toBe('aid');
  });
  it('finds area and sector from the words, and leaves sector empty when nothing is specific', () => {
    expect(sug('Business Valuation').areas).toContain('Finance');
    expect(sug('Manufacturing Diagnostic').sectors).toEqual(['Manufacturing']);
    expect(sug('Growth Mindset Survey').areas).toContain('People');
    expect(sug('Pareto Analysis').sectors).toEqual([]);
  });
  it('marks a guess with no evidence as not strong, and never claims a person decided', () => {
    const v = sug('Zebra');
    expect(v.strong).toBe(false);
    expect(v.basis).toBe('rules');
    expect(suggestType({ name: 'Growth Mindset Survey' }).strong).toBe(true);
  });
  it('uses the shape of a form: many scored questions read as a survey', () => {
    const shape = { sections: 4, scoredQuestions: 20, numbers: 0, computed: 0, tables: 0, hasActionTable: false };
    expect(suggestType({ name: 'Team pulse', shape }).type).toBe('survey');
  });
  it('reads the shape of a real tool definition', () => {
    const s = shapeOf(EXAMPLE_TOOL)!;
    expect(s.sections).toBeGreaterThan(0);
    expect(shapeOf({ kind: 'code' })).toBeNull();
  });
});

describe('stored classification is checked', () => {
  it('drops unknown values and needs an area', () => {
    expect(readClassification({ classification: { type: 'survey', areas: ['People', 'X'], sectors: ['Retail', 'Y'], basis: 'person' } })).toMatchObject({ areas: ['People'], sectors: ['Retail'], basis: 'person' });
    expect(readClassification({ classification: { type: 'bogus' } })).toBeNull();
    expect(readClassification(null)).toBeNull();
    expect(cleanClassification({ type: 'aid', areas: [], sectors: [] })).toBeNull();
    expect(cleanClassification({ type: 'aid', areas: ['Finance', 'Finance'], sectors: [] })!.areas).toEqual(['Finance']);
  });
});

describe('depth standard by type', () => {
  const tool = JSON.parse(JSON.stringify(EXAMPLE_TOOL)) as DeclarativeTool;
  it('every type has its own checks and plain-words fixes', () => {
    for (const t of ['survey', 'toolkit', 'aid'] as const) {
      const r = depthOf(t, tool);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.gaps.length).toBe(checksFor(t, tool).filter((c) => !c.ok).length);
    }
    expect(checksFor('survey', tool).map((c) => c.id)).toContain('dimensions');
    expect(checksFor('toolkit', tool).map((c) => c.id)).toContain('actions');
    expect(checksFor('aid', tool).map((c) => c.id)).toContain('assumptions');
  });
  it('a tool without a worked example or diagram is told so', () => {
    const bare = { ...tool, sample: undefined, diagram: undefined };
    expect(depthOf('toolkit', bare).gaps.join(' ')).toMatch(/worked example/);
    expect(depthOf('toolkit', bare).gaps.join(' ')).toMatch(/diagram/);
  });
  it('the enrich instruction lists the gaps and forbids invented figures', () => {
    const i = enrichInstruction('survey', ['Add scored questions.'], { areas: ['People'], sectors: ['Retail'] });
    expect(i).toMatch(/Survey forms/);
    expect(i).toMatch(/Add scored questions/);
    expect(i).toMatch(/do not invent benchmarks/);
    expect(i).toMatch(/Retail/);
    expect(enrichInstruction('aid', ['x'])).toMatch(/sector-neutral/);
  });
});

async function seeded() {
  const repo = createMemoryRepo();
  await repo.saveTool({ slug: 'growth-mindset', name: 'Growth Mindset Survey', category: 'Others', definition: EXAMPLE_TOOL, status: 'REVIEWED' });
  await repo.saveTool({ slug: 'mfg-diag', name: 'Manufacturing Diagnostic', category: 'Problem solving', definition: EXAMPLE_TOOL, status: 'PUBLISHED' });
  await repo.saveTool({ slug: 'old', name: 'Old tool', category: 'Others', definition: EXAMPLE_TOOL, status: 'ARCHIVED' });
  await repo.saveTool({ slug: 'hand', name: 'Hand built', category: 'Strategy', definition: { kind: 'code', toolId: 'x' }, status: 'PUBLISHED' });
  return repo;
}

describe('the catalogue and approvals', () => {
  it('lists non-archived tools with a suggested classification and depth, and marks hand-built ones', async () => {
    const rows = await catalogue(await seeded());
    expect(rows.map((r) => r.slug).sort()).toEqual(['growth-mindset', 'hand', 'mfg-diag']);
    const g = rows.find((r) => r.slug === 'growth-mindset')!;
    expect(g.classification.type).toBe('survey');
    expect(g.approved).toBe(false);
    expect(g.depth).not.toBeNull();
    expect(rows.find((r) => r.slug === 'hand')!.depth).toBeNull();
    expect(rows.find((r) => r.slug === 'hand')!.hand).toBe(true);
  });
  it('a person approving changes the classification only: status and review are untouched', async () => {
    const repo = await seeded();
    const done = await approveClassification(repo, 'mfg-diag', { type: 'toolkit', areas: ['Process'], sectors: ['Manufacturing'] }, 'user-1', () => new Date('2026-11-04T00:00:00Z'));
    expect(done).toMatchObject({ basis: 'person', by: 'user-1', at: '2026-11-04T00:00:00.000Z' });
    const after = await repo.getToolBySlug('mfg-diag');
    expect(after!.status).toBe('PUBLISHED');
    expect(rowOf(after!).approved).toBe(true);
    expect(rowOf(after!).classification.sectors).toEqual(['Manufacturing']);
  });
  it('refuses an approval with no area or for an unknown tool', async () => {
    const repo = await seeded();
    expect(await approveClassification(repo, 'mfg-diag', { type: 'toolkit', areas: [], sectors: [] }, 'u')).toBeNull();
    expect(await approveClassification(repo, 'nope', { type: 'toolkit', areas: ['Process'], sectors: [] }, 'u')).toBeNull();
  });
});

describe('AI refinement', () => {
  it('returns suggestions only for the tools asked about, drops invalid ones, and saves nothing', async () => {
    const repo = await seeded();
    const rows = (await catalogue(repo)).filter((r) => r.slug !== 'hand');
    const text = JSON.stringify({ items: [
      { slug: 'growth-mindset', type: 'survey', areas: ['People'], sectors: [], reason: 'Collects views from staff.' },
      { slug: 'not-asked', type: 'aid', areas: ['Finance'], sectors: [] },
      { slug: 'mfg-diag', type: 'wrong', areas: ['Process'], sectors: [] },
    ] });
    const out = await aiRefine(async () => ({ text, provider: 'anthropic', model: 'm' }), rows);
    expect(out.map((o) => o.slug)).toEqual(['growth-mindset']);
    expect(out[0].classification.basis).toBe('ai');
    expect((await repo.getToolBySlug('growth-mindset'))!.provenance?.classification).toBeUndefined();
    expect(await aiRefine(async () => null, rows)).toEqual([]);
  });
});
