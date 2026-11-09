// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { structuredForm } from '@/lib/forms/structured';
import { coverageErrors, reconcile } from '@/lib/forms/reconcile';
import { makeFormBuilder } from '@/lib/forms/build';
import { interpret, normaliseDeclarative, qualityGate } from '@/lib/strategyModels/declarative';
import type { ModelValues } from '@/lib/strategyModels/types';
import type { ElementKind, SourceElement, SourceReading } from '@/lib/forms/source';

/** A small Word-like document: cover details, a module with a question table, a worksheet table, a checklist, repeated generic headings. */
function doc(rows: [ElementKind, string][]): SourceReading {
  const elements: SourceElement[] = rows.map(([kind, text], i) => ({ id: `E${i + 1}`, file: 'kit.docx', kind, text, where: `Paragraph ${i + 1}` }));
  return { fileName: 'kit.docx', kind: 'word', elements, warnings: [], truncated: false };
}
const DOC = doc([
  ['heading', 'ACME'], ['heading', 'FOUNDER KIT'],
  ['row', 'Founder Name | ______________'], ['row', 'Company Name | ______________'], ['row', 'Date | ______________'],
  ['heading', 'TABLE OF CONTENTS'], ['tablehead', 'Section | Title'], ['row', 'A | Team'], ['row', 'B | Money'],
  ['tablehead', 'SECTION A MODULE A — TEAM'],
  ['note', 'Check how aligned the founders are.'],
  ['tablehead', 'A.1 | Co-Founder Alignment [VALUE IMPACT: CRITICAL]'],
  ['tablehead', '# | Diagnostic Question | Rating (1–5) | Evidence / Notes'],
  ['row', 'A1.1 | Have all co-founders signed a Founders Agreement covering equity and vesting? | | '],
  ['row', 'A1.2 | Is there a four year vesting schedule with a one year cliff for everyone? | | '],
  ['row', 'A1.3 | Do the founders share one definition of success and a plan for exit? | | '],
  ['heading', 'Steps'],
  ['tablehead', 'Activity Area | Key Activities | Tools'],
  ['row', 'COMPETITOR MAPPING | Map every direct and indirect competitor and what problem each solves | Sheets'],
  ['row', 'DIFFERENTIATION | Define how you are meaningfully different from all alternatives | Deck'],
  ['row', 'SETUP | • Set up company email and chat tools • Register the trademark for the brand • Open a business bank account | Tools'],
  ['heading', 'Advice'],
  ['tablehead', 'Source | Core Insight | Application'],
  ['row', 'Y Combinator | Make something people want and talk to users | Daily'],
  ['row', 'Sequoia | Build on an insight that is non obvious to most | Weekly'],
]);

describe('structured document conversion', () => {
  const r = structuredForm([DOC], { name: 'Founder Kit', category: 'strategy' as never })!;
  const { tool } = normaliseDeclarative(r.form);
  const parts = tool!.sections.flatMap((s) => s.parts.map((p) => ({ section: s.title, ...p })));

  it('makes steps from headings and "A.1 | Title" lines, in document order', () => {
    const titles = tool!.sections.map((s) => s.title);
    expect(titles.some((t) => /Co-Founder Alignment/.test(t))).toBe(true);
    expect(titles.indexOf('About this form')).toBe(0);
    expect(titles[titles.length - 1]).toBe('Action plan');
  });
  it('turns "label | blank" rows into fields with the wording unchanged', () => {
    const labels = parts.map((p) => p.label);
    expect(labels).toContain('Founder Name');
    expect(labels).toContain('Company Name');
  });
  it('turns each row of a question table into one rating field, using the question exactly as written', () => {
    const q = parts.find((p) => p.label.startsWith('Have all co-founders signed'));
    expect(q).toBeDefined();
    expect((q as { type: string }).type).toBe('rating');
    expect(parts.filter((p) => (p as { type: string }).type === 'rating')).toHaveLength(3);
  });
  it('turns worksheet rows into fill-in boxes and bullets into yes/no items', () => {
    expect(parts.map((p) => p.label)).toEqual(expect.arrayContaining(['COMPETITOR MAPPING', 'DIFFERENTIATION', 'Set up company email and chat tools', 'Register the trademark for the brand']));
    const yn = parts.find((p) => p.label === 'Register the trademark for the brand') as { type: string; options?: string[] };
    expect(yn.type).toBe('select');
    expect(yn.options).toEqual(['Yes', 'No']);
  });
  it('keeps advice and contents tables as reading, not questions, and says so', () => {
    const labels = parts.map((p) => p.label);
    expect(labels).not.toContain('Y Combinator');
    expect(labels).not.toContain('Sequoia');
    expect(r.approximations.join(' ')).toMatch(/not turned into questions/);
  });
  it('lists reading rows as left out by the reader (so they never block "Looks right")', () => {
    const maps = (r.form as { sourceMap?: { element: string; target: string }[] }).sourceMap ?? [];
    expect(maps.filter((m) => m.target === 'left-out:reading').length).toBeGreaterThanOrEqual(2);
    expect(maps.some((m) => m.target.startsWith('section:') && !tool!.sections.some((s) => m.target === `section:${s.key}`))).toBe(false);
  });
  it('leaves no source item open, so the draft can be marked reviewed', () => {
    const cov = reconcile(DOC.elements, r.form as never, tool!);
    expect(coverageErrors(cov)).toBeNull();
    expect(cov.counts.excluded).toBeGreaterThanOrEqual(2);
  });
  it('passes the quality check even when the same words appear in different steps', () => {
    expect(qualityGate(tool).ok).toBe(true);
  });
  it('gives back null for a document with almost nothing to fill in, and leaves sheets to the sheet reader', () => {
    expect(structuredForm([doc([['heading', 'Intro'], ['note', 'Only reading here.'], ['row', 'Name | ____']])], { category: 'strategy' as never })).toBeNull();
    expect(structuredForm([{ ...DOC, kind: 'excel' }], { category: 'strategy' as never })).toBeNull();
  });
});

