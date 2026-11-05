import { describe, expect, it } from 'vitest';
import { EXAMPLE_TOOL, makeDrafter, type GenerateFn } from '@/lib/tools/draft';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import {
  bulkAction, deleteTool, draftNext, markReviewed, parseToolList, publishTool, removeRun, removeRunItem, saveFillin, startImport,
} from '@/lib/tools/service';
import { fixTool, suggestTools, tidyTool } from '@/lib/tools/repair';
import { assess } from '@/lib/tools/standards';
import { PROPOSED_LIST_TEXT } from '@/lib/tools/proposedList';
import { seedHubTools } from '@/lib/tools/hub';
import type { DeclarativeTool } from '@/lib/strategyModels/declarative';

const ok = (o: unknown, finishReason = 'stop') => ({ text: typeof o === 'string' ? o : JSON.stringify(o), provider: 'groq' as const, model: 'm', finishReason });
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

async function repoWith(def: DeclarativeTool, status: 'DRAFT' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW') {
  const repo = createMemoryRepo();
  await repo.saveTool({ slug: def.slug, name: def.name, category: 'Decision Models', groupName: 'Decision making', practice: 'Strategy', definition: def, quality: assess(def), status });
  return repo;
}

describe('the proposed list loads as plain one-per-line text', () => {
  it('has 231 lines, every one a tool with a group, none skipped, no repeats', () => {
    const lines = PROPOSED_LIST_TEXT.split('\n').filter(Boolean);
    expect(lines).toHaveLength(231);
    expect(lines.every((l) => l.includes(' | '))).toBe(true);
    const r = parseToolList(PROPOSED_LIST_TEXT, 'Auto', 'Auto');
    expect(r.entries).toHaveLength(231);
    expect(r.skipped).toEqual([]);
    expect(r.duplicates).toEqual([]);
    expect(r.entries.find((e) => e.name === 'Business Capability Map')).toMatchObject({ practice: 'Technology', groupName: 'Technology and architecture' });
  });
});

