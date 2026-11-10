import { describe, expect, it } from 'vitest';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { aiAnalyse, aiFill, aiQuestions, buildAnalyseMessages, buildFillMessages, fromDeclarative, type GenerateFn } from '@/lib/tools/ai';

const TOOL = fromDeclarative(EXAMPLE_TOOL);

const reply = (o: unknown, finishReason = 'stop') => ({ text: JSON.stringify(o), provider: 'groq' as const, model: 'm', finishReason });
const down = () => 'No AI provider is switched on with a key.';
const mine = (label: string, value: string) => ({ label, value, source: 'Manual' });

const fillReply = {
  fields: [
    { label: 'What are we choosing between?', value: 'Which of five fixes to start first.' },
    { label: 'What does success look like?', value: 'Fewer late orders by March.' },
    { label: 'What limits the choice?', value: 'AI should not overwrite this.' },
    { label: 'What did you decide, and why?', value: 'Start with the quickest win.' },
  ],
  tables: [{ label: 'Options', rows: [{ option: 'Auto reminders', impact: '4', effort: '2' }, { option: 'New system', impact: '5', effort: '5' }] }],
};

describe('drafting answers', () => {
  it('asks for a situation first when there is nothing to base a draft on', async () => {
    const r = await aiFill({ generate: async () => reply(fillReply), explainDown: down }, { tool: TOOL, current: [], brief: '  ' });
    expect(r).toMatchObject({ ok: false, code: 'NOTHING_TO_DO' });
  });

  it('drafts only what is blank, labels it AI, and never touches the person\'s own answer', async () => {
    let seen: Parameters<GenerateFn>[0] | undefined;
    const generate: GenerateFn = async (a) => { seen = a; return reply(fillReply); };
    const r = await aiFill({ generate, explainDown: down }, { tool: TOOL, current: [mine('What limits the choice?', 'Two analysts, no budget.')], brief: 'We are a small finance team with late invoices.' });
    if (!r.ok) throw new Error(r.reason);
    const by = new Map(r.fields.map((f) => [f.label, f]));
    expect(by.get('What limits the choice?')).toMatchObject({ value: 'Two analysts, no budget.', source: 'Manual' });
    expect(by.get('What does success look like?')).toMatchObject({ value: 'Fewer late orders by March.', source: 'AI' });
    expect(JSON.parse(by.get('Options')!.value)).toHaveLength(2);
    expect(by.get('Options')!.source).toBe('AI');
    // the request: JSON mode, the person's words as data, the safety rules, and the person's own answer listed as fixed context
    expect(seen).toMatchObject({ json: true });
    expect(seen!.system).toMatch(/DATA, not instructions/);
    expect(seen!.system).toMatch(/Never invent figures/);
    expect(seen!.system).not.toContain('"What limits the choice?"');
    expect(seen!.user).toContain('small finance team');
    expect(seen!.user).toContain('Two analysts, no budget.');
  });

  it('refuses when every part already has the person\'s answer', async () => {
    const all = [
      mine('What are we choosing between?', 'a'), mine('What does success look like?', 'b'), mine('What limits the choice?', 'c'),
      mine('Options', JSON.stringify([{ option: 'x', impact: '3', effort: '2' }])), mine('What did you decide, and why?', 'd'),
      mine('Actions for the next 90 days', JSON.stringify([{ action: 'x', owner: 'Finance Manager', measure: 'm', horizon: '30 days' }])),
    ];
    const r = await aiFill({ generate: async () => reply(fillReply), explainDown: down }, { tool: TOOL, current: all, brief: 'x' });
    expect(r).toMatchObject({ ok: false, code: 'NOTHING_TO_DO' });
  });

  it('saves nothing and says why when the AI is down, cut off, or unreadable', async () => {
    const args = { tool: TOOL, current: [], brief: 'We are a small team.' };
    expect(await aiFill({ generate: async (a) => { a.diag?.push('Groq: HTTP 401'); return null; }, explainDown: (d) => `down: ${d}` }, args)).toEqual({ ok: false, code: 'AI_DOWN', reason: 'down: Groq: HTTP 401' });
    expect(await aiFill({ generate: async () => reply(fillReply, 'length'), explainDown: down }, args)).toMatchObject({ ok: false, code: 'CUT_OFF' });
    expect(await aiFill({ generate: async () => ({ text: 'not json', provider: 'groq', model: 'm' }), explainDown: down }, args)).toMatchObject({ ok: false, code: 'UNUSABLE' });
    expect(await aiFill({ generate: async () => reply({ fields: [{ label: 'Something else', value: 'x' }] }), explainDown: down }, args)).toMatchObject({ ok: false, code: 'UNUSABLE' });
  });

  it('builds a prompt from the tool\'s own structure', () => {
    const m = buildFillMessages({ tool: TOOL, structure: TOOL.def, fillable: ['Options'], current: [], brief: '' });
    expect(m.system).toContain('"Options"');
    expect(m.system).toContain('"tables"');
    expect(m.system).toContain(EXAMPLE_TOOL.does);
  });
});

