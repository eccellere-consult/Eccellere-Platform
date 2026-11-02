import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import {
  MARKET_CATEGORIES, MAX_LIST_ITEMS, STALE_DRAFT_MS, asChoice, previewImport, setToolCategory, suggestCategory, VersionConflict, draftNext, estimateRun, getFillin, getPublishedTool, markReviewed, parseToolList,
  publishTool, recordEdit, retryFailed, saveFillin, slugify, startImport, undoFieldChange, resumeJob, type DrafterFn,
} from '@/lib/tools/service';

const okTool = (slug: string, name: string, errors: string[] = []) => ({
  kind: 'ok' as const,
  tool: { slug, name, category: 'Root cause', definition: { v: 1 }, quality: { errors, warnings: [] } },
});
const drafter: DrafterFn = async (i) => okTool(i.slug, i.name);

describe('slugify', () => {
  it('makes readable slugs', () => {
    expect(slugify('Failure Mode and Effect Analysis (FMEA)')).toBe('failure-mode-and-effect-analysis-fmea');
    expect(slugify('Pareto Analysis (80/20 Rule)')).toBe('pareto-analysis-80-20-rule');
    expect(slugify("Porter's Value Chain")).toBe('porter-s-value-chain');
    expect(slugify('Plan & Do')).toBe('plan-and-do');
    expect(slugify('***')).toBe('');
  });
});

describe('parseToolList', () => {
  it('reads Name | Group and headings as the group, and works the marketplace category out from it in Auto', () => {
    const r = parseToolList('# Root cause\n5 Why Analysis\nFishbone | Diagnosis\n\n## Decision making\n- Pugh Matrix\n2. Kano Model *\nOODA Loop ~');
    expect(r.entries.map((e) => [e.name, e.groupName, e.category])).toEqual([
      ['5 Why Analysis', 'Root cause', 'Problem solving'], ['Fishbone', 'Diagnosis', 'Problem solving'],
      ['Pugh Matrix', 'Decision making', 'Decision Models'], ['Kano Model', 'Decision making', 'Decision Models'], ['OODA Loop', 'Decision making', 'Decision Models'],
    ]);
  });
  it('uses the chosen category for every line, unless a line names its own category', () => {
    const r = parseToolList('Alpha\nBeta | Strategy\nGamma | Some group', 'Change Management');
    expect(r.entries.map((e) => [e.name, e.category, e.groupName])).toEqual([
      ['Alpha', 'Change Management', null], ['Beta', 'Strategy', null], ['Gamma', 'Change Management', 'Some group'],
    ]);
  });
  it('knows the seven categories and refuses anything else', () => {
    expect(MARKET_CATEGORIES).toEqual(['Problem solving', 'Business analysis', 'Strategy', 'Project Management', 'Change Management', 'Decision Models', 'Others']);
    expect(asChoice(undefined)).toBe('Auto');
    expect(asChoice('strategy')).toBe('Strategy');
    expect(() => asChoice('Cooking')).toThrow(/not one of the categories/);
    expect(suggestCategory('Risk management')).toBe('Business analysis');
    expect(suggestCategory('Project and performance')).toBe('Project Management');
    expect(suggestCategory('Whatever')).toBe('Others');
  });
  it('keeps repeats once, reports them, and reports prose lines instead of dropping them silently', () => {
    const r = parseToolList('Kaizen\nkaizen\nThis is a long explanatory sentence that someone pasted by mistake into the list of tool names, which should be reported.');
    expect(r.entries).toHaveLength(1);
    expect(r.duplicates).toEqual(['kaizen']);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0].reason).toMatch(/sentence/);
  });
  it('stops at a Notes section', () => {
    expect(parseToolList('Kaizen\n## Notes on the merge\nKanban').entries.map((e) => e.name)).toEqual(['Kaizen']);
  });
  it('caps one run and says what was left out', () => {
    const text = Array.from({ length: MAX_LIST_ITEMS + 5 }, (_, i) => `Tool ${i}`).join('\n');
    const r = parseToolList(text);
    expect(r.entries).toHaveLength(MAX_LIST_ITEMS);
    expect(r.skipped).toHaveLength(5);
  });
  it('reads the real list file: 152 distinct tools, no skipped lines that are tools', () => {
    const file = path.join(__dirname, '../../docs/tools-marketplace/TOOL_LIST_v1.md');
    const r = parseToolList(readFileSync(file, 'utf8'));
    expect(r.entries.length).toBe(152);
    expect(new Set(r.entries.map((e) => e.slug)).size).toBe(152);
    expect(r.entries.find((e) => e.name === 'Pugh Matrix')).toMatchObject({ category: 'Decision Models', groupName: 'Decision making' });
    const per: Record<string, number> = {};
    for (const e of r.entries) per[e.category] = (per[e.category] ?? 0) + 1;
    expect(Object.keys(per).sort()).toEqual(['Business analysis', 'Decision Models', 'Problem solving', 'Project Management', 'Strategy']);
    expect(r.entries.find((e) => e.name === 'Balanced Scorecard')?.slug).toBe('balanced-scorecard');
  });
});