describe('delete', () => {
  it('deletes a draft, but not a live tool and not one people have saved work in', async () => {
    const repo = await repoWith(EXAMPLE_TOOL as DeclarativeTool, 'DRAFT');
    await markReviewed(repo, EXAMPLE_TOOL.slug, 'me');
    await publishTool(repo, EXAMPLE_TOOL.slug);
    await expect(deleteTool(repo, EXAMPLE_TOOL.slug)).rejects.toMatchObject({ code: 'WRONG_STATE' });
    await repo.patchTool(EXAMPLE_TOOL.slug, { status: 'REVIEWED' });
    await saveFillin(repo, 'u1', EXAMPLE_TOOL.slug, { fields: [{ label: 'a', value: 'b', source: 'Manual' }] });
    await expect(deleteTool(repo, EXAMPLE_TOOL.slug)).rejects.toMatchObject({ code: 'HAS_WORK' });
    expect(await repo.getToolBySlug(EXAMPLE_TOOL.slug)).not.toBeNull();
  });
  it('removes an untouched tool for good, and says so for one that is not there', async () => {
    const repo = await repoWith(EXAMPLE_TOOL as DeclarativeTool, 'DRAFT');
    await deleteTool(repo, EXAMPLE_TOOL.slug);
    expect(await repo.getToolBySlug(EXAMPLE_TOOL.slug)).toBeNull();
    await expect(deleteTool(repo, EXAMPLE_TOOL.slug)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('removes one name from a run, or the whole run, and keeps tools already drafted', async () => {
    const repo = createMemoryRepo();
    const gen: GenerateFn = async () => ok({ ...EXAMPLE_TOOL, confidence: 'high', concerns: [], originatorSuggestion: { name: 'X', year: '1990', confidence: 'low' } });
    const { jobId } = await startImport(repo, 'a', 'Alpha\nBeta\nGamma');
    await draftNext(repo, jobId, makeDrafter({ generate: gen, explainDown: () => 'down' }));
    const items = (await repo.getJob(jobId))!.items;
    await removeRunItem(repo, jobId, items[2].id);
    expect((await repo.getJob(jobId))!.items).toHaveLength(2);
    await expect(removeRunItem(repo, jobId, 'nope')).rejects.toMatchObject({ code: 'JOB_NOT_FOUND' });
    await removeRun(repo, jobId);
    expect(await repo.getJob(jobId)).toBeNull();
    expect(await repo.getToolBySlug('alpha')).not.toBeNull(); // the drafted tool stays
  });
  it('applies one action to many tools, reports each failure in plain words, and never stops at the first', async () => {
    const repo = createMemoryRepo();
    const a = { ...clone(EXAMPLE_TOOL), slug: 'a-tool', name: 'A Tool' } as DeclarativeTool;
    const b = { ...clone(EXAMPLE_TOOL), slug: 'b-tool', name: 'B Tool', outputs: [] } as DeclarativeTool;
    for (const d of [a, b]) await repo.saveTool({ slug: d.slug, name: d.name, category: 'Others', definition: d, quality: assess(d), status: assess(d).errors.length ? 'NEEDS_REVIEW' : 'DRAFT' });
    const r = await bulkAction(repo, 'review', ['a-tool', 'b-tool', 'ghost', 'a-tool'], 'me');
    expect(r.map((x) => [x.slug, x.ok])).toEqual([['a-tool', true], ['b-tool', false], ['ghost', false]]);
    expect(r[1].message).toMatch(/Fix these first/);
    expect((await bulkAction(repo, 'delete', ['b-tool'], 'me'))[0].ok).toBe(true);
    expect(await repo.getToolBySlug('b-tool')).toBeNull();
    expect((await bulkAction(repo, 'expose', ['a-tool'], 'me'))[0].ok).toBe(true);
    expect((await bulkAction(repo, 'withdraw', ['a-tool'], 'me'))[0].ok).toBe(true);
    expect((await bulkAction(repo, 'archive', ['a-tool'], 'me'))[0].ok).toBe(true);
  });
  it('lets the Strategy Hub tools be deleted from the library and added again', async () => {
    const repo = createMemoryRepo();
    await seedHubTools(repo, 'me');
    await deleteTool(repo, 'bmc');
    expect((await seedHubTools(repo, 'me')).added).toEqual(['bmc']);
  });
});

describe('Fix with AI and Modify with AI', () => {
  it('adds a missing diagram and worked example first, then needs nothing more', async () => {
    const bare = { ...clone(EXAMPLE_TOOL), diagram: undefined, sample: undefined } as unknown as DeclarativeTool;
    const repo = await repoWith(bare);
    let calls = 0;
    const gen: GenerateFn = async () => { calls++; return ok({ diagram: EXAMPLE_TOOL.diagram, sample: EXAMPLE_TOOL.sample }); };
    const r = await fixTool(repo, bare.slug, gen);
    expect(calls).toBe(1);
    expect(r).toMatchObject({ applied: true, before: 2, after: 0 });
    expect(r.tool).toMatchObject({ status: 'DRAFT', reviewedById: null });
    expect(r.notes.join(' ')).toMatch(/Added: diagram and sample/);
  });

  it('takes out a result whose rule the engine cannot run, without asking the AI, and says which', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    t.outputs = [...(t.outputs ?? []), { key: 'bogus', label: 'Invented total', rule: { op: 'sum_everything' } as never }];
    const repo = await repoWith(t);
    expect(assess(t).errors.join(' ')).toMatch(/unknown rule/);
    let calls = 0;
    const r = await fixTool(repo, t.slug, async () => { calls++; return ok({}); });
    expect(calls).toBe(0);
    expect(r).toMatchObject({ applied: true, after: 0 });
    expect(r.notes.join(' ')).toMatch(/Removed 1 result.*Invented total/);
    expect(((r.tool.definition as DeclarativeTool).outputs ?? []).some((o) => o.key === 'bogus')).toBe(false);
  });

  it('automatic clean-up repairs a diagram grid and a calculated column with no AI', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    t.diagram = { template: 'canvasGrid', title: 'Grid', cols: 2, rows: 1, boxes: [
      { name: 'A', col: 0, row: 0 }, { name: 'B', col: 3, row: 0, colSpan: 2 }, { name: '', col: 1, row: 0 },
    ] } as never;
    expect(assess(t).errors.join(' ')).toMatch(/Every box must be named/);
    const repo = await repoWith(t);
    const r = await tidyTool(repo, t.slug);
    expect(r.applied).toBe(true);
    expect(r.notes.join(' ')).toMatch(/Fixed the diagram/);
    expect(r.remaining.join(' ')).not.toMatch(/Every box must be named/);
    const d = (r.tool.definition as DeclarativeTool).diagram as unknown as { cols: number; boxes: unknown[] };
    expect(d.boxes).toHaveLength(2);
    expect(d.cols).toBe(4);

    const u = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    const table = u.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && !p.board && p.columns.some((c) => c.type === 'computed'));
    if (table && table.kind === 'table' && !table.board) {
      const c = table.columns.find((x) => x.type === 'computed')!;
      c.rule = { op: 'nonsense' } as never;
      expect(assess(u).errors.join(' ')).toMatch(/columns\[\d+\]\.rule/);
      const repo2 = await repoWith(u);
      const r2 = await tidyTool(repo2, u.slug);
      expect(r2.applied).toBe(true);
      expect(r2.remaining.join(' ')).not.toMatch(/columns\[\d+\]\.rule/);
      expect(r2.notes.join(' ')).toMatch(/enter it themselves/);
    }
  });

  it('automatic clean-up replaces a sole unrunnable result with a simple summary so the tool still has an output', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    t.outputs = [{ key: 'bogus', label: 'Invented total', rule: { op: 'sum_everything' } as never }];
    t.derived = [];
    const repo = await repoWith(t);
    const r = await tidyTool(repo, t.slug);
    expect(r.applied).toBe(true);
    expect(r.remaining.join(' ')).not.toMatch(/unknown rule|at least one output/);
    expect(((r.tool.definition as DeclarativeTool).outputs ?? []).length).toBe(1);
  });

  it('automatic clean-up gives a result even to a tool that has no plain input fields', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    t.outputs = []; t.derived = [];
    t.sections.forEach((sec) => { sec.parts = sec.parts.filter((p) => p.kind === 'table'); });
    const repo = await repoWith(t);
    const r = await tidyTool(repo, t.slug);
    expect(r.remaining.join(' ')).not.toMatch(/at least one output/);
  });

  it('automatic clean-up fixes a select with too few choices and adds a missing diagram', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    const f = t.sections.flatMap((x) => x.parts).find((p) => p.kind === 'field');
    if (f && f.kind === 'field') { f.type = 'select'; f.options = ['Only one']; }
    delete (t as { diagram?: unknown }).diagram;
    const repo = await repoWith(t);
    const r = await tidyTool(repo, t.slug);
    expect(r.applied).toBe(true);
    expect(r.remaining.join(' ')).not.toMatch(/at least 2 options|Diagram:/);
  });

  it('automatic clean-up leaves a sound tool alone', async () => {
    const t = clone(EXAMPLE_TOOL) as unknown as DeclarativeTool;
    const repo = await repoWith(t, 'DRAFT');
    const r = await tidyTool(repo, t.slug);
    expect(r.applied).toBe(false);
    expect(r.notes).toEqual([]);
  });

  it('fixes other errors with one correction call, keeping identity, keys and the originator', async () => {
    const broken = { ...clone(EXAMPLE_TOOL), does: 'Too short', outputs: [] } as unknown as DeclarativeTool;
    broken.reference.originator = 'Person I confirmed';
    const repo = await repoWith(broken);
    expect(assess(broken).errors.length).toBeGreaterThan(0);
    let seen = '';
    const gen: GenerateFn = async (a) => {
      seen = a.user;
      // the AI returns a corrected page, but also tries to rename the tool and claim another originator
      return ok({ ...clone(EXAMPLE_TOOL), name: 'Renamed By AI', slug: 'renamed', reference: { ...EXAMPLE_TOOL.reference, originator: 'Invented Person', year: '1901' } });
    };
    const r = await fixTool(repo, broken.slug, gen);
    expect(seen).toContain('PROBLEMS TO FIX');
    expect(seen).toMatch(/does needs at least 20|outputs/);
    expect(r.applied).toBe(true);
    expect(r.after).toBe(0);
    const saved = r.tool.definition as DeclarativeTool;
    expect(saved.name).toBe(broken.name);
    expect(saved.slug).toBe(broken.slug);
    expect(saved.reference.originator).toBe('Person I confirmed');
    expect(saved.outputs?.length).toBeGreaterThan(0);
  });

  it('refuses a correction that would make the page worse, and leaves it untouched', async () => {
    const broken = { ...clone(EXAMPLE_TOOL), does: 'Too short' } as unknown as DeclarativeTool;
    const repo = await repoWith(broken);
    const worse = { ...clone(EXAMPLE_TOOL), does: 'Still too', outputs: [], sections: [] };
    const r = await fixTool(repo, broken.slug, async () => ok(worse));
    expect(r.applied).toBe(false);
    expect(r.notes.join(' ')).toMatch(/was not applied/);
    expect(((await repo.getToolBySlug(broken.slug))!.definition as DeclarativeTool).does).toBe('Too short');
  });

  it('applies an administrator\'s instruction to a page that has no errors, and sends it back to review', async () => {
    const repo = await repoWith(clone(EXAMPLE_TOOL) as DeclarativeTool, 'DRAFT');
    await markReviewed(repo, EXAMPLE_TOOL.slug, 'me');
    let sent = '';
    const changed = clone(EXAMPLE_TOOL);
    changed.whenToUse = 'Use it when a bank operations team has more good ideas than capacity and needs a defensible order to start.';
    const r = await fixTool(repo, EXAMPLE_TOOL.slug, async (a) => { sent = a.user; return ok(changed); }, { instruction: 'Make it specific to bank operations.' });
    expect(sent).toContain('INSTRUCTION FROM THE ADMINISTRATOR');
    expect(sent).toContain('bank operations');
    expect(r.applied).toBe(true);
    expect(r.notes.join(' ')).toMatch(/Your instruction was applied/);
    expect(r.tool).toMatchObject({ status: 'DRAFT', reviewedById: null });
    expect(((r.tool.definition) as DeclarativeTool).whenToUse).toMatch(/bank operations/);
  });

  it('says plainly when the AI does not answer, and when its answer is unreadable', async () => {
    const broken = { ...clone(EXAMPLE_TOOL), does: 'Too short' } as unknown as DeclarativeTool;
    const repo = await repoWith(broken);
    await expect(fixTool(repo, broken.slug, async () => null)).rejects.toMatchObject({ code: 'AI_DOWN' });
    const r = await fixTool(repo, broken.slug, async () => ok('I cannot help'));
    expect(r.applied).toBe(false);
    expect(r.notes.join(' ')).toMatch(/unreadable|cut off/);
  });

  it('will not touch a live tool or a hand-built one', async () => {
    const repo = await repoWith(clone(EXAMPLE_TOOL) as DeclarativeTool, 'DRAFT');
    await markReviewed(repo, EXAMPLE_TOOL.slug, 'me');
    await publishTool(repo, EXAMPLE_TOOL.slug);
    await expect(fixTool(repo, EXAMPLE_TOOL.slug, async () => ok({}), { instruction: 'x' })).rejects.toMatchObject({ code: 'WRONG_STATE' });
    await seedHubTools(repo, 'me');
    await expect(fixTool(repo, 'bmc', async () => ok({}), { instruction: 'x' })).rejects.toMatchObject({ code: 'WRONG_STATE' });
  });
});

