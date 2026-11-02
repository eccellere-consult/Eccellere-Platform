// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ToolFrame, { TOOL_STAGES } from '@/components/standard/ToolFrame';

beforeAll(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
});
afterEach(cleanup);

const groups = [
  { category: 'Decision Models', tools: [{ slug: 'impact-effort', name: 'Impact-Effort Matrix' }, { slug: 'rice', name: 'RICE' }] },
  { category: 'Strategy', tools: [{ slug: 'ansoff', name: 'Ansoff Matrix' }] },
];
const frame = () => render(<ToolFrame groups={groups} slug="impact-effort" name="Impact-Effort Matrix" category="Decision Models"><p>the tool</p></ToolFrame>);

describe('the standard tool frame', () => {
  it('puts a labelled menu on the left, marks the open tool, and keeps the tool on the right', () => {
    frame();
    const nav = screen.getAllByRole('navigation', { name: 'Tools' })[0];
    expect(within(nav).getByRole('link', { name: 'Impact-Effort Matrix' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Ansoff Matrix' }).getAttribute('href')).toBe('/tools/ansoff');
    expect(screen.getByText('the tool')).toBeTruthy();
  });

  it('shows a breadcrumb that is also the way back, and the same three numbered stages', () => {
    frame();
    const crumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumb).getByRole('link', { name: 'Tools' }).getAttribute('href')).toBe('/tools');
    const stages = within(screen.getByRole('list', { name: 'Stages' })).getAllByRole('link');
    expect(stages).toHaveLength(TOOL_STAGES.length);
    expect(stages[1].getAttribute('href')).toBe('#stage-2');
    expect(stages[0].textContent).toContain('Stage 1');
  });

  it('opens the menu as a drawer on a phone and closes it with Escape', () => {
    frame();
    fireEvent.click(screen.getByLabelText('Open the tools menu'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
