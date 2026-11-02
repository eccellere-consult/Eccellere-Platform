// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Catalogue, { type CatalogueRow } from '@/app/admin/tools/Catalogue';
import AdminToolsPage from '@/app/admin/tools/page';
import { PROPOSED_LIST_TEXT } from '@/lib/tools/proposedList';

type Call = { url: string; method: string; body: Record<string, unknown> | null };
let calls: Call[] = [];
let respond: (c: Call) => { status: number; json: unknown } = () => ({ status: 200, json: {} });

beforeEach(() => {
  calls = [];
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const call: Call = { url, method: init?.method ?? 'GET', body: init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : null };
    calls.push(call);
    const r = respond(call);
    return { ok: r.status < 400, status: r.status, text: async () => JSON.stringify(r.json) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const row = (over: Partial<CatalogueRow>): CatalogueRow => ({ slug: 'x', name: 'X', category: 'Strategy', practice: 'Strategy', source: 'ai', groupName: null, status: 'NEEDS_REVIEW', errors: 0, warnings: 0, standards: null, ...over });
const rows: CatalogueRow[] = [
  row({ slug: 'a', name: 'Alpha', errors: 2, standards: { score: 70, level: 'L1' } }),
  row({ slug: 'b', name: 'Beta', status: 'DRAFT', errors: 0, standards: { score: 95, level: 'L2' } }),
  row({ slug: 'c', name: 'Gamma', status: 'PUBLISHED', errors: 0 }),
  row({ slug: 'bmc', name: 'Business Model Canvas', status: 'REVIEWED', source: 'strategy-hub', errors: 0 }),
];
const mount = (reload = vi.fn()) => { render(<Catalogue rows={rows} categories={['Strategy']} open={null} setOpen={() => {}} reload={reload} aiReady />); return reload; };

describe('catalogue clean-up', () => {
  it('offers "Fix all with AI" for tools with problems, and fixes them one request each, reporting what happened', async () => {
    respond = () => ({ status: 200, json: { applied: true, before: 2, after: 0, notes: [], tool: {} } });
    const reload = mount();
    expect(screen.getByText(/1 tool has problems to fix/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText(/Fix all 1 with AI/)); });
    const fixCalls = calls.filter((c) => c.method === 'POST');
    expect(fixCalls.map((c) => c.url)).toEqual(['/api/admin/tools/a']);
    expect(fixCalls[0].body).toMatchObject({ action: 'fix' });
    expect(await screen.findByText(/Fix with AI: 1 of 1 fixed/)).toBeTruthy();
    expect(screen.getByText(/Alpha: Fixed \(2 problems cleared\)/)).toBeTruthy();
    expect(reload).toHaveBeenCalled();
  });

  it('says plainly when the AI could not fix a tool', async () => {
    respond = () => ({ status: 200, json: { applied: false, before: 2, after: 2, notes: ["The AI's correction was not applied: it would leave 3 problems (there are 2 now)."] } });
    mount();
    await act(async () => { fireEvent.click(screen.getByText(/Fix all 1 with AI/)); });
    expect(await screen.findByText(/was not applied/)).toBeTruthy();
    expect(screen.getByText(/0 of 1 fixed/)).toBeTruthy();
  });

  it('selects tools and deletes them in one go, after a confirmation, listing any that could not be deleted and why', async () => {
    respond = () => ({ status: 200, json: { results: [{ slug: 'a', ok: true }, { slug: 'b', ok: false, message: '2 people have saved work in this tool, so it cannot be deleted. Archive it instead.' }] } });
    const reload = mount();
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Beta'));
    expect(screen.getByText('2 selected')).toBeTruthy();
    await act(async () => { fireEvent.click(within(screen.getByRole('toolbar')).getByText('Delete')); });
    expect(confirm).toHaveBeenCalled();
    expect(calls.find((c) => c.url === '/api/admin/tools/bulk')!.body).toEqual({ action: 'delete', slugs: ['a', 'b'] });
    expect(await screen.findByText(/Beta: 2 people have saved work/)).toBeTruthy();
    expect(screen.getByText(/Alpha: Done/)).toBeTruthy();
    expect(reload).toHaveBeenCalled();
    expect(screen.getByText('1 selected')).toBeTruthy(); // the one that failed stays selected
  });

  it('does not delete when the person says no', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    mount();
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    await act(async () => { fireEvent.click(within(screen.getByRole('toolbar')).getByText('Delete')); });
    expect(calls.filter((c) => c.url.includes('/bulk'))).toHaveLength(0);
  });

  it('leaves live and hand-built tools out of "fix with AI"', async () => {
    respond = () => ({ status: 200, json: {} });
    mount();
    fireEvent.click(screen.getByLabelText('Select Gamma'));
    fireEvent.click(screen.getByLabelText('Select Business Model Canvas'));
    await act(async () => { fireEvent.click(within(screen.getByRole('toolbar')).getByText('Fix with AI')); });
    expect(await screen.findByText(/None of the selected tools can be fixed with AI/)).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('filters to only the tools with problems, and selects everything shown', () => {
    mount();
    fireEvent.click(screen.getByLabelText('Only with problems'));
    expect(screen.queryByText('Beta')).toBeNull();
    expect(screen.getByText('Alpha')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Select all shown'));
    expect(screen.getByText('1 selected')).toBeTruthy();
  });
});

describe('the add stage', () => {
  const settle = async () => { await act(async () => { await Promise.resolve(); }); };

  it('loads the proposed consulting list into the box with one click, one tool per line', async () => {
    respond = (c) => (c.url === '/api/admin/tools' ? { status: 200, json: { categories: ['Strategy'], practices: ['Strategy'], aiReady: true, tools: [] } } : { status: 200, json: {} });
    render(<AdminToolsPage />);
    await settle();
    fireEvent.click(screen.getByText(/Load the proposed consulting list/));
    const box = screen.getByLabelText('List of tool names') as HTMLTextAreaElement;
    expect(box.value).toBe(PROPOSED_LIST_TEXT);
    expect(box.value.split('\n').filter(Boolean)).toHaveLength(231);
    fireEvent.click(screen.getByText(/Clear the box/));
    expect(box.value).toBe('');
  });

  it('asks the AI for tools on a topic and adds them to the box for editing, nothing drafted yet', async () => {
    respond = (c) => {
      if (c.url === '/api/admin/tools') return { status: 200, json: { categories: ['Strategy'], practices: ['Strategy'], aiReady: true, tools: [] } };
      if (c.url === '/api/admin/tools/suggest') return { status: 200, json: { tools: [{ name: 'ADKAR Change Model', group: 'Programme and change' }, { name: 'Kotter 8 Steps', group: 'Programme and change' }] } };
      return { status: 200, json: {} };
    };
    render(<AdminToolsPage />);
    await settle();
    fireEvent.change(screen.getByLabelText(/Suggest tools with AI/), { target: { value: 'change management for a bank' } });
    await act(async () => { fireEvent.click(screen.getByText('Suggest 15 tools')); });
    const box = screen.getByLabelText('List of tool names') as HTMLTextAreaElement;
    expect(box.value).toBe('ADKAR Change Model | Programme and change\nKotter 8 Steps | Programme and change');
    expect(screen.getByText(/2 tools added to the list below/)).toBeTruthy();
    expect(calls.find((c) => c.url === '/api/admin/tools/suggest')!.body).toMatchObject({ topic: 'change management for a bank' });
    expect(calls.some((c) => c.url.includes('/import'))).toBe(false);
  });
});
