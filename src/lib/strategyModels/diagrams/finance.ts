/**
 * diagrams/finance.ts — reference diagrams for the financial frameworks: the three linked statements, unit economics (CAC and
 * LTV) and the minimum viable financial model.
 */
import { C, badge, circle, line, lines, path, rect, svg, text } from './svg';

/** The three statements and how they link: profit feeds equity and cash from operations; the cash-flow statement ends in the balance sheet's cash. */
function financial(): string {
  let body = '';
  const panelTop = 38, rowH = 24;
  const panel = (x: number, title: string, items: [string, boolean][]) => {
    body += rect(x, panelTop, 208, 34 + items.length * rowH + 14, { fill: C.cream, stroke: C.border });
    body += rect(x, panelTop, 208, 32, { fill: C.ink });
    body += text(x + 104, panelTop + 21, title, { size: 13, weight: 700, fill: C.white, anchor: 'middle' });
    items.forEach(([t, strong], i) => {
      const rowTop = panelTop + 40 + i * rowH;
      if (strong) body += rect(x + 8, rowTop, 192, rowH - 2, { fill: C.goldPale, stroke: C.goldLight });
      body += text(x + 18, rowTop + 16, t, { size: 12, weight: strong ? 700 : 400, fill: strong ? C.ink : C.inkMid });
    });
  };
  panel(16, 'Income statement', [['Revenue', false], ['− Cost of goods sold', false], ['= Gross profit', true], ['− Operating expenses', false], ['= EBITDA', true], ['− Depreciation', false], ['− Interest', false], ['− Tax', false], ['= Net profit', true]]);
  panel(256, 'Balance sheet', [['Cash and bank', false], ['Receivables', false], ['Inventory', false], ['Net fixed assets', false], ['= Total assets', true], ['Payables', false], ['Borrowings', false], ['Equity', false], ['= Liabilities and equity', true]]);
  panel(496, 'Cash-flow statement', [['Net profit', false], ['+ Depreciation', false], ['− Working capital tied up', false], ['= Cash from operations', true], ['− Capital spending', false], ['+ Borrowings − dividends', false], ['= Net change in cash', true], ['+ Opening cash', false], ['= Closing cash', true]]);
  // the links: net profit goes over the top to the cash-flow statement; below, retained profit grows equity and closing cash lands in the balance sheet
  body += line(120, panelTop, 120, 20, { stroke: C.gold, sw: 1.8 }) + line(120, 20, 600, 20, { stroke: C.gold, sw: 1.8 }) + line(600, 20, 600, panelTop, { arrow: 'end', gold: true, sw: 1.8 });
  body += rect(300, 10, 120, 20, { fill: C.white }) + text(360, 25, 'Net profit', { size: 11, weight: 700, fill: C.gold, anchor: 'middle' });
  const bottom = panelTop + 34 + 9 * rowH + 14, linkY = bottom + 17;
  body += line(120, bottom, 120, linkY, { stroke: C.gold, sw: 1.8 }) + line(120, linkY, 322, linkY, { stroke: C.gold, sw: 1.8 }) + line(322, linkY, 322, bottom, { arrow: 'end', gold: true, sw: 1.8 });
  body += rect(136, linkY - 8, 170, 16, { fill: C.white }) + text(221, linkY + 4, 'Retained profit grows equity', { size: 10.5, weight: 600, fill: C.inkMid, anchor: 'middle' });
  body += line(600, bottom, 600, linkY, { stroke: C.gold, sw: 1.8 }) + line(600, linkY, 398, linkY, { stroke: C.gold, sw: 1.8 }) + line(398, linkY, 398, bottom, { arrow: 'end', gold: true, sw: 1.8 });
  body += rect(414, linkY - 8, 170, 16, { fill: C.white }) + text(499, linkY + 4, 'Closing cash = balance-sheet cash', { size: 10.5, weight: 600, fill: C.inkMid, anchor: 'middle' });
  // the years: the same three statements repeat, each year opening where the last closed
  const yearsTop = linkY + 16;
  ['Base year', 'Year 1', 'Year 2', 'Year 3'].forEach((label, i) => {
    const x = 16 + i * 172;
    body += rect(x, yearsTop, 148, 30, { fill: i === 0 ? C.ink : C.tealPale, stroke: i === 0 ? C.ink : C.teal });
    body += text(x + 74, yearsTop + 20, label, { size: 12.5, weight: 700, fill: i === 0 ? C.white : C.ink, anchor: 'middle' });
    if (i < 3) body += line(x + 150, yearsTop + 15, x + 170, yearsTop + 15, { arrow: 'end', gold: true, sw: 1.8 });
  });
  body += rect(16, yearsTop + 42, 688, 44, { fill: C.goldPale, stroke: C.gold });
  body += text(360, yearsTop + 62, 'Assets always equal liabilities plus equity', { size: 13.5, weight: 700, anchor: 'middle' });
  body += text(360, yearsTop + 78, 'If the balance sheet does not balance, a link between the statements is broken. Each year opens where the last one closed.', { size: 10.5, fill: C.inkMid, anchor: 'middle' });
  return svg({
    title: 'The three linked financial statements',
    desc: 'Three panels: the income statement, from revenue down to net profit; the balance sheet, assets against liabilities and equity; and the cash-flow statement, from net profit through working capital, investing and financing to closing cash. Arrows show net profit flowing into the cash-flow statement and into equity, and closing cash flowing into the balance sheet. Below, a row of years — base year, Year 1, Year 2 and Year 3 — shows each year opening where the last closed, and a note that assets always equal liabilities plus equity.',
  }, body);
}

