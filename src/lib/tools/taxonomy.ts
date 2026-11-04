/**
 * How every asset in the Tools marketplace is classified, so a client can find it and the team can keep it to one standard.
 *
 * Three TYPES (what the asset is for), then an AREA (the business topic) and a SECTOR (the industry), each of which can be several.
 *   1. Survey forms            collect data from people to analyse and report         e.g. Growth Mindset survey
 *   2. Transformation toolkits diagnose a situation and solve a problem               e.g. Manufacturing Diagnostic
 *   3. Daily tools & aids      do a job at the desk, in minutes                       e.g. Business Case, Business Valuation
 *
 * The classification is stored with the tool (provenance.classification), so no database change is needed. Until a person approves it,
 * the marketplace uses a rule-based suggestion so the filters work from day one. Pure code, no server imports: the browser uses it too.
 */
import { MARKETPLACE_SECTORS } from '@/lib/sectors';

export const ASSET_TYPES = [
  { id: 'survey', label: 'Survey forms', tagline: 'Collect data from people to analyse and report', example: 'Growth mindset survey' },
  { id: 'toolkit', label: 'Transformation toolkits', tagline: 'Diagnose a situation and solve the problem', example: 'Manufacturing diagnostic' },
  { id: 'aid', label: 'Daily tools & aids', tagline: 'Get a job done at the desk in minutes', example: 'Business case, business valuation' },
] as const;
export type AssetTypeId = (typeof ASSET_TYPES)[number]['id'];
export const assetTypeLabel = (id: string): string => ASSET_TYPES.find((t) => t.id === id)?.label ?? id;
export const isAssetType = (x: unknown): x is AssetTypeId => ASSET_TYPES.some((t) => t.id === x);

export const AREAS = ['Strategy', 'People', 'Process', 'Technology', 'Data', 'Finance', 'Customer & growth', 'Risk & governance'] as const;
export type Area = (typeof AREAS)[number];
export const isArea = (x: unknown): x is Area => AREAS.some((a) => a === x);

/** The four marketplace sectors, plus the industries the Eccellere work most often meets. A tool with no sector fits every sector. */
export const TOOL_SECTORS = [...MARKETPLACE_SECTORS, 'Financial Services', 'Healthcare & Life Sciences', 'Energy & Utilities', 'Technology & Services', 'Public Sector'] as const;
export type ToolSector = (typeof TOOL_SECTORS)[number];
export const isToolSector = (x: unknown): x is ToolSector => TOOL_SECTORS.some((s) => s === x);

export interface Classification {
  type: AssetTypeId;
  areas: Area[];
  /** empty = fits every sector */
  sectors: ToolSector[];
  /** who decided: the rules, the AI (a suggestion) or a named person (approved) */
  basis: 'rules' | 'ai' | 'person';
  reason: string;
  at?: string;
  by?: string;
}

/** What the rules look at. Everything is optional so a half-filled row still classifies. */
export interface ClassifyInput {
  name: string;
  category?: string | null;
  practice?: string | null;
  groupName?: string | null;
  does?: string | null;
  whenToUse?: string | null;
  /** counts read from the definition, when it is a form we can look into */
  shape?: Shape | null;
}
export interface Shape {
  sections: number;
  scoredQuestions: number;   // rating and choice fields and columns
  numbers: number;           // number fields and columns
  computed: number;          // computed columns, derived values and outputs
  tables: number;
  hasActionTable: boolean;
}

const has = (text: string, re: RegExp) => re.test(text);

const AREA_RULES: [Area, RegExp][] = [
  ['Strategy', /strateg|vision|swot|pestle?|porter|competit|positioning|ansoff|\bbcg\b|okr|business model|scenario|portfolio|market entry|roadmap/],
  ['People', /people|talent|culture|mindset|leadership|hiring|recruit|engagement|skills?|learning|change readiness|stakeholder|team|capabilit|organi[sz]ation|workforce|\braci\b|adoption/],
  ['Process', /process|operations|lean|value stream|kaizen|supply chain|quality|bottleneck|workflow|sipoc|pareto|root cause|fishbone|ishikawa|5 whys|six sigma|manufacturing|plant|shop ?floor|procurement|sourcing/],
  ['Technology', /technology|digital|\bai\b|agentic|software|\bit\b|cyber|cloud|automation|architecture|platform|integration/],
  ['Data', /\bdata\b|analytics|\bkpi\b|dashboard|metric|insight|spend analysis|benchmark|measure/],
  ['Finance', /financ|valuation|budget|business case|\broi\b|\bnpv\b|\birr\b|cost|pricing|profit|cash|invest|break-?even|capex|\bp&l\b/],
  ['Customer & growth', /customer|sales|marketing|brand|channel|journey|go-to-market|\bgtm\b|demand|segment|growth/],
  ['Risk & governance', /risk|compliance|governance|audit|control|\besg\b|regulat|assurance|resilien/],
];

