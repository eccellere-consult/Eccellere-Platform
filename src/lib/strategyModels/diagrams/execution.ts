/**
 * diagrams/execution.ts — reference diagrams for the frameworks that turn the plan into what people do: STP, the 9-box talent
 * grid, OKRs down to individual KRAs, and the First 90 Days plan.
 */
import { C, badge, circle, line, lines, polygon, rect, svg, text } from './svg';

/** STP: divide the market, choose a segment, own a place in the customer's mind. */
function stp(): string {
  let body = '';
  const heading = (x: number, n: string, title: string, sub: string) =>
    badge(x + 12, 36, n, C.gold, 10) + text(x + 34, 41, title, { size: 13.5, weight: 700 }) + text(x + 34, 57, sub, { size: 10.5, italic: true, fill: C.inkMid });
  body += heading(16, '1', 'Segmentation', 'Divide the market');
  body += heading(256, '2', 'Targeting', 'Choose where to compete');
  body += heading(496, '3', 'Positioning', 'Own a place in the customer’s mind');
  // 1: the market split into segments
  body += rect(16, 80, 220, 220, { fill: C.cream, stroke: C.border });
  const tiles: [number, number, number, number, string, string][] = [
    [24, 88, 100, 100, 'Segment A', C.tealPale], [130, 88, 98, 56, 'Segment B', C.goldPale], [130, 150, 98, 38, 'Segment C', C.cream],
    [24, 194, 70, 98, 'Segment D', C.goldPale], [100, 194, 128, 98, 'Segment E', C.tealPale],
  ];
  tiles.forEach(([x, y, w, h, label, fill]) => { body += rect(x, y, w, h, { fill, stroke: C.border }); body += text(x + w / 2, y + h / 2 + 4, label, { size: 11, weight: 600, anchor: 'middle', fill: C.inkMid }); });
  // 2: scored segments, the best chosen
  const scores: [string, number][] = [['Segment B', 104], ['Segment E', 88], ['Segment A', 72], ['Segment D', 54], ['Segment C', 38]];
  scores.forEach(([name, w], i) => {
    const y = 84 + i * 44, best = i === 0;
    body += rect(256, y, 220, 38, { fill: best ? C.goldPale : C.cream, stroke: best ? C.gold : C.border, sw: best ? 1.6 : 1 });
    body += text(266, y + 24, name, { size: 11.5, weight: best ? 700 : 500, fill: best ? C.ink : C.inkMid });
    body += rect(360, y + 13, w, 12, { fill: best ? C.gold : C.border });
  });
  body += text(256, 318, 'Score each on size, growth, reach, fit and room', { size: 10.5, fill: C.inkMid });
  // 3: a perceptual map with an empty place to own
  body += rect(500, 80, 204, 220, { fill: C.white, stroke: C.border });
  body += line(500, 300, 700, 300, { stroke: C.inkMid, sw: 1.2, arrow: 'end' }) + line(500, 300, 500, 84, { stroke: C.inkMid, sw: 1.2, arrow: 'end' });
  body += text(600, 316, 'What buyers care about (1)', { size: 10.5, fill: C.inkLight, anchor: 'middle' });
  [[556, 150, 'Rival 1'], [626, 188, 'Rival 2'], [574, 238, 'Rival 3']].forEach(([x, y, label]) => {
    body += circle(Number(x), Number(y), 9, { fill: C.border, stroke: C.inkLight });
    body += text(Number(x) + 14, Number(y) + 4, String(label), { size: 10.5, fill: C.inkMid });
  });
  body += circle(664, 120, 12, { fill: C.gold });
  body += lines(676, 150, ['The place', 'we own'], { size: 10.5, weight: 700, fill: C.gold, anchor: 'end', leading: 12.5 });
  body += line(240, 190, 252, 190, { arrow: 'end', gold: true, sw: 1.8 }) + line(480, 190, 496, 190, { arrow: 'end', gold: true, sw: 1.8 });
  // the statement
  body += rect(16, 334, 688, 92, { fill: C.goldPale, stroke: C.gold });
  body += text(32, 356, 'The positioning statement', { size: 12.5, weight: 700, fill: C.gold });
  body += lines(32, 376, ['For [target customers] who [their need], we are [what we are] that [the main benefit].', 'Unlike [the alternative], [why we are different, and the proof].'], { size: 12.5, weight: 600, leading: 20 });
  body += text(32, 416, 'One benefit, one named alternative, and proof that is true today.', { size: 10.5, fill: C.inkMid, italic: true });
  return svg({
    title: 'Segmentation, targeting and positioning (STP)',
    desc: 'Three steps left to right. Segmentation divides the market into segments of different sizes. Targeting scores each segment on size, growth, reach, fit and room and chooses the best. Positioning places the business on a map of what buyers care about, in an empty place no rival holds. Below, the positioning statement template: for target customers who have a need, we are a certain kind of business that gives one main benefit; unlike the alternative, we are different for a reason that can be proved.',
  }, body);
}

