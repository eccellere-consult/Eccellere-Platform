import { describe, expect, it } from 'vitest';
import { EXAMPLE_TOOL, buildDraftPrompt, declarativeCategory, extractJson, makeDrafter, type GenerateFn } from '@/lib/tools/draft';
import { qualityGate, interpret } from '@/lib/strategyModels/declarative';
import { standardsCheck, standardsGaps, actionPlanTable } from '@/lib/tools/standards';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import { draftNext, startImport } from '@/lib/tools/service';

const reply = (over: Record<string, unknown> = {}) => JSON.stringify({ ...EXAMPLE_TOOL, confidence: 'high', concerns: [], ...over });
const ok = (text: string, finishReason = 'stop') => ({ text, provider: 'groq' as const, model: 'm', finishReason });
const item = { name: 'Impact Effort Grid', category: 'Decision Models', groupName: 'Decision making', practice: 'Strategy', slug: 'impact-effort-grid' };
const down = () => 'No AI provider is switched on with a key.';

describe('the example shown to the AI', () => {
  it('passes our own quality gate and builds into a real definition', () => {
    const gate = qualityGate(EXAMPLE_TOOL);
    expect(gate.blockers).toEqual([]);
    const def = interpret(EXAMPLE_TOOL);
    expect(def.sections.length).toBe(3);
  });
  it('appears in the prompt with the rules, and the prompt carries the name and mapped category', () => {
    const { system, user } = buildDraftPrompt('Kano Model', 'Decision Models', false, 'Decision making');
    expect(system).toContain('Never state who invented the method');
    expect(system).toContain('impact-effort-matrix');
    expect(user).toContain('Kano Model');
    expect(user).toContain('"decision-matrix"');
    expect(buildDraftPrompt('X', 'Y', true).system).toContain('Keep it short');
  });
});

describe('declarativeCategory', () => {
  it('maps the marketplace categories, with the group refining problem-solving tools', () => {
    expect(declarativeCategory('Problem solving', 'Creative: idea generation')).toBe('creative');
    expect(declarativeCategory('Problem solving', 'Root cause')).toBe('root-cause');
    expect(declarativeCategory('Problem solving')).toBe('analytical');
    expect(declarativeCategory('Decision Models')).toBe('decision-matrix');
    expect(declarativeCategory('Strategy')).toBe('strategy');
    expect(declarativeCategory('Project Management')).toBe('planning');
    expect(declarativeCategory('Change Management')).toBe('planning');
    expect(declarativeCategory('Business analysis')).toBe('analytical');
    expect(declarativeCategory('Others')).toBe('other');
  });
});

describe('Eccellere standards check', () => {
  it('scores the example tool as an L2, publish-ready', () => {
    const r = standardsCheck(EXAMPLE_TOOL);
    expect(r.items.filter((i) => i.earned < i.points).map((i) => i.id)).toEqual(['example']); // only the optional worked example is missing
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.level).toBe('L2');
    expect(r.band).toBe('Publish-ready');
    expect(actionPlanTable(EXAMPLE_TOOL)?.key).toBe('actions');
  });
  it('scores a lite form as L0 and lists exactly what is missing', () => {
    const lite = {
      ...EXAMPLE_TOOL, whenNotToUse: undefined, next: undefined, diagram: undefined, derived: [], outputs: [{ key: 'x', label: 'X', rule: { op: 'template', text: 'ok' } }],
      analysisGuide: 'Short guide.',
      sections: [{ key: 's', title: 'Score', summary: 'Rate.', parts: [{ kind: 'field', key: 'a', label: 'A', type: 'text', help: 'Short help' }] }],
    } as unknown as typeof EXAMPLE_TOOL;
    const r = standardsCheck(lite);
    expect(r.level).toBe('L0');
    expect(r.score).toBeLessThan(40);
    const gaps = standardsGaps(r).join(' ');
    expect(gaps).toMatch(/action plan/i);
    expect(gaps).toMatch(/Context intake/);
  });
  it('does not count a table as an action plan without an owner column', () => {
    const noOwner = JSON.parse(JSON.stringify(EXAMPLE_TOOL));
    noOwner.sections[2].parts[1].columns = noOwner.sections[2].parts[1].columns.filter((c: { key: string }) => c.key !== 'owner');
    expect(actionPlanTable(noOwner)).toBeNull();
    expect(standardsCheck(noOwner).level).toBe('L1');
  });
  it('a thin AI draft is sent to review with a Standards error, a good one with none', async () => {
    const thin = { ...EXAMPLE_TOOL, sections: [EXAMPLE_TOOL.sections[1]], whenNotToUse: 'x', next: '', diagram: undefined, analysisGuide: 'Looks at the table and then decides what to do about everything in it, carefully, with a long enough sentence to pass the gate.' };
    const out = await makeDrafter({ generate: async () => ok(reply(thin)), explainDown: down })(item);
    if (out.kind !== 'ok') throw new Error('expected ok');
    expect(out.tool.quality!.errors.join(' ')).toMatch(/Standards: scored \d+\/100/);
    const good = await makeDrafter({ generate: async () => ok(reply()), explainDown: down })(item);
    if (good.kind !== 'ok') throw new Error('expected ok');
    expect(good.tool.quality!.errors).toEqual([]);
    expect(good.tool.quality!.standards).toMatchObject({ level: 'L2' });
  });
});

describe('extractJson', () => {
  it('reads plain, fenced and chatty replies, and refuses junk', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('Here you go:\n```json\n{"a":{"b":2}}\n```\nDone.')).toEqual({ a: { b: 2 } });
    expect(extractJson('{"a":')).toBeNull();
    expect(extractJson('no json here')).toBeNull();
  });
});