const SECTOR_RULES: [ToolSector, RegExp][] = [
  ['Manufacturing', /manufactur|factory|\bplant\b|shop ?floor|production line|industry 4|\boee\b|maintenance/],
  ['Retail', /\bretail|\bstores?\b|merchandis|omnichannel|e-?commerce|shopper/],
  ['Consumer Products', /consumer products|\bfmcg\b|\bcpg\b|consumer goods|brand portfolio/],
  ['Logistics', /logistic|warehouse|freight|fleet|last[- ]mile|transport|distribution network/],
  ['Financial Services', /\bbank|insurance|lending|wealth|fintech|financial services|\bnbfc\b/],
  ['Healthcare & Life Sciences', /health|hospital|clinical|pharma|life science|patient|medical/],
  ['Energy & Utilities', /\benergy\b|utilit|oil and gas|\bpower plant|renewable|grid\b/],
  ['Technology & Services', /\bsaas\b|software company|it services|professional services|consulting firm/],
  ['Public Sector', /public sector|government|municipal|ministry|citizen service/],
];

const SURVEY = /survey|questionnaire|\bpulse\b|mindset|readiness|maturity|culture|engagement|feedback|self[- ]?assess|perception|climate/;
const TOOLKIT = /diagnostic|root cause|fishbone|ishikawa|pareto|5 whys|problem[- ]solving|gap analysis|swot|pestle?|value (stream|chain)|improvement|\blean\b|kaizen|bottleneck|turnaround|health ?check|assessment|audit|review|baseline|opportunity|issue tree|hypothesis/;
const AID = /business case|valuation|\broi\b|\bnpv\b|calculator|canvas|charter|\braci\b|budget|template|checklist|brief|agenda|risk register|prioriti[sz]|estimat|pricing|forecast|break-?even|decision (matrix|log)|meeting|one[- ]pager|tracker|plan\b|scorecard/;

/** Counts read from a declarative tool's definition. Null for anything that is not one (a hand-built tool). */
export function shapeOf(def: unknown): Shape | null {
  const d = def as { sections?: unknown } | null;
  if (!d || !Array.isArray(d.sections)) return null;
  let scored = 0, numbers = 0, computed = 0, tables = 0, action = false;
  for (const s of d.sections as { parts?: unknown[]; title?: string }[]) {
    for (const p of (s.parts ?? []) as Record<string, unknown>[]) {
      if (p.kind === 'field') {
        if (p.type === 'rating' || p.type === 'select') scored++;
        if (p.type === 'number') numbers++;
      } else if (p.kind === 'table') {
        tables++;
        const cols = (Array.isArray(p.columns) ? p.columns : []) as Record<string, unknown>[];
        for (const c of cols) {
          if (c.type === 'rating' || c.type === 'select') scored++;
          if (c.type === 'number') numbers++;
          if (c.type === 'computed') computed++;
        }
        const heads = cols.map((c) => String(c.header ?? '').toLowerCase());
        if (heads.some((h) => /owner|responsible|who/.test(h)) && heads.some((h) => /when|date|due|days|horizon/.test(h))) action = true;
      }
    }
  }
  const dd = def as { derived?: unknown[]; outputs?: unknown[]; sections: unknown[] };
  computed += (dd.derived?.length ?? 0) + (dd.outputs?.length ?? 0);
  return { sections: dd.sections.length, scoredQuestions: scored, numbers, computed, tables, hasActionTable: action };
}