describe('sample safety', () => {
  it('a question that merely contains a placeholder word (such as "autodoc") does not fail the sample check', () => {
    const d = doc([
      ['heading', 'Setup'], ['row', 'Autodocumentation todo list | ______'], ['row', 'Mastodon tbd page | ______'], ['row', 'Name | ______'], ['row', 'City | ______'], ['row', 'Role | ______'], ['row', 'Date | ______'],
    ]);
    const { tool } = normaliseDeclarative(structuredForm([d], { name: 'Safe kit', category: 'strategy' as never })!.form);
    expect(qualityGate(tool).ok).toBe(true);
  });
});

describe('the Form Builder with no AI', () => {
  it('builds a reviewable draft from a document without calling the AI at all', async () => {
    const generate = vi.fn(async () => null);
    const build = makeFormBuilder({ generate, explainDown: () => 'down', slugTaken: async () => false });
    const out = await build({ request: 'Make it', name: 'Founder Kit', category: 'Strategy' as never, practice: 'Strategy' as never, readings: [DOC], noAi: true });
    expect(generate).not.toHaveBeenCalled();
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') {
      expect(out.tool.status === 'DRAFT' || out.tool.status === 'NEEDS_REVIEW').toBe(true);
      const fields = (out.tool.definition as { sections: { parts: unknown[] }[] }).sections.flatMap((s) => s.parts);
      expect(fields.length).toBeGreaterThan(8);
    }
  });
});

describe('results worked out from the answers', () => {
  const rows: [ElementKind, string][] = [['heading', 'Practices']];
  ['Do you use total quality management?', 'Do you use statistical process control?', 'Do you trace every batch?', 'Do you run source inspections?', 'Do you measure the cost of quality?'].forEach((q) => {
    rows.push(['question', q], ['option', 'Not at all'], ['option', 'Somewhat'], ['option', 'To a large Extent'], ['option', 'N/A']);
  });
  const built = structuredForm([doc(rows)], { name: 'Practice check', category: 'strategy' as never })!;
  const { tool } = normaliseDeclarative(built.form);
  const def = interpret(tool!);
  const keys = tool!.sections.flatMap((x) => x.parts).filter((p) => p.kind === 'field' && (p as { options?: string[] }).options?.includes('Somewhat')).map((p) => p.key);
  const out = (key: string, fields: Record<string, string>) => def.outputs!.find((o) => o.key === key)!.compute({ fields, tables: {} } as ModelValues);

  it('passes the quality check with its results', () => { expect(qualityGate(tool).ok).toBe(true); expect(keys).toHaveLength(5); });
  it('counts how much is answered', () => {
    expect(out('answered', { [keys[0]]: 'Somewhat', [keys[1]]: 'Not at all' })).toMatch(/^2 of \d+ answered \(\d+%\)$/);
  });
  it('turns the agreed order into a percentage and a band, ignoring N/A and unanswered', () => {
    // 2 + 0 + 1 over 3 scored answers with a best of 2 each = 3/6 = 50%
    expect(out('practice_maturity', { [keys[0]]: 'To a large Extent', [keys[1]]: 'Not at all', [keys[2]]: 'Somewhat', [keys[3]]: 'N/A' })).toBe('50% from 3 scored answers (Developing)');
    expect(out('practice_maturity', { [keys[0]]: 'To a large Extent', [keys[1]]: 'To a large Extent' })).toBe('100% from 2 scored answers (Strong)');
    expect(out('practice_maturity', { [keys[0]]: 'N/A' })).toBeNull();
  });
  it('counts Yes answers on a checklist', () => {
    const d = doc([
      ['heading', 'Checklist'], ['row', 'Name | ____'], ['row', 'City | ____'], ['row', 'Role | ____'],
      ['tablehead', 'Activity Area | Key Activities | Tools'],
      ['row', 'SETUP | • Set up company email • Register the trademark • Open a bank account | x'],
    ]);
    const t = normaliseDeclarative(structuredForm([d], { name: 'Check list', category: 'strategy' as never })!.form).tool!;
    const y = t.sections.flatMap((x) => x.parts).filter((p) => (p as { options?: string[] }).options?.join('/') === 'Yes/No').map((p) => p.key);
    expect(y).toHaveLength(3);
    const res = interpret(t).outputs!.find((o) => o.key === 'checklist_yes')!.compute({ fields: { [y[0]]: 'Yes', [y[1]]: 'Yes', [y[2]]: 'No' }, tables: {} } as ModelValues);
    expect(res).toBe('2 of 3 answered Yes (67%)');
  });
});
