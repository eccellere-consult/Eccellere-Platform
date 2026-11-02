/**
 * diagrams/portfolio.ts — reference diagrams for the growth and portfolio frameworks: the Ansoff Matrix and the BCG
 * growth-share matrix. (More are added here as the catalogue is converted.)
 */
import { C, badge, box, caption, circle, line, lines, path, rect, svg, text, wrap } from './svg';

/** A caption broken into lines at `at` characters. */
const wrapLines = (s: string, at: number): string[] => wrap(s, at);

/** Ansoff: products (existing / new) × markets (existing / new), with risk rising towards diversification. */
function ansoff(): string {
  const gx = 150, gy = 66, cw = 270, ch = 138;
  let body = text(gx + cw, 30, 'PRODUCTS', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += caption(gx + cw / 2, 52, 'Existing');
  body += caption(gx + cw + cw / 2, 52, 'New');
  body += text(34, gy + ch, 'MARKETS', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += caption(gx - 16, gy + ch / 2, 'Existing', 'middle', -90);
  body += caption(gx - 16, gy + ch + ch / 2, 'New', 'middle', -90);

  const cells: [number, number, string, string[], string, string, string][] = [
    [0, 0, 'Market penetration', ['Sell more of today’s products', 'to today’s customers.', 'Win share · raise usage · loyalty'], 'Lowest risk', C.tealPale, C.teal],
    [1, 0, 'Product development', ['New products for', 'today’s customers.', 'New models · features · services'], 'Medium risk', C.goldPale, C.gold],
    [0, 1, 'Market development', ['Today’s products in new', 'markets or segments.', 'New regions · channels · sectors'], 'Medium risk', C.goldPale, C.gold],
    [1, 1, 'Diversification', ['New products in new markets.', 'New business areas,', 'related or unrelated'], 'Highest risk', C.brickPale, C.brick],
  ];
  for (const [cx, cy, name, tips, risk, fill, accent] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 16, y + 30, name, { size: 14, weight: 700 });
    tips.forEach((t, i) => { body += text(x + 16, y + 57 + i * 18, t, { size: 12, fill: C.inkMid, italic: i === 2 }); });
    body += rect(x + 16, y + ch - 32, 92, 20, { fill: C.white, stroke: accent });
    body += text(x + 62, y + ch - 18, risk, { size: 9.5, weight: 700, fill: accent, anchor: 'middle' });
  }
  body += line(gx + 24, gy + 2 * ch + 28, gx + 2 * cw - 24, gy + 2 * ch + 28, { arrow: 'end', gold: true, sw: 1.8 });
  body += text(gx + cw, gy + 2 * ch + 46, 'Risk rises with distance from what you already do', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'middle' });
  return svg({
    title: 'The Ansoff Matrix',
    desc: 'A two-by-two grid. Columns are existing and new products; rows are existing and new markets. Market penetration (existing products, existing markets) is the lowest risk; product development and market development are medium risk; diversification (new products, new markets) is the highest risk.',
  }, body);
}

