/**
 * diagrams/operating.ts — reference diagrams for the frameworks that run and steer the organisation: the 7-Stage Agentic AI
 * ladder, McKinsey 7S, the RACI matrix, the Balanced Scorecard's strategy map, OGSM and the Startup KPI funnel.
 */
import { C, badge, circle, ellipse, line, lines, polygon, rect, svg, text } from './svg';

/** Eccellere's seven-rung ladder: a staircase, each rung resting on the one below. */
function agenticai(): string {
  const stages: [string[], string[]][] = [
    [['Prompt', 'marketplace'], ['Shared', 'prompts']],
    [['Prompt', 'workflows'], ['Chained prompts', 'a person runs']],
    [['skill.md'], ['Written-down', 'skills the AI', 'follows']],
    [['Event and', 'schedule', 'connections'], ['Runs on a', 'trigger or a', 'schedule']],
    [['Flow', 'orchestration'], ['Skills and tools', 'in flows with', 'approvals']],
    [['Autonomous', 'operation'], ['Agents do whole', 'tasks; people', 'supervise']],
    [['Coded agents'], ['Purpose-built', 'agents in code']],
  ];
  const baseY = 408, stepW = 92, gap = 4, left = 16;
  let body = '';
  stages.forEach(([name, what], i) => {
    const x = left + i * (stepW + gap), h = 72 + i * 34, top = baseY - h;
    const fill = i < 3 ? C.cream : i < 5 ? C.goldPale : C.tealPale;
    const edge = i < 3 ? C.border : i < 5 ? C.goldLight : C.teal;
    body += rect(x, top, stepW, h, { fill, stroke: edge });
    body += badge(x + 17, top + 17, String(i + 1), i < 3 ? C.inkMid : i < 5 ? C.gold : C.teal, 9.5);
    body += lines(x + 8, top + 44, what, { size: 10, fill: C.inkMid, leading: 12.5 });
    const labelTop = top - 6 - (name.length - 1) * 14;
    body += lines(x + stepW / 2, labelTop, name, { size: 11.5, weight: 700, anchor: 'middle', leading: 14 });
  });
  body += text(16, 28, 'THE LADDER', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  body += lines(16, 52, ['More autonomy, more value —', 'and more structure, trust', 'and guardrails needed'], { size: 12, weight: 700, fill: C.gold, leading: 16 });
  body += line(26, 250, 246, 120, { stroke: C.gold, sw: 2.2, arrow: 'end', gold: true });
  body += text(16, 429, 'Each rung rests on the one below: skip one and what you build above it is fragile.', { size: 11, fill: C.inkMid });
  return svg({
    title: 'The Eccellere 7-Stage Agentic AI Maturity Model',
    desc: 'A staircase of seven rungs rising left to right: prompt marketplace, prompt workflows, skill.md, event and schedule connections, flow orchestration, autonomous operation and coded agents. An arrow shows more autonomy and more value, with more structure, trust and guardrails needed at each rung. A note says each rung rests on the one below.',
  }, body);
}

/** McKinsey 7S: shared values at the centre, three hard S's and three soft S's around it, all linked. */
function sevens(): string {
  const cx = 360, cy = 226, rx = 215, ry = 136;
  const pos = (deg: number): [number, number] => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  const nodes: { name: string; what: string; at: [number, number]; hard: boolean }[] = [
    { name: 'Strategy', what: 'How you will win', at: pos(-90), hard: true },
    { name: 'Structure', what: 'Who reports to whom', at: pos(-30), hard: true },
    { name: 'Systems', what: 'Processes and tools', at: pos(30), hard: true },
    { name: 'Skills', what: 'What you do best', at: pos(90), hard: false },
    { name: 'Style', what: 'How leaders behave', at: pos(150), hard: false },
    { name: 'Staff', what: 'The people', at: pos(210), hard: false },
  ];
  let body = text(16, 28, 'EVERY ELEMENT AFFECTS ALL THE OTHERS', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  // the links: each element to its neighbours and to the centre
  nodes.forEach((n, i) => {
    const m = nodes[(i + 1) % nodes.length];
    body += line(n.at[0], n.at[1], m.at[0], m.at[1], { stroke: C.border, sw: 2 });
    body += line(n.at[0], n.at[1], cx, cy, { stroke: C.goldLight, sw: 1.6 });
  });
  nodes.forEach((n) => {
    const w = 140, h = 52, x = n.at[0] - w / 2, y = n.at[1] - h / 2;
    body += rect(x, y, w, h, { fill: n.hard ? C.goldPale : C.tealPale, stroke: n.hard ? C.gold : C.teal, sw: 1.4 });
    body += text(n.at[0], y + 22, n.name, { size: 14, weight: 700, anchor: 'middle' });
    body += text(n.at[0], y + 39, n.what, { size: 10.5, fill: C.inkMid, anchor: 'middle' });
  });
  body += ellipse(cx, cy, 62, 40, { fill: C.ink });
  body += lines(cx, cy - 2, ['Shared', 'values'], { size: 13.5, weight: 700, fill: C.white, anchor: 'middle', leading: 16 });
  body += rect(16, 396, 14, 14, { fill: C.goldPale, stroke: C.gold }) + text(38, 408, 'Hard S’s: easy to see and to change', { size: 11.5, fill: C.inkMid });
  body += rect(300, 396, 14, 14, { fill: C.tealPale, stroke: C.teal }) + text(322, 408, 'Soft S’s: harder to see — they decide whether a change sticks', { size: 11.5, fill: C.inkMid });
  return svg({
    title: 'The McKinsey 7S framework',
    desc: 'Shared values in the centre, linked to six surrounding elements and to each other. Strategy, structure and systems are the hard S’s; skills, style and staff are the soft S’s. Shared values is the centre of the model. The point is that all seven have to fit one another and the strategy.',
  }, body);
}

/** RACI: a decisions-by-people grid with the four letters and the one rule. */
function raci(): string {
  const people = ['MD', 'Sales', 'Finance', 'Plant', 'HR'];
  const decisions: [string, string[]][] = [
    ['Approve a price change', ['A', 'R', 'C', 'I', '']],
    ['Release a purchase order', ['I', '', 'A', 'R', '']],
    ['Hire a supervisor', ['C', '', 'I', 'A', 'R']],
    ['Accept a customer return', ['I', 'A', 'C', 'R', '']],
    ['Change a supplier', ['A', 'I', 'C', 'R', '']],
  ];
  const x0 = 16, y0 = 40, firstW = 190, colW = 54, rowH = 40, headH = 34;
  const fillOf: Record<string, string> = { R: C.teal, A: C.gold, C: C.goldPale, I: C.cream };
  let body = text(16, 28, 'ONE ROW PER DECISION · ONE LETTER PER PERSON', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  body += rect(x0, y0, firstW + colW * people.length, headH, { fill: C.ink });
  body += text(x0 + 12, y0 + 22, 'Decision', { size: 12, weight: 700, fill: C.white });
  people.forEach((p, i) => { body += text(x0 + firstW + colW * i + colW / 2, y0 + 22, p, { size: 12, weight: 700, fill: C.white, anchor: 'middle' }); });
  decisions.forEach(([d, cells], r) => {
    const y = y0 + headH + r * rowH;
    body += rect(x0, y, firstW + colW * people.length, rowH, { fill: r % 2 ? C.cream : C.white, stroke: C.border });
    body += text(x0 + 12, y + 25, d, { size: 12, weight: 600 });
    cells.forEach((c, i) => {
      if (!c) return;
      const cx = x0 + firstW + colW * i + colW / 2;
      body += circle(cx, y + rowH / 2, 13, { fill: fillOf[c], stroke: c === 'C' || c === 'I' ? C.border : undefined });
      body += text(cx, y + rowH / 2 + 4.5, c, { size: 13, weight: 700, fill: c === 'R' || c === 'A' ? C.white : C.ink, anchor: 'middle' });
    });
  });
  // the legend
  const lx = 520;
  const legend: [string, string, string[]][] = [
    ['R', 'Responsible', ['does the work']],
    ['A', 'Accountable', ['owns the outcome —', 'exactly one per row']],
    ['C', 'Consulted', ['asked before it', 'is decided']],
    ['I', 'Informed', ['told after it', 'is decided']],
  ];
  legend.forEach(([letter, name, what], i) => {
    const y = 56 + i * 54;
    body += circle(lx + 13, y + 10, 13, { fill: fillOf[letter], stroke: letter === 'C' || letter === 'I' ? C.border : undefined });
    body += text(lx + 13, y + 14.5, letter, { size: 13, weight: 700, fill: letter === 'R' || letter === 'A' ? C.white : C.ink, anchor: 'middle' });
    body += text(lx + 36, y + 8, name, { size: 12.5, weight: 700 });
    body += lines(lx + 36, y + 23, what, { size: 11, fill: C.inkMid, leading: 13 });
  });
  body += rect(16, 300, 688, 124, { fill: C.goldPale, stroke: C.gold });
  body += text(32, 326, 'The rule', { size: 13, weight: 700, fill: C.gold });
  body += lines(32, 348, ['Exactly one A in every row, and at least one R.', 'Two A’s, or none, is the finding — not a form to finish.', 'One person holding most of the A’s is a bottleneck, not an owner.'], { size: 12.5, weight: 600, leading: 21 });
  return svg({
    title: 'The RACI matrix',
    desc: 'A grid with a row for each decision and a column for each person, filled with the letters R, A, C and I. R is responsible and does the work, A is accountable and owns the outcome, exactly one per row, C is consulted before the decision and I is informed after it. A box states the rule: exactly one A and at least one R in every row, and one person holding most of the A’s is a bottleneck.',
  }, body);
}

/** The Balanced Scorecard as a strategy map: four perspectives joined by cause and effect, learning at the base. */
function bsc(): string {
  const bands: { name: string; question: string; chips: string[] }[] = [
    { name: 'Financial', question: 'How do we look to our owners?', chips: ['Grow revenue', 'Raise margin', 'Free up cash'] },
    { name: 'Customer', question: 'How do customers see us?', chips: ['On-time delivery', 'Quality', 'Win new programmes'] },
    { name: 'Internal process', question: 'What must we excel at?', chips: ['Cut rework', 'Faster quoting', 'Capacity'] },
    { name: 'Learning and growth', question: 'Can we keep improving?', chips: ['Skills', 'Use of AI', 'Culture'] },
  ];
  const bandX = 124, bandW = 580, bandH = 66, gap = 24, top = 36;
  let body = text(16, 24, 'STRATEGY MAP: LEARNING DRIVES PROCESS, PROCESS DRIVES CUSTOMERS, CUSTOMERS DRIVE RESULTS', { size: 10.5, weight: 700, fill: C.gold, spacing: 0.6 });
  body += rect(16, top, 92, bands.length * bandH + (bands.length - 1) * gap, { fill: C.ink });
  body += lines(62, top + 148, ['Vision', 'and', 'strategy'], { size: 13, weight: 700, fill: C.white, anchor: 'middle', leading: 18 });
  bands.forEach((b, i) => {
    const y = top + i * (bandH + gap);
    body += rect(bandX, y, bandW, bandH, { fill: C.cream, stroke: C.border });
    body += rect(bandX, y, 150, bandH, { fill: i === 0 ? C.gold : i === 3 ? C.teal : C.inkMid });
    const words = b.name.split(' ');
    body += words.length > 1
      ? lines(bandX + 75, y + 29, [words[0], words.slice(1).join(' ')], { size: 13, weight: 700, fill: C.white, anchor: 'middle', leading: 18 })
      : text(bandX + 75, y + 38, b.name, { size: 13, weight: 700, fill: C.white, anchor: 'middle' });
    body += text(bandX + 164, y + 22, b.question, { size: 11.5, italic: true, fill: C.inkMid });
    b.chips.forEach((c, k) => {
      const cx = bandX + 164 + k * 130;
      body += rect(cx, y + 32, 122, 24, { fill: C.goldPale, stroke: C.goldLight });
      body += text(cx + 61, y + 48, c, { size: 10.5, weight: 600, anchor: 'middle' });
    });
    body += line(108, y + bandH / 2, bandX, y + bandH / 2, { stroke: C.gold, sw: 1.6, arrow: 'end', gold: true });
    if (i < bands.length - 1) body += line(bandX + bandW / 2, y + bandH + gap, bandX + bandW / 2, y + bandH, { stroke: C.gold, sw: 2, arrow: 'end', gold: true });
  });
  const by = top + 4 * bandH + 3 * gap + 14;
  body += rect(16, by, 688, 46, { fill: C.goldPale, stroke: C.gold });
  body += text(32, by + 20, 'Each perspective has four things:', { size: 12, weight: 700 });
  body += text(32, by + 38, 'objectives · measures · targets · initiatives — results (lagging) matched by drivers (leading)', { size: 11.5, fill: C.inkMid });
  return svg({
    title: 'The Balanced Scorecard strategy map',
    desc: 'Four stacked bands for the four perspectives — financial, customer, internal process, and learning and growth — each with its question and example objectives, joined by upward arrows showing cause and effect from learning and growth at the base to the financial results at the top. A vision and strategy box on the left feeds each band. A note says every perspective has objectives, measures, targets and initiatives.',
  }, body);
}

/** OGSM: one page, four columns, each answering the one before. */
function ogsm(): string {
  const cols: { letter: string; name: string; q: string; x: number; w: number }[] = [
    { letter: 'O', name: 'Objective', q: 'Where are we going?', x: 16, w: 140 },
    { letter: 'G', name: 'Goals', q: 'What results show we arrived?', x: 196, w: 150 },
    { letter: 'S', name: 'Strategies', q: 'How will we get there?', x: 386, w: 160 },
    { letter: 'M', name: 'Measures', q: 'Is it working?', x: 586, w: 118 },
  ];
  let body = '';
  cols.forEach((c) => {
    body += circle(c.x + 12, 40, 12, { fill: C.gold });
    body += text(c.x + 12, 45, c.letter, { size: 14, weight: 700, fill: C.white, anchor: 'middle', serif: true });
    body += text(c.x + 32, 38, c.name, { size: 13.5, weight: 700 });
    body += text(c.x + 32, 53, c.q, { size: 10.5, italic: true, fill: C.inkMid });
  });
  const top = 74;
  // objective: one tall box
  body += rect(16, top, 140, 290, { fill: C.ink });
  body += lines(86, top + 120, ['One inspiring', 'statement of', 'direction —', 'not a number'], { size: 12.5, weight: 700, fill: C.white, anchor: 'middle', leading: 17 });
  // goals
  const goalY = [top, top + 100, top + 200];
  goalY.forEach((y, i) => {
    body += rect(196, y, 150, 90, { fill: C.goldPale, stroke: C.gold });
    body += text(208, y + 24, `Goal ${i + 1}`, { size: 12.5, weight: 700, fill: C.gold });
    body += lines(208, y + 44, ['A number and a date', ['Revenue', 'Profit', 'Customer'][i]], { size: 11.5, fill: C.inkMid, leading: 16 });
    body += line(156, top + 145, 196, y + 45, { stroke: C.gold, sw: 1.4, arrow: 'end', gold: true });
  });
  // strategies and measures, each linked to a goal
  const stratY = [top, top + 74, top + 148, top + 222];
  const goalOf = [0, 0, 1, 2];
  stratY.forEach((y, i) => {
    body += rect(386, y, 160, 66, { fill: C.cream, stroke: C.border });
    body += text(398, y + 24, `Strategy ${i + 1}`, { size: 12.5, weight: 700 });
    body += text(398, y + 44, 'A choice of how', { size: 11.5, fill: C.inkMid });
    body += line(346, goalY[goalOf[i]] + 45, 386, y + 33, { stroke: C.gold, sw: 1.4, arrow: 'end', gold: true });
    body += rect(586, y, 118, 66, { fill: C.tealPale, stroke: C.teal });
    body += text(598, y + 24, `Measure ${i + 1}`, { size: 12.5, weight: 700 });
    body += lines(598, y + 42, ['and its target,', 'with one owner'], { size: 10.5, fill: C.inkMid, leading: 12.5 });
    body += line(546, y + 33, 586, y + 33, { stroke: C.teal, sw: 1.4, arrow: 'end' });
  });
  body += rect(16, 382, 688, 42, { fill: C.goldPale, stroke: C.gold });
  body += text(360, 408, 'Every goal needs a strategy; every strategy a measure, a target and one owner. Keep it to one page.', { size: 12, weight: 600, anchor: 'middle' });
  return svg({
    title: 'The OGSM one-page plan',
    desc: 'Four columns read left to right: Objective, a single inspiring statement of direction; Goals, results with a number and a date; Strategies, the choices of how to reach the goals, each linked to a goal; and Measures, each with a target and one owner. A note says every goal needs a strategy and every strategy a measure, a target and an owner, on one page.',
  }, body);
}

/** The Startup KPI funnel (AARRR) under a North Star, with the weekly this-week-against-last-week strip. */
function startupkpis(): string {
  const stages: [string, string][] = [
    ['Acquisition', 'Do people find you?'],
    ['Activation', 'Do they get first value?'],
    ['Retention', 'Do they come back?'],
    ['Revenue', 'Do they pay?'],
    ['Referral', 'Do they tell others?'],
  ];
  let body = rect(16, 16, 688, 46, { fill: C.goldPale, stroke: C.gold });
  body += polygon([[40, 28], [44, 38], [55, 38], [46, 45], [50, 56], [40, 49], [30, 56], [34, 45], [25, 38], [36, 38]], { fill: C.gold });
  body += text(70, 36, 'North Star metric', { size: 13.5, weight: 700 });
  body += text(70, 52, 'The one number that best shows customers getting value — it rises when the business is truly doing better.', { size: 11, fill: C.inkMid });
  const top = 78, h = 44, cx = 190;
  stages.forEach(([name, q], i) => {
    const wTop = 340 - i * 48, wBot = 340 - (i + 1) * 48, y = top + i * h;
    const shade = [C.inkMid, '#4A4944', '#6A6862', C.gold, C.teal][i];
    body += polygon([[cx - wTop / 2, y], [cx + wTop / 2, y], [cx + wBot / 2, y + h - 3], [cx - wBot / 2, y + h - 3]], { fill: shade });
    body += text(cx, y + 26, name, { size: 13, weight: 700, fill: C.white, anchor: 'middle' });
    body += text(400, y + 26, q, { size: 12, fill: C.inkMid });
    body += line(cx + wTop / 2 + 8, y + 20, 392, y + 20, { stroke: C.border, sw: 1, dash: '3 3' });
  });
  // the weekly strip
  const sy = 312;
  body += rect(16, sy, 688, 112, { fill: C.cream, stroke: C.border });
  const heads = ['Metric', 'This week', 'Last week', 'Movement'], hx = [32, 280, 380, 480];
  heads.forEach((h2, i) => { body += text(hx[i], sy + 22, h2, { size: 10.5, weight: 700, fill: C.gold, spacing: 0.6, upper: true }); });
  const rowsData: [string, string, string, string, boolean][] = [
    ['RFQs received', '8', '6', 'Up 33% — better', true],
    ['Rework rate (%)', '4.8', '4.2', 'Up 14% — worse', false],
    ['Debtor days', '71', '73', 'Down 3% — better', true],
  ];
  rowsData.forEach(([m, a, b, mv, good], i) => {
    const y = sy + 46 + i * 23;
    body += text(hx[0], y, m, { size: 12, weight: 600 });
    body += text(hx[1], y, a, { size: 12 });
    body += text(hx[2], y, b, { size: 12 });
    body += text(hx[3], y, mv, { size: 12, weight: 700, fill: good ? C.teal : C.brick });
  });
  body += text(16, 435, 'Look at the same numbers on the same day each week: read the movement, not just the level.', { size: 10.5, fill: C.inkLight, italic: true });
  return svg({
    title: 'The Startup KPI funnel under a North Star',
    desc: 'A banner for the North Star metric, the one number that best shows customers getting value. Below it a funnel of five stages — acquisition, activation, retention, revenue and referral — each with the question it answers. Underneath, a weekly strip comparing this week with last week for three example metrics and whether each moved the right way.',
  }, body);
}

export const OPERATING_DIAGRAMS: Record<string, () => string> = { agenticai, sevens, raci, bsc, ogsm, startupkpis };
