// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cleanEdit, createMemoryEditRepo, isEmptyEdit, loadEdits, sipocWithEdit, withEdit, LIMITS, type AgentEditRepo } from '@/lib/agents/overrides';
import { listAgents } from '@/lib/agents/server';
import { pilotByAgent } from '@/lib/agents/pilots';

const ok = (slug: string, input: Record<string, unknown>) => { const c = cleanEdit(slug, input); if (!c.ok) throw new Error(c.errors.join(' ')); return c.edit; };

describe('cleanEdit', () => {
  it('tidies spaces, splits lines and treats empty boxes as "use the default"', () => {
    const e = ok('scenario-planner', { does: '  A   clearer\n description ', suppliers: 'Finance\n\n  Sales  \n', process: '', refresh: '   ' });
    expect(e.does).toBe('A clearer description');
    expect(e.suppliers).toEqual(['Finance', 'Sales']);
    expect(e.process).toBeNull();
    expect(e.refresh).toBeNull();
    expect(e.customers).toBeUndefined();
  });
  it('refuses text that is too long, with the limit in the message', () => {
    const c = cleanEdit('x', { does: 'a'.repeat(LIMITS.does + 1), suppliers: Array.from({ length: LIMITS.lines + 1 }, (_, i) => `s${i}`) });
    expect(c.ok).toBe(false);
    if (!c.ok) { expect(c.errors.join(' ')).toMatch(/limit is 400/); expect(c.errors.join(' ')).toMatch(/limit is 8/); }
  });
  it('refuses a value that is not text', () => {
    const c = cleanEdit('x', { does: 42 });
    expect(c.ok).toBe(false);
  });
  it('knows an all-empty edit is a reset', () => {
    expect(isEmptyEdit(ok('x', { does: '', suppliers: '' }))).toBe(true);
    expect(isEmptyEdit(ok('x', { does: 'Hi' }))).toBe(false);
  });
});

describe('what visitors see', () => {
  const base = { does: 'Default text' };
  it('uses the edit where there is one and the default otherwise', () => {
    expect(withEdit(base, { slug: 'x', does: 'Edited' }).does).toBe('Edited');
    expect(withEdit(base, { slug: 'x', does: null }).does).toBe('Default text');
    expect(withEdit(base, undefined).does).toBe('Default text');
  });
  it('merges SIPOC line by line', () => {
    const p = pilotByAgent('pricing-optimizer')!.sipoc;
    const merged = sipocWithEdit(p, { slug: 'pricing-optimizer', suppliers: ['Our sales desk'], process: null });
    expect(merged.suppliers).toEqual(['Our sales desk']);
    expect(merged.process).toEqual(p.process);
    expect(merged.refresh).toBe(p.refresh);
  });
});

describe('the edit store', () => {
  it('saves, versions, lists and resets, keeping the history', async () => {
    const repo = createMemoryEditRepo();
    expect(await repo.save('pricing-optimizer', ok('pricing-optimizer', { does: 'First' }), 'admin1')).toBe(1);
    expect(await repo.save('pricing-optimizer', ok('pricing-optimizer', { does: 'Second' }), 'admin1')).toBe(2);
    expect((await repo.get('pricing-optimizer'))?.does).toBe('Second');
    expect(await repo.save('pricing-optimizer', null, 'admin2')).toBe(3);
    expect(await repo.get('pricing-optimizer')).toBeNull();
    const h = await repo.history('pricing-optimizer');
    expect(h.map((x) => x.version)).toEqual([3, 2, 1]);
    expect(h[0].snapshot).toBeNull();
    expect(h[1].snapshot?.does).toBe('Second');
  });
  it('saving an all-empty edit counts as a reset', async () => {
    const repo = createMemoryEditRepo();
    await repo.save('a', ok('a', { does: 'X' }), null);
    await repo.save('a', ok('a', { does: '' }), null);
    expect(await repo.get('a')).toBeNull();
  });
  it('never breaks the public pages when the database or tables are missing', async () => {
    const broken: AgentEditRepo = { ...createMemoryEditRepo(), all: async () => { throw Object.assign(new Error('no table'), { code: 'P2021' }); } };
    expect(await loadEdits(broken)).toEqual({});
  });
});

describe('the admin list', () => {
  it('lists all 21 agents with defaults, and marks which can have a SIPOC edited', async () => {
    const repo = createMemoryEditRepo();
    await repo.save('demand-forecaster', ok('demand-forecaster', { does: 'Edited' }), 'a');
    const rows = await listAgents(repo);
    expect(rows).toHaveLength(21);
    expect(rows.filter((r) => r.sipocEditable).map((r) => r.slug).sort()).toEqual(['capital-allocation-advisor', 'demand-forecaster', 'pricing-optimizer', 'scenario-planner']);
    const d = rows.find((r) => r.slug === 'demand-forecaster')!;
    expect(d.edit?.does).toBe('Edited');
    expect(d.defaults?.does).toMatch(/demand/i);
    expect(rows.find((r) => r.slug === 'otif-tracker')!.edit).toBeNull();
  });
});