/** Unit economics: cumulative gross profit per customer against the cost of winning them, with the payback and the lifetime value. */
function unitecon(): string {
  const left = 90, right = 690, zeroY = 190, topY = 40, bottomY = 300;
  let body = line(left, bottomY, left, topY, { arrow: 'end', sw: 1.2 }) + line(left, zeroY, right, zeroY, { stroke: C.inkMid, sw: 1.4 });
  body += text(40, (topY + bottomY) / 2, 'CUMULATIVE GROSS PROFIT PER CUSTOMER', { size: 10.5, weight: 700, fill: C.gold, spacing: 0.8, anchor: 'middle', rotate: -90 });
  body += text(right, zeroY + 16, 'Time with the customer', { size: 11, weight: 700, fill: C.gold, anchor: 'end' });
  // the customer starts below zero by the CAC, climbs through zero at the payback, and ends at the LTV
  const startX = left + 20, startY = 262, endX = 600, endY = 70;
  body += path(`M${startX},${startY} L${endX},${endY}`, { stroke: C.gold, sw: 4 });
  body += line(startX, zeroY, startX, startY, { stroke: C.brick, sw: 1.8, arrow: 'end' });
  body += circle(startX, startY, 5, { fill: C.brick });
  body += text(startX + 12, startY + 4, 'Starts at −CAC: the cost of winning the customer', { size: 11.5, weight: 600, fill: C.brick });
  const crossX = startX + ((zeroY - startY) / (endY - startY)) * (endX - startX);
  body += circle(crossX, zeroY, 6, { fill: C.teal });
  body += lines(crossX + 12, zeroY - 22, ['Payback', 'CAC earned back'], { size: 11.5, weight: 700, fill: C.teal, leading: 15 });
  body += line(endX, zeroY, endX, endY, { stroke: C.teal, sw: 1.8, arrow: 'end' });
  body += circle(endX, endY, 5, { fill: C.teal });
  body += lines(endX + 8, endY - 36, ['LTV: all the gross profit', 'over the customer’s life'], { size: 11.5, weight: 700, fill: C.teal, anchor: 'end', leading: 15 });
  body += line(endX, zeroY + 20, endX, zeroY + 4, { stroke: C.inkMid, sw: 1 });
  body += text(endX, zeroY + 36, 'Customer leaves (churn)', { size: 10.5, fill: C.inkMid, anchor: 'middle' });
  // the sums
  body += rect(20, 328, 330, 96, { fill: C.cream, stroke: C.border });
  body += text(36, 352, 'LTV = revenue × gross margin ÷ churn', { size: 12.5, weight: 700 });
  body += text(36, 374, 'CAC = sales and marketing spend ÷ new customers', { size: 12.5, weight: 700 });
  body += text(36, 396, 'Payback = CAC ÷ monthly gross profit per customer', { size: 12.5, weight: 700 });
  body += text(36, 414, 'Gross margin is revenue less the direct cost of delivering it.', { size: 10.5, fill: C.inkLight, italic: true });
  body += rect(370, 328, 330, 96, { fill: C.goldPale, stroke: C.gold });
  body += text(386, 352, 'Rules of thumb', { size: 12.5, weight: 700, fill: C.gold });
  body += text(386, 376, 'LTV at least 3 × CAC', { size: 13, weight: 700 });
  body += text(386, 398, 'Payback within about 12 months', { size: 13, weight: 700 });
  body += text(386, 416, 'LTV under CAC: every customer loses money.', { size: 10.5, fill: C.inkMid, italic: true });
  return svg({
    title: 'Unit economics: CAC and LTV',
    desc: 'A chart of one customer’s cumulative gross profit over time. It starts below zero by the customer acquisition cost, crosses zero at the payback point, and ends at the customer lifetime value when the customer leaves. Below, the formulas for LTV, CAC and payback, and the rules of thumb: LTV at least three times CAC and payback within about twelve months.',
  }, body);
}

