// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Workspace from '@/app/tools/[slug]/Workspace';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';

type Call = { url: string; method: string; body: Record<string, unknown> | null };
let calls: Call[] = [];
let serverVersion = 0;
let handlers: Record<string, (c: Call) => { status: number; json: unknown }> = {};

const rec = (fields: unknown[], version: number, extra: Record<string, unknown> = {}) => ({
  fields, recommendations: [], actionables: [], analysis: null, analysisFingerprint: null, analysisAt: null, previousFields: null, version, updatedAt: null, ...extra,
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  calls = []; serverVersion = 0;
  handlers = {
    'GET fillin': () => ({ status: 200, json: { record: null } }),
    'PUT fillin': (c) => { serverVersion += 1; return { status: 200, json: { record: rec(c.body!.fields as unknown[], serverVersion) } }; },
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const call: Call = { url, method, body: init?.body ? JSON.parse(String(init.body)) : null };
    calls.push(call);
    const key = `${method} ${url.includes('/fillin') ? 'fillin' : 'ai'}`;
    const h = handlers[key] ?? (() => ({ status: 404, json: { error: 'no handler' } }));
    const r = h(call);
    return { ok: r.status < 400, status: r.status, text: async () => JSON.stringify(r.json) } as Response;
  }));
  vi.stubGlobal('print', vi.fn());
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const open = async () => {
  render(<Workspace slug="impact-effort-matrix" definition={EXAMPLE_TOOL} toolName="Impact-Effort Matrix" />);
  await screen.findByText(/parts started/);
};
const settle = async (ms = 1300) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const puts = () => calls.filter((c) => c.method === 'PUT');

