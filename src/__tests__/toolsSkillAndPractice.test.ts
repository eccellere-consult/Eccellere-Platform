import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSIST_SKILL, DEFAULT_DRAFT_SKILL, MAX_SKILL_CHARS, checkSkillText, defaultSkill, skillOrDefault } from '@/lib/tools/skill';
import { EXAMPLE_TOOL, buildDraftPrompt, makeDrafter, type GenerateFn } from '@/lib/tools/draft';
import { PRACTICES, HUB_PLACEMENT, asPractice, suggestPractice } from '@/lib/tools/practice';
import { MODEL_GROUPS } from '@/lib/strategyModels/groups';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import {
  archiveTool, asPracticeChoice, draftNext, getLibraryTool, getPublishedTool, markReviewed, parseToolList, previewImport, publishTool, restoreTool,
  setToolPractice, startImport, unpublishTool,
} from '@/lib/tools/service';
import { redraftTool } from '@/lib/tools/review';

const good = JSON.stringify({ ...EXAMPLE_TOOL, confidence: 'high', concerns: [], originatorSuggestion: { name: 'A. Suggested Person', year: '1998', confidence: 'medium' } });
const ok = (text: string) => ({ text, provider: 'groq' as const, model: 'm', finishReason: 'stop' });
const down = () => 'down';

describe('skill files', () => {
  it('ship with sensible defaults that pass their own check', () => {
    expect(checkSkillText(DEFAULT_DRAFT_SKILL)).toBeNull();
    expect(checkSkillText(DEFAULT_ASSIST_SKILL)).toBeNull();
    expect(defaultSkill('draft')).toBe(DEFAULT_DRAFT_SKILL);
    expect(DEFAULT_DRAFT_SKILL).toContain('originatorSuggestion');
    expect(DEFAULT_DRAFT_SKILL).toMatch(/always include a diagram/i);
    expect(DEFAULT_DRAFT_SKILL).toMatch(/worked example/i);
    expect(DEFAULT_DRAFT_SKILL).toContain('Action plan');
  });
  it('refuses a skill file that is empty, tiny, huge or not text', () => {
    expect(checkSkillText('')).toMatch(/too short/);
    expect(checkSkillText('x'.repeat(MAX_SKILL_CHARS + 1))).toMatch(/too long/);
    expect(checkSkillText(42)).toMatch(/must be text/);
  });
  it('uses the saved text when valid, otherwise the default', () => {
    const custom = 'A custom skill. '.repeat(30);
    expect(skillOrDefault('draft', { text: custom })).toBe(custom.trim());
    expect(skillOrDefault('draft', custom)).toBe(custom.trim());
    expect(skillOrDefault('draft', { text: 'too short' })).toBe(DEFAULT_DRAFT_SKILL);
    expect(skillOrDefault('assist', null)).toBe(DEFAULT_ASSIST_SKILL);
  });
});

describe('the drafting prompt', () => {
  it('is the skill plus a fixed format, so editing the skill cannot change the format', () => {
    const custom = 'CUSTOM-SKILL-MARKER '.repeat(20);
    const { system } = buildDraftPrompt('Kano Model', 'Decision Models', false, null, { skill: custom });
    expect(system).toContain('CUSTOM-SKILL-MARKER');
    expect(system).not.toContain('Eccellere drafting skill'); // the default text is replaced, not appended
    expect(system).toContain('Format you must return (fixed');
    expect(system).toContain('"template": "matrix2x2"');
    expect(system).toContain('impact-effort-matrix'); // the worked example
  });
  it('passes the administrator\'s context and practice to the AI as context, not as a change of format', () => {
    const { user } = buildDraftPrompt('Kano Model', 'Decision Models', false, 'Decision making', { brief: 'For a bank\'s product team.', practice: 'Digital' });
    expect(user).toContain('CONTEXT FROM THE ADMINISTRATOR');
    expect(user).toContain('For a bank\'s product team.');
    expect(user).toContain('consulting practice: Digital');
    expect(buildDraftPrompt('X', 'Y').user).not.toContain('CONTEXT FROM');
  });
  it('drafts with the saved skill and records that it did, with the context used', async () => {
    let system = '';
    const generate: GenerateFn = async (a) => { system = a.system; return ok(good); };
    const drafter = makeDrafter({ generate, explainDown: down, getSkill: async () => 'MY-EDITED-SKILL '.repeat(30) });
    const out = await drafter({ name: 'Impact Effort Grid', category: 'Decision Models', groupName: null, practice: 'Strategy', brief: 'Retail context', slug: 'impact-effort-grid' });
    if (out.kind !== 'ok') throw new Error('expected ok');
    expect(system).toContain('MY-EDITED-SKILL');
    expect(out.tool.provenance).toMatchObject({ customSkill: true, brief: 'Retail context' });
    expect(out.tool.practice).toBe('Strategy');
  });
  it('falls back to the built-in skill when the saved one cannot be read', async () => {
    let system = '';
    const drafter = makeDrafter({ generate: async (a) => { system = a.system; return ok(good); }, explainDown: down, getSkill: async () => { throw new Error('db down'); } });
    await drafter({ name: 'X Tool', category: 'Others', groupName: null, practice: null, slug: 'x-tool' });
    expect(system).toContain('Eccellere drafting skill');
  });
});