describe('estimateRun', () => {
  it('states calls and minutes', () => {
    expect(estimateRun(30)).toEqual({ count: 30, callsMin: 30, callsMax: 60, minutes: 7 });
  });
});

describe('drafting a list', () => {
  it('skips names already in the catalogue and refuses an empty run', async () => {
    const repo = createMemoryRepo();
    await repo.saveTool({ slug: 'kaizen', name: 'Kaizen', category: 'x', definition: {} });
    const started = await startImport(repo, 'admin1', 'Kaizen\nKanban');
    expect(started.queued).toBe(1);
    expect(started.alreadyInCatalogue).toEqual(['Kaizen']);
    await expect(startImport(repo, 'admin1', 'Kaizen')).rejects.toMatchObject({ code: 'NOTHING_TO_DRAFT' });
  });

  it('drafts each name once, ends the run, and puts clean drafts in DRAFT and gate failures in NEEDS_REVIEW', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin1', 'Alpha\nBeta\nGamma');
    const d: DrafterFn = async (i) => okTool(i.slug, i.name, i.slug === 'beta' ? ['Help text is too thin.'] : []);
    const seen: string[] = [];
    for (;;) {
      const s = await draftNext(repo, jobId, d);
      if (s.kind === 'idle') break;
      if (s.kind === 'drafted') seen.push(`${s.item.slug}:${s.toolStatus}`);
    }
    expect(seen).toEqual(['alpha:DRAFT', 'beta:NEEDS_REVIEW', 'gamma:DRAFT']);
    expect((await repo.getJob(jobId))!.job.status).toBe('DONE');
  });

  it('never gives the same name to two requests, even when they arrive together', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'a', 'One\nTwo');
    let calls = 0;
    const slow: DrafterFn = async (i) => { calls++; await new Promise((r) => setTimeout(r, 5)); return okTool(i.slug, i.name); };
    const out = await Promise.all([draftNext(repo, jobId, slow), draftNext(repo, jobId, slow), draftNext(repo, jobId, slow)]);
    expect(out.filter((o) => o.kind === 'drafted')).toHaveLength(2);
    expect(calls).toBe(2);
  });

  it('offers a name again when its request died more than three minutes ago, not before', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'a', 'One');
    const t0 = new Date();
    const hang: DrafterFn = () => new Promise(() => { /* never answers */ });
    void draftNext(repo, jobId, hang, () => t0);
    await new Promise((r) => setTimeout(r, 0));
    const soon = await draftNext(repo, jobId, drafter, () => new Date(t0.getTime() + 60_000));
    expect(soon).toMatchObject({ kind: 'idle' });
    // the memory repo stamps claimedAt with the real clock, so move the stamp back to simulate the old request
    for (const it of repo.items.values()) repo.items.set(it.id, { ...it, claimedAt: new Date(Date.now() - STALE_DRAFT_MS - 1000) });
    const later = await draftNext(repo, jobId, drafter);
    expect(later).toMatchObject({ kind: 'drafted' });
  });

  it('pauses the whole run with a plain reason when no AI provider answers, and loses no name', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'a', 'One\nTwo');
    const down: DrafterFn = async () => ({ kind: 'ai_down', reason: 'No AI provider is switched on with a key.' });
    expect(await draftNext(repo, jobId, down)).toEqual({ kind: 'paused', reason: 'No AI provider is switched on with a key.' });
    expect(await draftNext(repo, jobId, drafter)).toEqual({ kind: 'idle', reason: 'job_paused' });
    const j = (await repo.getJob(jobId))!;
    expect(j.items.every((i) => i.status === 'QUEUED')).toBe(true);
    await resumeJob(repo, jobId);
    expect(await draftNext(repo, jobId, drafter)).toMatchObject({ kind: 'drafted' });
  });

  it('marks one bad name FAILED, keeps going, and can retry it', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'a', 'Good\nBad');
    const d: DrafterFn = async (i) => (i.slug === 'bad' ? { kind: 'failed', reason: 'The answer was cut off.' } : okTool(i.slug, i.name));
    while ((await draftNext(repo, jobId, d)).kind !== 'idle') { /* run */ }
    const j = (await repo.getJob(jobId))!;
    expect(j.items.map((i) => i.status)).toEqual(['DRAFT', 'FAILED']);
    expect(await retryFailed(repo, jobId)).toBe(1);
    while ((await draftNext(repo, jobId, drafter)).kind !== 'idle') { /* run */ }
    expect((await repo.getJob(jobId))!.items.map((i) => i.status)).toEqual(['DRAFT', 'DRAFT']);
  });

  it('turns a thrown error into a FAILED name with a short reason', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'a', 'Boom');
    const s = await draftNext(repo, jobId, async () => { throw new Error('kaboom'); });
    expect(s).toMatchObject({ kind: 'failed', reason: 'kaboom' });
  });
});

