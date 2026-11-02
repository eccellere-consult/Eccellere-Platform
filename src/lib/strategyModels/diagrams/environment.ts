/**
 * diagrams/environment.ts — reference diagrams for the frameworks that read the world around the business and the structure
 * of its industry: PESTEL / SWOT and Porter's Five Forces. (More are added here as the catalogue is converted.)
 */
import { C, badge, box, caption, line, lines, polygon, rect, svg, text, wrap } from './svg';

/** A filled, outlined polygon in the diagrams' house style. */
const polygonShape = (pts: [number, number][], fill: string): string => polygon(pts, { fill, stroke: C.white, sw: 2 });
/** A caption broken into lines at `at` characters. */
const wrapLines = (s: string, at: number): string[] => wrap(s, at);

/** PESTEL (the macro-environment) beside SWOT (internal and external, helpful and harmful). */
function pestelSwot(): string {
  const pestel: [string, string, string[]][] = [
    ['P', 'Political', ['Tax policy, subsidies', 'Trade rules, stability']],
    ['E', 'Economic', ['Growth, inflation', 'Interest & exchange rates']],
    ['S', 'Social', ['Demographics, skills', 'Buying habits']],
    ['T', 'Technological', ['Automation, EV shift', 'R&D, digital adoption']],
    ['E', 'Environmental', ['Emission norms', 'Energy and climate']],
    ['L', 'Legal', ['Standards, labour law', 'IP, contracts, compliance']],
  ];
  let body = text(20, 26, 'PESTEL · the outside world', { size: 12, weight: 700, fill: C.gold, spacing: 0.8, upper: true });
  pestel.forEach(([letter, name, eg], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 168, y = 40 + row * 116;
    body += rect(x, y, 158, 106, { fill: C.cream, stroke: C.border });
    body += badge(x + 22, y + 24, letter, C.gold, 11);
    body += text(x + 44, y + 29, name, { size: 12.5, weight: 700 });
    body += lines(x + 12, y + 56, eg, { size: 11.5, fill: C.inkMid, leading: 17 });
    body += line(x + 12, y + 46, x + 146, y + 46, { stroke: C.border, sw: 1 });
  });
  body += text(20, 410, 'Rate each factor: how strong the effect, and is it an opportunity or a threat?', { size: 10, fill: C.inkLight, italic: true });

  // SWOT 2×2
  const gx = 410, gy = 56, cw = 148, ch = 158;
  body += text(gx, 26, 'SWOT · inside and out', { size: 12, weight: 700, fill: C.gold, spacing: 0.8, upper: true });
  body += caption(gx + cw / 2, 48, 'Helpful');
  body += caption(gx + cw + cw / 2, 48, 'Harmful');
  body += caption(gx - 14, gy + ch / 2, 'Internal', 'middle', -90);
  body += caption(gx - 14, gy + ch + ch / 2, 'External', 'middle', -90);
  const cells: [number, number, string, string, string[], string, string][] = [
    [0, 0, 'Strengths', 'S', ['What we do well', 'Resources others lack', 'Why customers choose us'], C.tealPale, C.teal],
    [1, 0, 'Weaknesses', 'W', ['Where we fall short', 'Resources we lack', 'Why customers leave'], C.brickPale, C.brick],
    [0, 1, 'Opportunities', 'O', ['Trends in our favour', 'Needs nobody serves', 'Rivals that are weak'], C.goldPale, C.gold],
    [1, 1, 'Threats', 'T', ['Trends against us', 'New or bigger rivals', 'Cost or rule changes'], C.cream, C.inkMid],
  ];
  for (const [cx, cy, name, letter, prompts, fill, accent] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += badge(x + 22, y + 26, letter, accent, 11);
    body += text(x + 44, y + 31, name, { size: 12.5, weight: 700 });
    body += lines(x + 14, y + 66, prompts, { size: 11.5, fill: C.inkMid, leading: 19 });
  }
  body += text(gx, 410, 'Inside = what we control · Outside = what we must respond to', { size: 10, fill: C.inkLight, italic: true });

  return svg({
    title: 'PESTEL and SWOT',
    desc: 'On the left, the six PESTEL factors — political, economic, social, technological, environmental, legal. On the right, the SWOT grid: strengths and weaknesses inside the business, opportunities and threats outside it.',
  }, body);
}

