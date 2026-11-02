/**
 * The consulting practice areas the Consulting library is organised by, and how a tool is placed in one. This is separate from the seven
 * marketplace sections clients browse (Problem solving, Strategy, ...): a tool has one of each. The practice is for the Eccellere team
 * finding the right tool for an engagement; the section is for clients choosing a tool.
 */
export const PRACTICES = [
  'Strategy',
  'Process',
  'Digital',
  'Organisation',
  'Technology',
  'Finance & Risk',
  'Programme & Change',
  'Problem solving & Creativity',
] as const;
export type Practice = (typeof PRACTICES)[number];

export const asPractice = (x: string): Practice | null => PRACTICES.find((p) => p.toLowerCase() === x.trim().toLowerCase()) ?? null;

/** Where a list heading (or group) belongs when the admin lets the list decide ("Auto"). */
export function suggestPractice(group: string): Practice {
  const g = group.toLowerCase();
  if (!g) return 'Problem solving & Creativity';
  if (/(technology|architecture|infrastructure|cyber|security|platform|cloud|integration|devops|software|it service|it governance)/.test(g)) return 'Technology';
  if (/(digital|data|analytics|automation|agentic|\bai\b|customer experience|digital product)/.test(g)) return 'Digital';
  if (/(organi[sz]ation|operating model|people|talent|structure|governance|culture|capability|workforce)/.test(g)) return 'Organisation';
  if (/(financ|risk|compliance|cost|investment|valuation|audit)/.test(g)) return 'Finance & Risk';
  if (/(project|programme|program|change|adoption|stakeholder|performance|portfolio|transformation office)/.test(g)) return 'Programme & Change';
  if (/(strateg|alignment|decision|growth|market|competit|portfolio)/.test(g)) return 'Strategy';
  if (/(process|quality|lean|six sigma|monitor|improvement|operations|supply)/.test(g)) return 'Process';
  if (/(root cause|creative|problem|empathy|ideation|idea)/.test(g)) return 'Problem solving & Creativity';
  return 'Problem solving & Creativity';
}

/** The 36 hand-built Strategy Hub tools: the library placement and marketplace section each takes. */
export const HUB_PLACEMENT: Record<string, { practice: Practice; category: string; group: string }> = {
  pestel: { practice: 'Strategy', category: 'Business analysis', group: 'Environment' },
  porter5: { practice: 'Strategy', category: 'Business analysis', group: 'Environment' },
  portergeneric: { practice: 'Strategy', category: 'Strategy', group: 'Competitive advantage' },
  valuechain: { practice: 'Process', category: 'Business analysis', group: 'Environment' },
  scenario: { practice: 'Strategy', category: 'Strategy', group: 'Environment' },
  gametheory: { practice: 'Strategy', category: 'Decision Models', group: 'Environment' },
  ansoff: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  bcg: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  ge9box: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  dpm: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  horizons3: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  parenting: { practice: 'Strategy', category: 'Strategy', group: 'Growth and portfolio' },
  makebuyally: { practice: 'Strategy', category: 'Decision Models', group: 'Growth and portfolio' },
  masynergy: { practice: 'Finance & Risk', category: 'Business analysis', group: 'Growth and portfolio' },
  pivotpersist: { practice: 'Strategy', category: 'Decision Models', group: 'Growth and portfolio' },
  blueocean: { practice: 'Strategy', category: 'Strategy', group: 'Competitive advantage' },
  errc: { practice: 'Strategy', category: 'Strategy', group: 'Competitive advantage' },
  vrio: { practice: 'Strategy', category: 'Strategy', group: 'Competitive advantage' },
  rbv: { practice: 'Strategy', category: 'Strategy', group: 'Competitive advantage' },
  corecompetence: { practice: 'Organisation', category: 'Strategy', group: 'Competitive advantage' },
  bmc: { practice: 'Strategy', category: 'Strategy', group: 'Business model' },
  vpc: { practice: 'Strategy', category: 'Strategy', group: 'Business model' },
  leancanvas: { practice: 'Strategy', category: 'Strategy', group: 'Business model' },
  financial: { practice: 'Finance & Risk', category: 'Business analysis', group: 'Finance' },
  unitecon: { practice: 'Finance & Risk', category: 'Business analysis', group: 'Finance' },
  mvfm: { practice: 'Finance & Risk', category: 'Business analysis', group: 'Finance' },
  agenticai: { practice: 'Digital', category: 'Strategy', group: 'Operating model' },
  sevens: { practice: 'Organisation', category: 'Change Management', group: 'Operating model' },
  raci: { practice: 'Organisation', category: 'Change Management', group: 'Operating model' },
  bsc: { practice: 'Organisation', category: 'Strategy', group: 'Operating model' },
  ogsm: { practice: 'Programme & Change', category: 'Strategy', group: 'Operating model' },
  startupkpis: { practice: 'Finance & Risk', category: 'Business analysis', group: 'Operating model' },
  stp: { practice: 'Strategy', category: 'Strategy', group: 'Execution' },
  ninebox: { practice: 'Organisation', category: 'Change Management', group: 'Execution' },
  okrs: { practice: 'Programme & Change', category: 'Project Management', group: 'Execution' },
  first90: { practice: 'Programme & Change', category: 'Project Management', group: 'Execution' },
};
