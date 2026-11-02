import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import AdminToolsPage from '@/app/admin/tools/page';
import ReviewPanel from '@/app/admin/tools/ReviewPanel';

// Smoke test: the pages build and draw their first screen without a browser or a database.
describe('admin tools screens', () => {
  it('draws the add-tools screen with both ways of adding and the seven-category drop-down placeholder', () => {
    const html = renderToString(createElement(AdminToolsPage));
    expect(html).toContain('Tools marketplace');
    expect(html).toContain('Paste or upload a list');
    expect(html).toContain('Write one tool');
    expect(html).toContain('Upload a file');
    expect(html).toContain('Auto: decide from the list');
    expect(html).toContain('Review and publish');
    expect(html).toContain('No tools yet');
  });
  it('draws the review panel loading state', () => {
    const html = renderToString(createElement(ReviewPanel, { slug: 'x', categories: ['Strategy'], onChanged: () => {}, onClose: () => {} }));
    expect(html).toContain('Loading');
  });
});