describe('practice areas', () => {
  it('has the practices the consulting proposition is organised by', () => {
    expect(PRACTICES).toEqual(['Strategy', 'Process', 'Digital', 'Organisation', 'Technology', 'Finance & Risk', 'Programme & Change', 'Problem solving & Creativity']);
    expect(asPractice('technology')).toBe('Technology');
    expect(asPractice('cooking')).toBeNull();
    expect(() => asPracticeChoice('Cooking')).toThrow(/not one of the practice areas/);
    expect(asPracticeChoice('auto')).toBe('Auto');
  });
  it('places a list heading in a practice', () => {
    expect(suggestPractice('Process improvement')).toBe('Process');
    expect(suggestPractice('Digital and data')).toBe('Digital');
    expect(suggestPractice('Technology and architecture')).toBe('Technology');
    expect(suggestPractice('Organisation design')).toBe('Organisation');
    expect(suggestPractice('Financial analysis')).toBe('Finance & Risk');
    expect(suggestPractice('Project and performance')).toBe('Programme & Change');
    expect(suggestPractice('Strategy and alignment')).toBe('Strategy');
    expect(suggestPractice('Root cause')).toBe('Problem solving & Creativity');
    expect(suggestPractice('Creative: idea generation')).toBe('Problem solving & Creativity');
  });
  it('reads practice from the heading, the chosen drop-down value, or a tag on the line', () => {
    const auto = parseToolList('# Technology and architecture\nCapability Map\n# Organisation design\nSpans and Layers');
    expect(auto.entries.map((e) => [e.name, e.practice])).toEqual([['Capability Map', 'Technology'], ['Spans and Layers', 'Organisation']]);
    const chosen = parseToolList('Alpha\nBeta | Digital', 'Auto', 'Process');
    expect(chosen.entries.map((e) => [e.name, e.practice, e.groupName])).toEqual([['Alpha', 'Process', null], ['Beta', 'Digital', null]]);
  });
  it('new heading words also land in a sensible marketplace section', () => {
    const r = parseToolList('# Digital and data\nData Maturity Model\n# Organisation design\nSpans and Layers');
    expect(r.entries.map((e) => e.category)).toEqual(['Business analysis', 'Change Management']);
  });
  it('previews tools per practice', async () => {
    const p = await previewImport(createMemoryRepo(), '# Process improvement\nKaizen\n# Digital and data\nData Maturity Model', 'Auto');
    expect(p.byPractice).toEqual({ Process: 1, Digital: 1 });
  });
  it('places every one of the 36 Strategy Hub tools, and nothing else', () => {
    const hub = Object.values(MODEL_GROUPS).flat().sort();
    expect(Object.keys(HUB_PLACEMENT).sort()).toEqual(hub);
    expect(hub).toHaveLength(36);
  });
});

describe('who sees a tool: library versus clients', () => {
  async function reviewedTool() {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin', 'Impact Effort Grid', 'Decision Models');
    await draftNext(repo, jobId, makeDrafter({ generate: async () => ok(good), explainDown: down }));
    await markReviewed(repo, 'impact-effort-grid', 'me');
    return repo;
  }
  it('a reviewed tool is in the Consulting library but not visible to clients', async () => {
    const repo = await reviewedTool();
    expect(await getLibraryTool(repo, 'impact-effort-grid')).not.toBeNull();
    expect(await getPublishedTool(repo, 'impact-effort-grid')).toBeNull();
  });
  it('a draft is in neither', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin', 'Impact Effort Grid', 'Decision Models');
    await draftNext(repo, jobId, makeDrafter({ generate: async () => ok(good), explainDown: down }));
    expect(await getLibraryTool(repo, 'impact-effort-grid')).toBeNull();
  });
  it('exposing to clients, withdrawing, archiving and restoring move it between the places', async () => {
    const repo = await reviewedTool();
    await publishTool(repo, 'impact-effort-grid');
    expect(await getPublishedTool(repo, 'impact-effort-grid')).not.toBeNull();
    const withdrawn = await unpublishTool(repo, 'impact-effort-grid');
    expect(withdrawn.status).toBe('REVIEWED'); // still in the library
    expect(await getPublishedTool(repo, 'impact-effort-grid')).toBeNull();
    expect(await getLibraryTool(repo, 'impact-effort-grid')).not.toBeNull();
    await expect(unpublishTool(repo, 'impact-effort-grid')).rejects.toMatchObject({ code: 'WRONG_STATE' });
    await archiveTool(repo, 'impact-effort-grid');
    expect(await getLibraryTool(repo, 'impact-effort-grid')).toBeNull();
    expect((await restoreTool(repo, 'impact-effort-grid')).status).toBe('REVIEWED');
    await expect(restoreTool(repo, 'impact-effort-grid')).rejects.toMatchObject({ code: 'WRONG_STATE' });
  });
  it('moves a tool to another practice, refusing an unknown one', async () => {
    const repo = await reviewedTool();
    expect((await setToolPractice(repo, 'impact-effort-grid', 'technology')).practice).toBe('Technology');
    await expect(setToolPractice(repo, 'impact-effort-grid', 'Cooking')).rejects.toMatchObject({ code: 'BAD_PRACTICE' });
  });
  it('redrafting reuses the context the tool was first drafted with, unless new context is given', async () => {
    const seen: (string | null | undefined)[] = [];
    const drafter = makeDrafter({ generate: async (a) => { seen.push(a.user.includes('CONTEXT FROM THE ADMINISTRATOR') ? a.user : null); return ok(good); }, explainDown: down });
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin', 'Impact Effort Grid', 'Decision Models');
    await repo.items.forEach((i) => repo.items.set(i.id, { ...i, brief: 'Telecom billing team' }));
    await draftNext(repo, jobId, drafter);
    await redraftTool(repo, 'impact-effort-grid', drafter);
    await redraftTool(repo, 'impact-effort-grid', drafter, 'Bank operations');
    expect(seen[0]).toContain('Telecom billing team');
    expect(seen[1]).toContain('Telecom billing team');
    expect(seen[2]).toContain('Bank operations');
    expect(seen[2]).not.toContain('Telecom billing team');
  });
});
