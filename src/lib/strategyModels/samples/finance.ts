/**
 * samples/finance.ts — the worked examples for the Three-Statement Financial Model, Unit Economics and the Minimum Viable
 * Financial Model, told about the fictional Anand Auto Components (Pune): revenue ₹9,800 lakh in FY 2024-25, EBITDA ₹1,450
 * lakh, 71 debtor days, 41% of revenue from one customer. Fictional and illustrative; every figure ties to the other demos.
 * The figures quoted in the analyses are the ones the model works out from these answers (a test checks them).
 */
import type { ModelSample } from '../types';

export const FINANCE_SAMPLES: Record<string, ModelSample> = {
  financial: {
    scenario: 'Anand Auto Components (Pune) — a three-year projection to test whether the growth plan is financeable.',
    values: {
      period: 'FY 2024-25',
      revenue: '9800',
      cogs_pct: '80',
      opex_pct: '5.2',
      depreciation: '380',
      interest: '208',
      tax_rate: '25',
      cash: '300',
      receivables: '1906',
      inventory: '1181',
      fixed_assets: '3800',
      payables: '967',
      debt: '2600',
      depreciation_rate: '10',
      interest_rate: '8',
      revenue_basis: 'Per-unit sales under annual OEM contracts (about 92% of revenue), tooling and fixture recovery (about 5%) and engineering services (about 3%). Growth comes from the two bid-stage OEM contracts, the welded-bracket line and EV tooling.',
      cost_basis: 'Operations is about two-thirds of total cost, with materials at 58% of revenue at index prices. The plan assumes rework falls from 4.8% towards 2% as the Line 2 welding fix lands, and index-linked pricing passes steel moves through to customers.',
      investment_plan: 'Year 1 (₹500 lakh): the Line 2 welding fix (₹120 lakh), EV pilot fixtures (₹80 lakh) and maintenance and replacement (₹300 lakh). Year 2 (₹1,130 lakh): the second welding line for chassis brackets (₹650 lakh), tooling and fixture capacity (₹180 lakh) and maintenance (₹300 lakh), part-funded by an ₹800 lakh term loan. Year 3 (₹700 lakh): capacity balancing and tooling (₹260 lakh), maintenance (₹300 lakh) and EV scale-up fixtures (₹140 lakh) that are released only if a second OEM confirms volumes. Term loans are repaid at ₹300 lakh a year, so Year 2 shows net new borrowing of ₹500 lakh.',
      growth_basis: 'About ₹60 lakh to win each new OEM programme against about ₹240 lakh of lifetime gross profit, a ratio of 4 to 1, but a payback of about 30 months — so growth is staged against signed programmes.',
      stress_cases: 'Steel price up 15% with no pass-through; the anchor customer cuts volume by 20%; the second line is delayed by two quarters. The projection should be re-run for each.',
      one_off_events: 'No acquisition is assumed. The M&A check on the Chakan heat-treatment and aluminium-machining specialist found that the ₹1,100 lakh asking price is not covered by the synergies and set a walk-away price of about ₹1,000 lakh; a deal at that price would be on top of this plan and need its own funding.',
      notes: '',
    },
    tables: {
      assumptions: [
        { year: 'Year 1', growth: '11', cogs_pct: '79.5', opex_pct: '5.2', receivable_days: '68', inventory_days: '53', payable_days: '46', capex: '500', new_debt: '-300', dividend: '80' },
        { year: 'Year 2', growth: '14', cogs_pct: '79', opex_pct: '5.1', receivable_days: '64', inventory_days: '51', payable_days: '46', capex: '1130', new_debt: '500', dividend: '80' },
        { year: 'Year 3', growth: '16', cogs_pct: '78.5', opex_pct: '5', receivable_days: '60', inventory_days: '49', payable_days: '46', capex: '700', new_debt: '-300', dividend: '120' },
      ],
    },
    why: {
      revenue: 'The base year ties to the Value Scan and the other demos (revenue ₹9,800 lakh, EBITDA about ₹1,450 lakh).',
      assumptions: 'Each assumption has a reason in the section below it: the growth is tied to named contracts, the working-capital days follow the debtor-days programme, and the capital spending follows the second welding line approved in the portfolio tools.',
      investment_plan: 'The capital plan names what each year’s spending buys and how it is funded, which is what lets a lender test it.',
    },
    analysis: {
      summary: 'The plan takes revenue from ₹9,800 lakh to ₹14,385 lakh in three years (13.6% a year) and the EBITDA margin from 14.8% to 16.5%, lifting net profit from ₹647 lakh to ₹1,263 lakh. The three statements balance in every year, cash never falls below ₹535 lakh, borrowings fall from 1.8 to 1.1 times EBITDA and interest cover rises from 5.1 to 8.5 times, so the plan is financeable. It depends on two things not yet earned: a margin gain worth ₹245 lakh of EBITDA in Year 3, and debtor days falling from 71 to 60, worth ₹433 lakh of cash by Year 3.',
      verdict: {
        label: 'Financeable — if the margin gain and faster collections are delivered',
        rationale: 'The statements balance and cash stays above ₹535 lakh, but without the margin gain and the faster collections Year-3 cash falls from ₹1,607 lakh to ₹845 lakh, and the Year-2 term loan is what lifts cash to ₹1,147 lakh.',
      },
      findings: [
        { title: 'The plan largely funds itself', detail: 'Cash from operations of ₹1,115, ₹1,323 and ₹1,580 lakh in the three years pays for ₹2,330 lakh of capital spending, ₹280 lakh of dividends and ₹900 lakh of loan repayments, with ₹800 lakh of new borrowing in Year 2 for the second welding line; cash rises from ₹300 lakh to ₹1,607 lakh.' },
        { title: 'Working capital is the biggest cash lever', detail: 'Revenue grows 47% but receivables rise only 24%, because debtor days fall from 71 to 60; if debtor days stay at 71, Year-3 cash is ₹433 lakh lower (₹1,174 lakh instead of ₹1,607 lakh).' },
        { title: 'The margin gain is assumed, not yet earned', detail: 'Cost of goods sold falls from 80.0% to 78.5% of revenue and operating expenses from 5.2% to 5.0%, worth ₹245 lakh of EBITDA in Year 3; without it Year-3 EBITDA is ₹2,129 lakh and Year-3 cash ₹328 lakh lower.' },
        { title: 'The balance sheet gets stronger, not riskier', detail: 'Borrowings stay between ₹2,300 lakh and ₹2,800 lakh while EBITDA grows from ₹1,450 lakh to ₹2,374 lakh, so borrowings to EBITDA fall from 1.8 to 1.1 times and interest cover rises from 5.1 to 8.5 times, which leaves a lender room to say yes.' },
      ],
      watchouts: [
        'Capital spending of ₹2,330 lakh is nearly twice the depreciation of ₹1,238 lakh over the period; fixed assets grow from ₹3,800 lakh to ₹4,892 lakh, so the new capacity must be filled for the margin gain to hold.',
        'Only one case has been run: the stress cases named in the plan (steel up 15% with no pass-through, the anchor customer cutting volume by 20%, a two-quarter delay to the second line) are not yet in the model.',
        'If the Year-2 term loan were not drawn and debtor days stayed at 71, Year-2 cash would fall to ₹110 lakh, less than half a week of revenue.',
      ],
    },
    recommendations: [
      'Take the ₹800 lakh term loan for the second welding line, but draw it against signed bracket volumes, so the money is not committed before the orders are.',
      'Treat the fall in debtor days from 71 to 60 as a funded programme with a named owner and a monthly target: each day released is worth about ₹39 lakh of cash at Year-3 revenue.',
      'Run the three stress cases named in the plan through this model and take the lowest cash of each to the bank, rather than a single projection.',
      'Decide in advance what Year-3 surplus cash is for — prepaying the 8% term loan, or funding the EV scale-up if a second OEM confirms volumes — instead of letting it build to ₹1,607 lakh unused.',
    ],
    actionables: [
      { action: 'Run the three stress cases (steel up 15%, anchor customer volume down 20%, second line two quarters late) through the model and report the lowest cash in each', owner: 'Finance Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Set a monthly debtor-days path from 71 to 60 with named owners for the ten largest accounts', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Ask the bank for terms on an ₹800 lakh term loan with drawdown tied to signed bracket volumes', owner: 'Managing Director', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Track rework against the 4.8% to 2% path each quarter, because the margin gain depends on it', owner: 'Operations Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  unitecon: {
    scenario: 'Anand Auto Components (Pune) — what a new OEM programme is worth against what it costs to win.',
    values: {
      avg_revenue: '120',
      gross_margin: '20',
      annual_churn: '10',
      acquisition_spend: '180',
      new_customers: '3',
      cac_known: '60',
      scaling_view: 'The ratio is healthy at 4 to 1, so winning more OEM programmes creates value. The payback is the problem: 30 months, because approvals take months and the gross margin is only 20%. Growth should therefore be staged against signed programmes, and the levers are price (index-linked pricing), margin (the rework fix) and a faster approval cycle.',
      notes: 'A “customer” here is an OEM programme (a part family supplied under a multi-year contract), not a company.',
    },
    tables: {
      channels: [
        { channel: 'Key-account sales to the two anchor OEMs', spend: '120', customers: '2' },
        { channel: 'Tenders and OEM supplier portals', spend: '45', customers: '1' },
        { channel: 'Referrals and trade shows', spend: '15', customers: '0' },
      ],
    },
    why: {
      avg_revenue: 'An average per programme rather than the flagship account, so the figure is not flattered by the largest customer.',
      acquisition_spend: 'It includes sales salaries and bid costs, not only marketing, which is where most of the cost of winning a programme sits.',
      channels: 'The channel split shows key-account sales win at ₹60 lakh each while referrals and trade shows have won nothing yet.',
    },
    analysis: {
      summary: 'Each new OEM programme costs about ₹60 lakh to win and earns about ₹24 lakh of gross profit a year for an average of ten years, an LTV of ₹240 lakh — four times the cost and comfortably above the 3-to-1 benchmark. The weakness is time: the ₹60 lakh takes 30 months to earn back, far beyond the 12-month rule of thumb, because OEM approvals are slow and the gross margin is only 20%.',
      verdict: {
        label: 'Healthy ratio, slow payback — scale selectively and shorten approvals',
        rationale: 'LTV to CAC of 4 to 1 says each programme creates value; a 30-month payback says the cash is tied up for a long time before it does.',
      },
      findings: [
        { title: 'The ratio supports growth', detail: 'At 4 to 1 every ₹1 spent winning a programme returns ₹4 of lifetime gross profit, so more programmes are worth winning.' },
        { title: 'The payback is the constraint', detail: 'The 30-month payback means winning three programmes a year ties up about ₹180 lakh of cash for two and a half years each, which matters with 71 debtor days.' },
        { title: 'Margin is the biggest lever', detail: 'A gross margin of 25% instead of 20% would cut payback to 24 months and lift the ratio to 5 to 1 — the rework fix does more for these economics than cheaper selling.' },
        { title: 'One channel is not paying', detail: 'Referrals and trade shows cost ₹15 lakh and won nothing, while key-account sales win a programme for ₹60 lakh and tenders for ₹45 lakh.' },
      ],
      watchouts: [
        'Churn of 10% a year assumes programmes last ten years on average; a shorter life, as EVs replace engine parts, would cut the LTV sharply.',
        'The three programmes won in the year are a small sample; one more or one fewer changes the CAC by a third.',
        'Gross margin is an average across part families; new programmes may earn less in their first years.',
      ],
    },
    recommendations: [
      'Keep winning programmes — the ratio is healthy — but fund growth from signed contracts, so no programme is started before its first purchase order is in hand.',
      'Raise the gross margin: the Line 2 rework fix and index-linked pricing improve both LTV and payback more than any selling economy.',
      'Move spend from the weaker channels to key-account sales and tenders, and review referrals and trade shows after one more year of data.',
      'Test the churn assumption: list the programmes by expected end date and see how many fall within five years.',
    ],
    actionables: [
      { action: 'Compute CAC and LTV for the last five programmes won to check the three-programme sample', owner: 'Finance Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'List every live programme with its expected end date and test the 10% churn assumption', owner: 'Sales Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Agree a rule that growth spending is released only against a signed programme', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'Medium' },
      { action: 'Review the referral and trade-show spend with the sales team', owner: 'Sales Head', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  mvfm: {
    scenario: 'Anand Auto Components (Pune) — a one-sheet model of the EV tooling studio idea, built after the Lean Canvas and before the idea is worth a full model.',
    values: {
      unit_price: '150000',
      unit_cost: '97500',
      volume_month1: '4',
      volume_growth: '15',
      collection_days: '30 days',
      fixed_costs: '4.5',
      launch_costs: '18',
      starting_cash: '30',
      assumptions_basis: 'A unit is one tooling job — a fixture or a prototype tool. The price of ₹1.5 lakh is the middle of the ₹4–8 lakh fee for a programme of about four jobs, as set out in the Lean Canvas; the unit cost of ₹97,500 is material ₹38,000, tool-room machine hours ₹44,000 and inspection and packing ₹15,500, from the last three prototype jobs. Month-1 volume is the first paid pilot programme (four jobs). Fixed costs of ₹4.5 lakh a month are a dedicated tooling designer, a share of the tool-room supervisor, the quoting and incubator sales effort and machine overhead; the launch costs of ₹18 lakh are the fixture library, fast-quote tooling and process certification; the ₹30 lakh of starting cash is ring-fenced from the plant’s budget. The least certain assumptions are the price — no start-up has yet agreed to pay a premium for speed — and the 15% monthly growth.',
      notes: '',
    },
    tables: {},
    why: {
      unit_cost: 'Variable cost only, taken from three real prototype jobs; the fixed team and the fixture library sit in the fixed and launch costs, so the break-even volume means something.',
      volume_growth: 'The growth rate is flagged as one of the two least certain assumptions, so the reader knows what the pilots must test first.',
      collection_days: 'Payment timing is modelled because a start-up that pays a month late is what turns a profitable month into a cash shortage.',
    },
    analysis: {
      summary: 'Each tooling job earns ₹52,500, a margin of 35%, so about nine jobs a month cover the ₹4.5 lakh of fixed costs — more than twice the four jobs of the first month. Profit turns positive in Month 7, but cash keeps falling until Month 9 because start-ups pay a month late while volume grows 15% a month; the low point is −₹11.6 lakh, which is ₹11.6 lakh more than the ₹30 lakh set aside. The studio is sound if customers pay promptly and short of cash if they do not.',
      verdict: {
        label: 'Worth running, but ₹30 lakh is not enough — fix the payment terms first',
        rationale: 'The margin is healthy and profit turns positive in Month 7, but cash dips ₹11.6 lakh below zero in Month 9 because of the 30-day wait for payment while volume is growing.',
      },
      findings: [
        { title: 'The unit margin is healthy', detail: 'Each job earns ₹52,500 on a ₹1.5 lakh price, a margin of 35%, so about nine jobs a month cover the ₹4.5 lakh of fixed costs.' },
        { title: 'Profit arrives before cash does', detail: 'Operating profit turns positive in Month 7, but cash keeps falling until Month 9 and is still ₹9.0 lakh below zero in Month 12, because each month’s sales are paid a month later while volume grows 15% a month.' },
        { title: 'Payment terms decide the funding need', detail: 'If start-ups pay on delivery, cash never falls below ₹3.4 lakh and no extra funding is needed; at 90 days the balance is ₹54.4 lakh below zero and still falling in Month 12.' },
        { title: 'Price is the most sensitive assumption', detail: 'A price 10% lower (₹1.35 lakh) doubles the shortfall to ₹23.6 lakh and moves the first profitable month to Month 9, while a ₹1 lakh rise in the monthly fixed costs lifts it to ₹21.6 lakh.' },
      ],
      watchouts: [
        'Month-12 volume of nearly 19 jobs a month is more than four programmes a month, from five named early adopters; the 15% growth is a hope until the first pilots convert.',
        'No start-up has yet agreed to pay ₹1.5 lakh a job, so the price is untested; the pilots must test it, not assume it.',
        'The sheet has no tax and no capital spending beyond the launch costs, so it should be replaced by actuals once the three pilots have run.',
      ],
    },
    recommendations: [
      'Ask start-ups to pay on delivery, or half in advance on order: this alone removes the funding need, and it costs nothing to put in the pilot offer.',
      'If the payment terms cannot change, raise the ring-fenced budget from ₹30 lakh to about ₹45 lakh, which keeps the lowest cash just above zero (₹3.4 lakh).',
      'Test the price in the three paid pilots before the fixture library is built: confirm that start-ups accept ₹1.5 lakh a job, because a 10% lower price doubles the shortfall.',
      'Track jobs sold, days to collect and fixed costs every month against this sheet, and if at least two pilots convert, move to the three-statement model so the studio sits inside the plant’s plan.',
    ],
    actionables: [
      { action: 'Add payment on delivery, or half in advance on order, to the pilot offer and test it with the first two start-ups', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Confirm the ₹1.5 lakh job price in writing with the three pilot start-ups before the fixture library is built', owner: 'Engineering Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Decide whether to raise the ring-fenced budget from ₹30 lakh to ₹45 lakh or to fix the payment terms', owner: 'Finance Head', timeframe: 'Next 30 days', priority: 'Medium' },
      { action: 'Record jobs sold, days to collect and fixed cost every month against this sheet', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },
};