/** Porter's Five Forces: rivalry in the centre, the four other forces pressing in on it. */
function porter5(): string {
  let body = '';
  const centre = box(250, 168, 220, 104, 'Competitive rivalry', ['Number and balance of competitors', 'Industry growth', 'Fixed costs · Exit barriers', 'Differentiation'], { fill: C.goldPale, stroke: C.goldLight, wrapAt: 34 });
  body += centre;
  body += box(250, 18, 220, 98, 'Threat of new entrants', ['Economies of scale', 'Capital requirements', 'Brand loyalty · Channel access', 'Regulation'], { wrapAt: 34 });
  body += box(250, 324, 220, 98, 'Threat of substitutes', ['Relative price–performance', 'Buyers’ readiness to switch', 'Switching costs'], { wrapAt: 34 });
  body += box(10, 160, 210, 120, 'Bargaining power of suppliers', ['Few suppliers, concentrated', 'High switching costs', 'Unique or critical inputs', 'Threat of forward integration'], { wrapAt: 34 });
  body += box(500, 160, 210, 120, 'Bargaining power of buyers', ['Few, large buyers', 'Price sensitivity', 'Low switching costs', 'Threat of backward integration'], { wrapAt: 34 });
  body += line(360, 116, 360, 168, { arrow: 'end', sw: 1.6 });
  body += line(360, 324, 360, 272, { arrow: 'end', sw: 1.6 });
  body += line(220, 220, 250, 220, { arrow: 'end', sw: 1.6 });
  body += line(500, 220, 470, 220, { arrow: 'end', sw: 1.6 });
  return svg({
    title: 'Porter’s Five Forces',
    desc: 'Competitive rivalry at the centre, with four forces pressing in on it: the threat of new entrants from above, the threat of substitutes from below, the bargaining power of suppliers from the left and of buyers from the right.',
  }, body);
}

