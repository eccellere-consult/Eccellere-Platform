/**
 * diagrams/advantage.ts — reference diagrams for the frameworks about where advantage comes from and whether it lasts:
 * Blue Ocean's strategy canvas, the ERRC grid, VRIO, the resource-based view and core competence.
 */
import { C, badge, circle, ellipse, line, lines, path, rect, svg, text, wrap } from './svg';

const wrapLines = (s: string, at: number): string[] => wrap(s, at);

/** Blue Ocean strategy canvas: factors across, offering level up; rivals' curves alike, a new curve apart. */
function blueocean(): string {
  const left = 92, right = 700, top = 84, bottom = 316;
  const factors = ['Price', 'Lead time', 'Quality', 'Service', 'Range', 'Brand'];
  const x = (i: number) => left + 44 + i * ((right - left - 88) / (factors.length - 1));
  const y = (level: number) => bottom - ((level - 1) / 4) * (bottom - top - 24) - 12;
  let body = line(left, bottom, right, bottom, { sw: 1.2 }) + line(left, bottom, left, top, { arrow: 'end', sw: 1.2 });
  for (let l = 1; l <= 5; l += 1) body += line(left, y(l), right, y(l), { stroke: C.border, sw: 1, dash: '3 4' });
  factors.forEach((f, i) => { body += text(x(i), bottom + 18, f, { size: 11, fill: C.inkMid, anchor: 'middle' }); body += line(x(i), bottom, x(i), top + 14, { stroke: C.border, sw: 1 }); });
  body += text(44, (top + bottom) / 2, 'OFFERING LEVEL', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += text(left - 8, y(5) + 4, 'High', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(left - 8, y(1) + 4, 'Low', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text((left + right) / 2, bottom + 40, 'FACTORS THE INDUSTRY COMPETES ON', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  const curve = (levels: number[], colour: string, sw: number, dash?: string) => {
    const pts = levels.map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(l).toFixed(1)}`).join(' ');
    return path(pts, { stroke: colour, sw, dash });
  };
  body += curve([5, 4, 3, 2, 5, 3], C.inkLight, 2.4);
  body += curve([4, 4, 3, 2, 4, 4], C.inkMid, 2.4);
  body += curve([2, 5, 3, 5, 1, 2], C.gold, 4);
  [[5, 4, 3, 2, 5, 3], [2, 5, 3, 5, 1, 2]].forEach((levels, k) => levels.forEach((l, i) => { body += circle(x(i), y(l), 4, { fill: k ? C.gold : C.inkLight }); }));
  // key
  const key: [string, string][] = [[C.inkLight, 'Competitor A'], [C.inkMid, 'Competitor B'], [C.gold, 'Your new value curve']];
  key.forEach(([colour, name], i) => {
    const kx = 120 + i * 190;
    body += line(kx, 30, kx + 26, 30, { stroke: colour, sw: i === 2 ? 4 : 2.4 });
    body += text(kx + 34, 34, name, { size: 11, weight: i === 2 ? 700 : 500, fill: i === 2 ? C.gold : C.inkMid });
  });
  body += text(696, 372, 'Red ocean: your curve follows the rivals’ curves. Blue ocean: a different shape, in space nobody serves.', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'end' });
  body += text(696, 392, 'A good strategy has focus, divergence and a compelling tagline.', { size: 10.5, fill: C.inkMid, anchor: 'end', weight: 600 });
  return svg({
    title: 'The Blue Ocean strategy canvas',
    desc: 'A line chart. The factors the industry competes on run along the bottom and the level each firm offers rises up the side. Two competitors’ curves follow the same shape; a new value curve in gold takes a different shape, high where the rivals are low and low where they are high. A good strategy has focus, divergence and a compelling tagline.',
  }, body);
}

/** The ERRC grid: eliminate, reduce, raise, create. */
function errc(): string {
  const gx = 60, gy = 26, cw = 300, ch = 136;
  let body = '';
  const cells: [number, number, string, string, string, string, string][] = [
    [0, 0, 'Eliminate', 'Which of the factors that the industry takes for granted should be eliminated?', C.brickPale, C.brick, 'Cuts cost'],
    [1, 0, 'Raise', 'Which factors should be raised well above the industry’s standard?', C.tealPale, C.teal, 'Lifts value'],
    [0, 1, 'Reduce', 'Which factors should be reduced well below the industry’s standard?', C.goldPale, C.gold, 'Cuts cost'],
    [1, 1, 'Create', 'Which factors should be created that the industry has never offered?', C.tealPale, C.teal, 'Lifts value'],
  ];
  for (const [cx, cy, name, q, fill, accent, effect] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 18, y + 38, name, { size: 20, weight: 700, fill: accent });
    body += lines(x + 18, y + 66, wrapLines(q, 40), { size: 12, fill: C.inkMid, leading: 17 });
    body += rect(x + 18, y + ch - 36, 86, 22, { fill: C.white, stroke: accent });
    body += text(x + 61, y + ch - 21, effect, { size: 10.5, weight: 700, fill: accent, anchor: 'middle' });
  }
  body += rect(gx, gy + 2 * ch + 20, cw, 50, { fill: C.cream, stroke: C.border });
  body += text(gx + cw / 2, gy + 2 * ch + 41, 'Eliminate + reduce', { size: 12.5, weight: 700, anchor: 'middle' });
  body += text(gx + cw / 2, gy + 2 * ch + 59, 'lower the cost structure', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  body += rect(gx + cw, gy + 2 * ch + 20, cw, 50, { fill: C.cream, stroke: C.border });
  body += text(gx + cw + cw / 2, gy + 2 * ch + 41, 'Raise + create', { size: 12.5, weight: 700, anchor: 'middle' });
  body += text(gx + cw + cw / 2, gy + 2 * ch + 59, 'lift buyer value', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  body += rect(gx + cw - 74, gy + 2 * ch + 12, 148, 26, { fill: C.gold });
  body += text(gx + cw, gy + 2 * ch + 29, 'Value innovation', { size: 12, weight: 700, fill: C.white, anchor: 'middle' });
  return svg({
    title: 'The ERRC grid',
    desc: 'A two-by-two grid with four actions: eliminate, reduce, raise and create, each with its question. Eliminating and reducing lower the cost structure; raising and creating lift buyer value. Doing both at once is value innovation.',
  }, body);
}

/** VRIO: four yes/no questions in order, and what each pattern of answers means. */
function vrio(): string {
  const heads = ['Valuable?', 'Rare?', 'Costly to imitate?', 'Organised?'];
  const colW = 108, x0 = 24, implX = x0 + 4 * colW + 14, implW = 696 - implX;
  let body = '';
  heads.forEach((h, i) => {
    body += rect(x0 + i * colW, 28, colW - 4, 44, { fill: C.goldPale, stroke: C.border });
    body += badge(x0 + i * colW + 18, 50, String(i + 1), C.gold, 9.5);
    body += lines(x0 + i * colW + 36, wrapLines(h, 11).length > 1 ? 46 : 54, wrapLines(h, 11), { size: 11.5, weight: 700, leading: 14 });
  });
  body += rect(implX, 28, implW, 44, { fill: C.ink });
  body += text(implX + implW / 2, 55, 'Competitive implication', { size: 12, weight: 700, fill: C.white, anchor: 'middle' });
  const patterns: [string[], string, string, string][] = [
    [['No', '—', '—', '—'], 'Competitive disadvantage', C.brickPale, C.brick],
    [['Yes', 'No', '—', '—'], 'Competitive parity', C.cream, C.inkMid],
    [['Yes', 'Yes', 'No', '—'], 'Temporary competitive advantage', C.goldPale, C.gold],
    [['Yes', 'Yes', 'Yes', 'No'], 'Unexploited competitive advantage', C.goldPale, C.gold],
    [['Yes', 'Yes', 'Yes', 'Yes'], 'Sustained competitive advantage', C.tealPale, C.teal],
  ];
  patterns.forEach(([answers, implication, fill, accent], r) => {
    const y = 86 + r * 58;
    answers.forEach((a, i) => {
      const yes = a === 'Yes', no = a === 'No';
      body += rect(x0 + i * colW, y, colW - 4, 48, { fill: yes ? C.tealPale : no ? C.brickPale : C.white, stroke: C.border });
      body += text(x0 + i * colW + (colW - 4) / 2, y + 30, a, { size: 14, weight: yes || no ? 700 : 400, fill: yes ? C.teal : no ? C.brick : C.inkLight, anchor: 'middle' });
    });
    body += rect(implX, y, implW, 48, { fill, stroke: accent });
    body += lines(implX + implW / 2, y + 28, wrapLines(implication, 24), { size: 12.5, weight: 700, fill: accent === C.inkMid ? C.ink : accent, anchor: 'middle', leading: 15 });
  });
  body += text(24, 394, 'A “No” stops the chain: later questions cannot rescue a resource that fails an earlier one.', { size: 11, fill: C.inkMid });
  body += text(24, 412, 'Valuable: exploits an opportunity or neutralises a threat · Rare: few rivals have it', { size: 10, fill: C.inkLight, italic: true });
  body += text(24, 428, 'Costly to imitate: others would face a cost disadvantage · Organised: the firm can capture the value', { size: 10, fill: C.inkLight, italic: true });
  return svg({
    title: 'The VRIO framework',
    desc: 'A table of the four VRIO questions, asked in order: valuable, rare, costly to imitate, organised. A no to the first means competitive disadvantage; yes then no means competitive parity; yes, yes, no means temporary competitive advantage; yes, yes, yes, no means unexploited competitive advantage; four yeses mean sustained competitive advantage.',
  }, body);
}

/** Resource-based view: resources combine into capabilities, which create advantage and performance. */
function rbv(): string {
  const resources = [
    'Financial resources', 'Physical resources', 'Technological resources', 'Reputation and brand',
    'Organisational resources (systems, culture)', 'Human resources (skills and know-how)',
  ];
  let body = text(20, 24, 'RESOURCES — WHAT THE FIRM HAS', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  resources.forEach((r, i) => {
    const y = 36 + i * 60;
    body += rect(20, y, 232, 50, { fill: i % 2 ? C.cream : C.goldPale, stroke: C.border });
    body += lines(34, y + 24, wrapLines(r, 34), { size: 12, weight: 600, leading: 15 });
  });
  const stages: [string, string, string][] = [
    ['Capabilities', 'What the firm can do by combining its resources', C.tealPale],
    ['Competitive advantage', 'What customers value and rivals cannot easily match', C.goldPale],
    ['Superior performance', 'Profit above the industry’s average', C.teal],
  ];
  stages.forEach(([name, what, fill], i) => {
    const x = 296 + i * 140;
    body += rect(x, 120 + i * 0, 124, 190, { fill, stroke: C.border });
    body += lines(x + 62, 190, wrapLines(name, 12), { size: 13.5, weight: 700, anchor: 'middle', fill: fill === C.teal ? C.white : C.ink, leading: 17 });
    body += lines(x + 62, 236, wrapLines(what, 16), { size: 10.5, anchor: 'middle', fill: fill === C.teal ? C.white : C.inkMid, leading: 13 });
    if (i < 2) body += line(x + 124, 215, x + 140, 215, { arrow: 'end', gold: true, sw: 1.8 });
  });
  // every kind of resource feeds the capabilities
  for (let i = 0; i < resources.length; i += 1) body += line(252, 61 + i * 60, 266, 61 + i * 60, { stroke: C.gold, sw: 1.6 });
  body += line(266, 61, 266, 61 + 5 * 60, { stroke: C.gold, sw: 1.6 });
  body += line(266, 211, 296, 211, { arrow: 'end', gold: true, sw: 1.8 });
  body += rect(296, 330, 400, 76, { fill: C.cream, stroke: C.border });
  body += text(496, 352, 'A resource supports lasting advantage when it is', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  body += text(496, 376, 'valuable · rare · hard to copy · hard to substitute', { size: 13, weight: 700, fill: C.gold, anchor: 'middle' });
  body += text(496, 396, 'Resources alone rarely create advantage: the combination does.', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'middle' });
  return svg({
    title: 'The resource-based view of the firm',
    desc: 'Six kinds of resource (financial, physical, technological, reputation and brand, organisational, and human) combine into capabilities, which create competitive advantage and, through it, superior performance. A resource supports lasting advantage when it is valuable, rare, hard to copy and hard to substitute.',
  }, body);
}

/** Core competence: the corporation as a tree — roots, trunk, branches, leaves — with the three tests. */
function corecompetence(): string {
  let body = '';
  // leaves
  const leaves: [number, number][] = [[80, 62], [124, 44], [170, 62], [216, 44], [262, 62], [308, 44], [354, 62], [102, 92], [148, 98], [194, 94], [240, 98], [286, 94], [332, 98]];
  for (const [x, y] of leaves) body += circle(x, y, 20, { fill: C.tealPale, stroke: C.teal, sw: 1.2 });
  body += rect(150, 112, 130, 22, { fill: C.teal });
  body += text(215, 128, 'End products', { size: 11.5, weight: 700, fill: C.white, anchor: 'middle' });
  // branches
  [[70, 'Unit A'], [182, 'Unit B'], [294, 'Unit C']].forEach(([x, n]) => {
    body += rect(Number(x), 156, 100, 40, { fill: C.cream, stroke: C.border });
    body += text(Number(x) + 50, 181, String(n), { size: 11.5, fill: C.inkMid, anchor: 'middle' });
    body += line(Number(x) + 50, 196, 215, 216, { stroke: C.inkLight, sw: 1.4 });
  });
  body += text(215, 150, 'Business units', { size: 11, weight: 700, fill: C.gold, anchor: 'middle', spacing: 0.6 });
  // trunk
  body += rect(150, 216, 130, 70, { fill: C.goldPale, stroke: C.gold, sw: 1.4 });
  body += text(215, 247, 'Core products', { size: 13, weight: 700, anchor: 'middle' });
  body += text(215, 267, 'the trunk and main limbs', { size: 10.5, fill: C.inkMid, anchor: 'middle' });
  // roots
  body += path('M180,286 C 150,320 110,330 70,350 M215,286 C 215,320 215,336 215,350 M250,286 C 280,320 320,330 360,350', { stroke: C.gold, sw: 3 });
  body += ellipse(215, 372, 170, 34, { fill: C.gold });
  body += text(215, 372, 'Core competencies', { size: 14, weight: 700, fill: C.white, anchor: 'middle' });
  body += text(215, 390, 'the roots that feed everything above', { size: 10.5, fill: C.white, anchor: 'middle' });
  // the three tests
  body += rect(450, 56, 256, 280, { fill: C.cream, stroke: C.border });
  body += text(466, 84, 'Three tests of a core competence', { size: 12.5, weight: 700 });
  const tests: [string, string][] = [
    ['1', 'Access to a wide variety of markets'],
    ['2', 'A significant contribution to customer benefit in the end product'],
    ['3', 'Difficult for competitors to imitate'],
  ];
  tests.forEach(([n, t], i) => {
    body += badge(478, 130 + i * 62, n, C.gold, 10);
    body += lines(502, 126 + i * 62, wrapLines(t, 28), { size: 12, fill: C.inkMid, leading: 16 });
  });
  body += text(578, 346, 'Prahalad and Hamel, 1990', { size: 10, fill: C.inkLight, italic: true, anchor: 'middle' });
  return svg({
    title: 'The core competence tree',
    desc: 'A tree. The roots are the core competencies, the trunk and main limbs are the core products, the branches are the business units and the leaves are the end products. Beside it, the three tests of a core competence: access to a wide variety of markets, a significant contribution to customer benefit, and difficulty for competitors to imitate.',
  }, body);
}

export const ADVANTAGE_DIAGRAMS: Record<string, () => string> = { blueocean, errc, vrio, rbv, corecompetence };
