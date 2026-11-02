/**
 * diagramTemplates.test.ts — the generic reference diagrams: every template draws a well-formed, accessible, deterministic SVG that names every
 * element it was given, escapes hostile text, and refuses a spec that cannot be drawn.
 */
import { describe, expect, it } from 'vitest';
import { diagramIssues, renderDiagram, type DiagramSpec } from '../lib/strategyModels/diagrams/templates';

const axis = (label: string) => ({ label, low: 'low end', high: 'high end' });
const SPECS: { name: string; spec: DiagramSpec; labels: string[] }[] = [
  { name: 'matrix2x2', spec: { template: 'matrix2x2', title: 'Impact and effort', xAxis: axis('Effort'), yAxis: axis('Impact'), quadrants: [{ name: 'Quick win', hint: 'Do these first', tone: 'good' }, { name: 'Major project', tone: 'warn' }, { name: 'Fill-in' }, { name: 'Avoid', tone: 'bad' }], caption: 'Start top left.' }, labels: ['quick win', 'do these first', 'major project', 'fill-in', 'avoid', 'effort', 'impact', 'low end', 'high end', 'start top left.'] },
  { name: 'matrix3x3', spec: { template: 'matrix3x3', title: 'Attractiveness and strength', xAxis: axis('Strength'), yAxis: axis('Attractiveness'), cells: ['Hold', 'Invest', 'Invest', 'Harvest', 'Hold', 'Invest', 'Divest', 'Harvest', 'Hold'] }, labels: ['invest', 'hold', 'harvest', 'divest', 'strength', 'attractiveness'] },
  { name: 'steps', spec: { template: 'steps', title: 'Four steps', steps: [{ name: 'Define' }, { name: 'Measure', hint: 'Get the facts' }, { name: 'Analyse' }, { name: 'Improve' }, { name: 'Control' }] }, labels: ['define', 'measure', 'get the facts', 'analyse', 'improve', 'control'] },
  { name: 'cycle', spec: { template: 'cycle', title: 'Plan do check act', steps: [{ name: 'Plan' }, { name: 'Do' }, { name: 'Check' }, { name: 'Act' }] }, labels: ['plan', 'do', 'check', 'act'] },
  { name: 'canvasGrid', spec: { template: 'canvasGrid', title: 'A canvas', cols: 3, rows: 2, boxes: [{ name: 'Problem', col: 0, row: 0, rowSpan: 2 }, { name: 'Solution', hint: 'What we do', col: 1, row: 0 }, { name: 'Metrics', col: 2, row: 0 }, { name: 'Channels', col: 1, row: 1, colSpan: 2 }] }, labels: ['problem', 'solution', 'what we do', 'metrics', 'channels'] },
  { name: 'scale', spec: { template: 'scale', title: 'A maturity scale', levels: [{ name: 'Ad hoc' }, { name: 'Repeatable' }, { name: 'Defined', hint: 'Written down' }, { name: 'Managed' }] }, labels: ['ad hoc', 'repeatable', 'defined', 'written down', 'managed'] },
];

const textOf = (svg: string) => [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, '')).join(' ').toLowerCase();

function balanced(svg: string): boolean {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    if (m[3] === '/') continue;
    if (m[1] === '/') { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
  }
  return stack.length === 0;
}

describe.each(SPECS)('the $name template', ({ spec, labels }) => {
  const out = renderDiagram(spec);
  it('is a well-formed, accessible 720 x 440 figure', () => {
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(balanced(out)).toBe(true);
    expect(out).toContain('viewBox="0 0 720 440"');
    expect(out).toContain('role="img"');
    expect(out).toMatch(/<title id="dg-title">.{4,}<\/title>/);
    expect(out).toMatch(/<desc id="dg-desc">.{40,}<\/desc>/);
    expect(out).not.toMatch(/NaN|undefined|\[object/);
  });
  it('keeps every text at least 9.5 px', () => {
    const sizes = [...out.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(9.5);
  });
  it('draws the same figure for the same input, and names every element it was given', () => {
    expect(renderDiagram(spec)).toBe(out);
    const t = textOf(out);
    for (const l of labels) expect(t, l).toContain(l);
  });
});

describe('what a template will not draw', () => {
  it('escapes hostile text', () => {
    const out = renderDiagram({ template: 'steps', title: '<b>x</b>', steps: [{ name: '<script>alert(1)</script>' }, { name: 'A & B' }, { name: 'Three' }] });
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('A &amp; B');
  });
  it('refuses a spec that cannot be drawn, with a reason in plain words', () => {
    expect(diagramIssues({ template: 'steps', title: 't', steps: [{ name: 'one' }] })[0]).toMatch(/3 to 8 steps/);
    expect(diagramIssues({ template: 'matrix3x3', title: 't', xAxis: axis('a'), yAxis: axis('b'), cells: ['x'] })[0]).toMatch(/9 cells/);
    expect(diagramIssues({ template: 'canvasGrid', title: 't', cols: 2, rows: 1, boxes: [{ name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0, colSpan: 2 }] })[0]).toMatch(/inside the grid/);
    expect(diagramIssues({ template: 'scale', title: '', levels: [{ name: 'a' }, { name: 'b' }] }).length).toBe(2);
    expect(() => renderDiagram({ template: 'cycle', title: 't', steps: [] })).toThrow(/cannot be drawn/);
  });
  it('is checked by the quality gate through the same function', () => {
    expect(diagramIssues(SPECS[0].spec)).toEqual([]);
  });
});