/** The type with the most evidence. Returns how strong the evidence was so the screen can mark weak guesses for a person. */
export function suggestType(i: ClassifyInput): { type: AssetTypeId; strong: boolean; reason: string } {
  const text = `${i.name} ${i.groupName ?? ''} ${i.does ?? ''} ${i.whenToUse ?? ''}`.toLowerCase();
  const name = i.name.toLowerCase();
  const score: Record<AssetTypeId, number> = { survey: 0, toolkit: 0, aid: 0 };
  const why: Record<AssetTypeId, string[]> = { survey: [], toolkit: [], aid: [] };
  const add = (t: AssetTypeId, n: number, w: string) => { score[t] += n; why[t].push(w); };

  if (has(name, SURVEY)) add('survey', 3, 'the name reads like a survey'); else if (has(text, SURVEY)) add('survey', 1, 'the description mentions a survey or maturity check');
  if (has(name, /diagnostic/)) add('toolkit', 4, 'the name says diagnostic'); else if (has(name, TOOLKIT)) add('toolkit', 3, 'the name reads like a diagnostic or problem-solving method'); else if (has(text, TOOLKIT)) add('toolkit', 1, 'the description reads like diagnosis or problem solving');
  if (has(name, AID)) add('aid', 3, 'the name reads like a working tool or calculator'); else if (has(text, AID)) add('aid', 1, 'the description reads like a working tool');
  const cat = (i.category ?? '').toLowerCase();
  if (cat === 'problem solving' || cat === 'business analysis') add('toolkit', 1, `it sits in "${i.category}"`);
  if (cat === 'project management' || cat === 'decision models' || cat === 'others') add('aid', 1, `it sits in "${i.category}"`);
  const s = i.shape;
  if (s) {
    if (s.scoredQuestions >= 10 && s.computed <= 2 && s.tables <= 1) add('survey', 2, `it is mostly scored questions (${s.scoredQuestions})`);
    if (s.numbers >= 3 && s.computed >= 2) add('aid', 2, 'it takes numbers in and works out results');
    if (s.hasActionTable && s.sections >= 3) add('toolkit', 1, 'it ends in an action plan');
  }
  const ranked = (Object.keys(score) as AssetTypeId[]).sort((a, b) => score[b] - score[a]);
  const top = ranked[0];
  const gap = score[top] - score[ranked[1]];
  // nothing matched at all: a worksheet is most often a desk tool
  if (score[top] === 0) return { type: 'aid', strong: false, reason: 'nothing in the name or shape points one way, so it is treated as a desk tool' };
  return { type: top, strong: score[top] >= 3 && gap >= 2, reason: `Because ${why[top].join(' and ')}.` };
}

export function suggestAreas(i: ClassifyInput): Area[] {
  const text = `${i.name} ${i.groupName ?? ''} ${i.does ?? ''} ${i.practice ?? ''}`.toLowerCase();
  const nameOnly = i.name.toLowerCase();
  const hits = AREA_RULES.filter(([, re]) => re.test(nameOnly)).map(([a]) => a);
  const more = AREA_RULES.filter(([a, re]) => !hits.includes(a) && re.test(text)).map(([a]) => a);
  const out = [...hits, ...more].slice(0, 3);
  if (out.length) return out;
  const p = (i.practice ?? '').toLowerCase();
  if (p.startsWith('strategy')) return ['Strategy'];
  if (p.startsWith('process')) return ['Process'];
  if (p.startsWith('digital') || p.startsWith('technology')) return ['Technology'];
  if (p.startsWith('organisation') || p.startsWith('programme')) return ['People'];
  if (p.startsWith('finance')) return ['Finance'];
  return ['Strategy'];
}

export function suggestSectors(i: ClassifyInput): ToolSector[] {
  const text = `${i.name} ${i.groupName ?? ''} ${i.does ?? ''} ${i.whenToUse ?? ''}`.toLowerCase();
  return SECTOR_RULES.filter(([, re]) => re.test(text)).map(([s]) => s).slice(0, 3);
}

/** The rule-based classification. Never claims to be a person's decision. */
export function suggestClassification(i: ClassifyInput): Classification & { strong: boolean } {
  const t = suggestType(i);
  return { type: t.type, areas: suggestAreas(i), sectors: suggestSectors(i), basis: 'rules', reason: t.reason, strong: t.strong };
}

/** Reads and checks a stored classification; anything unrecognised is dropped rather than shown. */
export function readClassification(provenance: unknown): Classification | null {
  const c = (provenance as { classification?: Partial<Classification> } | null)?.classification;
  if (!c || !isAssetType(c.type)) return null;
  const areas = (Array.isArray(c.areas) ? c.areas : []).filter(isArea);
  const sectors = (Array.isArray(c.sectors) ? c.sectors : []).filter(isToolSector);
  const basis = c.basis === 'person' || c.basis === 'ai' ? c.basis : 'rules';
  return { type: c.type, areas, sectors, basis, reason: typeof c.reason === 'string' ? c.reason.slice(0, 300) : '', at: c.at, by: c.by };
}

/** Cleans what a browser or an AI sends back into a safe classification (unknown values removed; at least one area). */
export function cleanClassification(raw: unknown): { type: AssetTypeId; areas: Area[]; sectors: ToolSector[] } | null {
  const r = raw as { type?: unknown; areas?: unknown; sectors?: unknown } | null;
  if (!r || !isAssetType(r.type)) return null;
  const areas = (Array.isArray(r.areas) ? r.areas : []).filter(isArea).slice(0, 4);
  const sectors = (Array.isArray(r.sectors) ? r.sectors : []).filter(isToolSector).slice(0, 5);
  if (!areas.length) return null;
  return { type: r.type, areas: [...new Set(areas)], sectors: [...new Set(sectors)] };
}
