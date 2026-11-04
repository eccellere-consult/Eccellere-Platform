// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

const path = '/admin/forms/classify';
vi.mock('next/navigation', () => ({ usePathname: () => path }));
import AdminFrame, { ADMIN_STAGES, TitleBlock, stageFor } from '@/components/standard/AdminFrame';

afterEach(cleanup);

describe('the standard admin frame', () => {
  it('works out the stage from the address, longest match first', () => {
    expect(stageFor('/admin/forms').n).toBe(1);
    expect(stageFor('/admin/forms/classify').n).toBe(2);
    expect(stageFor('/admin/tools').n).toBe(3);
  });
  it('has a labelled menu, a breadcrumb back to Admin and the same numbered Stage strip', () => {
    render(<AdminFrame><p>the work</p></AdminFrame>);
    expect(within(screen.getAllByRole('navigation', { name: 'Admin' })[0]).getByRole('link', { name: '3. Tools marketplace' })).toBeTruthy();
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin');
    const stages = within(screen.getByRole('list', { name: 'Stages' })).getAllByRole('link');
    expect(stages).toHaveLength(ADMIN_STAGES.length);
    expect(stages[1].getAttribute('aria-current')).toBe('step');
    expect(stages[0].textContent).toContain('Stage 1');
    expect(screen.getByText('the work')).toBeTruthy();
  });
  it('opens every page with kicker, title and one sentence of purpose', () => {
    render(<TitleBlock kicker="Stage 1" title="Build a form" purpose="Why." />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Build a form');
    expect(screen.getByText('Stage 1')).toBeTruthy();
  });
});
