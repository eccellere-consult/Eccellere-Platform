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
    expect(html).toContain('Upload a list');
    expect(html).toContain('.pdf, .docx, .pptx');
    expect(html).toContain('Upload a document as source');
    expect(html).toContain('Consulting practice');
    expect(html).toContain('Strategy Hub tools');
    expect(html).toContain('Skill files');
    expect(html).toContain('Auto: decide from the list');
    expect(html).toContain('Review, fix and publish');
    expect(html).toContain('Load the proposed consulting list');
    expect(html).toContain('Suggest tools with AI');
    expect(html).toContain('No tools yet');
  });
  it('draws the review panel loading state', () => {
    const html = renderToString(createElement(ReviewPanel, { slug: 'x', categories: ['Strategy'], practices: ['Strategy'], onChanged: () => {}, onClose: () => {} }));
    expect(html).toContain('Loading');
  });
});
