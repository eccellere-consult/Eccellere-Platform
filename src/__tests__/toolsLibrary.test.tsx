// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import LibraryBrowser, { type LibraryCard } from '@/app/consulting/library/LibraryBrowser';
import Workspace from '@/app/tools/[slug]/Workspace';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { PRACTICES } from '@/lib/tools/practice';
import { WINDOWS, gamePlanOf, windowOf } from '@/lib/tools/gameplan';
import type { FillinRow } from '@/lib/tools/repo';

afterEach(cleanup);

const cards: LibraryCard[] = [
  { slug: 'bmc', name: 'Business Model Canvas', practice: 'Strategy', category: 'Strategy', groupName: 'Business model', does: 'Describes how a business creates value.', live: false, handBuilt: true, layer: 'L2', stages: '1 to 5' },
  { slug: 'kaizen', name: 'Kaizen', practice: 'Process', category: 'Problem solving', groupName: 'Process improvement', does: 'Small continuous improvements.', live: true, handBuilt: false, layer: null, stages: null },
  { slug: 'capability-map', name: 'Capability Map', practice: 'Technology', category: 'Business analysis', groupName: null, does: 'Maps what the business can do.', live: false, handBuilt: false, layer: null, stages: null },
];

describe('the consulting library', () => {
  it('groups by practice, shows who can see each tool, and links into the library', () => {
    render(<LibraryBrowser tools={cards} practices={[...PRACTICES]} />);
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toContain('All 3');
    expect(tabs).toContain('Strategy 1');
    expect(tabs).toContain('Process 1');
    expect(tabs).toContain('Technology 1');
    expect(screen.getByRole('link', { name: /Business Model Canvas/ }).getAttribute('href')).toBe('/consulting/library/bmc');
    expect(screen.getAllByText('Live for clients')).toHaveLength(1);
    expect(screen.getAllByText('Library only')).toHaveLength(2);
    expect(screen.getByText('Hand-built')).toBeTruthy();
  });

  it('switches to the framework-layer view, where hand-built tools sit in their layer and the rest are "Other tools"', () => {
    render(<LibraryBrowser tools={cards} practices={[...PRACTICES]} />);
    fireEvent.click(screen.getByRole('tab', { name: 'By framework layer' }));
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toContain('L2 Business model 1');
    expect(tabs).toContain('Other tools 2');
    expect(screen.getByText(/Stages 1 to 5/)).toBeTruthy();
  });

  it('searches and narrows to one group', () => {
    render(<LibraryBrowser tools={cards} practices={[...PRACTICES]} />);
    fireEvent.change(screen.getByLabelText('Search the library'), { target: { value: 'maps what' } });
    expect(screen.getAllByRole('link')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Search the library'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('tab', { name: /^Process 1/ }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Kaizen/ })).toBeTruthy();
  });

  it('explains an empty library', () => {
    render(<LibraryBrowser tools={[]} practices={[...PRACTICES]} />);
    expect(screen.getByText(/library is empty/)).toBeTruthy();
  });
});

describe('the game plan', () => {
  it('puts a free-text timeframe in the right window', () => {
    expect(windowOf('Next 30 days')).toBe('Next 30 days');
    expect(windowOf('within 45 days')).toBe('30 to 60 days');
    expect(windowOf('30 to 60 days')).toBe('30 to 60 days');
    expect(windowOf('60 to 90 days')).toBe('60 to 90 days');
    expect(windowOf('90 days')).toBe('60 to 90 days');
    expect(windowOf('this month')).toBe('Next 30 days');
    expect(windowOf('Q3')).toBe('Later or not dated');
    expect(WINDOWS).toHaveLength(4);
  });

  it('collects actions from every tool, in windows, high priority first, with the tool they came from', () => {
    const row = (toolSlug: string, actionables: FillinRow['actionables']): FillinRow => ({
      id: toolSlug, userId: 'u', toolSlug, caseId: 0, fields: [], recommendations: [], actionables, analysis: null, analysisFingerprint: null,
      analysisAt: null, previousFields: null, previousReason: null, version: 1, updatedAt: new Date(),
    });
    const plan = gamePlanOf(
      [
        row('kaizen', [{ action: 'Start daily stand-ups', owner: 'Plant Manager', timeframe: 'Next 30 days', priority: 'Low' }, { action: ' ', owner: 'x', timeframe: 'Next 30 days', priority: 'High' }]),
        row('bmc', [{ action: 'Test the pricing model', owner: 'Commercial Head', timeframe: 'Next 30 days', priority: 'High' }, { action: 'Rework channels', owner: 'Sales Head', timeframe: '60 to 90 days', priority: 'Medium' }]),
      ],
      [{ slug: 'kaizen', name: 'Kaizen' }, { slug: 'bmc', name: 'Business Model Canvas' }],
    );
    expect(plan.total).toBe(3); // the blank action is dropped
    expect(plan.windows[0].items.map((i) => i.action)).toEqual(['Test the pricing model', 'Start daily stand-ups']);
    expect(plan.windows[0].items[0].toolName).toBe('Business Model Canvas');
    expect(plan.windows[2].items.map((i) => i.action)).toEqual(['Rework channels']);
  });
});

describe('the worksheet for library tools', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('print', vi.fn());
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      if (String(url).endsWith('/ai') && body?.action === 'questions') {
        return { ok: true, status: 200, text: async () => JSON.stringify({ questions: [{ question: 'Which two fixes would the finance director reject on sight?', why: 'Surfaces a veto before scoring.' }, { question: 'What does a late invoice cost per day?', why: 'Sets the value scale.' }, { question: 'Who owns the customer relationship at the largest accounts?', why: 'Finds the owner for the plan.' }] }) } as Response;
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ record: null }) } as Response;
    }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); try { localStorage.clear(); } catch { /* ignore */ } });

  const open = async (props: Partial<React.ComponentProps<typeof Workspace>> = {}) => {
    render(<Workspace slug="impact-effort-matrix" toolName="Impact-Effort Matrix" definition={EXAMPLE_TOOL} sample={EXAMPLE_TOOL.sample!} {...props} />);
    await screen.findByText(/parts answered/);
  };

  it('shows the fictional worked example on request, labelled, and leaves the worksheet untouched', async () => {
    await open();
    expect(screen.queryByLabelText('Worked example')).toBeNull();
    fireEvent.click(screen.getByText(/See a worked example/));
    const panel = screen.getByLabelText('Worked example');
    expect(panel.textContent).toContain('Worked example (fictional)');
    expect(panel.textContent).toContain('regional distributor');
    expect(panel.textContent).toContain('Automatic payment reminders');
    expect(panel.textContent).toContain('not saved');
    expect((screen.getByLabelText(/What are we choosing between/) as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByLabelText('Worked example')).toBeNull();
  });

  it('offers no example button when a tool has none', async () => {
    await open({ sample: null });
    expect(screen.queryByText(/worked example/i)).toBeNull();
  });

  it('suggests questions for the situation, keeps them in this browser, and can clear them', async () => {
    await open();
    const button = screen.getByText(/Suggest questions for my situation/).closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true); // needs a situation first
    fireEvent.change(screen.getByLabelText('Your situation'), { target: { value: 'Late invoices at a distributor' } });
    expect(button.disabled).toBe(false);
    await act(async () => { fireEvent.click(button); });
    expect(await screen.findByText(/Which two fixes would the finance director reject/)).toBeTruthy();
    expect(screen.getByText('Surfaces a veto before scoring.')).toBeTruthy();
    expect(localStorage.getItem('tools.brief.impact-effort-matrix')).toBe('Late invoices at a distributor');
    fireEvent.click(screen.getByText('Clear these questions'));
    expect(screen.queryByText(/Which two fixes/)).toBeNull();
  });

  it('opens a hand-built Strategy Hub tool from its id, with its own sections', async () => {
    render(<Workspace slug="bmc" toolName="Business Model Canvas" toolId="bmc" sample={null} />);
    expect(await screen.findByText(/parts answered/, undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getAllByText(/Customer Segments/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Value Propositions/).length).toBeGreaterThan(0);
  });
});