describe('Suggest tools with AI', () => {
  it('returns new, well-formed names only, leaving out what is already there', async () => {
    const gen: GenerateFn = async () => ok({ tools: [
      { name: 'Process Mapping', group: 'Process improvement' }, { name: 'Gemba Walk', group: 'Process improvement' }, { name: 'gemba walk', group: 'x' },
      { name: 'Kaizen', group: 'Process improvement' }, { name: 'A | bad', group: 'g' }, { name: '', group: 'g' }, { name: 'x'.repeat(90), group: 'g' },
    ] });
    const r = await suggestTools(gen, { topic: 'process improvement in a plant', practice: 'Process', existing: ['Kaizen'] });
    if (!r.ok) throw new Error(r.reason);
    expect(r.tools.map((t) => t.name)).toEqual(['Process Mapping', 'Gemba Walk', 'A bad']);
  });
  it('needs a topic, and explains an AI that is down or unreadable', async () => {
    expect(await suggestTools(async () => ok({}), { topic: ' ', existing: [] })).toMatchObject({ ok: false });
    expect(await suggestTools(async () => null, { topic: 'change management', existing: [] })).toMatchObject({ ok: false, reason: expect.stringMatching(/did not answer/) });
    expect(await suggestTools(async () => ok('nonsense'), { topic: 'change management', existing: [] })).toMatchObject({ ok: false, reason: expect.stringMatching(/readable list/) });
    expect(await suggestTools(async () => ok({ tools: [{ name: 'Kaizen', group: 'g' }] }), { topic: 'change management', existing: ['Kaizen'] })).toMatchObject({ ok: false, reason: expect.stringMatching(/nothing new/) });
  });
});
