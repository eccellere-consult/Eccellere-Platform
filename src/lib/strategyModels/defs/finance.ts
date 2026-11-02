/**
 * defs/finance.ts — the financial frameworks: the Three-Statement Financial Model, Unit Economics (CAC and LTV) and the
 * Minimum Viable Financial Model. The figures these models work out — the three statements, a month-by-month cash projection —
 * are computed here from the client's answers by pure functions, shown as tables of worked-out figures (views) and given to
 * the AI as figures it must use rather than recompute.
 *
 * Each definition follows the published model — its elements, in its order, under its names. Examples are placeholders; the
 * worked examples live in samples/finance.ts.
 */
import { col, long, num, section, select, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, ResultView, Row } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];
const filled = (v: ModelValues, key: string): string | null => v.fields[key]?.trim() || null;
const n = (v: ModelValues, key: string): number | null => toNum(v.fields[key]);

/** A whole number with thousands separators and a proper minus sign: 9,800 · −1,250. */
function fmtInt(x: number): string {
  const r = Math.round(x);
  const s = String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return r < 0 ? `−${s}` : s;
}
/** Money in lakh with the sign in front of the rupee: ₹1,250 lakh · −₹55 lakh. */
const lakh = (x: number): string => (Math.round(x) < 0 ? `−₹${fmtInt(-x)} lakh` : `₹${fmtInt(x)} lakh`);
/** The same to one decimal, for the small sums of a new venture: ₹11.6 lakh · −₹11.6 lakh. */
const lakhOne = (x: number): string => (Math.round(x * 10) < 0 ? `−₹${fmtNum(-x, 1)} lakh` : `₹${fmtNum(x, 1)} lakh`);
const pct = (x: number): string => `${fmtNum(x, 1)}%`;

// ── Three-statement financial model ──────────────────────────────────────────

const YEAR_ROWS = ['Year 1', 'Year 2', 'Year 3'] as const;
const COLUMNS = ['Base year', ...YEAR_ROWS] as const;

interface YearFigures {
  revenue: number; cogs: number; grossProfit: number; opex: number; ebitda: number;
  depreciation: number; ebit: number; interest: number; pbt: number; tax: number; netProfit: number;
  cash: number; receivables: number; inventory: number; fixedAssets: number; totalAssets: number;
  payables: number; debt: number; equity: number; totalLiabilitiesAndEquity: number; check: number;
  /** The cash-flow statement; absent for the base year. */
  flow?: {
    netProfit: number; depreciation: number; receivables: number; inventory: number; payables: number; operating: number;
    capex: number; investing: number; newDebt: number; dividends: number; financing: number; netChange: number; opening: number; closing: number;
  };
}

const assumption = (v: ModelValues, year: string, key: string): number | null => {
  const r = rows(v, 'assumptions').find((x) => x.year === year);
  return r ? toNum(r[key]) : null;
};

/**
 * The three statements for the base year and each projected year. A year is projected once its revenue growth is given; every
 * other assumption falls back to the year before (for the first year, to the base year's own ratios). Returns null until the
 * base year has revenue and its two cost ratios.
 */
function projectFinancials(v: ModelValues): YearFigures[] | null {
  const revenue = n(v, 'revenue'), cogsPct = n(v, 'cogs_pct'), opexPct = n(v, 'opex_pct');
  if (revenue === null || cogsPct === null || opexPct === null) return null;
  const taxRate = (n(v, 'tax_rate') ?? 25) / 100;
  const base = {
    cash: n(v, 'cash') ?? 0, receivables: n(v, 'receivables') ?? 0, inventory: n(v, 'inventory') ?? 0,
    fixedAssets: n(v, 'fixed_assets') ?? 0, payables: n(v, 'payables') ?? 0, debt: n(v, 'debt') ?? 0,
  };
  const depreciation0 = n(v, 'depreciation') ?? 0, interest0 = n(v, 'interest') ?? 0;
  const cogs0 = revenue * (cogsPct / 100);
  const depRate = n(v, 'depreciation_rate') !== null ? n(v, 'depreciation_rate')! / 100 : base.fixedAssets > 0 ? depreciation0 / base.fixedAssets : 0;
  const intRate = n(v, 'interest_rate') !== null ? n(v, 'interest_rate')! / 100 : base.debt > 0 ? interest0 / base.debt : 0;

  const profitAndLoss = (rev: number, cogs: number, opex: number, dep: number, interest: number) => {
    const grossProfit = rev - cogs, ebitda = grossProfit - opex, ebit = ebitda - dep, pbt = ebit - interest;
    const tax = Math.max(0, pbt) * taxRate;
    return { grossProfit, ebitda, ebit, pbt, tax, netProfit: pbt - tax };
  };
  const totalAssets0 = base.cash + base.receivables + base.inventory + base.fixedAssets;
  const equity0 = totalAssets0 - base.payables - base.debt;
  const pl0 = profitAndLoss(revenue, cogs0, revenue * (opexPct / 100), depreciation0, interest0);
  const years: YearFigures[] = [{
    revenue, cogs: cogs0, opex: revenue * (opexPct / 100), depreciation: depreciation0, interest: interest0, ...pl0,
    ...base, totalAssets: totalAssets0, equity: equity0, totalLiabilitiesAndEquity: base.payables + base.debt + equity0, check: 0,
  }];

  // The days the base year implies, used until the client gives their own.
  let recDays = revenue > 0 ? (base.receivables / revenue) * 365 : 0;
  let invDays = cogs0 > 0 ? (base.inventory / cogs0) * 365 : 0;
  let payDays = cogs0 > 0 ? (base.payables / cogs0) * 365 : 0;
  let cogsRatio = cogsPct, opexRatio = opexPct;

  for (const year of YEAR_ROWS) {
    const growth = assumption(v, year, 'growth');
    if (growth === null) break;
    const prev = years[years.length - 1];
    cogsRatio = assumption(v, year, 'cogs_pct') ?? cogsRatio;
    opexRatio = assumption(v, year, 'opex_pct') ?? opexRatio;
    recDays = assumption(v, year, 'receivable_days') ?? recDays;
    invDays = assumption(v, year, 'inventory_days') ?? invDays;
    payDays = assumption(v, year, 'payable_days') ?? payDays;
    const capex = assumption(v, year, 'capex') ?? 0, newDebt = assumption(v, year, 'new_debt') ?? 0, dividends = assumption(v, year, 'dividend') ?? 0;

    const rev = prev.revenue * (1 + growth / 100);
    const cogs = rev * (cogsRatio / 100), opex = rev * (opexRatio / 100);
    const dep = prev.fixedAssets * depRate, interest = prev.debt * intRate;
    const pl = profitAndLoss(rev, cogs, opex, dep, interest);
    const receivables = (rev * recDays) / 365, inventory = (cogs * invDays) / 365, payables = (cogs * payDays) / 365;
    const fixedAssets = prev.fixedAssets + capex - dep, debt = prev.debt + newDebt;
    const equity = prev.equity + pl.netProfit - dividends;
    const flow = {
      netProfit: pl.netProfit, depreciation: dep,
      receivables: -(receivables - prev.receivables), inventory: -(inventory - prev.inventory), payables: payables - prev.payables,
      operating: 0, capex: -capex, investing: -capex, newDebt, dividends: -dividends, financing: newDebt - dividends,
      netChange: 0, opening: prev.cash, closing: 0,
    };
    flow.operating = flow.netProfit + flow.depreciation + flow.receivables + flow.inventory + flow.payables;
    flow.netChange = flow.operating + flow.investing + flow.financing;
    flow.closing = prev.cash + flow.netChange;
    const totalAssets = flow.closing + receivables + inventory + fixedAssets;
    const totalLE = payables + debt + equity;
    years.push({
      revenue: rev, cogs, opex, depreciation: dep, interest, ...pl,
      cash: flow.closing, receivables, inventory, fixedAssets, totalAssets, payables, debt, equity,
      totalLiabilitiesAndEquity: totalLE, check: totalAssets - totalLE, flow,
    });
  }
  return years;
}

