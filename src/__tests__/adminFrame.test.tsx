// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

const where = { path: '/admin/forms/classify' };
vi.mock('next/navigation', () => ({ usePathname: () => where.path }));
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
import AdminFrame, { TitleBlock } from '@/components/standard/AdminFrame';
import { ADMIN_GROUPS, ADMIN_ITEMS, activeItem } from '@/lib/admin/menu';

afterEach(cleanup);

describe('the admin menu catalogue (the guard)', () => {
  it('lists every admin screen that exists, so none can arrive without a menu entry', () => {
    const root = path.join(process.cwd(), 'src/app/admin');
    const screens = fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => [d.name, ...fs.readdirSync(path.join(root, d.name), { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => `${d.name}/${x.name}`)])
      .filter((rel) => fs.existsSync(path.join(root, rel, 'page.tsx')))
      .map((rel) => `/admin/${rel}`);
    const listed = ADMIN_ITEMS.map((i) => i.href);
    expect(screens.filter((s) => !listed.includes(s))).toEqual([]);
    expect(listed.filter((h) => h !== '/admin' && !screens.includes(h))).toEqual([]);
  });
  it('works out the current entry from the address, longest match first', () => {
    expect(activeItem('/admin')?.label).toBe('Dashboard');
    expect(activeItem('/admin/forms')?.label).toBe('Build');
    expect(activeItem('/admin/forms/classify')?.label).toBe('Classify and deepen');
    expect(activeItem('/admin/tools')?.group.stages).toBe(true);
    expect(activeItem('/admin/users')?.group.stages).toBeUndefined();
  });
});

describe('the standard admin frame', () => {
  it('has the whole menu on every screen, marks the current one, and a breadcrumb back to Admin', () => {
    where.path = '/admin/users';
    render(<AdminFrame><p>the work</p></AdminFrame>);
    const nav = screen.getAllByRole('navigation', { name: 'Admin' })[0];
    for (const g of ADMIN_GROUPS) for (const i of g.items) expect(within(nav).getByRole('link', { name: i.label }).getAttribute('href')).toBe(i.href);
    expect(within(nav).getByRole('link', { name: 'Users' }).getAttribute('aria-current')).toBe('page');
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin');
    expect(screen.queryByRole('list', { name: 'Stages' })).toBeNull();
    expect(screen.getByText('the work')).toBeTruthy();
  });
  it('is fixed to the left edge so it never moves or vanishes while the person clicks around', () => {
    where.path = '/admin/tools';
    render(<AdminFrame><p>x</p></AdminFrame>);
    const aside = document.querySelector('aside')!;
    expect(aside.className).toMatch(/\bfixed\b/);
    expect(aside.className).toMatch(/inset-y-0/);
  });
  it('shows the same numbered Stage strip on the three tools-marketplace screens', () => {
    where.path = '/admin/forms/classify';
    render(<AdminFrame><p>x</p></AdminFrame>);
    const stages = within(screen.getByRole('list', { name: 'Stages' })).getAllByRole('link');
    expect(stages).toHaveLength(3);
    expect(stages[1].getAttribute('aria-current')).toBe('step');
    expect(stages[0].textContent).toContain('Stage 1');
  });
  it('opens every page with kicker, title and one sentence of purpose', () => {
    render(<TitleBlock kicker="Stage 1" title="Build a form" purpose="Why." />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Build a form');
    expect(screen.getByText('Stage 1')).toBeTruthy();
  });
});
