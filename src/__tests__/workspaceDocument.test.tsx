// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Workspace from '@/app/tools/[slug]/Workspace';
import { readSource } from '@/lib/forms/source';
import { structuredForm } from '@/lib/forms/structured';
import { normaliseDeclarative, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { docxOf, SAMPLE_TOOLKIT } from './helpers/sampleDocx';

type Field = { label: string; value: string };
let saved: Field[] = [];
let puts = 0;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  saved = []; puts = 0;
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') { saved = JSON.parse(String(init.body)).fields; puts += 1; }
    const record = init?.method === 'PUT' ? { fields: saved, recommendations: [], actionables: [], analysis: null, analysisFingerprint: null, analysisAt: null, previousFields: null, version: puts, updatedAt: null } : null;
    return { ok: true, status: 200, text: async () => JSON.stringify({ record }) } as Response;
  }));
  vi.stubGlobal('print', vi.fn());
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const settle = async (ms = 1300) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const answer = (label: string) => saved.find((f) => f.label === label)?.value ?? '';

/** The online version of the sample Word toolkit, exactly as "Make online" builds it without AI. */
async function toolkit(): Promise<DeclarativeTool> {
  const reading = await readSource('Supplier Review Toolkit.docx', await docxOf(SAMPLE_TOOLKIT));
  return normaliseDeclarative(structuredForm([reading], { name: 'Supplier Review Toolkit', category: 'strategy' as never })!.form).tool!;
}
const open = async () => {
  const def = await toolkit();
  const view = render(<Workspace slug="supplier-review-toolkit" definition={def} toolName="Supplier Review Toolkit" />);
  await screen.findByText(/parts answered/);
  return { def, ...view };
};