const INCOME_ROWS = ['Revenue', 'Cost of goods sold', 'Gross profit', 'Operating expenses', 'EBITDA', 'Depreciation', 'EBIT', 'Interest', 'Profit before tax', 'Tax', 'Net profit'] as const;
const BALANCE_ROWS = ['Cash and bank', 'Receivables', 'Inventory', 'Net fixed assets', 'Total assets', 'Payables', 'Borrowings', 'Equity', 'Total liabilities and equity', 'Balance check (should be 0)'] as const;
const FLOW_ROWS = ['Net profit', 'Depreciation', 'Change in receivables', 'Change in inventory', 'Change in payables', 'Cash from operations', 'Capital spending', 'Cash from investing', 'New borrowings (repayments)', 'Dividends', 'Cash from financing', 'Net change in cash', 'Opening cash', 'Closing cash'] as const;

const yearAt = (v: ModelValues, column: string): YearFigures | undefined => {
  const p = projectFinancials(v);
  return p ? p[COLUMNS.indexOf(column as (typeof COLUMNS)[number])] : undefined;
};
const shown = (x: number | undefined): string => (x === undefined ? '' : fmtInt(x));

const incomeCell = (row: string, column: string, v: ModelValues): string => {
  const y = yearAt(v, column);
  if (!y) return '';
  const map: Record<string, number> = {
    'Revenue': y.revenue, 'Cost of goods sold': -y.cogs, 'Gross profit': y.grossProfit, 'Operating expenses': -y.opex, 'EBITDA': y.ebitda,
    'Depreciation': -y.depreciation, 'EBIT': y.ebit, 'Interest': -y.interest, 'Profit before tax': y.pbt, 'Tax': -y.tax, 'Net profit': y.netProfit,
  };
  return shown(map[row]);
};
const balanceCell = (row: string, column: string, v: ModelValues): string => {
  const y = yearAt(v, column);
  if (!y) return '';
  const map: Record<string, number> = {
    'Cash and bank': y.cash, 'Receivables': y.receivables, 'Inventory': y.inventory, 'Net fixed assets': y.fixedAssets, 'Total assets': y.totalAssets,
    'Payables': y.payables, 'Borrowings': y.debt, 'Equity': y.equity, 'Total liabilities and equity': y.totalLiabilitiesAndEquity,
    'Balance check (should be 0)': Math.abs(y.check) < 0.5 ? 0 : y.check,
  };
  return shown(map[row]);
};
const flowCell = (row: string, column: string, v: ModelValues): string => {
  const f = yearAt(v, column)?.flow;
  if (!f) return '';
  const map: Record<string, number> = {
    'Net profit': f.netProfit, 'Depreciation': f.depreciation, 'Change in receivables': f.receivables, 'Change in inventory': f.inventory,
    'Change in payables': f.payables, 'Cash from operations': f.operating, 'Capital spending': f.capex, 'Cash from investing': f.investing,
    'New borrowings (repayments)': f.newDebt, 'Dividends': f.dividends, 'Cash from financing': f.financing, 'Net change in cash': f.netChange,
    'Opening cash': f.opening, 'Closing cash': f.closing,
  };
  return shown(map[row]);
};

