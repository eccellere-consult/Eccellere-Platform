/**
 * diagrams/templates.ts — generic reference diagrams for tools defined as data (see ../declarative.ts). A hand-coded tool draws its own
 * original diagram; a declarative tool names one of these templates and gives it its words, so an admin or an AI can add a tool with a
 * correct picture and no drawing code.
 *
 * Every template follows the house rules of svg.ts: 720 x 440, role="img" with a title and a description that narrates the whole figure,
 * real <text> (selectable and testable), nothing smaller than 9.5 px, sharp corners, the brand palette, and the same output for the same input.
 * A tool that fits no template simply has no diagram: the page shows its reference card only.
 */
import { C, badge, box, caption, line, rect, svg, text } from './svg';

export interface Axis { label: string; low: string; high: string }
export type Tone4 = 'good' | 'warn' | 'bad' | 'neutral';
export interface Quad { name: string; hint?: string; tone?: Tone4 }
export interface Step { name: string; hint?: string }

export type DiagramSpec =
  /** Quadrants in reading order: top-left, top-right, bottom-left, bottom-right. The vertical axis rises upwards, the horizontal one to the right. */
  | { template: 'matrix2x2'; title: string; xAxis: Axis; yAxis: Axis; quadrants: [Quad, Quad, Quad, Quad]; caption?: string }
  /** Nine cells in reading order (top row first). */
  | { template: 'matrix3x3'; title: string; xAxis: Axis; yAxis: Axis; cells: string[]; caption?: string }
  | { template: 'steps'; title: string; steps: Step[]; caption?: string }
  | { template: 'cycle'; title: string; steps: Step[]; caption?: string }
  | { template: 'canvasGrid'; title: string; cols: number; rows: number; boxes: { name: string; hint?: string; col: number; row: number; colSpan?: number; rowSpan?: number }[]; caption?: string }
  /** Levels from the lowest to the highest, drawn as a staircase. */
  | { template: 'scale'; title: string; levels: Step[]; caption?: string };

const TONE: Record<Tone4, { fill: string; stroke: string }> = {
  good: { fill: C.tealPale, stroke: C.teal },
  warn: { fill: C.goldPale, stroke: C.gold },
  bad: { fill: C.brickPale, stroke: C.brick },
  neutral: { fill: C.cream, stroke: C.border },
};

/** What is wrong with a spec, in plain words (empty when it can be drawn). Used by the quality gate before anything is saved. */
export function diagramIssues(d: DiagramSpec): string[] {
  const out: string[] = [];
  const need = (ok: boolean, msg: string) => { if (!ok) out.push(msg); };
  need(!!d.title?.trim(), 'The diagram needs a title');
  switch (d.template) {
    case 'matrix2x2':
      need(Array.isArray(d.quadrants) && d.quadrants.length === 4 && d.quadrants.every((q) => q.name?.trim()), 'A 2x2 needs exactly 4 named quadrants');
      need(!!d.xAxis?.label && !!d.yAxis?.label, 'A 2x2 needs a label on both axes');
      break;
    case 'matrix3x3':
      need(Array.isArray(d.cells) && d.cells.length === 9, 'A 3x3 needs exactly 9 cells');
      need(!!d.xAxis?.label && !!d.yAxis?.label, 'A 3x3 needs a label on both axes');
      break;
    case 'steps': case 'cycle': {
      const n = d.steps?.length ?? 0;
      need(n >= 3 && n <= 8, `A ${d.template} needs 3 to 8 steps (it has ${n})`);
      need((d.steps ?? []).every((s) => s.name?.trim()), 'Every step needs a name');
      break;
    }
    case 'scale': {
      const n = d.levels?.length ?? 0;
      need(n >= 3 && n <= 7, `A scale needs 3 to 7 levels (it has ${n})`);
      break;
    }
    case 'canvasGrid':
      need(d.cols >= 1 && d.cols <= 6 && d.rows >= 1 && d.rows <= 5, 'A canvas grid has 1 to 6 columns and 1 to 5 rows');
      need((d.boxes ?? []).length >= 2 && (d.boxes ?? []).every((b) => b.col >= 0 && b.row >= 0 && b.col + (b.colSpan ?? 1) <= d.cols && b.row + (b.rowSpan ?? 1) <= d.rows && !!b.name?.trim()), 'Every box must be named and sit inside the grid');
      break;
    default: out.push('Unknown diagram template');
  }
  return out;
}

const cut = (s: string | undefined, n: number) => ((s ?? '').length > n ? `${(s as string).slice(0, n - 1).trimEnd()}…` : (s ?? ''));
const cap = (d: { caption?: string }, y = 428) => (d.caption ? text(360, y, cut(d.caption, 120), { size: 10.5, fill: C.inkLight, italic: true, anchor: 'middle' }) : '');