/** BCG growth-share matrix: market growth (rows) against relative market share (columns, high on the left). */
function bcg(): string {
  const gx = 112, gy = 36, cw = 290, ch = 172;
  let body = '';
  const cells: [number, number, string, string, string, string, string][] = [
    [0, 0, 'Stars', 'High growth · high share', 'Invest to hold leadership', C.tealPale, C.teal],
    [1, 0, 'Question marks', 'High growth · low share', 'Invest selectively — or exit', C.goldPale, C.gold],
    [0, 1, 'Cash cows', 'Low growth · high share', 'Harvest the cash; defend', C.cream, C.inkMid],
    [1, 1, 'Dogs', 'Low growth · low share', 'Divest, or run for cash', C.brickPale, C.brick],
  ];
  for (const [cx, cy, name, where, play, fill, accent] of cells) {
    const x = gx + cx * cw, y = gy + cy * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 16, y + 28, name, { size: 15, weight: 700, fill: accent === C.inkMid ? C.ink : accent });
    body += text(x + 16, y + 46, where, { size: 11.5, fill: C.inkLight });
    body += text(x + 16, y + ch - 14, play, { size: 12, weight: 600, fill: C.inkMid });
  }
  // example bubbles — the area of a bubble is a product line's revenue
  const bubbles: [number, number, number, string][] = [
    [gx + 120, gy + 100, 26, C.teal], [gx + 205, gy + 78, 14, C.teal],
    [gx + cw + 100, gy + 94, 18, C.gold], [gx + cw + 190, gy + 112, 10, C.gold],
    [gx + 150, gy + ch + 100, 32, C.inkMid],
    [gx + cw + 120, gy + ch + 100, 12, C.brick],
  ];
  for (const [x, y, r, fill] of bubbles) body += circle(x, y, r, { fill, opacity: 0.78 });
  // axes
  body += caption(gx + cw, gy + 2 * ch + 24, 'Relative market share', 'middle');
  body += text(gx + 6, gy + 2 * ch + 24, 'High (1.0× or more)', { size: 10, fill: C.inkLight });
  body += text(gx + 2 * cw - 6, gy + 2 * ch + 24, 'Low (under 1.0×)', { size: 10, fill: C.inkLight, anchor: 'end' });
  body += caption(40, gy + ch, 'Market growth rate', 'middle', -90);
  body += text(gx - 10, gy + 14, 'High', { size: 10, fill: C.inkLight, anchor: 'end' });
  body += text(gx - 10, gy + 2 * ch - 4, 'Low', { size: 10, fill: C.inkLight, anchor: 'end' });
  body += text(gx + 2 * cw, gy - 14, 'Bubble area = the product line’s revenue', { size: 10, fill: C.inkLight, italic: true, anchor: 'end' });
  return svg({
    title: 'The BCG growth-share matrix',
    desc: 'A two-by-two grid of market growth rate against relative market share. High growth and high share is a Star; high growth and low share is a Question mark; low growth and high share is a Cash cow; low growth and low share is a Dog. Bubble area shows each product line’s revenue.',
  }, body);
}

