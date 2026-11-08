import type { DeclarativeTool } from '@/lib/strategyModels/declarative';
import { qualityGate } from '@/lib/strategyModels/declarative';
import { assess } from '@/lib/tools/standards';
import type { ToolsRepo } from '@/lib/tools/repo';
import type { SipocText } from '@/lib/agents/sipoc';
import { SCENARIO_PLANNER } from './scenarioPlanner';
import { PRICING_OPTIMIZER } from './pricingOptimizer';
import { DEMAND_FORECASTER } from './demandForecaster';
import { CAPITAL_ALLOCATION } from './capitalAllocation';

/** A pilot: the catalogue agent, the working tool that backs it, where that tool sits in the marketplace, and its SIPOC (a draft for the owner to confirm). */
export interface Pilot {
  /** slug of the agent in the catalogue; the same as the tool's slug */
  agent: string;
  tool: DeclarativeTool;
  marketCategory: string;
  group: string;
  practice: string;
  sipoc: SipocText;
}

export const PILOTS: Pilot[] = [
  {
    agent: 'scenario-planner', tool: SCENARIO_PLANNER, marketCategory: 'Decision Models', group: 'Decisions under uncertainty', practice: 'Strategy',
    sipoc: {
      suppliers: ['Strategy or planning lead (the options and the view of the future)', 'Finance (payoff figures for each option and scenario)', 'Market and operations teams (signposts)'],
      process: ['Frame the decision and the options', 'Set best, base and worst scenarios and their likelihood', 'Enter one payoff per option and scenario', 'Work out expected value, spread, maximin, maximax, Hurwicz, regret and the value of perfect information', 'Compare what each rule recommends and set signposts'],
      customers: ['The executive team or board making the commitment', 'Finance, which budgets the chosen option'],
      refresh: 'Update the likelihoods and payoffs whenever a signpost moves or at each quarterly review.',
    },
  },
  {
    agent: 'pricing-optimizer', tool: PRICING_OPTIMIZER, marketCategory: 'Decision Models', group: 'Pricing and revenue', practice: 'Finance & Risk',
    sipoc: {
      suppliers: ['Sales (prices charged and units sold in two tests)', 'Finance (unit variable cost and fixed cost)', 'Market intelligence (competitor price, customer value)'],
      process: ['Enter two price and volume observations for the same period length', 'Work out arc price elasticity', 'Fit a straight-line demand curve and a constant-elasticity curve', 'Find the profit-maximising price under each', 'Test candidate prices for volume, profit, break-even and margin of safety'],
      customers: ['Sales head and pricing owner', 'Finance director who signs off margin'],
      refresh: 'Rerun after every price test, using the two most recent price and volume points.',
    },
  },
  {
    agent: 'demand-forecaster', tool: DEMAND_FORECASTER, marketCategory: 'Decision Models', group: 'Demand and inventory', practice: 'Process',
    sipoc: {
      suppliers: ['Sales or ERP system (units demanded per period)', 'Purchasing (lead time, order cost, unit cost)', 'Finance (holding cost rate)'],
      process: ['Enter demand history in time order', 'Fit a least-squares linear trend', 'Measure the standard error and R²', 'Convert the service level into a safety factor', 'Work out safety stock, reorder point and economic order quantity'],
      customers: ['Purchase and inventory managers', 'Finance, which funds working capital'],
      refresh: 'Add the latest period to the history every cycle and rerun; compare last forecast with actual sales.',
    },
  },
  {
    agent: 'capital-allocation-advisor', tool: CAPITAL_ALLOCATION, marketCategory: 'Decision Models', group: 'Capital and investment', practice: 'Finance & Risk',
    sipoc: {
      suppliers: ['Project owners (outlay and five-year cash flows)', 'Finance (hurdle rate, reinvestment rate, budget)'],
      process: ['List every project with outlay and cash flows', 'Discount at the hurdle rate to get NPV and profitability index', 'Work out IRR, MIRR and payback', 'Fund projects in order of profitability index within the budget', 'Review actual cash flows against plan'],
      customers: ['Investment committee or board', 'Project controllers who track delivery'],
      refresh: 'Rerun each budget round, and again when the hurdle rate or a project’s cash flows change.',
    },
  },
];

export const pilotByAgent = (agent: string): Pilot | undefined => PILOTS.find((p) => p.agent === agent);

export interface InstallResult { added: string[]; skipped: string[]; refused: { slug: string; reasons: string[] }[] }

/**
 * Put the pilot tools in the Tools marketplace as "needs review". A tool already there is left alone, so pressing twice is safe.
 * Each tool must pass the quality gate first. Nothing is published: a person reviews and publishes it.
 */
export async function installPilots(repo: ToolsRepo, now: () => Date = () => new Date()): Promise<InstallResult> {
  const out: InstallResult = { added: [], skipped: [], refused: [] };
  for (const p of PILOTS) {
    const slug = p.tool.slug;
    if (await repo.getToolBySlug(slug)) { out.skipped.push(slug); continue; }
    const gate = qualityGate(p.tool);
    if (gate.blockers.length) { out.refused.push({ slug, reasons: gate.blockers }); continue; }
    const definition: DeclarativeTool = { ...p.tool, source: { draftedBy: 'human', draftedAt: now().toISOString() } };
    await repo.saveTool({
      slug, name: definition.name, category: p.marketCategory, groupName: p.group, practice: p.practice, source: 'hand',
      does: definition.does, whenToUse: definition.whenToUse, whenNotToUse: definition.whenNotToUse ?? null,
      definition, status: 'NEEDS_REVIEW', quality: assess(definition),
      provenance: { handBuilt: true, pilotAgent: p.agent, draftedBy: 'human', installedAt: now().toISOString() },
    });
    out.added.push(slug);
  }
  return out;
}