describe('review and publish', () => {
  const draftIn = async (errors: string[] = []) => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin1', 'Five Whys');
    await draftNext(repo, jobId, async (i) => okTool(i.slug, i.name, errors));
    return repo;
  };

  it('does not let an unreviewed draft go live, and does not show it to visitors', async () => {
    const repo = await draftIn();
    await expect(publishTool(repo, 'five-whys')).rejects.toMatchObject({ code: 'NOT_REVIEWED' });
    expect(await getPublishedTool(repo, 'five-whys')).toBeNull();
  });

  it('records who reviewed and when, then publishes', async () => {
    const repo = await draftIn();
    const reviewed = await markReviewed(repo, 'five-whys', 'me', () => new Date('2026-11-03T09:00:00Z'));
    expect(reviewed).toMatchObject({ status: 'REVIEWED', reviewedById: 'me' });
    const live = await publishTool(repo, 'five-whys');
    expect(live.status).toBe('PUBLISHED');
    expect(await getPublishedTool(repo, 'five-whys')).not.toBeNull();
  });

  it('blocks "Looks right" while the quality check has errors', async () => {
    const repo = await draftIn(['A diagram needs a title.']);
    await expect(markReviewed(repo, 'five-whys', 'me')).rejects.toMatchObject({ code: 'QUALITY_ERRORS' });
  });

  it('sends a reviewed tool back to review when it is edited, but leaves a live tool live', async () => {
    const repo = await draftIn();
    await markReviewed(repo, 'five-whys', 'me');
    const edited = await recordEdit(repo, 'five-whys', { errors: [], warnings: [] });
    expect(edited).toMatchObject({ status: 'DRAFT', reviewedById: null });
    await expect(publishTool(repo, 'five-whys')).rejects.toMatchObject({ code: 'NOT_REVIEWED' });
    await markReviewed(repo, 'five-whys', 'me');
    await publishTool(repo, 'five-whys');
    expect((await recordEdit(repo, 'five-whys', { errors: [], warnings: [] })).status).toBe('PUBLISHED');
  });
});