const FINANCIAL_VIEWS: ResultView[] = [
  { key: 'income', title: 'Projected income statement (₹ lakh)', help: 'Worked out from the base year and the assumptions above. Costs are shown as negatives.', rowHeading: '₹ lakh', columns: COLUMNS, rows: INCOME_ROWS, strong: ['Gross profit', 'EBITDA', 'EBIT', 'Profit before tax', 'Net profit'], cell: incomeCell },
  { key: 'balance', title: 'Projected balance sheet (₹ lakh)', help: 'Cash comes from the cash-flow statement; equity grows by retained profit. Assets always equal liabilities plus equity.', rowHeading: '₹ lakh', columns: COLUMNS, rows: BALANCE_ROWS, strong: ['Total assets', 'Total liabilities and equity'], cell: balanceCell },
  { key: 'cashflow', title: 'Projected cash-flow statement (₹ lakh)', help: 'Net profit plus depreciation, less the cash tied up in working capital, less capital spending, plus borrowing less dividends.', rowHeading: '₹ lakh', columns: YEAR_ROWS, rows: FLOW_ROWS, strong: ['Cash from operations', 'Cash from investing', 'Cash from financing', 'Net change in cash', 'Closing cash'], cell: flowCell },
];

const last = (p: YearFigures[]): { y: YearFigures; index: number } => ({ y: p[p.length - 1], index: p.length - 1 });
const projected = (v: ModelValues): YearFigures[] | null => { const p = projectFinancials(v); return p && p.length > 1 ? p : null; };
const lowestCash = (p: YearFigures[]): { cash: number; column: string; revenue: number } => {
  const ys = p.slice(1);
  return ys.reduce((a, y, i) => (y.cash < a.cash ? { cash: y.cash, column: YEAR_ROWS[i] as string, revenue: y.revenue } : a), { cash: ys[0].cash, column: YEAR_ROWS[0] as string, revenue: ys[0].revenue });
};
/** Cash under a week of that year's revenue is thin — one late payment would empty it. */
const isThin = (l: { cash: number; revenue: number }): boolean => l.cash >= 0 && l.cash < l.revenue / 52;
const cashTone = (p: YearFigures[]): 'good' | 'warn' | 'bad' => { const l = lowestCash(p); return l.cash < 0 ? 'bad' : isThin(l) ? 'warn' : 'good'; };
const fundingText = (p: YearFigures[]): string => {
  const l = lowestCash(p);
  return l.cash < 0 ? `${lakh(-l.cash)} short in ${l.column}` : isThin(l) ? `None, but cash is thin (${lakh(l.cash)} in ${l.column})` : 'None — cash stays positive';
};

