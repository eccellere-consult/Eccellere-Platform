/**
 * strategyModels/groups.ts — which framework's model lives in which group module, and how the browser loads one.
 *
 * Definitions are grouped into a handful of modules so a page loads only the group it needs (the browser fetches the group
 * on demand) while the server imports them all. This file lists the tool ids per group WITHOUT importing the definitions,
 * so cheap code (the public catalogue route asking "does this framework have a model?") never pulls them in; a test keeps
 * it in step with the modules themselves.
 */
import type { ModelDefinition } from './types';

export const MODEL_GROUPS = {
  environment: ['pestel', 'porter5', 'portergeneric', 'valuechain', 'scenario', 'gametheory'],
  portfolio: ['ansoff', 'bcg', 'ge9box', 'dpm', 'horizons3', 'parenting', 'makebuyally', 'masynergy', 'pivotpersist'],
  advantage: ['blueocean', 'errc', 'vrio', 'rbv', 'corecompetence'],
  business: ['bmc', 'vpc', 'leancanvas'],
  finance: ['financial', 'unitecon', 'mvfm'],
  operating: ['agenticai', 'sevens', 'raci', 'bsc', 'ogsm', 'startupkpis'],
  execution: ['stp', 'ninebox', 'okrs', 'first90'],
} as const;

export type ModelGroup = keyof typeof MODEL_GROUPS;

const GROUP_OF = new Map<string, ModelGroup>(
  (Object.keys(MODEL_GROUPS) as ModelGroup[]).flatMap((g) => MODEL_GROUPS[g].map((id) => [id, g] as const))
);

export const modelToolIds = (): string[] => [...GROUP_OF.keys()];
export const hasModelFor = (toolId: string): boolean => GROUP_OF.has(toolId);
export const groupOfTool = (toolId: string): ModelGroup | null => GROUP_OF.get(toolId) ?? null;

type Loader = () => Promise<ModelDefinition[]>;

/** Browser-side loaders, one dynamic import per group — each becomes its own chunk. */
const LOADERS: Record<ModelGroup, Loader> = {
  environment: () => import('./defs/environment').then((m) => m.ENVIRONMENT_MODELS),
  portfolio: () => import('./defs/portfolio').then((m) => m.PORTFOLIO_MODELS),
  advantage: () => import('./defs/advantage').then((m) => m.ADVANTAGE_MODELS),
  business: () => import('./defs/business').then((m) => m.BUSINESS_MODELS),
  finance: () => import('./defs/finance').then((m) => m.FINANCE_MODELS),
  operating: () => import('./defs/operating').then((m) => m.OPERATING_MODELS),
  execution: () => import('./defs/execution').then((m) => m.EXECUTION_MODELS),
};

const loaded = new Map<ModelGroup, Promise<ModelDefinition[]>>();

/** The definition for a tool (null when the framework has no model), loading its group once. */
export async function loadModelDefinition(toolId: string): Promise<ModelDefinition | null> {
  const group = groupOfTool(toolId);
  if (!group) return null;
  if (!loaded.has(group)) loaded.set(group, LOADERS[group]());
  const defs = await loaded.get(group)!;
  return defs.find((d) => d.toolId === toolId) ?? null;
}