describe('makeDrafter', () => {
  it('turns a good reply into a clean draft: identity from the list, originator and year always blank', async () => {
    const gen: GenerateFn = async () => ok(reply({ name: 'Wrong Name', slug: 'wrong', reference: { ...EXAMPLE_TOOL.reference, originator: 'A. Person', year: '1999' } }));
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') return;
    const def = out.tool.definition as typeof EXAMPLE_TOOL;
    expect(out.tool.slug).toBe('impact-effort-grid');
    expect(def.name).toBe('Impact Effort Grid');
    expect(def.slug).toBe('impact-effort-grid');
    expect(def.category).toBe('decision-matrix');
    expect(def.reference.originator).toBe('');
    expect(def.reference.year).toBe('');
    expect(def.source?.draftedBy).toBe('ai');
    expect(out.tool.quality?.errors).toEqual([]);
    expect(out.tool.category).toBe('Decision Models');
    expect(out.tool.groupName).toBe('Decision making');
    expect(out.tool.provenance).toMatchObject({ provider: 'groq', calls: 1, confidence: 'high' });
  });

  it('keeps a draft with gate errors (so a person can see and fix it) and lists the errors', async () => {
    const gen: GenerateFn = async () => ok(reply({ outputs: [], does: 'Too short' }));
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') return;
    expect(out.tool.quality!.errors.join(' ')).toMatch(/outputs/);
    expect(out.tool.quality!.errors.join(' ')).toMatch(/does needs at least/);
  });

  it('drops a worked example that has errors rather than failing the tool', async () => {
    const gen: GenerateFn = async () => ok(reply({ sample: { scenario: 'x', values: { nonsense_field: 'TBD' }, tables: {} } }));
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    if (out.kind !== 'ok') throw new Error('expected ok');
    expect(out.tool.quality!.errors).toEqual([]);
    expect(out.tool.quality!.warnings.join(' ')).toMatch(/worked example had errors and was removed/);
    expect((out.tool.definition as { sample?: unknown }).sample).toBeUndefined();
  });

  it('passes the AI\'s own doubts to the reviewer', async () => {
    const gen: GenerateFn = async () => ok(reply({ confidence: 'low', concerns: ['Name could mean two methods.'] }));
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    if (out.kind !== 'ok') throw new Error('expected ok');
    const w = out.tool.quality!.warnings.join(' ');
    expect(w).toMatch(/not sure this is the standard method/);
    expect(w).toMatch(/Name could mean two methods/);
  });

  it('retries once, shorter, after a cut-off answer, and succeeds', async () => {
    const prompts: string[] = [];
    let n = 0;
    const gen: GenerateFn = async (a) => { prompts.push(a.system); return n++ === 0 ? ok('{"schema":1,"slug":', 'length') : ok(reply()); };
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    if (out.kind !== 'ok') throw new Error('expected ok');
    expect(out.tool.provenance).toMatchObject({ calls: 2 });
    expect(prompts[0]).not.toContain('Keep it short');
    expect(prompts[1]).toContain('Keep it short');
  });

  it('fails one name after two unreadable answers, with a plain reason', async () => {
    const gen: GenerateFn = async () => ok('I am sorry, I cannot do that.');
    const out = await makeDrafter({ generate: gen, explainDown: down })(item);
    expect(out).toMatchObject({ kind: 'failed' });
    if (out.kind === 'failed') expect(out.reason).toMatch(/did not return a readable answer.*tried twice/);
  });

  it('reports "AI down" (pausing the run) when no provider answers, using the diagnostics', async () => {
    const gen: GenerateFn = async (a) => { a.diag?.push('Groq (Llama): HTTP 401'); return null; };
    const out = await makeDrafter({ generate: gen, explainDown: (d) => `Providers failed: ${d.join('; ')}` })(item);
    expect(out).toEqual({ kind: 'ai_down', reason: 'Providers failed: Groq (Llama): HTTP 401' });
  });

  it('asks for JSON mode with room for a full tool', async () => {
    let seen: Parameters<GenerateFn>[0] | undefined;
    const gen: GenerateFn = async (a) => { seen = a; return ok(reply()); };
    await makeDrafter({ generate: gen, explainDown: down })(item);
    expect(seen).toMatchObject({ json: true, maxTokens: 7000 });
  });
});

describe('end to end with a pretend AI: paste a list, draft, review', () => {
  it('drafts three names; the broken one is flagged, the failing one is retryable', async () => {
    const repo = createMemoryRepo();
    const { jobId } = await startImport(repo, 'admin', '# Decision making\nPugh Matrix\nKano Model\nDelphi Method');
    const gen: GenerateFn = async (a) => {
      if (a.user.includes('Kano')) return ok(reply({ outputs: [] }));
      if (a.user.includes('Delphi')) return ok('garbage');
      return ok(reply());
    };
    const drafter = makeDrafter({ generate: gen, explainDown: down });
    const kinds: string[] = [];
    for (;;) {
      const s = await draftNext(repo, jobId, drafter);
      if (s.kind === 'idle') break;
      kinds.push(s.kind === 'drafted' ? s.toolStatus : s.kind);
    }
    expect(kinds).toEqual(['DRAFT', 'NEEDS_REVIEW', 'failed']);
    expect((await repo.getToolBySlug('pugh-matrix'))!.status).toBe('DRAFT');
    expect((await repo.getToolBySlug('delphi-method'))).toBeNull();
  });
});
