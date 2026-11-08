import type { DeclField, DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';

/**
 * Capital Allocation Advisor: ranking investment projects and choosing the set to fund within a budget.
 *
 * Methods (all fixed formulas, nothing estimated by AI):
 *  - Net present value: NPV = -I + sum of CF_t / (1 + r)^t, with r the hurdle rate (cost of capital).
 *  - Profitability index: PI = PV of inflows / I = 1 + NPV / I (value created per rupee invested).
 *  - Internal rate of return: the rate that makes NPV zero; no answer unless the flows change sign.
 *  - Modified IRR: MIRR = (FV of inflows at the reinvestment rate / I)^(1/n) - 1, which avoids IRR's assumption that cash is reinvested at the IRR.
 *  - Payback: years until cumulative cash returns the outlay, with straight-line interpolation inside the year.
 *  - Capital rationing: when the budget binds, fund projects in descending profitability index while they fit (a standard heuristic, not always the exact optimum).
 * Five yearly cash flows per project; cash flows are in the same unit as the investment and are not adjusted for inflation or tax by the tool.
 */

const f = (field: string): Expr => ({ field });
const c = (cell: string): Expr => ({ cell });
const num = (key: string, label: string, unit: string, help: string, example: string): DeclField => ({ kind: 'field', key, label, type: 'number', unit, help, example });
const YEARS = [1, 2, 3, 4, 5];
const cf = (t: number): Expr => c(`cf${t}`);
const rate: Expr = { add: [1, { div: [f('hurdle'), 100] }] };
const rr: Expr = { add: [1, { div: [f('reinvest'), 100] }] };
const pvIn: Expr = { add: YEARS.map((t) => ({ div: [cf(t), { pow: [rate, t] }] })) };
const npv: Expr = { sub: [pvIn, c('invest')] };
const fvIn: Expr = { add: YEARS.map((t) => ({ mul: [cf(t), { pow: [rr, 5 - t] }] })) };
const flows: Expr[] = [{ sub: [0, c('invest')] }, ...YEARS.map(cf)];
const irr: Expr = { irr: flows };
const mirr: Expr = { mul: [{ sub: [{ pow: [{ div: [fvIn, c('invest')] }, 0.2] }, 1] }, 100] };

export const CAPITAL_ALLOCATION: DeclarativeTool = {
  schema: 1,
  slug: 'capital-allocation-advisor',
  name: 'Capital Allocation Advisor',
  category: 'prioritisation',
  does: 'Scores each investment project on net present value, profitability index, internal and modified rates of return and payback, then picks the set of projects that creates the most value within your budget, so scarce capital goes where it earns the most.',
  whenToUse: 'Use it when several projects compete for one capital budget and you can estimate each one’s outlay and its cash flows for the next five years.',
  whenNotToUse: 'Do not use it for projects where the cash flows are unknowable (pure research), for compulsory spending (safety, compliance), or for projects whose value is mainly strategic and cannot be turned into cash flows without inventing figures.',
  next: 'Test the funded set against the downside case in the Scenario Planner, then track actual cash flows against these estimates every quarter.',
  reference: {
    originator: 'Net present value and the internal rate of return (Irving Fisher, 1930); profitability index for capital rationing (Weingartner, 1963); modified IRR (McDaniel, McCarty and Jessell, 1988)',
    year: '1930 to 1988',
    summary: 'A rupee received later is worth less than a rupee today. Discounting the project’s cash flows at the cost of capital shows whether it creates value, and dividing by the outlay shows how efficiently it uses scarce money.',
    caption: 'Value created is the test; return and payback are supporting views; the budget decides how many projects can be funded.',
    howToRead: [
      'Fund only projects with positive NPV; a project below the hurdle destroys value even if it pays back fast.',
      'When money is limited, the profitability index ranks projects by value created per rupee spent.',
      'Where IRR and MIRR differ widely, the project’s cash flows are uneven; trust NPV and MIRR over IRR.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From a list of projects to a funded portfolio',
    steps: [
      { name: 'List the projects', hint: 'Outlay and five years of cash flow' },
      { name: 'Set the hurdle', hint: 'Cost of capital and reinvestment rate' },
      { name: 'Score each project', hint: 'NPV, PI, IRR, MIRR, payback' },
      { name: 'Apply the budget', hint: 'Fund in order of profitability index' },
      { name: 'Test and track', hint: 'Downside case, then actual vs plan' },
    ],
    caption: 'A project must clear the hurdle first; then the budget chooses among the projects that do.',
  },
  sections: [
    {
      key: 'terms',
      title: 'Budget and hurdle',
      summary: 'Set the capital available and the rates that decide whether a project creates value.',
      parts: [
        { kind: 'field', key: 'context', label: 'What decision is this budget for?', type: 'longtext', help: 'State the budget period, who decides, and any constraint such as a project that must be funded whatever its score.', example: 'FY27 capital budget for a plastics manufacturer' },
        num('budget', 'Capital available', '₹ lakh', 'The total you can spend on new projects this round, in the same unit as the project outlays.', '350'),
        num('hurdle', 'Hurdle rate (cost of capital)', '% per year', 'The minimum yearly return your capital must earn: your cost of funds plus a margin for risk. Ask your finance lead if unsure; do not guess a low figure.', '12'),
        num('reinvest', 'Reinvestment rate', '% per year', 'The yearly return you expect from reinvesting cash the project returns. Used only for MIRR; the hurdle rate is a reasonable default.', '10'),
      ],
    },
    {
      key: 'projects_section',
      title: 'The projects',
      summary: 'One row per project: its outlay and its cash flows for years 1 to 5.',
      parts: [
        {
          kind: 'table', key: 'projects', label: 'Project list', rowLabel: 'Project', minRows: 3, maxRows: 20,
          help: 'Enter the outlay as a positive number and each year’s net cash flow (inflow minus running costs, after tax) in the same unit. Fill all five years; use 0 for a year with no cash. Results appear on the right of each row.',
          columns: [
            { key: 'name', header: 'Project', help: 'A short name that identifies the project.', type: 'text' },
            { key: 'invest', header: 'Outlay now', help: 'Cash spent at the start, as a positive number.', type: 'number', unit: '₹ lakh' },
            { key: 'cf1', header: 'Year 1', help: 'Net cash flow in year 1.', type: 'number', unit: '₹ lakh' },
            { key: 'cf2', header: 'Year 2', help: 'Net cash flow in year 2.', type: 'number', unit: '₹ lakh' },
            { key: 'cf3', header: 'Year 3', help: 'Net cash flow in year 3.', type: 'number', unit: '₹ lakh' },
            { key: 'cf4', header: 'Year 4', help: 'Net cash flow in year 4.', type: 'number', unit: '₹ lakh' },
            { key: 'cf5', header: 'Year 5', help: 'Net cash flow in year 5, including any scrap or residual value.', type: 'number', unit: '₹ lakh' },
            { key: 'npv', header: 'NPV', help: 'Worked out: present value of the five cash flows at the hurdle rate, minus the outlay. Positive creates value.', type: 'computed', rule: { op: 'calc', expr: npv, format: 'dp1' } },
            { key: 'pi', header: 'Profitability index', help: 'Worked out: present value of inflows divided by the outlay. Above 1 creates value; higher is more efficient use of capital.', type: 'computed', rule: { op: 'calc', expr: { div: [pvIn, c('invest')] }, format: 'dp2' } },
            { key: 'irr', header: 'IRR', help: 'Worked out: the yearly rate at which NPV is zero. Compare with the hurdle rate.', type: 'computed', rule: { op: 'calc', expr: irr, format: 'dp1', suffix: '%' } },
            { key: 'mirr', header: 'MIRR', help: 'Worked out: modified IRR, assuming inflows are reinvested at the reinvestment rate.', type: 'computed', rule: { op: 'calc', expr: mirr, format: 'dp1', suffix: '%' } },
            { key: 'payback', header: 'Payback (years)', help: 'Worked out: years until cumulative cash covers the outlay, interpolated within the year. Blank means not within five years.', type: 'computed', rule: { op: 'calc', expr: { payback: flows }, format: 'dp1' } },
            { key: 'verdict', header: 'Verdict', help: 'Worked out: clears the hurdle when NPV is positive.', type: 'computed', rule: { op: 'when', expr: npv, gt: 0, then: 'Creates value', else: 'Below hurdle', tones: { then: 'good', else: 'bad' } } },
          ],
        },
      ],
    },
    {
      key: 'plan',
      title: 'Decision and action plan',
      summary: 'Record the portfolio you approve and the first actions.',
      parts: [
        { kind: 'field', key: 'decision_made', label: 'Which projects did you approve, and why?', type: 'longtext', help: 'List the approved projects, the numbers that decided it, and what you left out and why (for example a strategic reason beyond the cash flows).' },
        {
          kind: 'table', key: 'actions', label: 'Actions for the next 90 days', rowLabel: 'Action', minRows: 3, maxRows: 12,
          help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.',
          columns: [
            { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
            { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Finance Director, not a named person.', type: 'text' },
            { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
            { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
          ],
        },
      ],
    },
  ],
  derived: [
    { key: 'asked', label: 'Total capital asked for', help: 'The sum of all project outlays.', rule: { op: 'calc', expr: { agg: 'sum', table: 'projects', col: 'invest' }, format: 'dp1' } },
    { key: 'gap', label: 'Asked minus available', help: 'Positive means the budget cannot fund every project, so rationing applies.', rule: { op: 'calc', expr: { sub: [{ agg: 'sum', table: 'projects', col: 'invest' }, f('budget')] }, format: 'dp1' } },
    { key: 'rationing', label: 'Is the budget a limit', rule: { op: 'when', expr: { sub: [{ agg: 'sum', table: 'projects', col: 'invest' }, f('budget')] }, gt: 0, then: 'Yes: not every project can be funded', else: 'No: every project that creates value can be funded', tones: { then: 'warn', else: 'good' } } },
  ],
  outputs: [
    { key: 'funded', label: 'Projects to fund within the budget', rule: { op: 'ration', table: 'projects', name: 'name', cost: 'invest', value: 'npv', budget: 'budget', show: 'names' } },
    { key: 'funded_cost', label: 'Capital used by the funded set', rule: { op: 'ration', table: 'projects', name: 'name', cost: 'invest', value: 'npv', budget: 'budget', show: 'cost' } },
    { key: 'funded_value', label: 'NPV created by the funded set', rule: { op: 'ration', table: 'projects', name: 'name', cost: 'invest', value: 'npv', budget: 'budget', show: 'value' } },
    { key: 'best_npv', label: 'Largest value created (NPV)', rule: { op: 'top', table: 'projects', by: 'npv', label: 'name' } },
    { key: 'best_pi', label: 'Most efficient use of capital (profitability index)', rule: { op: 'top', table: 'projects', by: 'pi', label: 'name' } },
  ],
  analysisGuide: 'Start with the funded set, the capital used and the NPV created. Say which projects fail the hurdle and should not be funded whatever the budget. Compare the ranking by NPV with the ranking by profitability index and explain why they differ (size). Note any project where IRR and MIRR diverge, and prefer NPV. State plainly that the funding rule is the profitability-index heuristic: it can miss the exact optimum when project sizes are lumpy, so check whether swapping one project for two smaller ones would raise total NPV. Warn about optimistic cash flows, the sensitivity of NPV to the hurdle rate, projects that depend on one another, and spending that is compulsory. Recommend one portfolio, the downside test to run, and who tracks actual cash flows against the plan.',
  sample: {
    scenario: 'A fictional plastics manufacturer has ₹350 lakh to spend on five proposals: a packaging line, an ERP upgrade, dealer expansion, rooftop solar and a prototype programme. The hurdle rate is 12 percent.',
    values: {
      context: 'FY27 capital budget for a plastics manufacturer',
      budget: '350', hurdle: '12', reinvest: '10',
      decision_made: 'Fund the projects the tool selects, keep the prototype programme as a staged option, and review actual cash flows against plan each quarter.',
    },
    tables: {
      projects: [
        { name: 'Packaging line', invest: '200', cf1: '70', cf2: '70', cf3: '70', cf4: '70', cf5: '70' },
        { name: 'ERP upgrade', invest: '150', cf1: '40', cf2: '50', cf3: '60', cf4: '60', cf5: '60' },
        { name: 'Dealer expansion', invest: '180', cf1: '30', cf2: '60', cf3: '90', cf4: '90', cf5: '90' },
        { name: 'Rooftop solar', invest: '120', cf1: '35', cf2: '35', cf3: '35', cf4: '35', cf5: '35' },
        { name: 'Prototype programme', invest: '100', cf1: '0', cf2: '0', cf3: '40', cf4: '60', cf5: '80' },
      ],
      actions: [
        { action: 'Approve the funded projects and release the first tranche', owner: 'Finance Director', measure: 'Approval minuted', horizon: '30 days' },
        { action: 'Run the downside case on the funded set', owner: 'Strategy Head', measure: 'Downside NPV still positive', horizon: '30 days' },
        { action: 'Track actual cash flow against plan each quarter', owner: 'Project Controller', measure: 'Quarterly variance report', horizon: '90 days' },
      ],
    },
  },
};
