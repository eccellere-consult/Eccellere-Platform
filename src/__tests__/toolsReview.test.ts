import { describe, expect, it } from 'vitest';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import { EXAMPLE_TOOL, makeDrafter, type GenerateFn } from '@/lib/tools/draft';
import { draftNext, markReviewed, publishTool, startImport } from '@/lib/tools/service';
import { assess, editTool, redraftTool } from '@/lib/tools/review';

const good = JSON.stringify({ ...EXAMPLE_TOOL, confidence: 'high', concerns: [], originatorSuggestion: { name: 'A. Suggested Person', year: '1998', confidence: 'medium' } });
const gen: GenerateFn = async () => ({ text: good, provider: 'groq', model: 'm', finishReason: 'stop' });
const drafter = makeDrafter({ generate: gen, explainDown: () => 'down' });

async function oneDraft() {
  const repo = createMemoryRepo();
  const { jobId } = await startImport(repo, 'admin', 'Impact Effort Grid', 'Decision Models');
  await draftNext(repo, jobId, drafter);
  return repo;
}

describe('assess', () => {
  it('reports the standards score and keeps errors separate from warnings', () => {
    const q = assess(EXAMPLE_TOOL);
    expect(q.errors).toEqual([]);
    expect(q.standards).toMatchObject({ level: 'L2', band: 'Publish-ready' });
    // the originator is not confirmed on the example, so the reviewer is told
    expect(q.warnings.some((w) => /Originator not confirmed/.test(w))).toBe(true);
    // a page with no diagram or worked example is an error, not a footnote
    const bare = { ...EXAMPLE_TOOL, diagram: undefined, sample: undefined };
    const bq = assess(bare);
    expect(bq.errors.join(' ')).toMatch(/Diagram: every tool needs a diagram/);
    expect(bq.errors.join(' ')).toMatch(/Worked example: every tool needs/);
  });
});