describe('a person\'s work', () => {
  const f = (label: string, value: string) => ({ label, value, source: 'user' });

  it('saves, reloads and bumps the version', async () => {
    const repo = createMemoryRepo();
    const a = await saveFillin(repo, 'u1', 'five-whys', { fields: [f('Problem', 'Late deliveries')] });
    expect(a.version).toBe(1);
    const b = await saveFillin(repo, 'u1', 'five-whys', { fields: [f('Problem', 'Late deliveries to Pune')] }, { expectedVersion: 1 });
    expect(b.version).toBe(2);
    expect((await getFillin(repo, 'u1', 'five-whys'))!.fields[0].value).toBe('Late deliveries to Pune');
    expect(await getFillin(repo, 'u2', 'five-whys')).toBeNull();
  });

  it('refuses a save from a stale tab and returns what is stored', async () => {
    const repo = createMemoryRepo();
    await saveFillin(repo, 'u1', 't', { fields: [f('A', '1')] });
    await saveFillin(repo, 'u1', 't', { fields: [f('A', '2')] }, { expectedVersion: 1 });
    const err = await saveFillin(repo, 'u1', 't', { fields: [f('A', 'stale')] }, { expectedVersion: 1 }).catch((e) => e);
    expect(err).toBeInstanceOf(VersionConflict);
    expect(err.current.fields[0].value).toBe('2');
  });

  it('two simultaneous first saves: one wins, the other is told', async () => {
    const repo = createMemoryRepo();
    const r = await Promise.allSettled([
      saveFillin(repo, 'u1', 't', { fields: [f('A', 'x')] }, { expectedVersion: 0 }),
      saveFillin(repo, 'u1', 't', { fields: [f('A', 'y')] }, { expectedVersion: 0 }),
    ]);
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
  });

  it('keeps one undo snapshot for an AI fill, drops it on a manual edit, and undoes', async () => {
    const repo = createMemoryRepo();
    await saveFillin(repo, 'u1', 't', { fields: [f('A', 'mine')] });
    const ai = await saveFillin(repo, 'u1', 't', { fields: [f('A', 'ai text')] }, { snapshotReason: 'ai', expectedVersion: 1 });
    expect(ai.previousFields?.[0].value).toBe('mine');
    const back = await undoFieldChange(repo, 'u1', 't');
    expect(back!.fields[0].value).toBe('mine');
    expect(back!.previousFields).toBeNull();
    await saveFillin(repo, 'u1', 't', { fields: [f('A', 'ai again')] }, { snapshotReason: 'ai' });
    const edited = await saveFillin(repo, 'u1', 't', { fields: [f('A', 'ai again, edited')] });
    expect(edited.previousFields).toBeNull();
    expect(await undoFieldChange(repo, 'u1', 't')).toBeNull();
  });

  it('does not wipe an analysis when fields are edited, and shows it as stale by fingerprint', async () => {
    const repo = createMemoryRepo();
    await saveFillin(repo, 'u1', 't', { fields: [f('A', 'one')] });
    const analysis = { headline: 'h', summary: 's' } as never;
    const withAnalysis = await saveFillin(repo, 'u1', 't', { analysis });
    const edited = await saveFillin(repo, 'u1', 't', { fields: [f('A', 'two')] });
    expect(edited.analysis).toEqual(withAnalysis.analysis);
    expect(edited.analysisFingerprint).toBe(withAnalysis.analysisFingerprint);
    const fresh = await saveFillin(repo, 'u1', 't', { analysis });
    expect(fresh.analysisFingerprint).not.toBe(withAnalysis.analysisFingerprint);
  });

  it('keeps cases apart', async () => {
    const repo = createMemoryRepo();
    await saveFillin(repo, 'u1', 't', { fields: [f('A', 'case 0')] });
    await saveFillin(repo, 'u1', 't', { fields: [f('A', 'case 7')] }, { caseId: 7 });
    expect((await getFillin(repo, 'u1', 't', 0))!.fields[0].value).toBe('case 0');
    expect((await getFillin(repo, 'u1', 't', 7))!.fields[0].value).toBe('case 7');
  });
});

describe('preview and re-filing', () => {
  it('previews without writing, counting tools per category', async () => {
    const repo = createMemoryRepo();
    await repo.saveTool({ slug: 'kaizen', name: 'Kaizen', category: 'Problem solving', definition: {} });
    const p = await previewImport(repo, '# Strategy and alignment\nOKR\n# Process improvement\nKaizen\nKanban', 'Auto');
    expect(p.byCategory).toEqual({ Strategy: 1, 'Problem solving': 1 });
    expect(p.alreadyInCatalogue).toEqual(['Kaizen']);
    expect(p.estimate.count).toBe(2);
    expect(repo.items.size).toBe(0);
  });
  it('moves a tool to another category from the drop-down, and refuses an unknown one', async () => {
    const repo = createMemoryRepo();
    await repo.saveTool({ slug: 'okr', name: 'OKR', category: 'Others', definition: {} });
    expect((await setToolCategory(repo, 'okr', 'Strategy')).category).toBe('Strategy');
    await expect(setToolCategory(repo, 'okr', 'Cooking')).rejects.toMatchObject({ code: 'BAD_CATEGORY' });
    await expect(setToolCategory(repo, 'nope', 'Strategy')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