function axes(x0: number, y0: number, w: number, h: number, xa: Axis, ya: Axis): string {
  let b = line(x0, y0 + h + 10, x0 + w, y0 + h + 10, { arrow: 'end', gold: true, sw: 1.6 }) + line(x0 - 10, y0 + h, x0 - 10, y0, { arrow: 'end', gold: true, sw: 1.6 });
  b += text(x0, y0 + h + 28, cut(xa.low, 28), { size: 10.5, fill: C.inkLight, italic: true });
  b += text(x0 + w, y0 + h + 28, cut(xa.high, 28), { size: 10.5, fill: C.inkLight, italic: true, anchor: 'end' });
  b += caption(x0 + w / 2, y0 + h + 28, cut(xa.label, 36));
  b += text(x0 - 22, y0 + h, cut(ya.low, 24), { size: 10.5, fill: C.inkLight, italic: true, rotate: -90 });
  b += text(x0 - 22, y0 + 6, cut(ya.high, 24), { size: 10.5, fill: C.inkLight, italic: true, rotate: -90, anchor: 'end' });
  b += caption(x0 - 40, y0 + h / 2, cut(ya.label, 30), 'middle', -90);
  return b;
}

function matrix2x2(d: Extract<DiagramSpec, { template: 'matrix2x2' }>): string {
  const x0 = 104, y0 = 36, w = 560, h = 320, cw = w / 2, ch = h / 2;
  let body = '';
  d.quadrants.forEach((q, i) => {
    const t = TONE[q.tone ?? 'neutral'];
    body += box(x0 + (i % 2) * cw + 2, y0 + Math.floor(i / 2) * ch + 2, cw - 4, ch - 4, q.name, q.hint ? [cut(q.hint, 90)] : [], { fill: t.fill, stroke: t.stroke, align: 'start', valign: 'top' });
  });
  body += axes(x0, y0, w, h, d.xAxis, d.yAxis) + cap(d);
  return svg({
    title: d.title,
    desc: `A two-by-two grid. The horizontal axis is ${d.xAxis.label}, from ${d.xAxis.low} to ${d.xAxis.high}. The vertical axis is ${d.yAxis.label}, from ${d.yAxis.low} to ${d.yAxis.high}. The four quadrants are ${d.quadrants.map((q, i) => `${['top left', 'top right', 'bottom left', 'bottom right'][i]}: ${q.name}`).join('; ')}.`,
  }, body);
}

function matrix3x3(d: Extract<DiagramSpec, { template: 'matrix3x3' }>): string {
  const x0 = 104, y0 = 30, w = 540, h = 330, cw = w / 3, ch = h / 3;
  let body = '';
  d.cells.forEach((name, i) => {
    const heat = (i % 3) - Math.floor(i / 3); // rises towards the top-right
    const t = heat >= 1 ? TONE.good : heat <= -1 ? TONE.bad : TONE.warn;
    body += box(x0 + (i % 3) * cw + 2, y0 + Math.floor(i / 3) * ch + 2, cw - 4, ch - 4, name, [], { fill: t.fill, stroke: t.stroke, titleSize: 13 });
  });
  body += axes(x0, y0, w, h, d.xAxis, d.yAxis) + cap(d);
  return svg({
    title: d.title,
    desc: `A three-by-three grid. The horizontal axis is ${d.xAxis.label}, from ${d.xAxis.low} to ${d.xAxis.high}. The vertical axis is ${d.yAxis.label}, from ${d.yAxis.low} to ${d.yAxis.high}. The cells, top row first, are ${d.cells.join(', ')}.`,
  }, body);
}

function steps(d: Extract<DiagramSpec, { template: 'steps' }>): string {
  const n = d.steps.length, perRow = n <= 4 ? n : Math.ceil(n / 2), rows = Math.ceil(n / perRow), gap = 30;
  const bw = (672 - (perRow - 1) * gap) / perRow, bh = 132, top = rows === 1 ? 150 : 56;
  let body = '';
  d.steps.forEach((s, i) => {
    const r = Math.floor(i / perRow), c = i % perRow, x = 24 + c * (bw + gap), y = top + r * (bh + 44);
    body += box(x, y, bw, bh, s.name, s.hint ? [cut(s.hint, 80)] : [], { fill: i === n - 1 ? C.goldPale : C.cream, stroke: i === n - 1 ? C.gold : C.border, valign: 'top' });
    body += badge(x + 14, y + 14, String(i + 1), C.gold, 9.5);
    if (c < perRow - 1 && i < n - 1) body += line(x + bw + 3, y + bh / 2, x + bw + gap - 3, y + bh / 2, { arrow: 'end' });
    if (c === perRow - 1 && r < rows - 1) body += line(x + bw / 2, y + bh + 3, x + bw / 2, y + bh + 41, { arrow: 'end', dash: '4 3' });
  });
  body += cap(d);
  return svg({ title: d.title, desc: `A sequence of ${n} steps, read from the first to the last: ${d.steps.map((s, i) => `${i + 1}, ${s.name}`).join('; ')}.` }, body);
}