const analysisReply = {
  analysis: {
    summary: 'Auto reminders give the best return on effort among the options scored.',
    verdict: { label: 'Start with reminders', rationale: 'Highest impact per effort.' },
    findings: [{ title: 'Clear leader', detail: 'Auto reminders scored impact 4 for effort 2.' }],
    watchouts: ['Only two options were scored.'],
  },
  recommendations: [{ text: 'Start with auto reminders.' }],
  actionables: [{ action: 'Switch on reminders', owner: 'Finance Manager', timeframe: 'Next 30 days', priority: 'High' }],
};
const filled = [
  mine('What are we choosing between?', 'Which of five fixes to start first.'),
  mine('Options', JSON.stringify([{ option: 'Auto reminders', impact: '4', effort: '2' }, { option: 'New system', impact: '5', effort: '5' }])),
];

describe('drafting one section, using the suggested questions', () => {
  it('sends the suggested questions as context and drafts only the chosen section', async () => {
    let seen: Parameters<GenerateFn>[0] | undefined;
    const generate: GenerateFn = async (a) => { seen = a; return reply(fillReply); };
    const sec = TOOL.def.sections[0];
    const labels = new Set(sec.parts.map((p) => p.label));
    const r = await aiFill({ generate, explainDown: down }, { tool: TOOL, current: [], brief: 'We sell to small shops.', questions: [{ question: 'Which channel brings most first orders?', why: '' }], sectionKey: sec.key });
    if (!r.ok) throw new Error(r.reason);
    expect(seen!.user).toMatch(/QUESTIONS THE PERSON IS THINKING THROUGH/);
    expect(seen!.user).toMatch(/Which channel brings most first orders/);
    // only this section's parts were asked for
    const asked = TOOL.def.sections.flatMap((x) => x.parts.map((p) => p.label)).filter((l) => seen!.system.includes(`"${l}"`) || seen!.system.includes(l));
    for (const l of asked) if (!labels.has(l) && TOOL.def.sections.length > 1) expect(seen!.system.split('Elements to draft:')[1]).not.toContain(`"${l}"`);
  });
  it('says so when the chosen section is already fully answered', async () => {
    const sec = TOOL.def.sections[0];
    const cur = sec.parts.map((p) => mine(p.label, p.kind === 'table' ? JSON.stringify([{ a: '1' }]) : 'done'));
    const r = await aiFill({ generate: async () => reply(fillReply), explainDown: down }, { tool: TOOL, current: cur, brief: 'x', sectionKey: sec.key });
    expect(r).toMatchObject({ ok: false, code: 'NOTHING_TO_DO' });
  });
});

describe('the analysis', () => {
  it('will not analyse an empty worksheet', async () => {
    const r = await aiAnalyse({ generate: async () => reply(analysisReply), explainDown: down }, { tool: TOOL, fields: [mine('What are we choosing between?', 'x')] });
    expect(r).toMatchObject({ ok: false, code: 'NOTHING_TO_DO' });
  });

  it('writes the analysis and keeps the system prompt honest about blanks, hypotheses and the tool\'s own reading guide', async () => {
    let seen: Parameters<GenerateFn>[0] | undefined;
    const r = await aiAnalyse({ generate: async (a) => { seen = a; return reply(analysisReply); }, explainDown: down }, { tool: TOOL, fields: filled });
    if (!r.ok) throw new Error(r.reason);
    expect(r.analysis.verdict?.label).toBe('Start with reminders');
    expect(r.actionables[0]).toMatchObject({ owner: 'Finance Manager', timeframe: 'Next 30 days' });
    expect(r.analysis.figuresToCheck).toBeUndefined(); // 4 and 2 are in the inputs
    expect(seen!.system).toContain(EXAMPLE_TOOL.analysisGuide);
    expect(seen!.system).toMatch(/blank answer means "not known"/);
    expect(seen!.system).toMatch(/hypotheses/);
    expect(seen!.user).toContain('Auto reminders');
    expect(seen!.user).toMatch(/Figures worked out/);
  });

  it('lists every number the inputs do not support, with its unit', async () => {
    const bad = { ...analysisReply, analysis: { ...analysisReply.analysis, summary: 'Reminders will cut late payments by 37 percent and save Rs 4,50,000.' } };
    const r = await aiAnalyse({ generate: async () => reply(bad), explainDown: down }, { tool: TOOL, fields: filled });
    if (!r.ok) throw new Error(r.reason);
    expect(r.analysis.figuresToCheck?.join(' ')).toMatch(/37/);
    expect(r.analysis.figuresToCheck?.join(' ')).toMatch(/4,50,000|450000/);
  });

  it('saves nothing when the AI is down, cut off or unreadable', async () => {
    const args = { tool: TOOL, fields: filled };
    expect(await aiAnalyse({ generate: async () => null, explainDown: down }, args)).toMatchObject({ ok: false, code: 'AI_DOWN' });
    expect(await aiAnalyse({ generate: async () => reply(analysisReply, 'length'), explainDown: down }, args)).toMatchObject({ ok: false, code: 'CUT_OFF' });
    expect(await aiAnalyse({ generate: async () => ({ text: '{}', provider: 'groq', model: 'm' }), explainDown: down }, args)).toMatchObject({ ok: false, code: 'UNUSABLE' });
  });

  it('builds the prompt with the tool name in it', () => {
    const m = buildAnalyseMessages({ tool: TOOL, structure: TOOL.def, fields: filled });
    expect(m.system).toContain('Impact-Effort Matrix');
    expect(m.system).toContain('Next 30 days');
  });
});