describe('editTool', () => {
  it('corrects wording, re-checks, and sends an approved tool back to review', async () => {
    const repo = await oneDraft();
    await markReviewed(repo, 'impact-effort-grid', 'me');
    const edited = await editTool(repo, 'impact-effort-grid', { does: 'Sorts options by the value they create against the effort they need, so quick wins stand out.' });
    expect(edited).toMatchObject({ status: 'DRAFT', reviewedById: null, reviewedAt: null });
    expect(edited.does).toMatch(/quick wins stand out/);
    expect((edited.definition as { does: string }).does).toBe(edited.does);
    await expect(publishTool(repo, 'impact-effort-grid')).rejects.toMatchObject({ code: 'NOT_REVIEWED' });
  });

  it('turns a damaging edit into visible errors instead of saving it quietly', async () => {
    const repo = await oneDraft();
    const edited = await editTool(repo, 'impact-effort-grid', { does: 'Too short', analysisGuide: 'Short.' });
    expect(edited.status).toBe('NEEDS_REVIEW');
    expect(edited.quality!.errors.join(' ')).toMatch(/does needs at least 20|analysisGuide needs at least 40/);
    await expect(markReviewed(repo, 'impact-effort-grid', 'me')).rejects.toMatchObject({ code: 'QUALITY_ERRORS' });
  });

  it('lets a person who opened a source record the originator and year (the AI never does)', async () => {
    const repo = await oneDraft();
    expect((await repo.getToolBySlug('impact-effort-grid'))!.definition).toMatchObject({ reference: { originator: '', year: '' } });
    const edited = await editTool(repo, 'impact-effort-grid', { reference: { originator: 'Source named by the reviewer', year: '2001' } });
    expect(edited.definition).toMatchObject({ reference: { originator: 'Source named by the reviewer', year: '2001' } });
  });

  it('refuses to edit a live tool, and an unknown one', async () => {
    const repo = await oneDraft();
    await markReviewed(repo, 'impact-effort-grid', 'me');
    await publishTool(repo, 'impact-effort-grid');
    await expect(editTool(repo, 'impact-effort-grid', { does: 'x'.repeat(40) })).rejects.toMatchObject({ code: 'WRONG_STATE' });
    await expect(editTool(repo, 'nope', {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('redraftTool', () => {
  it('drafts again from the name, clears the old approval, and keeps the category and group', async () => {
    const repo = await oneDraft();
    await markReviewed(repo, 'impact-effort-grid', 'me');
    const r = await redraftTool(repo, 'impact-effort-grid', drafter);
    expect(r.tool).toMatchObject({ status: 'DRAFT', reviewedById: null, category: 'Decision Models' });
  });
  it('reports a down AI or a failed draft without touching the tool', async () => {
    const repo = await oneDraft();
    const before = (await repo.getToolBySlug('impact-effort-grid'))!.updatedAt;
    expect(await redraftTool(repo, 'impact-effort-grid', async () => ({ kind: 'ai_down', reason: 'no key' }))).toEqual({ paused: 'no key' });
    expect(await redraftTool(repo, 'impact-effort-grid', async () => ({ kind: 'failed', reason: 'cut off' }))).toEqual({ failed: 'cut off' });
    expect((await repo.getToolBySlug('impact-effort-grid'))!.updatedAt).toEqual(before);
  });
  it('will not redraft a live tool', async () => {
    const repo = await oneDraft();
    await markReviewed(repo, 'impact-effort-grid', 'me');
    await publishTool(repo, 'impact-effort-grid');
    await expect(redraftTool(repo, 'impact-effort-grid', drafter)).rejects.toMatchObject({ code: 'WRONG_STATE' });
  });
});

import { completeTool, confirmOriginator } from '@/lib/tools/review';

describe('confirming the originator and completing a page', () => {
  it('shows the AI\'s suggestion to the reviewer but puts nothing on the page until it is confirmed', async () => {
    const repo = await oneDraft();
    const before = (await repo.getToolBySlug('impact-effort-grid'))!;
    expect((before.definition as typeof EXAMPLE_TOOL).reference.originator).toBe('');
    expect(before.provenance).toMatchObject({ originatorSuggestion: { name: 'A. Suggested Person', status: 'unverified' } });
    const confirmed = await confirmOriginator(repo, 'impact-effort-grid');
    expect((confirmed.definition as typeof EXAMPLE_TOOL).reference).toMatchObject({ originator: 'A. Suggested Person', year: '1998' });
    expect(confirmed.provenance).toMatchObject({ originatorConfirmed: true, originatorSuggestion: { status: 'confirmed' } });
    expect(confirmed.quality!.warnings.join(' ')).not.toMatch(/Originator not confirmed/);
    expect(confirmed.status).toBe('DRAFT'); // changing the page sends it back to review
  });
  it('lets the reviewer type their own originator instead, and refuses an empty confirmation', async () => {
    const repo = await oneDraft();
    const t = await confirmOriginator(repo, 'impact-effort-grid', { name: 'Source I checked', year: '2004' });
    expect((t.definition as typeof EXAMPLE_TOOL).reference).toMatchObject({ originator: 'Source I checked', year: '2004' });
    const empty = createMemoryRepo();
    await empty.saveTool({ slug: 'x', name: 'X', category: 'Others', definition: EXAMPLE_TOOL });
    await expect(confirmOriginator(empty, 'x')).rejects.toMatchObject({ code: 'NOTHING_TO_CONFIRM' });
  });
  it('"Complete the page" adds a missing diagram and worked example to an existing tool', async () => {
    const repo = createMemoryRepo();
    const { diagram, sample, ...rest } = EXAMPLE_TOOL; void diagram; void sample;
    await repo.saveTool({ slug: 'bare-tool', name: 'Bare Tool', category: 'Others', definition: { ...rest, slug: 'bare-tool', name: 'Bare Tool' }, status: 'NEEDS_REVIEW' });
    const generate: GenerateFn = async () => ({ text: JSON.stringify({ diagram: EXAMPLE_TOOL.diagram, sample: EXAMPLE_TOOL.sample, originatorSuggestion: { name: 'Credited Person', year: '1980', confidence: 'medium' } }), provider: 'groq', model: 'm', finishReason: 'stop' });
    const r = await completeTool(repo, 'bare-tool', generate);
    expect(r.added.sort()).toEqual(['diagram', 'sample']);
    expect(r.tool.quality!.errors).toEqual([]);
    expect(r.tool.provenance).toMatchObject({ originatorSuggestion: { name: 'Credited Person', status: 'unverified' } });
    expect((await completeTool(repo, 'bare-tool', generate)).notes[0]).toMatch(/already has/);
  });
});