/** Porter's generic strategies: competitive advantage (lower cost / differentiation) × competitive scope (broad / narrow). */
function portergeneric(): string {
  const gx = 150, gy = 66, cw = 276, ch = 132;
  let body = text(gx + cw, 30, 'COMPETITIVE ADVANTAGE', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += caption(gx + cw / 2, 54, 'Lower cost');
  body += caption(gx + cw + cw / 2, 54, 'Differentiation');
  body += text(34, gy + ch, 'COMPETITIVE SCOPE', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += caption(gx - 14, gy + ch / 2, 'Broad target', 'middle', -90);
  body += caption(gx - 14, gy + ch + ch / 2, 'Narrow target', 'middle', -90);

  const cells: [number, number, string, string[], string, string][] = [
    [0, 0, 'Cost leadership', ['The lowest cost across the whole market.', 'Scale · learning curve · tight cost control'], C.tealPale, C.teal],
    [1, 0, 'Differentiation', ['Something unique that buyers pay more for.', 'Quality · design · brand · service'], C.goldPale, C.gold],
    [0, 1, 'Cost focus', ['The lowest cost in one chosen segment.', 'A narrow base served more cheaply'], C.cream, C.inkMid],
    [1, 1, 'Differentiation focus', ['One segment’s special needs, met best.', 'Specialist fit no broad rival matches'], C.cream, C.inkMid],
  ];
  for (const [cx, cy, name, tips, fill, accent] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 16, y + 34, name, { size: 15, weight: 700, fill: accent === C.inkMid ? C.ink : accent });
    tips.forEach((t, i) => { body += text(x + 16, y + 62 + i * 20, t, { size: 12, fill: C.inkMid, italic: i === 1 }); });
  }
  // the failure state below the grid
  body += rect(gx, gy + 2 * ch + 18, 2 * cw, 54, { fill: C.brickPale, stroke: C.brick, dash: '5 4' });
  body += text(gx + cw, gy + 2 * ch + 42, 'Stuck in the middle', { size: 14, weight: 700, fill: C.brick, anchor: 'middle' });
  body += text(gx + cw, gy + 2 * ch + 60, 'No clear choice — the lowest returns of all', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  return svg({
    title: 'Porter’s generic strategies',
    desc: 'A two-by-two grid. Columns are the source of competitive advantage, lower cost or differentiation; rows are competitive scope, a broad target or a narrow one. The squares are cost leadership, differentiation, cost focus and differentiation focus. A band below the grid warns of being stuck in the middle.',
  }, body);
}

/** Porter's value chain: four support activities above five primary activities, with the margin as the result. */
function valuechain(): string {
  const left = 20, width = 556;
  let body = text(left, 24, 'SUPPORT ACTIVITIES', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  const support = ['Firm infrastructure', 'Human resource management', 'Technology development', 'Procurement'];
  support.forEach((name, i) => {
    const y = 34 + i * 46;
    body += rect(left, y, width, 38, { fill: i % 2 ? C.cream : C.goldPale, stroke: C.border });
    body += text(left + width / 2, y + 24, name, { size: 13, weight: 700, anchor: 'middle' });
  });
  body += text(left, 238, 'PRIMARY ACTIVITIES', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  const primary: [string[], string][] = [
    [['Inbound', 'logistics'], 'Receiving, storing inputs'],
    [['Operations'], 'Turning inputs into the product'],
    [['Outbound', 'logistics'], 'Delivering to buyers'],
    [['Marketing', 'and sales'], 'Making buyers aware and able to buy'],
    [['Service'], 'Keeping value after sale'],
  ];
  const cw = width / 5, notch = 16;
  primary.forEach(([name, what], i) => {
    const x = left + i * cw, y = 248, h = 150;
    const pts: [number, number][] = [[x, y], [x + cw - notch, y], [x + cw, y + h / 2], [x + cw - notch, y + h], [x, y + h], [x + notch, y + h / 2]];
    body += polygonShape(pts, i % 2 ? C.cream : C.tealPale);
    body += lines(x + notch + 6, y + 58, name, { size: 12.5, weight: 700, leading: 16 });
    body += lines(x + notch + 6, y + 96, wrapLines(what, 13), { size: 10.5, fill: C.inkMid, leading: 13 });
  });
  // the margin: what is left of what customers pay
  const mx = 596;
  body += polygonShape([[mx, 34], [mx + 62, 34], [704, 220], [mx + 62, 398], [mx, 398], [mx + 36, 216]], C.gold);
  body += text(654, 218, 'Margin', { size: 15, weight: 700, fill: C.white, anchor: 'middle' });
  body += text(654, 238, 'price − total cost', { size: 10.5, fill: C.white, anchor: 'middle' });
  return svg({
    title: 'Porter’s value chain',
    desc: 'Four support activities (firm infrastructure, human resource management, technology development and procurement) run across the top. Beneath them five primary activities run left to right: inbound logistics, operations, outbound logistics, marketing and sales, and service. An arrow to the right shows the margin that is left.',
  }, body);
}

/** Scenario planning: two critical uncertainties as axes, four futures in the corners. */
function scenario(): string {
  const gx = 150, gy = 36, cw = 270, ch = 150;
  let body = '';
  const quads: [number, number, string, string, string, string][] = [
    [0, 0, 'Top left', 'Left end of axis 1', 'top end of axis 2', C.cream],
    [1, 0, 'Top right', 'Right end of axis 1', 'top end of axis 2', C.goldPale],
    [0, 1, 'Bottom left', 'Left end of axis 1', 'bottom end of axis 2', C.goldPale],
    [1, 1, 'Bottom right', 'Right end of axis 1', 'bottom end of axis 2', C.cream],
  ];
  for (const [cx, cy, name, a, b, fill] of quads) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 18, y + 34, name, { size: 15, weight: 700 });
    body += text(x + 18, y + 58, 'A named, coherent future:', { size: 11.5, fill: C.inkLight });
    body += text(x + 18, y + 78, `${a} · ${b}`, { size: 11.5, fill: C.inkMid });
    body += text(x + 18, y + ch - 18, 'Name · story · how we respond', { size: 11, fill: C.inkLight, italic: true });
  }
  // axes through the middle
  body += line(gx, gy + ch, gx + 2 * cw, gy + ch, { arrow: 'both', gold: true, sw: 1.8 });
  body += line(gx + cw, gy + 2 * ch, gx + cw, gy, { arrow: 'both', gold: true, sw: 1.8 });
  body += text(gx + cw, gy + 2 * ch + 22, 'CRITICAL UNCERTAINTY 1', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += text(gx + 4, gy + 2 * ch + 22, 'left end', { size: 10.5, fill: C.inkLight });
  body += text(gx + 2 * cw - 4, gy + 2 * ch + 22, 'right end', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(52, gy + ch, 'CRITICAL UNCERTAINTY 2', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += text(gx - 10, gy + 14, 'top', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(gx - 10, gy + 2 * ch - 4, 'bottom', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  // the steps that lead to it
  const steps = ['Focal question', 'Driving forces', 'Critical uncertainties', 'Four scenarios', 'Signposts'];
  const sw = 132, gap = 8, sx = 20, sy = 388;
  steps.forEach((s, i) => {
    const x = sx + i * (sw + gap);
    body += rect(x, sy, sw, 34, { fill: i === 3 ? C.gold : C.cream, stroke: i === 3 ? C.gold : C.border });
    body += text(x + sw / 2, sy + 21, `${i + 1}  ${s}`, { size: 11, weight: 700, fill: i === 3 ? C.white : C.inkMid, anchor: 'middle' });
  });
  return svg({
    title: 'Scenario planning with two critical uncertainties',
    desc: 'A two-by-two grid. The horizontal axis is the first critical uncertainty and the vertical axis the second; the four corners (top left, top right, bottom left, bottom right) are four distinct, plausible futures. Beneath it, five steps: focal question, driving forces, critical uncertainties, four scenarios, signposts.',
  }, body);
}

/** Game theory: a payoff grid of your options against a rival's responses, with the equilibrium marked. */
function gametheory(): string {
  const gx = 190, gy = 98, cw = 250, ch = 118;
  let body = text(gx + cw, 30, 'THE RIVAL’S RESPONSE', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += caption(gx + cw / 2, 78, 'Response 1');
  body += caption(gx + cw + cw / 2, 78, 'Response 2');
  body += text(34, gy + ch, 'YOUR OPTION', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += caption(gx - 14, gy + ch / 2, 'Option A', 'middle', -90);
  body += caption(gx - 14, gy + ch + ch / 2, 'Option B', 'middle', -90);

  // illustrative payoffs (yours, the rival's) — a prisoner's dilemma
  const cells: [number, number, string, string, string][] = [
    [0, 0, 'Option A → Response 1', '3 , 3', 'Both hold: good for both'],
    [1, 0, 'Option A → Response 2', '0 , 4', 'Rival gains at your cost'],
    [0, 1, 'Option B → Response 1', '4 , 0', 'You gain at the rival’s cost'],
    [1, 1, 'Option B → Response 2', '1 , 1', 'Both worse off'],
  ];
  for (const [cx, cy, name, pay, note] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    const eq = cx === 1 && cy === 1;
    body += rect(x, y, cw, ch, { fill: eq ? C.goldPale : C.cream, stroke: eq ? C.gold : C.border, sw: eq ? 2.2 : 1 });
    body += text(x + 14, y + 22, name, { size: 10.5, fill: C.inkLight, weight: 600 });
    body += text(x + cw / 2, y + 66, pay, { size: 24, weight: 700, anchor: 'middle' });
    body += text(x + cw / 2, y + 92, note, { size: 11, fill: C.inkMid, anchor: 'middle' });
    if (eq) body += rect(x + cw - 100, y + 8, 88, 20, { fill: C.gold }) + text(x + cw - 56, y + 22, 'Equilibrium', { size: 10, weight: 700, fill: C.white, anchor: 'middle' });
  }
  body += text(gx, gy + 2 * ch + 30, 'In each cell: your payoff , the rival’s payoff (illustrative numbers).', { size: 11, fill: C.inkMid });
  body += text(gx, gy + 2 * ch + 50, 'Equilibrium: each side is already doing its best reply, so neither wants to change.', { size: 11, fill: C.inkMid });
  body += text(gx, gy + 2 * ch + 70, 'Here both would do better at “3 , 3” but cannot get there alone — a prisoner’s dilemma.', { size: 11, fill: C.inkMid, italic: true });
  return svg({
    title: 'A payoff grid for competitive response',
    desc: 'A two-by-two payoff grid. Your two options (A and B) run down the side and the rival’s two responses (1 and 2) across the top. Each cell shows your payoff and the rival’s payoff. The bottom-right cell is marked as the equilibrium, where neither side wants to change its choice.',
  }, body);
}

export const ENVIRONMENT_DIAGRAMS: Record<string, () => string> = { pestel: pestelSwot, porter5, portergeneric, valuechain, scenario, gametheory };
