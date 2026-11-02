// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ToolsBrowser, { type ToolCard } from '@/app/tools/ToolsBrowser';
import { MARKET_CATEGORIES } from '@/lib/tools/service';

afterEach(cleanup);

const tools: ToolCard[] = [
  { slug: '5-why-analysis', name: '5 Why Analysis', category: 'Problem solving', groupName: 'Root cause', does: 'Asks why repeatedly to reach a root cause.', level: 'L2' },
  { slug: 'pugh-matrix', name: 'Pugh Matrix', category: 'Decision Models', groupName: 'Decision making', does: 'Compares options against a baseline on weighted criteria.', level: 'L1' },
  { slug: 'okr', name: 'OKR', category: 'Strategy', groupName: null, does: 'Links objectives to measurable key results.', level: null },
];

describe('tools grid', () => {
  it('lists every tool with its section, links each to its page, and only shows sections that have tools', () => {
    render(<ToolsBrowser tools={tools} categories={[...MARKET_CATEGORIES]} />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /5 Why Analysis/ }).getAttribute('href')).toBe('/tools/5-why-analysis');
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['All', 'Problem solving1', 'Strategy1', 'Decision Models1']);
  });

  it('filters by section and by search words (name, group or description)', () => {
    render(<ToolsBrowser tools={tools} categories={[...MARKET_CATEGORIES]} />);
    fireEvent.click(screen.getByRole('tab', { name: /Strategy/ }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    fireEvent.change(screen.getByLabelText('Search tools'), { target: { value: 'root cause' } });
    expect(screen.getAllByRole('link')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Search tools'), { target: { value: 'baseline' } });
    expect(screen.getByRole('link', { name: /Pugh Matrix/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search tools'), { target: { value: 'zzzz' } });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(/No tool matches/)).toBeTruthy();
  });

  it('shows a friendly empty state before anything is published', () => {
    render(<ToolsBrowser tools={[]} categories={[...MARKET_CATEGORIES]} />);
    expect(screen.getByText(/first tools are being prepared/)).toBeTruthy();
  });
});