describe('the workspace', () => {
  it('opens an empty worksheet with every section, the results box and the limitations note', async () => {
    await open();
    expect(screen.getByText(/0 of 6 parts started/)).toBeTruthy();
    for (const t of ['The decision', 'Score the options', 'Action plan', 'Results at a glance', 'Analysis and actions', 'Sources, assumptions and limitations']) {
      expect(screen.getAllByText(new RegExp(t)).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/never as zero/)).toBeTruthy();
  });

  it('saves what you type after a pause, then saves the next change against the new version', async () => {
    await open();
    const box = screen.getByLabelText(/What are we choosing between/);
    fireEvent.change(box, { target: { value: 'Which fix first' } });
    expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
    expect(puts()).toHaveLength(0); // not yet: still within the pause
    await settle();
    expect(puts()).toHaveLength(1);
    expect(puts()[0].body).toMatchObject({ expectedVersion: 0 });
    expect((puts()[0].body!.fields as { label: string; value: string }[]).find((f) => f.label === 'What are we choosing between?')?.value).toBe('Which fix first');
    expect(screen.getByText('Saved')).toBeTruthy();
    fireEvent.change(box, { target: { value: 'Which fix first, and why' } });
    await settle();
    expect(puts()[1].body).toMatchObject({ expectedVersion: 1 });
  });

  it('batches quick typing into one save', async () => {
    await open();
    const box = screen.getByLabelText(/What does success look like/);
    for (const v of ['a', 'ab', 'abc']) { fireEvent.change(box, { target: { value: v } }); await settle(300); }
    await settle();
    expect(puts()).toHaveLength(1);
  });

  it('calculates the results live from the table', async () => {
    await open();
    const options = screen.getAllByLabelText('Option');
    fireEvent.change(options[0], { target: { value: 'Auto reminders' } });
    fireEvent.change(screen.getAllByLabelText(/^Impact \(/)[0], { target: { value: '4' } });
    fireEvent.change(screen.getAllByLabelText(/^Effort \(/)[0], { target: { value: '2' } });
    fireEvent.change(options[1], { target: { value: 'New system' } });
    fireEvent.change(screen.getAllByLabelText(/^Impact \(/)[1], { target: { value: '3' } });
    fireEvent.change(screen.getAllByLabelText(/^Effort \(/)[1], { target: { value: '2' } });
    expect(screen.getByText('Auto reminders', { selector: 'dd' })).toBeTruthy(); // 4 / 2 = 2 beats 3 / 2 = 1.5, and the table shows the worked-out figure
    expect(screen.getByText('1.5')).toBeTruthy();
    await settle();
  });

  it('tells the person when another tab saved first, and does not overwrite it', async () => {
    handlers['PUT fillin'] = () => ({ status: 409, json: { error: 'changed elsewhere', code: 'VERSION_CONFLICT', record: rec([{ label: 'What are we choosing between?', value: 'From the other tab', source: 'Manual' }], 5) } });
    await open();
    fireEvent.change(screen.getByLabelText(/What are we choosing between/), { target: { value: 'My edit' } });
    await settle();
    expect(screen.getByText(/changed in another tab or window/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Load the saved version/));
    expect((screen.getByLabelText(/What are we choosing between/) as HTMLTextAreaElement).value).toBe('From the other tab');
  });

  it('keeps the edit on the page and says so when saving fails', async () => {
    handlers['PUT fillin'] = () => ({ status: 500, json: { error: 'Something went wrong on the server.' } });
    await open();
    const box = screen.getByLabelText(/What are we choosing between/) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'still here' } });
    await settle();
    expect(screen.getByText(/Something went wrong on the server/)).toBeTruthy();
    expect(box.value).toBe('still here');
  });

  it('reloads saved work, marks AI-suggested parts, and offers undo', async () => {
    handlers['GET fillin'] = () => ({ status: 200, json: { record: rec([{ label: 'What does success look like?', value: 'Fewer late orders', source: 'AI' }], 3, { previousFields: [{ label: 'x', value: 'y', source: 'Manual' }] }) } });
    await open();
    expect((screen.getByLabelText(/What does success look like/) as HTMLInputElement).value).toBe('Fewer late orders');
    expect(screen.getByText('AI-suggested')).toBeTruthy();
    expect(screen.getByText(/Undo the AI draft/)).toBeTruthy();
    // editing an AI-suggested part makes it the person's own
    fireEvent.change(screen.getByLabelText(/What does success look like/), { target: { value: 'Fewer late orders by March' } });
    expect(screen.queryByText('AI-suggested')).toBeNull();
    await settle();
  });

  it('asks the AI to draft only after the person describes their situation, and shows what came back', async () => {
    handlers['POST ai'] = () => ({ status: 200, json: { drafted: 2, record: rec([{ label: 'What limits the choice?', value: 'Two analysts', source: 'AI' }], 1) } });
    await open();
    const draft = screen.getByText('Draft the empty parts') as HTMLButtonElement;
    expect(draft.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Your situation'), { target: { value: 'Small finance team' } });
    expect(draft.disabled).toBe(false);
    await act(async () => { fireEvent.click(draft); });
    const sent = calls.find((c) => c.url.endsWith('/ai'))!;
    expect(sent.body).toMatchObject({ action: 'fill', brief: 'Small finance team', expectedVersion: 0 });
    expect(await screen.findByText(/The AI drafted 2 parts/)).toBeTruthy();
    expect((screen.getByLabelText(/What limits the choice/) as HTMLInputElement).value).toBe('Two analysts');
  });

  it('shows a plain reason when the AI cannot help, and changes nothing', async () => {
    handlers['POST ai'] = () => ({ status: 503, json: { error: 'AI help is not switched on right now. You can still fill in the worksheet yourself.', code: 'AI_DOWN' } });
    await open();
    fireEvent.change(screen.getByLabelText('Your situation'), { target: { value: 'x' } });
    await act(async () => { fireEvent.click(screen.getByText('Draft the empty parts')); });
    expect(await screen.findByText(/AI help is not switched on/)).toBeTruthy();
  });

  it('shows the analysis, its action plan and flagged figures, and calls it out of date after an edit', async () => {
    handlers['GET fillin'] = () => ({ status: 200, json: { record: rec(
      [
        { label: 'What are we choosing between?', value: 'Fix first', source: 'Manual' }, { label: 'What does success look like?', value: '', source: 'Manual' },
        { label: 'What limits the choice?', value: 'Two analysts', source: 'Manual' }, { label: 'Options', value: '', source: 'Manual' },
        { label: 'What did you decide, and why?', value: '', source: 'Manual' }, { label: 'Actions for the next 90 days', value: '', source: 'Manual' },
      ],
      2,
      {
        analysis: { summary: 'Start with reminders.', verdict: { label: 'Reminders first', rationale: 'Best return.' }, findings: [{ title: 'Leader', detail: 'Clear.' }], watchouts: ['Thin evidence.'], figuresToCheck: ['37 percent'] },
        recommendations: [{ text: 'Switch on reminders.' }],
        actionables: [{ action: 'Turn on reminders', owner: 'Finance Manager', timeframe: 'Next 30 days', priority: 'High' }],
        analysisFingerprint: 'x', analysisAt: '2026-11-03T00:00:00Z',
      },
    ) } });
    await open();
    expect(screen.getByText('Reminders first.')).toBeTruthy();
    expect(screen.getByText('Turn on reminders')).toBeTruthy();
    expect(screen.getByText('Finance Manager')).toBeTruthy();
    expect(screen.getByText(/Check these figures/)).toBeTruthy();
    expect(screen.getAllByText(/37 percent/).length).toBeGreaterThan(0);
    expect(screen.getByText(/changed your answers since this was written/)).toBeTruthy(); // the stored fingerprint never matches these fields
    await settle();
  });

  it('prints through the browser', async () => {
    await open();
    fireEvent.click(screen.getByText(/Print or save as PDF/));
    expect(window.print).toHaveBeenCalled();
  });
});