function cycle(d: Extract<DiagramSpec, { template: 'cycle' }>): string {
  const n = d.steps.length, cx = 360, cy = 214, rx = 236, ry = 150, bw = 164, bh = 66;
  const pos = d.steps.map((_, i) => { const a = (-90 + (i * 360) / n) * (Math.PI / 180); return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }; });
  let body = '';
  pos.forEach((p, i) => {
    const q = pos[(i + 1) % n];
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, k = 46;
    body += line(p.x + (dx / len) * k, p.y + (dy / len) * (k * 0.62), q.x - (dx / len) * k, q.y - (dy / len) * (k * 0.62), { arrow: 'end', gold: true, sw: 1.6 });
  });
  d.steps.forEach((s, i) => {
    body += box(pos[i].x - bw / 2, pos[i].y - bh / 2, bw, bh, s.name, s.hint ? [cut(s.hint, 44)] : [], { fill: C.cream, stroke: C.border, titleSize: 12.5, bodySize: 10 });
    body += badge(pos[i].x - bw / 2 + 12, pos[i].y - bh / 2 + 12, String(i + 1), C.gold, 9.5);
  });
  body += cap(d);
  return svg({ title: d.title, desc: `A cycle of ${n} steps that repeats: ${d.steps.map((s, i) => `${i + 1}, ${s.name}`).join('; ')}; after the last step the cycle returns to the first.` }, body);
}

function canvasGrid(d: Extract<DiagramSpec, { template: 'canvasGrid' }>): string {
  const x0 = 24, y0 = 20, w = 672, h = 384, g = 6, cw = (w - (d.cols - 1) * g) / d.cols, ch = (h - (d.rows - 1) * g) / d.rows;
  let body = '';
  d.boxes.forEach((b, i) => {
    const bw = cw * (b.colSpan ?? 1) + g * ((b.colSpan ?? 1) - 1), bh = ch * (b.rowSpan ?? 1) + g * ((b.rowSpan ?? 1) - 1);
    body += box(x0 + b.col * (cw + g), y0 + b.row * (ch + g), bw, bh, b.name, b.hint ? [cut(b.hint, 110)] : [], { fill: i === 0 ? C.goldPale : C.cream, stroke: i === 0 ? C.gold : C.border, valign: 'top', align: 'start' });
  });
  return svg({ title: d.title, desc: `A canvas of ${d.boxes.length} boxes laid out on a grid of ${d.cols} columns and ${d.rows} rows: ${d.boxes.map((b) => b.name).join(', ')}.` }, body + cap(d, 432));
}

function scale(d: Extract<DiagramSpec, { template: 'scale' }>): string {
  const n = d.levels.length, x0 = 36, w = 648 / n, bh = 92;
  let body = '';
  d.levels.forEach((s, i) => {
    const y = 330 - i * (240 / (n - 1));
    body += box(x0 + i * w + 2, y, w - 4, bh, s.name, s.hint ? [cut(s.hint, 52)] : [], { fill: i === n - 1 ? C.tealPale : i === 0 ? C.brickPale : C.cream, stroke: i === n - 1 ? C.teal : i === 0 ? C.brick : C.border, valign: 'top', titleSize: 12.5, bodySize: 10 });
    body += rect(x0 + i * w + 2, y + bh, w - 4, 420 - (y + bh), { fill: C.cream, stroke: C.border, sw: 0.8, opacity: 0.6 });
  });
  body += line(x0 + 8, 406, x0 + 648 - 8, 406, { arrow: 'end', gold: true, sw: 1.6 }) + cap(d, 430);
  return svg({ title: d.title, desc: `A scale of ${n} levels rising from the lowest to the highest: ${d.levels.map((s, i) => `${i + 1}, ${s.name}`).join('; ')}.` }, body);
}

/** The picture for a spec. Throws on a spec that diagramIssues rejects, so a bad spec never reaches a page. */
export function renderDiagram(d: DiagramSpec): string {
  const issues = diagramIssues(d);
  if (issues.length) throw new Error(`Diagram cannot be drawn: ${issues.join('; ')}`);
  switch (d.template) {
    case 'matrix2x2': return matrix2x2(d);
    case 'matrix3x3': return matrix3x3(d);
    case 'steps': return steps(d);
    case 'cycle': return cycle(d);
    case 'canvasGrid': return canvasGrid(d);
    case 'scale': return scale(d);
  }
}