const financial: ModelDefinition = {
  toolId: 'financial',
  reference: {
    originator: 'Standard integrated financial modelling (income statement, balance sheet and cash-flow statement linked through net profit, working capital and cash)',
    year: 'Standard practice',
    summary: 'Turns the business model into a projection of the three statements that every lender and investor reads: the income statement (profit), the balance sheet (what the business owns and owes) and the cash-flow statement (where the cash went). They are linked: profit feeds equity, the cash-flow statement ends in the balance sheet’s cash, and the balance sheet must always balance.',
    caption: 'Profit flows into equity and into cash from operations; the cash-flow statement ends in the balance sheet’s cash.',
    howToRead: [
      'Start from the last completed year: its profit and loss, and its balance sheet. Equity is the balancing figure.',
      'Give the growth and the ratios for each of the next three years. Anything you leave blank carries forward from the year before.',
      'Check the three statements tie together: the balance check is zero in every year, and the cash balance never goes negative — if it does, that is the funding you will need.',
    ],
  },
  sections: [
    section('base', 'The starting point', 'The last completed financial year, in ₹ lakh.',
      text('period', 'Base year', 'The financial year the starting figures are for.', 'FY 2024-25', { prefill: 'value_scan' }),
      num('revenue', 'Revenue', 'Revenue for the base year.', '₹ lakh', '9,800', { prefill: 'value_scan' }),
      num('cogs_pct', 'Cost of goods sold', 'Materials, direct labour, power and job work, as a share of revenue.', '% of revenue', '80'),
      num('opex_pct', 'Operating expenses', 'Selling, administration and other running costs that are not in cost of goods sold, excluding depreciation and interest, as a share of revenue.', '% of revenue', '5.2'),
      num('depreciation', 'Depreciation', 'Depreciation charged in the base year.', '₹ lakh', '380'),
      num('interest', 'Interest paid', 'Interest on borrowings paid in the base year.', '₹ lakh', '208'),
      num('tax_rate', 'Tax rate', 'The tax rate on profit before tax. Leave blank to use 25%.', '%', '25')),
    section('balance', 'The balance sheet at the end of the base year', 'What the business owned and owed. Equity is worked out as the balancing figure.',
      num('cash', 'Cash and bank', 'Cash and bank balances.', '₹ lakh', '300'),
      num('receivables', 'Receivables (debtors)', 'Money customers owe you.', '₹ lakh', '1,906'),
      num('inventory', 'Inventory', 'Raw material, work in progress and finished goods.', '₹ lakh', '1,181'),
      num('fixed_assets', 'Net fixed assets', 'Plant, machinery and buildings at book value, after depreciation.', '₹ lakh', '3,800'),
      num('payables', 'Payables (creditors)', 'Money you owe suppliers.', '₹ lakh', '967'),
      num('debt', 'Borrowings (debt)', 'Bank and other borrowings.', '₹ lakh', '2,600')),
    section('assumptions', 'The assumptions for the next three years', 'Give the revenue growth for each year you want projected; every other assumption left blank carries forward from the year before.',
      table('assumptions', 'Assumptions by year', 'One row per year. Revenue growth switches the year on.', 'Year', [
        col.text('year', 'Year', 'The projected year.'),
        col.num('growth', 'Revenue growth', 'Growth in revenue over the year before.', '%'),
        col.num('cogs_pct', 'Cost of goods sold', 'As a share of revenue.', '% of revenue'),
        col.num('opex_pct', 'Operating expenses', 'As a share of revenue.', '% of revenue'),
        col.num('receivable_days', 'Receivable days', 'Days of revenue that customers take to pay.', 'days'),
        col.num('inventory_days', 'Inventory days', 'Days of cost of goods sold held in stock.', 'days'),
        col.num('payable_days', 'Payable days', 'Days of cost of goods sold that you take to pay suppliers.', 'days'),
        col.num('capex', 'Capital spending', 'Spending on plant, machinery and buildings.', '₹ lakh'),
        col.num('new_debt', 'New borrowings (repayments)', 'New borrowings; a repayment is entered as a negative number.', '₹ lakh'),
        col.num('dividend', 'Dividends', 'Dividends paid to owners.', '₹ lakh'),
      ], {
        fixed: YEAR_ROWS,
        hints: { 'Year 1': 'The first year after the base year', 'Year 2': 'The second year after the base year', 'Year 3': 'The third year after the base year' },
      }),
      num('depreciation_rate', 'Depreciation rate', 'Depreciation each year as a share of the net fixed assets at the start of the year. Leave blank to use the base year’s own rate.', '% of opening fixed assets', '10'),
      num('interest_rate', 'Interest rate on borrowings', 'Interest each year as a share of the borrowings at the start of the year. Leave blank to use the base year’s own rate.', '% of opening borrowings', '8')),
    section('basis', 'What the numbers rest on', 'The reasons behind the assumptions, drawn from the earlier tools. This is what lets a lender or board challenge the numbers.',
      long('revenue_basis', 'Where the revenue comes from', 'The revenue streams and customers behind the growth assumption.', 'Per-unit sales under annual contracts', { prefill: { upstream: 'bmc', output: 'revenue_streams' } }),
      long('cost_basis', 'What drives the costs', 'Where the cost goes, by activity, and what would change it.', 'Operations is two-thirds of cost', { prefill: { upstream: 'valuechain', output: 'cost_by_activity' } }),
      long('investment_plan', 'What the capital spending buys', 'The investments behind the capital-spending assumptions and where the cash to fund them comes from.', 'A second welding line and a rework fix', { prefill: { upstream: 'ge9box', output: 'allocation' } }),
      long('growth_basis', 'The evidence behind the growth', 'The customer economics that justify growing at this rate: what a customer is worth against what it costs to win one.', 'LTV to CAC of about 4 to 1', { prefill: { upstream: 'unitecon', output: 'ltv_cac' } }),
      long('stress_cases', 'Cases to stress-test', 'The scenarios the projection should be tested against (a price shock, a lost customer, a delayed line).', 'Steel price up 15%; the anchor customer cuts volume 20%', { prefill: { upstream: 'scenario', output: 'scenario_names' } }),
      long('one_off_events', 'One-off events (an acquisition, a wind-down)', 'Any acquisition, disposal or wind-down that the projection should allow for, and its value.', 'No acquisition assumed', { prefill: { upstream: 'masynergy', output: 'synergy_value' } }),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  views: FINANCIAL_VIEWS,
  derived: [
    {
      key: 'growth',
      label: 'Revenue growth a year',
      compute: (v) => { const p = projected(v); if (!p) return null; const { y, index } = last(p); return `${pct((Math.pow(y.revenue / p[0].revenue, 1 / index) - 1) * 100)} over ${index} year${index === 1 ? '' : 's'}`; },
    },
    {
      key: 'ebitda_margin',
      label: 'EBITDA margin',
      help: 'The base year’s margin, and the last projected year’s.',
      compute: (v) => { const p = projected(v); if (!p) return null; const { y } = last(p); return `${pct((p[0].ebitda / p[0].revenue) * 100)} → ${pct((y.ebitda / y.revenue) * 100)}`; },
      tone: (v) => { const p = projected(v); if (!p) return undefined; const { y } = last(p); return y.ebitda / y.revenue >= p[0].ebitda / p[0].revenue ? 'good' : 'warn'; },
    },
    {
      key: 'net_profit',
      label: 'Net profit in the last year',
      compute: (v) => { const p = projected(v); return p ? lakh(last(p).y.netProfit) : null; },
      tone: (v) => { const p = projected(v); return p ? (last(p).y.netProfit > 0 ? 'good' : 'bad') : undefined; },
    },
    {
      key: 'lowest_cash',
      label: 'Lowest cash balance',
      help: 'Under about a week of revenue is thin: one late payment would empty it.',
      compute: (v) => { const p = projected(v); if (!p) return null; const l = lowestCash(p); return `${lakh(l.cash)} (${l.column})`; },
      tone: (v) => { const p = projected(v); return p ? cashTone(p) : undefined; },
    },
    {
      key: 'funding',
      label: 'Funding gap',
      compute: (v) => { const p = projected(v); return p ? fundingText(p) : null; },
      tone: (v) => { const p = projected(v); return p ? cashTone(p) : undefined; },
    },
    {
      key: 'leverage',
      label: 'Borrowings to EBITDA',
      help: 'Below 2 is comfortable; above 3 is stretched for an MSME.',
      compute: (v) => { const p = projected(v); if (!p) return null; const { y } = last(p); return y.ebitda > 0 ? `${fmtNum(y.debt / y.ebitda, 1)}×` : 'No EBITDA'; },
      tone: (v) => { const p = projected(v); if (!p) return undefined; const { y } = last(p); return y.ebitda <= 0 ? 'bad' : y.debt / y.ebitda > 3 ? 'bad' : y.debt / y.ebitda > 2 ? 'warn' : 'good'; },
    },
    {
      key: 'interest_cover',
      label: 'Interest cover (EBIT ÷ interest)',
      compute: (v) => { const p = projected(v); if (!p) return null; const { y } = last(p); return y.interest > 0 ? `${fmtNum(y.ebit / y.interest, 1)}×` : 'No interest cost'; },
      tone: (v) => { const p = projected(v); if (!p) return undefined; const { y } = last(p); return y.interest <= 0 ? 'good' : y.ebit / y.interest < 2 ? 'bad' : y.ebit / y.interest < 3 ? 'warn' : 'good'; },
    },
    {
      key: 'balance_check',
      label: 'Do the statements tie together?',
      compute: (v) => { const p = projectFinancials(v); if (!p) return null; const worst = Math.max(...p.map((y) => Math.abs(y.check))); return worst < 0.5 ? 'Yes — the balance sheet balances in every year' : `No — out by ${lakh(worst)}`; },
      tone: (v) => { const p = projectFinancials(v); return p ? (Math.max(...p.map((y) => Math.abs(y.check))) < 0.5 ? 'good' : 'bad') : undefined; },
    },
  ],
  outputs: [
    {
      key: 'summary',
      label: 'The projection in brief',
      compute: (v) => {
        const p = projected(v);
        if (!p) return null;
        const { y, index } = last(p), l = lowestCash(p);
        return `Revenue ${lakh(p[0].revenue)} → ${lakh(y.revenue)} by year ${index} (${pct((Math.pow(y.revenue / p[0].revenue, 1 / index) - 1) * 100)} a year); EBITDA margin ${pct((p[0].ebitda / p[0].revenue) * 100)} → ${pct((y.ebitda / y.revenue) * 100)}; net profit ${lakh(y.netProfit)}; lowest cash ${lakh(l.cash)} in ${l.column}`;
      },
    },
    { key: 'final_revenue', label: 'Revenue in the last projected year', compute: (v) => { const p = projected(v); return p ? lakh(last(p).y.revenue) : null; } },
    { key: 'final_ebitda_margin', label: 'EBITDA margin in the last projected year', compute: (v) => { const p = projected(v); return p ? pct((last(p).y.ebitda / last(p).y.revenue) * 100) : null; } },
    { key: 'final_net_profit', label: 'Net profit in the last projected year', compute: (v) => { const p = projected(v); return p ? lakh(last(p).y.netProfit) : null; } },
    { key: 'funding_need', label: 'Funding gap', compute: (v) => { const p = projected(v); return p ? fundingText(p) : null; } },
    { key: 'revenue_basis', label: 'Where the revenue comes from', compute: (v) => filled(v, 'revenue_basis') },
  ],
  legacyLabels: { 'Latest revenue (Value Scan)': 'revenue', 'EBITDA margin (Value Scan)': 'notes', 'Capex assumption': 'notes' },
  analysisGuide:
    'The verdict is whether the three-year plan is financeable and credible. Use the statements as worked out from the answers (they are shown under "worked out"); never recompute them. Check the growth against what the earlier tools support, the margin movement against a named cause, and the working-capital days against the base year: collecting faster than the base year releases cash and needs a reason (what changes in collections). ' +
    'Name the year in which cash is lowest and whether there is a funding gap, comment on borrowings to EBITDA and interest cover, and say which assumption the result is most sensitive to. Flag capital spending with no plan behind it, growth with no customer evidence, and dividends paid while cash is short.',
};

// ── Unit economics (CAC and LTV) ─────────────────────────────────────────────

const channelRows = (v: ModelValues): Row[] => rows(v, 'channels').filter((r) => r.channel);
const channelTotals = (v: ModelValues): { spend: number; customers: number } | null => {
  const spend = channelRows(v).reduce((a, r) => a + (toNum(r.spend) ?? 0), 0);
  const customers = channelRows(v).reduce((a, r) => a + (toNum(r.customers) ?? 0), 0);
  return spend > 0 && customers > 0 ? { spend, customers } : null;
};
/** The cost of winning a customer: given directly, or worked out from spend ÷ customers won (the fields first, then the channels). */
function cac(v: ModelValues): number | null {
  const direct = n(v, 'cac_known');
  if (direct !== null && direct > 0) return direct;
  const spend = n(v, 'acquisition_spend'), won = n(v, 'new_customers');
  if (spend !== null && won !== null && won > 0) return spend / won;
  const t = channelTotals(v);
  return t ? t.spend / t.customers : null;
}
const grossProfitPerYear = (v: ModelValues): number | null => { const r = n(v, 'avg_revenue'), g = n(v, 'gross_margin'); return r === null || g === null ? null : (r * g) / 100; };
function ltv(v: ModelValues): number | null {
  const gp = grossProfitPerYear(v), churn = n(v, 'annual_churn');
  return gp === null || churn === null || churn <= 0 ? null : gp / (churn / 100);
}
const ltvToCac = (v: ModelValues): number | null => { const l = ltv(v), c = cac(v); return l === null || c === null || c <= 0 ? null : l / c; };
const paybackMonths = (v: ModelValues): number | null => { const gp = grossProfitPerYear(v), c = cac(v); return gp === null || c === null || gp <= 0 ? null : c / (gp / 12); };

const unitecon: ModelDefinition = {
  toolId: 'unitecon',
  reference: {
    originator: 'Venture-investor practice popularised by David Skok (“SaaS Metrics 2.0”): customer lifetime value against customer acquisition cost',
    year: '2009–2013',
    summary: 'Asks the one question that decides whether a business can scale: what does it cost to win a customer, and what is that customer worth? Customer lifetime value (LTV) against customer acquisition cost (CAC), and the months to earn the acquisition cost back, show whether growth creates value or destroys it.',
    caption: 'Each customer costs money to win (CAC) and then earns gross profit month by month; the point where it has paid back the CAC is the payback; its total lifetime profit is the LTV.',
    howToRead: [
      'CAC is what you spend on sales and marketing in a period divided by the new customers it won. LTV is the gross profit a customer earns over their life: revenue × gross margin ÷ the share of customers lost each year (churn).',
      'A healthy business has an LTV at least three times its CAC, and earns its CAC back within about twelve months. A ratio under 1 means every new customer loses money.',
      'Long industrial sales cycles can be healthy with a longer payback, but only if the customer stays long enough for the ratio to hold.',
    ],
  },
  sections: [
    section('value', 'What a customer is worth', 'The yearly revenue and gross profit of one customer, and how long they stay.',
      num('avg_revenue', 'Average annual revenue per customer', 'What one customer brings in each year (an average contract value, or revenue ÷ number of customers).', '₹ lakh a year', '120', { prefill: 'value_scan' }),
      num('gross_margin', 'Gross margin on that revenue', 'Revenue less the direct cost of delivering it, as a share of revenue.', '%', '20'),
      num('annual_churn', 'Customers lost each year (churn)', 'The share of customers (or contracts) that end each year. A ten-year average life is 10% a year.', '% a year', '10')),
    section('cost', 'What it costs to win a customer', 'The money spent winning customers, and how many it won.',
      num('acquisition_spend', 'Sales and marketing spend to win customers', 'Everything spent in a year on winning new customers: sales salaries, marketing, bid costs, travel.', '₹ lakh a year', '180'),
      num('new_customers', 'New customers won in the year', 'The number of new customers (or new programmes) won with that spend.', 'customers a year', '3'),
      table('channels', 'By channel (optional)', 'Break the spend and the wins down by channel to see which channels pay.', 'Channel', [
        col.text('channel', 'Channel', 'How the customers were found: key-account sales, tenders, referrals, trade shows.'),
        col.num('spend', 'Spend', 'What the channel cost in the year.', '₹ lakh'),
        col.num('customers', 'Customers won', 'The customers it won.', 'customers'),
        col.computed('cac', 'Cost per customer', 'Spend ÷ customers won.', (r) => { const s = toNum(r.spend), c = toNum(r.customers); return s !== null && c !== null && c > 0 ? lakh(s / c) : ''; }),
      ], { min: 1, max: 6, example: { channel: 'Key-account sales', spend: '120', customers: '2' } }),
      num('cac_known', 'Customer acquisition cost (if known)', 'If you already know your cost of winning a customer, enter it and it is used instead of the figure worked out from the spend.', '₹ lakh', '60')),
    section('reading', 'What it means', 'Whether the model is ready to scale.',
      long('scaling_view', 'Is the model ready to scale?', 'Whether the ratio and the payback justify spending more on growth, and what would change them (price, margin, retention, cheaper channels).', 'The ratio is healthy but payback is long because approvals take months'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    { key: 'cac', label: 'Cost to win a customer (CAC)', compute: (v) => { const c = cac(v); return c === null ? null : lakh(c); } },
    { key: 'ltv', label: 'Lifetime value of a customer (LTV)', help: 'Revenue × gross margin ÷ churn.', compute: (v) => { const l = ltv(v); return l === null ? null : lakh(l); } },
    {
      key: 'ratio',
      label: 'LTV to CAC',
      help: 'Three or more is healthy; under 1 loses money on every customer.',
      compute: (v) => { const r = ltvToCac(v); return r === null ? null : `${fmtNum(r, 1)} to 1`; },
      tone: (v) => { const r = ltvToCac(v); return r === null ? undefined : r >= 3 ? 'good' : r >= 1 ? 'warn' : 'bad'; },
    },
    {
      key: 'payback',
      label: 'Months to earn back the CAC',
      help: 'Within 12 months is healthy; over 24 is slow.',
      compute: (v) => { const m = paybackMonths(v); return m === null ? null : `${fmtNum(m, 0)} months`; },
      tone: (v) => { const m = paybackMonths(v); return m === null ? undefined : m <= 12 ? 'good' : m <= 24 ? 'warn' : 'bad'; },
    },
    {
      key: 'lifetime',
      label: 'Average customer life',
      compute: (v) => { const c = n(v, 'annual_churn'); return c === null || c <= 0 ? null : `${fmtNum(100 / c, 1)} years`; },
    },
  ],
  outputs: [
    { key: 'ltv_cac', label: 'LTV to CAC', compute: (v) => { const r = ltvToCac(v); return r === null ? null : `${fmtNum(r, 1)} to 1 (LTV ${lakh(ltv(v)!)}, CAC ${lakh(cac(v)!)}, payback ${fmtNum(paybackMonths(v)!, 0)} months)`; } },
    { key: 'cac', label: 'Cost to win a customer', compute: (v) => { const c = cac(v); return c === null ? null : lakh(c); } },
    { key: 'ltv', label: 'Lifetime value of a customer', compute: (v) => { const l = ltv(v); return l === null ? null : lakh(l); } },
    { key: 'payback_months', label: 'Months to earn back the CAC', compute: (v) => { const m = paybackMonths(v); return m === null ? null : `${fmtNum(m, 0)} months`; } },
    { key: 'scaling_view', label: 'Is the model ready to scale?', compute: (v) => filled(v, 'scaling_view') },
  ],
  legacyLabels: { 'Customer acquisition cost': 'cac_known', 'Average contract value (Value Scan)': 'avg_revenue' },
  analysisGuide:
    'The verdict is whether the unit economics support scaling. Use the CAC, LTV, ratio and payback as worked out from the answers; do not recompute them. A ratio of 3 or more and a payback of 12 months or less is healthy, but for long industrial sales cycles judge payback against how long customers stay. Check the churn is a realistic average (not the best customer), that the acquisition spend includes all sales effort (salaries and bid costs, not only marketing), and that revenue per customer is an average not a flagship account. ' +
    'Say which lever moves the ratio most (price, margin, retention or cost to win), and whether the Financial Model\'s growth assumptions should wait for it to improve.',
};

// ── Minimum viable financial model ───────────────────────────────────────────

const MONTHS = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`);
const MONTH_COLUMNS = ['Units sold', 'Revenue', 'Variable cost', 'Fixed costs', 'Operating profit', 'Cash in', 'Cash out', 'Closing cash'] as const;
const COLLECTION = ['Paid on delivery', '30 days', '60 days', '90 days'] as const;
const collectionLag = (v: ModelValues): number => Math.max(0, COLLECTION.indexOf((v.fields.collection_days ?? '') as (typeof COLLECTION)[number]));

interface MonthFigures { units: number; revenue: number; variable: number; fixed: number; profit: number; cashIn: number; cashOut: number; cash: number }
/** Twelve months from the unit price, unit cost, month-1 volume and its growth, the fixed costs, and the starting cash. Null until the core inputs are given. */
function projectMonths(v: ModelValues): MonthFigures[] | null {
  const price = n(v, 'unit_price'), cost = n(v, 'unit_cost'), vol = n(v, 'volume_month1'), fixed = n(v, 'fixed_costs');
  if (price === null || cost === null || vol === null || fixed === null) return null;
  const growth = (n(v, 'volume_growth') ?? 0) / 100, launch = n(v, 'launch_costs') ?? 0, lag = collectionLag(v);
  const out: MonthFigures[] = [];
  let cash = n(v, 'starting_cash') ?? 0;
  for (let m = 0; m < 12; m += 1) {
    const units = vol * Math.pow(1 + growth, m);
    const revenue = (units * price) / 100000, variable = (units * cost) / 100000;
    const received = lag === 0 ? revenue : m - lag >= 0 ? out[m - lag].revenue : 0;
    const cashOut = variable + fixed + (m === 0 ? launch : 0);
    cash = cash + received - cashOut;
    out.push({ units, revenue, variable, fixed, profit: revenue - variable - fixed, cashIn: received, cashOut, cash });
  }
  return out;
}
const monthCell = (row: string, column: string, v: ModelValues): string => {
  const p = projectMonths(v);
  if (!p) return '';
  const f = p[MONTHS.indexOf(row)];
  if (!f) return '';
  const map: Record<(typeof MONTH_COLUMNS)[number], number> = {
    'Units sold': f.units, 'Revenue': f.revenue, 'Variable cost': -f.variable, 'Fixed costs': -f.fixed,
    'Operating profit': f.profit, 'Cash in': f.cashIn, 'Cash out': -f.cashOut, 'Closing cash': f.cash,
  };
  const x = map[column as (typeof MONTH_COLUMNS)[number]];
  if (x === undefined) return '';
  if (column === 'Units sold') return fmtInt(x);
  return Math.round(x * 10) < 0 ? `−${fmtNum(-x, 1)}` : fmtNum(x, 1);
};
const unitMargin = (v: ModelValues): number | null => { const p = n(v, 'unit_price'), c = n(v, 'unit_cost'); return p === null || c === null ? null : p - c; };
const breakEvenUnits = (v: ModelValues): number | null => { const m = unitMargin(v), f = n(v, 'fixed_costs'); return m === null || f === null || m <= 0 ? null : (f * 100000) / m; };
/** The month with the least cash — and whether the balance is still falling in the last month, so the true low lies beyond the twelve. */
const lowestMonthCash = (p: MonthFigures[]): { cash: number; month: number; stillFalling: boolean } => {
  const low = p.reduce((a, f, i) => (f.cash < a.cash ? { cash: f.cash, month: i + 1 } : a), { cash: p[0].cash, month: 1 });
  return { ...low, stillFalling: low.month === p.length && p.length > 1 && p[p.length - 1].cash < p[p.length - 2].cash };
};
const fundingNeeded = (p: MonthFigures[], tail: (month: number, stillFalling: boolean) => string): string => {
  const l = lowestMonthCash(p);
  if (l.cash >= 0) return 'None — the starting cash is enough';
  return `${l.stillFalling ? 'At least ' : ''}${lakhOne(-l.cash)} more than ${tail(l.month, l.stillFalling)}`;
};

const mvfm: ModelDefinition = {
  toolId: 'mvfm',
  reference: {
    originator: 'Lean-startup practice: the “minimum viable” idea of Eric Ries applied to finance, alongside Ash Maurya’s Lean Canvas — a one-sheet unit-economics and twelve-month cash model',
    year: '2010s',
    summary: 'A single sheet that answers the questions a new venture cannot dodge: does each unit sold earn a margin, how many units cover the fixed costs, and does the cash last until it does? It is built before a full three-statement model is worth the effort, from assumptions, and replaced by actuals once there is trading history.',
    caption: 'Margin per unit times units sold, less fixed costs, gives profit; timing of collections turns profit into cash; cash tells you how much funding you need.',
    howToRead: [
      'Enter what one unit sells for and costs to make (variable costs only), how many you expect to sell in the first month and how fast that grows.',
      'Add the fixed costs you pay every month whether you sell or not, any one-off launch costs, and the cash you start with.',
      'Read three results: the break-even volume (units a month needed to cover fixed costs), the month profit turns positive, and the lowest cash balance — if it goes below zero, that is the funding you need before you launch.',
    ],
  },
  sections: [
    section('unit', 'One unit', 'What a single unit sells for and costs.',
      num('unit_price', 'Unit price', 'What one unit sells for, before tax.', '₹ per unit', '2,400'),
      num('unit_cost', 'Unit cost', 'The variable cost of making and delivering one unit: material, direct labour, packing and freight. Not fixed costs.', '₹ per unit', '1,560')),
    section('volume', 'Volume', 'How many units you expect to sell, and when you are paid.',
      num('volume_month1', 'Expected monthly volume (Month 1)', 'Units you expect to sell in the first month.', 'units', '400'),
      num('volume_growth', 'Monthly volume growth', 'How much the monthly volume grows each month. Leave blank for none.', '% a month', '12'),
      select('collection_days', 'When customers pay', 'How long customers take to pay after delivery. A longer wait means more cash is needed.', COLLECTION, '60 days')),
    section('costs', 'Fixed costs and cash', 'What you pay every month regardless of sales, and the cash you start with.',
      num('fixed_costs', 'Fixed monthly costs', 'Rent, salaries, power, insurance and anything else paid each month whether or not you sell.', '₹ lakh a month', '6.5'),
      num('launch_costs', 'One-off launch costs', 'A one-time cost paid in the first month: tooling, certification, deposits.', '₹ lakh', '25'),
      num('starting_cash', 'Starting cash', 'The cash available on day one.', '₹ lakh', '30', { prefill: 'business_context' })),
    section('reading', 'What it means', 'Whether the idea can plausibly become a business.',
      long('assumptions_basis', 'Where these numbers come from', 'Where each assumption comes from (a quote, a customer, a rival’s price, a guess), and which is the least certain.', 'Price from the pilot quote; volume is a guess', { prefill: { upstream: 'leancanvas', output: 'revenue_streams' } }),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  views: [{
    key: 'months',
    title: 'Twelve months at a glance (₹ lakh)',
    help: 'Worked out from the answers above. Costs are shown as negatives; cash in follows the collection period.',
    rowHeading: 'Month',
    columns: MONTH_COLUMNS,
    rows: MONTHS,
    cell: monthCell,
  }],
  derived: [
    {
      key: 'unit_margin',
      label: 'Margin on each unit',
      compute: (v) => { const m = unitMargin(v), p = n(v, 'unit_price'); return m === null || p === null || p <= 0 ? null : `₹${fmtInt(m)} (${pct((m / p) * 100)})`; },
      tone: (v) => { const m = unitMargin(v); return m === null ? undefined : m > 0 ? 'good' : 'bad'; },
    },
    {
      key: 'breakeven_units',
      label: 'Break-even volume',
      help: 'Units a month needed to cover the fixed costs.',
      compute: (v) => { const b = breakEvenUnits(v); return b === null ? null : `${fmtInt(b)} units a month`; },
    },
    {
      key: 'breakeven_month',
      label: 'First profitable month',
      compute: (v) => { const p = projectMonths(v); if (!p) return null; const i = p.findIndex((f) => f.profit >= 0); return i < 0 ? 'Not within 12 months' : `Month ${i + 1}`; },
      tone: (v) => { const p = projectMonths(v); return p ? (p.some((f) => f.profit >= 0) ? 'good' : 'bad') : undefined; },
    },
    {
      key: 'lowest_cash',
      label: 'Lowest cash balance',
      help: 'If this goes below zero, that is the funding you need on top of the starting cash.',
      compute: (v) => { const p = projectMonths(v); if (!p) return null; const l = lowestMonthCash(p); return `${lakhOne(l.cash)} (Month ${l.month}${l.stillFalling ? ', still falling' : ''})`; },
      tone: (v) => { const p = projectMonths(v); return p ? (lowestMonthCash(p).cash < 0 ? 'bad' : 'good') : undefined; },
    },
    {
      key: 'funding',
      label: 'Funding you need',
      compute: (v) => { const p = projectMonths(v); return p ? fundingNeeded(p, (_, falling) => (falling ? 'you start with — the balance is still falling in Month 12' : 'you start with')) : null; },
      tone: (v) => { const p = projectMonths(v); return p ? (lowestMonthCash(p).cash < 0 ? 'bad' : 'good') : undefined; },
    },
  ],
  outputs: [
    { key: 'unit_margin', label: 'Margin on each unit', compute: (v) => { const m = unitMargin(v), p = n(v, 'unit_price'); return m === null || p === null || p <= 0 ? null : `₹${fmtInt(m)} (${pct((m / p) * 100)})`; } },
    { key: 'breakeven_units', label: 'Break-even volume', compute: (v) => { const b = breakEvenUnits(v); return b === null ? null : `${fmtInt(b)} units a month`; } },
    { key: 'funding_needed', label: 'Funding needed', compute: (v) => { const p = projectMonths(v); return p ? fundingNeeded(p, (month, falling) => `the starting cash (${falling ? 'still falling in' : 'lowest in'} Month ${month})`) : null; } },
    { key: 'assumptions_basis', label: 'Where the numbers come from', compute: (v) => filled(v, 'assumptions_basis') },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is whether the idea can plausibly become a business and how much money it needs. Use the unit margin, break-even volume, first profitable month and lowest cash as worked out from the answers (the month table is shown under "worked out"); do not recompute them. Check the unit cost is variable cost only, that the starting volume and its growth have a basis (a customer, a quote) rather than hope, and that the collection period is realistic: late payment is what kills young businesses. ' +
    'Say which assumption the result is most sensitive to, what the funding need is, and whether the sheet should now be replaced by the Three-Statement Financial Model.',
};

export const FINANCE_MODELS: ModelDefinition[] = [financial, unitecon, mvfm];

// Exported for the tests, which check the arithmetic directly.
export { projectFinancials, projectMonths, cac, ltv, paybackMonths, fmtInt };