describe('a toolkit made online, on the page', () => {
  it('shows the document in order: the introduction, each step with its instruction, then the appendix', async () => {
    const { container } = await open();
    const text = container.textContent ?? '';
    const at = (s: string) => { const i = text.indexOf(s); expect(i, s).toBeGreaterThan(-1); return i; };
    const order = [
      'This toolkit helps you review one supplier at a time.', 'How to use this toolkit', 'Rate honestly', 'Fully in place and evidenced',
      'Part 1: Supplier details', 'Fill in the details of the supplier you are reviewing.', 'Supplier name',
      'Part 2: Performance assessment', 'Rate each question from 1 to 5 and note your evidence.', 'Delivery and quality', 'Does the supplier deliver on the agreed date?',
      'Part 3: Maturity of supplier management', 'For each area, choose the level that describes you today.', 'Quarterly reviews with agreed measures.',
      'Part 4: Readiness checklist', 'Tick each item once it is done.', 'Contract is signed and filed',
      'Part 5: Action plan', 'List the actions you agree with the supplier.',
      'Appendix: Benchmarks', 'Typical ranges seen in practice.', 'Under 2 percent',
    ].map(at);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // no added steps, and no filler help line under every question
    expect(screen.queryByText('About this form')).toBeNull();
    expect(screen.queryByText(/as it is asked in the document/)).toBeNull();
  });

  it('keeps every existing feature of the worksheet: AI help, AI drafting for each step, the Excel template and upload, print, download, results and the analysis', async () => {
    await open();
    expect(screen.getByRole('button', { name: 'Draft the empty parts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Suggest questions for my situation/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Draft this section with AI/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Upload a filled template' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download blank template' })).toBeTruthy();
    for (const name of ['Print', 'Download', 'Analyse & recommend']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByText('Results at a glance')).toBeTruthy();
    expect(screen.getByText('Methodology')).toBeTruthy();
  });

  it('draws a table to fill in as a real table: column headings, a row for each printed row, a 1 to 5 scale and a notes box', async () => {
    await open();
    const table = screen.getByRole('table', { name: 'Delivery and quality' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Diagnostic Question', 'Rating (1-5)', 'Evidence / Notes']);
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    const group = within(table).getByRole('radiogroup', { name: /Rating \(1-5\): 2\.2 Are quality rejections/ });
    fireEvent.click(within(group).getByRole('radio', { name: '4' }));
    fireEvent.change(within(table).getByLabelText(/Evidence \/ Notes: 2\.2/), { target: { value: 'Two rejections in March' } });
    await settle();
    expect(JSON.parse(answer('Delivery and quality'))).toEqual([{ diagnostic_question: '2.2 Are quality rejections below the agreed limit?', rating_1_5: '4', evidence_notes: 'Two rejections in March' }]);
    expect(screen.getByText('Average rating (1-5): Delivery and quality').parentElement!.textContent).toContain('4');
  });

  it('draws a maturity model as its table of descriptions, and picks a level when its description is clicked', async () => {
    await open();
    const table = screen.getAllByRole('table').find((t) => within(t).queryByRole('columnheader', { name: 'Level 3: Defined' }))!;
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Area', 'Level 1: Initial', 'Level 2: Developing', 'Level 3: Defined', 'Level 4: Leading']);
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    // every description is on the page, in its own cell
    expect(within(table).getAllByRole('button')).toHaveLength(12);
    const cell = within(table).getByRole('button', { name: 'Level 3: Defined: Performance review' });
    expect(cell.textContent).toBe('Quarterly reviews with agreed measures.');
    fireEvent.click(cell);
    expect(cell.getAttribute('aria-pressed')).toBe('true');
    expect(cell.textContent).toContain('Chosen');
    // one level for each row: choosing another moves the choice
    const other = within(table).getByRole('button', { name: 'Level 2: Developing: Performance review' });
    fireEvent.click(other);
    expect(cell.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(within(table).getByRole('button', { name: 'Level 4: Leading: Risk management' }));
    await settle();
    const rows = JSON.parse(saved.find((f) => /^Table: Area/.test(f.label))!.value);
    expect(rows).toEqual([{ area: 'Performance review', level_chosen: 'Level 2: Developing' }, { area: 'Risk management', level_chosen: 'Level 4: Leading' }]);
    // (2 + 4) / 2 = 3
    expect(screen.getByText(/^Average level:/).parentElement!.textContent).toContain('3 of 4 (from 2 rows)');
    // clicking the chosen description again clears it
    fireEvent.click(other);
    expect(other.getAttribute('aria-pressed')).toBe('false');
  });

  it('draws tick boxes as tick boxes, and saves a tick as Yes', async () => {
    await open();
    const box = screen.getByLabelText('Contract is signed and filed') as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    fireEvent.click(box);
    await settle();
    expect(answer('Contract is signed and filed')).toBe('Yes');
    expect(screen.getByText('Boxes ticked').parentElement!.textContent).toContain('1 of 3 ticked (33%)');
    fireEvent.click(box);
    await settle();
    expect(answer('Contract is signed and filed')).toBe('');
  });

  it('shows every option of a choice, one answer for round buttons and several for "tick all that apply"', async () => {
    await open();
    const one = screen.getByRole('group', { name: 'How would you describe the relationship overall?' });
    const radios = within(one).getAllByRole('radio') as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    fireEvent.click(within(one).getByLabelText('Cooperative'));
    fireEvent.click(within(one).getByLabelText('Strategic partner'));
    const many = screen.getByRole('group', { name: /Which risks apply to this supplier/ });
    expect(within(many).getAllByRole('checkbox')).toHaveLength(4);
    fireEvent.click(within(many).getByLabelText('Quality drift'));
    fireEvent.click(within(many).getByLabelText('Single source'));
    await settle();
    expect(answer('How would you describe the relationship overall?')).toBe('Strategic partner');
    // kept in the order the document lists them, whatever order they were ticked in
    expect(answer('Which risks apply to this supplier? (tick all that apply)')).toBe('Single source; Quality drift');
  });

  it('keeps a table of blank rows as blank rows under the same headings, with a tick column, and lets a row be added', async () => {
    await open();
    const table = screen.getAllByRole('table').find((t) => within(t).queryByRole('columnheader', { name: 'Due date' }))!;
    expect(within(table).getAllByRole('columnheader').slice(0, 4).map((h) => h.textContent)).toEqual(['Action', 'Owner', 'Due date', 'Done']);
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    fireEvent.change(within(table).getByLabelText('Action: row 1'), { target: { value: 'Agree a delivery review' } });
    fireEvent.click(within(table).getByLabelText('Done: row 1'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add a row' }));
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    await settle();
    const rows = JSON.parse(saved.find((f) => /^Table: Action/.test(f.label))!.value);
    expect(rows).toEqual([{ action: 'Agree a delivery review', done: 'Yes' }]);
  });

  it('reopens with the saved answers in place', async () => {
    const def = await toolkit();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ record: { fields: [
      { label: 'Contract is signed and filed', value: 'Yes', source: 'Manual' },
      { label: 'Which risks apply to this supplier? (tick all that apply)', value: 'Long lead time; Quality drift', source: 'Manual' },
      { label: 'Delivery and quality', value: JSON.stringify([{ diagnostic_question: '2.1 Does the supplier deliver on the agreed date?', rating_1_5: '5' }]), source: 'Manual' },
    ], recommendations: [], actionables: [], analysis: null, analysisFingerprint: null, analysisAt: null, previousFields: null, version: 3, updatedAt: null } }) }) as Response));
    render(<Workspace slug="supplier-review-toolkit" definition={def} toolName="Supplier Review Toolkit" />);
    await screen.findByText(/parts answered/);
    expect((screen.getByLabelText('Contract is signed and filed') as HTMLInputElement).checked).toBe(true);
    const many = screen.getByRole('group', { name: /Which risks apply/ });
    expect((within(many).getAllByRole('checkbox') as HTMLInputElement[]).map((c) => c.checked)).toEqual([false, false, true, true]);
    const group = screen.getByRole('radiogroup', { name: /Rating \(1-5\): 2\.1/ });
    expect(within(group).getByRole('radio', { name: '5' }).getAttribute('aria-checked')).toBe('true');
  });

  it('prints a blank copy without touching the answers', async () => {
    await open();
    const name = screen.getByLabelText('Supplier name') as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'Acme Components' } });
    await settle();
    const before = puts;
    fireEvent.click(screen.getByRole('button', { name: 'Print a blank copy' }));
    await settle(100);
    expect(window.print).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Supplier name') as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('Results at a glance')).toBeNull();
    act(() => { window.dispatchEvent(new Event('afterprint')); });
    expect((screen.getByLabelText('Supplier name') as HTMLInputElement).value).toBe('Acme Components');
    await settle();
    expect(puts).toBe(before);
    expect(answer('Supplier name')).toBe('Acme Components');
  });
});

describe('a tool that is not in the document layout', () => {
  it('is drawn as before: no grid, no blank-copy button, its help lines shown', async () => {
    const { container } = render(<Workspace slug="impact-effort-matrix" definition={EXAMPLE_TOOL} toolName="Impact-Effort Matrix" />);
    await screen.findByText(/parts answered/);
    expect(container.querySelector('.ws-grid')).toBeNull();
    expect(container.querySelector('style')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Print a blank copy' })).toBeNull();
    const firstField = EXAMPLE_TOOL.sections.flatMap((s) => s.parts).find((p) => p.kind === 'field')!;
    expect(screen.getByText(firstField.help)).toBeTruthy();
  });
});