/** GE–McKinsey nine-box: industry attractiveness (rows) against business strength (columns), in three zones. */
function ge9box(): string {
  const gx = 140, gy = 36, cw = 170, ch = 96;
  const GREEN = [C.tealPale, C.teal, 'Invest / grow'], GOLD = [C.goldPale, C.gold, 'Invest selectively'], RED = [C.brickPale, C.brick, 'Harvest / divest'];
  const zones = [[GREEN, GREEN, GOLD], [GREEN, GOLD, RED], [GOLD, RED, RED]];
  let body = '';
  zones.forEach((row, r) => row.forEach(([fill, accent, label], c) => {
    const x = gx + c * cw, y = gy + r * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 12, y + 24, label, { size: 12.5, weight: 700, fill: accent });
  }));
  // example bubbles: the area of a bubble is a unit's revenue
  const bubbles: [number, number, number][] = [[gx + 96, gy + 62, 22], [gx + 2 * cw + 100, gy + ch + 62, 12], [gx + cw + 96, gy + 2 * ch + 62, 16]];
  for (const [x, y, r] of bubbles) body += circle(x, y, r, { fill: C.ink, opacity: 0.55 });
  // axes
  ['High', 'Medium', 'Low'].forEach((t, i) => { body += text(gx - 12, gy + i * ch + ch / 2 + 4, t, { size: 10.5, fill: C.inkLight, anchor: 'end' }); });
  ['Strong', 'Average', 'Weak'].forEach((t, i) => { body += text(gx + i * cw + cw / 2, gy + 3 * ch + 18, t, { size: 10.5, fill: C.inkLight, anchor: 'middle' }); });
  body += text(gx + 1.5 * cw, gy + 3 * ch + 40, 'BUSINESS STRENGTH', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += text(36, gy + 1.5 * ch, 'INDUSTRY ATTRACTIVENESS', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += text(gx + 3 * cw, gy - 12, 'Bubble area = the unit’s revenue', { size: 10, fill: C.inkLight, italic: true, anchor: 'end' });
  // the zones in words
  const legend: [string, string, string][] = [[C.teal, 'Invest / grow', 'back the unit'], [C.gold, 'Invest selectively', 'protect earnings'], [C.brick, 'Harvest / divest', 'milk it, or sell']];
  legend.forEach(([colour, name, what], i) => {
    const x = 24 + i * 232;
    body += rect(x, 392, 14, 14, { fill: colour });
    body += text(x + 22, 404, `${name} — ${what}`, { size: 11, fill: C.inkMid });
  });
  return svg({
    title: 'The GE–McKinsey nine-box matrix',
    desc: 'A three-by-three grid. Rows are industry attractiveness (high, medium, low); columns are business strength (strong, average, weak). The top-left cells are invest and grow, the diagonal band is invest selectively, and the bottom-right cells are harvest or divest. Bubble area shows each unit’s revenue.',
  }, body);
}

/** Shell's directional policy matrix: sector prospects across, competitive capability down, a named policy in every cell. */
function dpm(): string {
  const gx = 150, gy = 66, cw = 180, ch = 98;
  const cells: [string, string, string][][] = [
    [['Cash generation', C.cream, C.inkMid], ['Growth', C.tealPale, C.teal], ['Leader', C.tealPale, C.teal]],
    [['Phased withdrawal', C.brickPale, C.brick], ['Custodial', C.cream, C.inkMid], ['Try harder', C.goldPale, C.gold]],
    [['Disinvest', C.brickPale, C.brick], ['Phased withdrawal', C.brickPale, C.brick], ['Double or quit', C.goldPale, C.gold]],
  ];
  let body = text(gx + 1.5 * cw, 26, 'BUSINESS SECTOR PROSPECTS', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  ['Unattractive', 'Average', 'Attractive'].forEach((t, i) => { body += caption(gx + i * cw + cw / 2, 54, t); });
  ['Strong', 'Average', 'Weak'].forEach((t, i) => { body += text(gx - 12, gy + i * ch + ch / 2 + 4, t, { size: 10.5, fill: C.inkLight, anchor: 'end' }); });
  body += text(36, gy + 1.5 * ch, 'COMPETITIVE CAPABILITIES', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  cells.forEach((row, r) => row.forEach(([name, fill, accent], c) => {
    const x = gx + c * cw, y = gy + r * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + cw / 2, y + ch / 2 + 5, name, { size: 14, weight: 700, fill: accent === C.inkMid ? C.ink : accent, anchor: 'middle' });
  }));
  body += text(gx, gy + 3 * ch + 28, 'Rate each business on both axes (1–5); the cell where they meet names the policy.', { size: 11, fill: C.inkMid });
  body += text(gx, gy + 3 * ch + 48, 'Use it as a second opinion beside the nine-box: where they disagree, look again at the evidence.', { size: 11, fill: C.inkLight, italic: true });
  return svg({
    title: 'The Directional Policy Matrix',
    desc: 'A three-by-three grid. Columns are business sector prospects (unattractive, average, attractive); rows are the company’s competitive capabilities (strong, average, weak). Each cell names a policy: cash generation, growth, leader, phased withdrawal, custodial, try harder, disinvest, phased withdrawal and double or quit.',
  }, body);
}

/** Three Horizons: three overlapping growth curves over time. */
function horizons3(): string {
  const left = 92, right = 700, top = 30, bottom = 322;
  let body = line(left, bottom, right, bottom, { arrow: 'end', sw: 1.4 }) + line(left, bottom, left, top, { arrow: 'end', sw: 1.4 });
  body += text(right, bottom + 18, 'Time', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'end', upper: true });
  body += text(42, (top + bottom) / 2, 'Value (profit)', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90, upper: true });
  const curves: [string, string, string][] = [
    [C.teal, 'M96,150 C 190,92 262,100 340,170 S 560,296 696,312', 'H1'],
    [C.gold, 'M180,320 C 270,300 310,128 430,118 S 610,170 696,236', 'H2'],
    [C.brick, 'M330,324 C 450,322 520,250 600,160 S 672,88 696,66', 'H3'],
  ];
  for (const [colour, d] of curves) body += path(d, { stroke: colour, sw: 3.2 });
  body += badge(150, 118, '1', C.teal, 10) + badge(430, 100, '2', C.gold, 10) + badge(652, 112, '3', C.brick, 10);
  const key: [string, string, string, string][] = [
    [C.teal, 'Horizon 1', 'Extend and defend core businesses', 'Today’s profit · about 0–2 years'],
    [C.gold, 'Horizon 2', 'Build emerging businesses', 'Tomorrow’s growth · about 2–5 years'],
    [C.brick, 'Horizon 3', 'Create viable options', 'The seeds · about 5 years and beyond'],
  ];
  key.forEach(([colour, h, name, when], i) => {
    const x = 24 + i * 232;
    body += rect(x, 352, 216, 76, { fill: C.cream, stroke: C.border });
    body += rect(x, 352, 5, 76, { fill: colour });
    body += text(x + 16, 374, h, { size: 12.5, weight: 700, fill: colour });
    body += text(x + 16, 394, name, { size: 11.5, weight: 600 });
    body += text(x + 16, 414, when, { size: 10.5, fill: C.inkLight });
  });
  return svg({
    title: 'The Three Horizons of growth',
    desc: 'A chart of value over time with three overlapping curves. Horizon 1, extend and defend core businesses, is today’s profit and fades over time. Horizon 2, build emerging businesses, rises as the core fades. Horizon 3, create viable options, starts furthest out and rises last.',
  }, body);
}