/** The 9-box grid: performance across, potential up, the nine named boxes and what each calls for. */
function ninebox(): string {
  const x0 = 116, y0 = 40, cw = 176, ch = 96;
  const grid: [string, string, string][][] = [
    [['Enigma', 'Find out what holds', 'them back'], ['Growth employee', 'Develop and give', 'bigger scope'], ['Star', 'Stretch and groom', 'for succession']],
    [['Dilemma', 'Coach, or find', 'a better fit'], ['Core player', 'Keep engaged', 'and developing'], ['High performer', 'Reward, retain and', 'widen the role']],
    [['Underperformer', 'A plan with a', 'review date'], ['Effective', 'Maintain and', 'cross-train'], ['Trusted professional', 'Recognise; use', 'as a mentor']],
  ];
  const fill: Record<string, string> = { Star: C.teal, 'Growth employee': C.tealPale, 'High performer': C.tealPale, 'Core player': C.goldPale, Enigma: C.goldPale, Dilemma: C.cream, Underperformer: C.brickPale, Effective: C.cream, 'Trusted professional': C.cream };
  let body = '';
  grid.forEach((row, r) => row.forEach(([name, a, b], c) => {
    const x = x0 + c * cw, y = y0 + r * ch, star = name === 'Star';
    body += rect(x, y, cw - 4, ch - 4, { fill: fill[name], stroke: star ? C.teal : C.border, sw: star ? 1.6 : 1 });
    body += text(x + 12, y + 28, name, { size: 13.5, weight: 700, fill: star ? C.white : C.ink });
    body += lines(x + 12, y + 50, [a, b], { size: 11, fill: star ? C.white : C.inkMid, leading: 14 });
  }));
  ['High', 'Moderate', 'Low'].forEach((l, r) => { body += text(x0 - 10, y0 + r * ch + 44, l, { size: 11.5, weight: 600, fill: C.inkMid, anchor: 'end' }); });
  ['Low', 'Moderate', 'High'].forEach((l, c) => { body += text(x0 + c * cw + (cw - 4) / 2, y0 + 3 * ch + 14, l, { size: 11.5, weight: 600, fill: C.inkMid, anchor: 'middle' }); });
  body += line(20, y0 + 3 * ch - 8, 20, y0 + 8, { stroke: C.gold, sw: 2, arrow: 'end', gold: true });
  body += text(40, y0 + 150, 'POTENTIAL', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += line(x0, y0 + 3 * ch + 28, x0 + 3 * cw - 8, y0 + 3 * ch + 28, { stroke: C.gold, sw: 2, arrow: 'end', gold: true });
  body += text(x0 + (3 * cw - 8) / 2, y0 + 3 * ch + 46, 'PERFORMANCE', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += text(16, 432, 'Rate on written evidence, calibrate with others, and never hand a person their box as a label.', { size: 10.5, fill: C.inkLight, italic: true });
  return svg({
    title: 'The 9-box talent grid',
    desc: 'A three by three grid with performance across, low to high, and potential up, low to high. The nine boxes are named: enigma, growth employee and star on the top row; dilemma, core player and high performer in the middle; underperformer, effective and trusted professional on the bottom. Each box says what it calls for. A note says to rate on written evidence, calibrate with others and never hand a person their box as a label.',
  }, body);
}

/** OKRs: an objective, its key results with start and target, and the individual KRAs beneath each. */
function okrs(): string {
  let body = rect(236, 20, 248, 30, { fill: C.cream, stroke: C.border, dash: '4 3' });
  body += text(360, 40, 'Parent objective (scorecard or OGSM)', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  body += line(360, 50, 360, 72, { arrow: 'end', gold: true, sw: 1.8 });
  body += rect(196, 72, 328, 56, { fill: C.ink });
  body += text(360, 96, 'Objective', { size: 14, weight: 700, fill: C.white, anchor: 'middle' });
  body += text(360, 114, 'Ambitious, qualitative — no number in it', { size: 11, fill: C.goldLight, anchor: 'middle' });
  const kx = [16, 252, 488];
  kx.forEach((x, i) => {
    body += line(360, 128, x + 108, 164, { stroke: C.gold, sw: 1.6, arrow: 'end', gold: true });
    body += rect(x, 164, 216, 86, { fill: C.goldPale, stroke: C.gold });
    body += text(x + 12, 186, `Key result ${i + 1}`, { size: 13, weight: 700 });
    body += text(x + 12, 202, 'A measure, not an activity', { size: 10.5, fill: C.inkMid });
    body += rect(x + 12, 218, 192, 10, { fill: C.white, stroke: C.goldLight });
    body += rect(x + 12, 218, [60, 100, 132][i], 10, { fill: C.gold });
    body += text(x + 12, 244, 'Start', { size: 10.5, fill: C.inkMid }) + text(x + 204, 244, 'Target', { size: 10.5, fill: C.inkMid, anchor: 'end' });
    [0, 1].forEach((k) => {
      const kxx = x + k * 110;
      body += line(x + 108, 250, kxx + 50, 288, { stroke: C.teal, sw: 1.3, arrow: 'end' });
      body += rect(kxx, 288, 106, 70, { fill: C.tealPale, stroke: C.teal });
      body += circle(kxx + 16, 306, 7, { fill: C.teal });
      body += text(kxx + 30, 310, 'Person', { size: 10.5, weight: 700 });
      body += lines(kxx + 10, 328, ['Individual KRA:', 'the slice one', 'person owns'], { size: 10, fill: C.inkMid, leading: 12 });
    });
  });
  body += rect(16, 376, 688, 48, { fill: C.cream, stroke: C.border });
  body += text(32, 396, 'Three to five key results · confidence about 3 out of 5 · reviewed every week', { size: 12, weight: 700 });
  body += text(32, 414, 'Every key result needs someone who owns a slice of it, with a measure.', { size: 11, fill: C.inkMid });
  return svg({
    title: 'OKRs cascading to individual KRAs',
    desc: 'A parent objective from the scorecard or OGSM feeds one objective for the quarter. Beneath it sit three key results, each a measure with a start value and a target shown as a progress bar. Under each key result are two individual KRAs, the slice of the key result that one person owns. A note says three to five key results, confidence about three out of five, reviewed every week.',
  }, body);
}

/** The First 90 Days plan: three 30-day blocks, each with one outcome, two or three actions and an owner. */
function first90(): string {
  let body = rect(16, 20, 688, 46, { fill: C.brickPale, stroke: C.brick });
  body += text(32, 40, 'THE BIGGEST RISK THIS PLAN ATTACKS', { size: 11, weight: 700, fill: C.brick, spacing: 1 });
  body += text(32, 57, 'Every block should make it smaller. A plan that does not name the risk is a checklist.', { size: 11.5, fill: C.inkMid });
  const blocks: [string, string][] = [['Days 1–30', 'Set up'], ['Days 31–60', 'Build and test'], ['Days 61–90', 'Prove and decide']];
  blocks.forEach(([name, sub], i) => {
    const x = 16 + i * 236;
    body += rect(x, 88, 216, 236, { fill: C.cream, stroke: C.border });
    body += rect(x, 88, 216, 44, { fill: C.ink });
    body += text(x + 14, 108, name, { size: 14, weight: 700, fill: C.white }) + text(x + 14, 124, sub, { size: 11, fill: C.goldLight });
    [['OUTCOME', 'One thing that is done or not done'], ['ACTIONS', 'Two or three, one per line'], ['OWNER', 'One name']].forEach(([label, what], k) => {
      body += text(x + 14, 158 + k * 54, label, { size: 10.5, weight: 700, fill: C.gold, spacing: 1 });
      body += text(x + 14, 176 + k * 54, what, { size: 11.5, fill: C.inkMid });
    });
    if (i < 2) body += line(x + 218, 210, x + 234, 210, { arrow: 'end', gold: true, sw: 1.8 });
  });
  // the timeline
  body += rect(16, 346, 688, 8, { fill: C.border });
  body += rect(16, 346, 688, 8, { fill: C.gold, opacity: 0.35 });
  [['Day 1', 16, 'start'], ['Day 30', 252, 'middle'], ['Day 60', 488, 'middle'], ['Day 90', 704, 'end']].forEach(([label, x, anchor]) => {
    body += circle(Number(x), 350, 6, { fill: C.gold });
    body += text(Number(x), 374, String(label), { size: 11, weight: 700, fill: C.inkMid, anchor: anchor as 'start' | 'middle' | 'end' });
  });
  body += polygon([[700, 340], [716, 350], [700, 360]], { fill: C.gold });
  body += text(16, 412, 'When the team and its rhythm mature, graduate to quarterly OKRs.', { size: 11.5, fill: C.inkMid, italic: true });
  return svg({
    title: 'The First 90 Days plan',
    desc: 'A banner names the biggest risk the plan attacks. Below, three sequenced blocks: days 1 to 30, set up; days 31 to 60, build and test; days 61 to 90, prove and decide. Each block has one outcome that is done or not done, two or three actions, and one owner. A timeline from day 1 to day 90 runs underneath, and a note says to graduate to quarterly OKRs when the team matures.',
  }, body);
}

export const EXECUTION_DIAGRAMS: Record<string, () => string> = { stp, ninebox, okrs, first90 };
