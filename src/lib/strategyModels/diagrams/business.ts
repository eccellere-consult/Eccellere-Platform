/**
 * diagrams/business.ts — reference diagrams for the business-model and financial frameworks: the Business Model Canvas and
 * the Value Proposition Canvas. (More are added here as the catalogue is converted.)
 */
import { C, box, caption, line, path, svg, text } from './svg';

/** The Business Model Canvas in its standard layout of nine blocks. */
function bmc(): string {
  const colW = 136, gap = 5, x0 = 10;
  const colX = (i: number) => x0 + i * (colW + gap);
  const topY = 12, topH = 302, rowH = 148;
  let body = '';
  body += box(colX(0), topY, colW, topH, 'Key partnerships', ['Suppliers, allies, joint ventures.', 'Which key resources and activities do they provide?'], { wrapAt: 20, valign: 'top' });
  body += box(colX(1), topY, colW, rowH, 'Key activities', ['What we must do to deliver the value proposition.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(1), topY + rowH + gap + 2, colW, rowH, 'Key resources', ['Physical, intellectual, human and financial assets we need.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(2), topY, colW, topH, 'Value propositions', ['What value we deliver.', 'Which customer problem we solve, and which needs we satisfy.'], { wrapAt: 20, valign: 'top', fill: C.goldPale, stroke: C.goldLight });
  body += box(colX(3), topY, colW, rowH, 'Customer relationships', ['How we win, keep and grow each segment.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(3), topY + rowH + gap + 2, colW, rowH, 'Channels', ['How we reach customers and deliver the proposition.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(4), topY, colW, topH, 'Customer segments', ['The groups of people or businesses we create value for.', 'Who are our most important customers?'], { wrapAt: 20, valign: 'top' });
  const bottomY = topY + topH + gap, bottomH = 440 - bottomY - 12;
  const half = (5 * colW + 4 * gap - gap) / 2;
  body += box(x0, bottomY, half, bottomH, 'Cost structure', ['The most important costs in the model; which resources and activities are most expensive.'], { wrapAt: 56, valign: 'top' });
  body += box(x0 + half + gap, bottomY, half, bottomH, 'Revenue streams', ['What customers really pay for, how they pay, and how much each stream contributes.'], { wrapAt: 56, valign: 'top' });
  return svg({
    title: 'The Business Model Canvas',
    desc: 'Nine building blocks on one page. Value propositions in the centre; customer segments, customer relationships and channels on the right; key activities, key resources and key partners on the left; cost structure and revenue streams along the bottom.',
  }, body);
}

/** The Value Proposition Canvas: the value map (a square) beside the customer profile (a circle), with the fit between them. */
function vpc(): string {
  let body = '';
  // value map — the square
  body += text(30, 30, 'Value map', { size: 12, weight: 700, fill: C.gold, spacing: 0.8, upper: true });
  body += box(30, 46, 150, 348, 'Products & services', ['What we offer — the products and services the value proposition is built around.'], { wrapAt: 20, valign: 'top', fill: C.cream });
  body += box(180, 46, 150, 174, 'Gain creators', ['How our offer creates the gains the customer wants.'], { wrapAt: 20, valign: 'top', fill: C.tealPale, stroke: C.white, sw: 2 });
  body += box(180, 220, 150, 174, 'Pain relievers', ['How our offer removes or reduces the customer’s pains.'], { wrapAt: 20, valign: 'top', fill: C.brickPale, stroke: C.white, sw: 2 });
  // customer profile — the circle, in three sectors
  const cx = 548, cy = 220, r = 162;
  body += text(cx - r, 30, 'Customer profile', { size: 12, weight: 700, fill: C.gold, spacing: 0.8, upper: true });
  body += path(`M${cx},${cy} L${cx - r},${cy} A${r},${r} 0 0 1 ${cx},${cy - r} Z`, { fill: C.tealPale, stroke: C.white, sw: 2 });
  body += path(`M${cx},${cy} L${cx},${cy + r} A${r},${r} 0 0 1 ${cx - r},${cy} Z`, { fill: C.brickPale, stroke: C.white, sw: 2 });
  body += path(`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} Z`, { fill: C.cream, stroke: C.white, sw: 2 });
  body += text(cx - r / 2 - 4, cy - 70, 'Gains', { size: 13, weight: 700, anchor: 'middle' });
  body += text(cx - r / 2 - 4, cy - 52, 'What the customer', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx - r / 2 - 4, cy - 38, 'hopes to achieve', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx - r / 2 - 4, cy + 56, 'Pains', { size: 13, weight: 700, anchor: 'middle' });
  body += text(cx - r / 2 - 4, cy + 74, 'What annoys, blocks', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx - r / 2 - 4, cy + 88, 'or frightens them', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx + r / 2 + 6, cy - 6, 'Customer jobs', { size: 13, weight: 700, anchor: 'middle' });
  body += text(cx + r / 2 + 6, cy + 12, 'What they are trying to', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx + r / 2 + 6, cy + 26, 'get done: functional,', { size: 10, fill: C.inkMid, anchor: 'middle' });
  body += text(cx + r / 2 + 6, cy + 40, 'social, emotional', { size: 10, fill: C.inkMid, anchor: 'middle' });
  // the fit
  body += line(334, 133, 384, 133, { arrow: 'both', gold: true, sw: 1.8 });
  body += line(334, 307, 384, 307, { arrow: 'both', gold: true, sw: 1.8 });
  body += caption(359, 122, 'Fit');
  body += caption(359, 296, 'Fit');
  body += text(360, 424, 'Fit = our creators and relievers answer the gains and pains that matter most', { size: 10, fill: C.inkLight, italic: true, anchor: 'middle' });
  return svg({
    title: 'The Value Proposition Canvas',
    desc: 'On the left, the value map: products and services, gain creators and pain relievers. On the right, the customer profile as a circle: customer jobs, gains and pains. Arrows mark the fit between gain creators and gains, and between pain relievers and pains.',
  }, body);
}

/** The Lean Canvas: problem, solution, value proposition, unfair advantage and customers across the top; money along the bottom. */
function leancanvas(): string {
  const colW = 136, gap = 5, x0 = 10;
  const colX = (i: number) => x0 + i * (colW + gap);
  const topY = 12, topH = 302, rowH = 148;
  let body = '';
  body += box(colX(0), topY, colW, topH, 'Problem', ['The top 1–3 problems the customer has.', 'Existing alternatives: how they cope today.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(1), topY, colW, rowH, 'Solution', ['The top three features that answer the problems.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(1), topY + rowH + gap + 2, colW, rowH, 'Key metrics', ['The few numbers that show how you are doing.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(2), topY, colW, topH, 'Unique value proposition', ['A single, clear, compelling message that says why you are different and worth buying.', 'High-level concept: “X for Y”.'], { wrapAt: 20, valign: 'top', fill: C.goldPale, stroke: C.goldLight });
  body += box(colX(3), topY, colW, rowH, 'Unfair advantage', ['Something that cannot easily be copied or bought.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(3), topY + rowH + gap + 2, colW, rowH, 'Channels', ['The path to customers.'], { wrapAt: 20, valign: 'top' });
  body += box(colX(4), topY, colW, topH, 'Customer segments', ['Who has the problem: the target customers.', 'Early adopters: who would try it first.'], { wrapAt: 20, valign: 'top' });
  const bottomY = topY + topH + gap, bottomH = 440 - bottomY - 12;
  const half = (5 * colW + 4 * gap - gap) / 2;
  body += box(x0, bottomY, half, bottomH, 'Cost structure', ['Customer acquisition, delivery, people and premises.'], { wrapAt: 56, valign: 'top' });
  body += box(x0 + half + gap, bottomY, half, bottomH, 'Revenue streams', ['How you will earn: price, margin and lifetime value.'], { wrapAt: 56, valign: 'top' });
  return svg({
    title: 'The Lean Canvas',
    desc: 'Nine boxes on one page. Across the top: problem (with existing alternatives), solution with key metrics beneath it, unique value proposition (with the high-level concept), unfair advantage with channels beneath it, and customer segments (with early adopters). Cost structure and revenue streams run along the bottom.',
  }, body);
}

export const BUSINESS_DIAGRAMS: Record<string, () => string> = { bmc, vpc, leancanvas };
