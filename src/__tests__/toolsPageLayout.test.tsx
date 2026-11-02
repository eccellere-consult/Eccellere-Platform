// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ToolPageView from '@/app/tools/ToolPageView';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { renderDiagram } from '@/lib/strategyModels/diagrams/templates';
import { worksheetText } from '@/lib/tools/worksheetText';
import { interpret } from '@/lib/strategyModels/declarative';
import type { ToolRecord } from '@/lib/tools/repo';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const tool = (over: Partial<ToolRecord> = {}): ToolRecord => ({
  id: '1', slug: EXAMPLE_TOOL.slug, name: EXAMPLE_TOOL.name, category: 'Decision Models', groupName: 'Prioritisation', practice: 'Strategy', status: 'PUBLISHED', source: 'ai',
  does: EXAMPLE_TOOL.does, whenToUse: EXAMPLE_TOOL.whenToUse, whenNotToUse: EXAMPLE_TOOL.whenNotToUse ?? null, definition: EXAMPLE_TOOL,
  quality: null, provenance: null, reviewedById: null, reviewedAt: null, publishedAt: null, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), ...over,
});
const view = (t = tool(), mode: 'client' | 'library' = 'client') => render(<ToolPageView tool={t} signedIn={false} mode={mode} backHref="/tools" backLabel="Back to all tools" signInHref="/login" />);

describe('the tool page follows the Strategy Hub layout', () => {
  it('shows the title with its chips, then the reference model, about, how to read, the three notes and the golden thread, in that order', () => {
    const { container } = view();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Impact-Effort Matrix');
    const text = container.textContent ?? '';
    const at = (s: string) => { const i = text.indexOf(s); expect(i, s).toBeGreaterThan(-1); return i; };
    const order = ['Reference model', 'About this model', 'How to read it', 'What this does', 'When to use it', 'What happens next', 'Golden thread'].map(at);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text).toContain('Builds on');
    expect(text).toContain('Option long-list');
    expect(text).toContain('Feeds into');
    expect(text).toContain('90-day action plan');
    expect(screen.getByText('Decision Models')).toBeTruthy();
    expect(screen.getByText('Prioritisation')).toBeTruthy();
    expect(screen.getByText(/Not when: /)).toBeTruthy();
  });

  it('draws the diagram in a frame with a caption and an Enlarge button that opens it larger and closes again', () => {
    const { container } = view();
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(1);
    expect(screen.getByText(/Impact rises upwards/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Enlarge/));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Quick wins')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('leaves out the golden thread when a tool names nothing, and says so about the originator', () => {
    const bare = { ...EXAMPLE_TOOL, links: undefined };
    const { container } = view(tool({ definition: bare }));
    expect(container.textContent).not.toContain('Golden thread');
    expect(container.textContent).toContain('Originator not stated.');
  });

  it('says in the library whether clients can see the tool', () => {
    view(tool({ status: 'REVIEWED' }), 'library');
    expect(screen.getByText(/Consulting library only/)).toBeTruthy();
  });
});

describe('the quadrant diagram', () => {
  it('draws each quadrant with its name, its hint and a small tag, like the hand-built diagrams', () => {
    const svg = renderDiagram(EXAMPLE_TOOL.diagram!);
    for (const t of ['Quick wins', 'Do first', 'Big bets', 'Plan', 'Money pits', 'Avoid', 'High impact for low effort.']) expect(svg).toContain(t);
    // a tag is optional: a spec without tags still draws
    const plain = { ...EXAMPLE_TOOL.diagram!, quadrants: EXAMPLE_TOOL.diagram!.template === 'matrix2x2' ? EXAMPLE_TOOL.diagram!.quadrants.map((q) => ({ name: q.name })) : [] } as never;
    expect(renderDiagram(plain)).toContain('Quick wins');
  });
});

describe('the download', () => {
  it('lists the answers by section, leaves unknowns marked, and adds the analysis and the action plan', () => {
    const def = interpret(EXAMPLE_TOOL);
    const text = worksheetText({
      toolName: 'Impact-Effort Matrix', def,
      values: { fields: { decision: 'Pick fixes for the quarter' }, tables: { options: [{ option: 'Reminders', impact: '4', effort: '2' }, {}] } },
      analysis: { summary: 'Start with reminders.', verdict: { label: 'Start small', rationale: 'Best ratio.' }, findings: [{ title: 'Reminders win', detail: 'Impact 4 for effort 2.' }], watchouts: ['Scores are unevidenced'] } as never,
      recommendations: [{ text: 'Switch reminders on' }] as never,
      actionables: [{ action: 'Turn on reminders', owner: 'Finance Manager', timeframe: 'Next 30 days', priority: 'High' }] as never,
    });
    expect(text).toContain('What are we choosing between?: Pick fixes for the quarter');
    expect(text).toContain('What does success look like?: not known');
    expect(text).toContain('1. Option: Reminders | Impact: 4 | Effort: 2');
    expect(text).not.toContain('Impact per effort'); // worked-out columns are not answers
    expect(text).toContain('Start small: Best ratio.');
    expect(text).toContain('1. Turn on reminders (Finance Manager; Next 30 days; High)');
  });
});