/** Corporate parenting: opportunity to add value against fit with the parent, in five zones. */
function parenting(): string {
  const gx = 150, gy = 34, cw = 180, ch = 100;
  let body = '';
  const corner = (c: number, r: number, fill: string, accent: string, name: string, what: string[]) => {
    const x = gx + c * 2 * cw, y = gy + r * 2 * ch;
    body += rect(x, y, cw, ch, { fill, stroke: C.white, sw: 2 });
    body += text(x + 14, y + 30, name, { size: 14, weight: 700, fill: accent });
    body += lines(x + 14, y + 52, what.flatMap((w) => wrapLines(w, 25)), { size: 11, fill: C.inkMid, leading: 15 });
  };
  // the plus-shaped middle band: edge of the heartland
  body += rect(gx + cw, gy, cw, 3 * ch, { fill: C.goldPale, stroke: C.white, sw: 2 });
  body += rect(gx, gy + ch, 3 * cw, ch, { fill: C.goldPale, stroke: C.white, sw: 2 });
  body += text(gx + 1.5 * cw, gy + 1.5 * ch + 5, 'Edge of heartland', { size: 14, weight: 700, fill: C.gold, anchor: 'middle' });
  body += text(gx + 1.5 * cw, gy + 1.5 * ch + 24, 'Some fit, some opportunity: look closer', { size: 10.5, fill: C.inkMid, anchor: 'middle' });
  corner(0, 0, C.brickPale, C.brick, 'Value trap', ['Big opportunity, but the parent does not understand the unit']);
  corner(1, 0, C.tealPale, C.teal, 'Heartland', ['Real opportunity and a parent that understands what the unit needs']);
  corner(0, 1, C.cream, C.inkMid, 'Alien territory', ['Little to gain, little understanding: another owner would do better']);
  corner(1, 1, C.cream, C.inkMid, 'Ballast', ['Understood, but little to improve: safe, and adds nothing']);
  // axes
  body += text(gx + 1.5 * cw, gy + 3 * ch + 22, 'FIT WITH THE PARENT', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle' });
  body += text(gx + 4, gy + 3 * ch + 22, 'Poor', { size: 10.5, fill: C.inkLight });
  body += text(gx + 3 * cw - 4, gy + 3 * ch + 22, 'Good', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(40, gy + 1.5 * ch, 'OPPORTUNITY TO ADD VALUE', { size: 11, weight: 700, fill: C.gold, spacing: 1, anchor: 'middle', rotate: -90 });
  body += text(gx - 10, gy + 14, 'High', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(gx - 10, gy + 3 * ch - 4, 'Low', { size: 10.5, fill: C.inkLight, anchor: 'end' });
  body += text(gx + 3 * cw, 426, 'A unit belongs in the group only if the parent adds more value than another owner would.', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'end' });
  return svg({
    title: 'The parenting-fit matrix',
    desc: 'A grid of opportunity for the parent to add value (low to high, upward) against fit with the parent (poor to good, rightward). The corners are value trap (top left), heartland (top right), alien territory (bottom left) and ballast (bottom right); the plus-shaped middle band is the edge of the heartland.',
  }, body);
}

/** Make, buy or ally: three questions in order, each leading to a route. */
function makebuyally(): string {
  let body = text(24, 28, 'A CAPABILITY GAP', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  const qs: [string, string, string, string, string, string, string][] = [
    ['1', 'Can we build it?', 'Relevant resources inside, and time to develop the capability', 'Build', '(make)', 'Develop it ourselves', C.teal],
    ['2', 'Can we borrow it?', 'A contract if it can be specified; an alliance with a partner we can trust', 'Borrow', '(ally or contract)', 'Use a partner’s capability', C.gold],
    ['3', 'Can we buy it?', 'A target that has it, an affordable price and a way to integrate it', 'Buy', '(acquire)', 'Own the capability outright', C.inkMid],
  ];
  const w = 204, gap = 36, x0 = 24;
  qs.forEach(([n, q, sub, route, qualifier, what, colour], i) => {
    const x = x0 + i * (w + gap);
    body += rect(x, 44, w, 120, { fill: C.cream, stroke: C.border });
    body += badge(x + 24, 72, n, colour, 11);
    body += text(x + 48, 77, q, { size: 14, weight: 700 });
    body += lines(x + 16, 108, wrapLines(sub, 30), { size: 11, fill: C.inkMid, leading: 15 });
    // yes → the route
    body += line(x + w / 2, 164, x + w / 2, 214, { arrow: 'end', gold: true, sw: 1.8 });
    body += text(x + w / 2 + 8, 192, 'Yes', { size: 11, weight: 700, fill: C.teal });
    body += rect(x, 214, w, 92, { fill: colour });
    body += text(x + w / 2, 246, route, { size: 20, weight: 700, fill: C.white, anchor: 'middle' });
    body += text(x + w / 2, 266, qualifier, { size: 12, weight: 600, fill: C.white, anchor: 'middle' });
    body += text(x + w / 2, 288, what, { size: 11, fill: C.white, anchor: 'middle' });
    // no → the next question
    if (i < 2) {
      body += line(x + w, 104, x + w + gap, 104, { arrow: 'end', sw: 1.6 });
      body += text(x + w + gap / 2, 94, 'No', { size: 11, weight: 700, fill: C.brick, anchor: 'middle' });
    }
  });
  body += rect(24, 332, 672, 56, { fill: C.brickPale, stroke: C.brick, dash: '5 4' });
  body += text(360, 356, 'If all three answers are No: revisit the need', { size: 14, weight: 700, fill: C.brick, anchor: 'middle' });
  body += text(360, 376, 'Is the capability really needed, or can the strategy change so that it is not?', { size: 11.5, fill: C.inkMid, anchor: 'middle' });
  body += text(696, 420, 'Ask in this order: build if you can, borrow if you cannot, buy only when you must.', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'end' });
  return svg({
    title: 'Build, borrow or buy',
    desc: 'Three questions asked in order, starting from a capability gap. Can we build it? If yes, build. If no, can we borrow it through a contract or an alliance? If yes, borrow. If no, can we buy it? If yes, buy. If all three answers are no, revisit the need.',
  }, body);
}

/** M&A synergy map: where synergy comes from, what takes it away, and the most a buyer can pay. */
function masynergy(): string {
  let body = text(24, 26, 'SYNERGIES ADD VALUE', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  const adds: [string, string[], string, string][] = [
    ['Cost synergies', ['Overheads and duplicate teams', 'Purchasing and plant use'], 'The most reliable', C.tealPale],
    ['Revenue synergies', ['Cross-selling', 'New markets and pricing'], 'The least reliable', C.goldPale],
    ['Capability and financial', ['Know-how and technology', 'Tax, lower cost of capital'], 'In between', C.cream],
  ];
  adds.forEach(([name, items, note, fill], i) => {
    const x = 24 + i * 228;
    body += box(x, 38, 216, 120, name, items, { fill, stroke: C.border, wrapAt: 34 });
    body += text(x + 108, 150, note, { size: 10.5, fill: C.inkLight, italic: true, anchor: 'middle' });
  });
  body += text(24, 192, 'THESE TAKE VALUE AWAY', { size: 11, weight: 700, fill: C.brick, spacing: 1 });
  body += box(24, 204, 330, 84, 'Dis-synergies', ['Customers lost · people lost', 'Management distraction'], { fill: C.brickPale, stroke: C.brick, titleFill: C.brick, wrapAt: 50 });
  body += box(366, 204, 330, 84, 'Integration costs', ['Systems, redundancy, advisers', 'One-off cost to achieve each synergy'], { fill: C.brickPale, stroke: C.brick, titleFill: C.brick, wrapAt: 50 });
  body += rect(24, 312, 672, 100, { fill: C.goldPale, stroke: C.gold });
  body += text(360, 340, 'Net value of the synergies  =  benefits × probability  −  dis-synergies  −  costs, discounted', { size: 12, weight: 600, anchor: 'middle' });
  body += text(360, 372, 'Pay no more than this above the target’s standalone value', { size: 15, weight: 700, fill: C.gold, anchor: 'middle' });
  body += text(360, 396, 'A premium above the net synergies hands the seller value the buyer has still to create.', { size: 11, fill: C.inkMid, italic: true, anchor: 'middle' });
  return svg({
    title: 'The M&A synergy map',
    desc: 'Three sources of synergy add value: cost synergies, revenue synergies and capability and financial synergies. Dis-synergies and integration costs take value away. The net present value of the risk-adjusted net synergies is the most a buyer should pay above the target’s standalone value, the premium.',
  }, body);
}

/** Pivot or persist: three questions and the three paths they point to. */
function pivotpersist(): string {
  const qs: [string, string, string, string, string, string][] = [
    ['1', 'Is the core still defensible?', 'Do customers still need it, and is there an edge rivals cannot copy?', 'Yes (4–5)', 'PERSIST', 'Defend and improve the core'],
    ['2', 'Is there a credible reinvention path?', 'A specific new direction with customer pull, using capabilities you have', 'Core weak, path credible', 'PIVOT', 'Change one fundamental thing and test it'],
    ['3', 'Is staying the best use of the capital and team?', 'Compared with the best alternative use of the same money and people', 'No (1–2), or no path', 'EXIT AND REDEPLOY', 'Wind down or sell; redeploy the capital'],
  ];
  const colours = [C.teal, C.gold, C.brick];
  let body = '';
  qs.forEach(([n, q, sub, when, path, what], i) => {
    const y = 24 + i * 132, c = colours[i];
    body += rect(24, y, 306, 112, { fill: C.cream, stroke: C.border });
    body += badge(52, y + 30, n, c, 11);
    body += lines(78, y + 28, wrapLines(q, 28), { size: 13.5, weight: 700, leading: 17 });
    body += lines(78, y + 74, wrapLines(sub, 38), { size: 10.5, fill: C.inkMid, leading: 14 });
    body += line(330, y + 56, 424, y + 56, { arrow: 'end', gold: true, sw: 1.8 });
    body += lines(377, y + 40, wrapLines(when, 14), { size: 9.5, weight: 600, fill: C.inkLight, anchor: 'middle', leading: 12 });
    body += rect(424, y, 272, 112, { fill: c });
    body += text(560, y + 52, path, { size: 19, weight: 700, fill: C.white, anchor: 'middle' });
    body += lines(560, y + 78, wrapLines(what, 32), { size: 11.5, fill: C.white, anchor: 'middle', leading: 15 });
  });
  body += text(696, 426, 'Score each question 1 (no) to 5 (yes): the weakest answer matters most.', { size: 10.5, fill: C.inkLight, italic: true, anchor: 'end' });
  return svg({
    title: 'Pivot or persist',
    desc: 'Three questions, each leading to a path. Is the core still defensible? If yes, persist. Is there a credible reinvention path when the core is weak? If yes, pivot. Is staying the best use of the capital and the team? If no, or if there is no path, exit and redeploy.',
  }, body);
}

export const PORTFOLIO_DIAGRAMS: Record<string, () => string> = { ansoff, bcg, ge9box, dpm, horizons3, parenting, makebuyally, masynergy, pivotpersist };