/** The minimum viable financial model: from unit margin to cash, with the funding gap on a cash curve. */
function mvfm(): string {
  let body = text(20, 28, 'FROM ONE UNIT TO CASH', { size: 11, weight: 700, fill: C.gold, spacing: 1 });
  const steps: [string, string[], string][] = [
    ['Unit margin', ['Unit price', '− Unit cost', '= Margin on each unit'], C.tealPale],
    ['Operating profit', ['× Units sold', '− Fixed costs', '= Profit each month'], C.goldPale],
    ['Cash', ['Profit', '+ When customers pay', '− Launch costs'], C.cream],
  ];
  steps.forEach(([title, items, fill], i) => {
    const y = 40 + i * 118;
    body += rect(20, y, 226, 104, { fill, stroke: C.border });
    body += badge(40, y + 24, String(i + 1), C.gold, 10);
    body += text(62, y + 29, title, { size: 13.5, weight: 700 });
    body += lines(40, y + 56, items, { size: 11.5, fill: C.inkMid, leading: 17 });
    if (i < 2) body += line(133, y + 104, 133, y + 118, { arrow: 'end', gold: true, sw: 1.8 });
  });
  // the cash curve
  const left = 300, right = 700, top = 56, bottom = 300, zeroY = 170;
  body += line(left, bottom, left, top - 6, { arrow: 'end', sw: 1.2 }) + line(left, zeroY, right, zeroY, { stroke: C.inkMid, sw: 1.4, dash: '5 4' });
  body += text(right, zeroY - 7, 'Cash = 0', { size: 10.5, fill: C.inkMid, anchor: 'end' });
  body += text(right, bottom + 18, 'Months', { size: 11, weight: 700, fill: C.gold, anchor: 'end' });
  body += text(308, top, 'CASH BALANCE', { size: 10.5, weight: 700, fill: C.gold, spacing: 0.8 });
  const curve = `M${left + 14},${zeroY - 40} C ${left + 90},${zeroY + 40} ${left + 130},${zeroY + 110} ${left + 190},${zeroY + 92} S ${left + 310},${zeroY - 70} ${right - 10},${zeroY - 110}`;
  body += path(curve, { stroke: C.gold, sw: 4 });
  body += circle(left + 14, zeroY - 40, 5, { fill: C.teal });
  body += lines(left + 24, zeroY - 62, ['Starting cash'], { size: 11.5, weight: 700, fill: C.teal, leading: 15 });
  body += circle(left + 178, zeroY + 94, 5, { fill: C.brick });
  body += lines(left + 204, zeroY + 120, ['Lowest cash: the funding', 'you need before you launch'], { size: 11.5, weight: 700, fill: C.brick, leading: 15 });
  // profit turns positive on the way down — customers pay late, so cash keeps falling for a while after it
  body += circle(left + 124, zeroY + 76, 5, { fill: C.teal });
  body += lines(left + 12, zeroY + 99, ['Break-even month:', 'profit turns positive,', 'cash still falling'], { size: 11.5, weight: 700, fill: C.teal, leading: 15 });
  body += rect(300, 330, 400, 92, { fill: C.cream, stroke: C.border });
  body += text(316, 354, 'Break-even volume = fixed costs ÷ margin on each unit', { size: 12, weight: 700 });
  body += text(316, 376, 'The cash curve dips because costs are paid before customers pay.', { size: 11.5, fill: C.inkMid });
  body += text(316, 396, 'A later collection date makes the dip deeper and longer.', { size: 11.5, fill: C.inkMid });
  body += text(316, 414, 'Replace the guesses with actuals once there is trading history.', { size: 10.5, fill: C.inkLight, italic: true });
  return svg({
    title: 'The minimum viable financial model',
    desc: 'On the left, three steps: unit price less unit cost gives the margin on each unit; units sold times that margin less fixed costs gives the monthly profit; profit adjusted for when customers pay and for launch costs gives cash. On the right, a cash curve that starts positive, dips below zero to its lowest point, which is the funding needed, and recovers once the break-even month passes.',
  }, body);
}

export const FINANCE_DIAGRAMS: Record<string, () => string> = { financial, unitecon, mvfm };
