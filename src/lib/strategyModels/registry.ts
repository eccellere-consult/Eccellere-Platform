/**
 * strategyModels/registry.ts — the server-side lookup of every framework's model: its definition, its worked example and its
 * reference diagram. Imports every group, so only server code (routes, the catalogue, tests) should use it; the browser loads
 * definitions one group at a time through groups.ts, and never receives samples or diagram code except as the API sends them.
 */
import { ENVIRONMENT_MODELS } from './defs/environment';
import { PORTFOLIO_MODELS } from './defs/portfolio';
import { ADVANTAGE_MODELS } from './defs/advantage';
import { BUSINESS_MODELS } from './defs/business';
import { FINANCE_MODELS } from './defs/finance';
import { OPERATING_MODELS } from './defs/operating';
import { EXECUTION_MODELS } from './defs/execution';
import { ENVIRONMENT_SAMPLES } from './samples/environment';
import { PORTFOLIO_SAMPLES } from './samples/portfolio';
import { ADVANTAGE_SAMPLES } from './samples/advantage';
import { BUSINESS_SAMPLES } from './samples/business';
import { FINANCE_SAMPLES } from './samples/finance';
import { OPERATING_SAMPLES } from './samples/operating';
import { EXECUTION_SAMPLES } from './samples/execution';
import { ENVIRONMENT_DIAGRAMS } from './diagrams/environment';
import { PORTFOLIO_DIAGRAMS } from './diagrams/portfolio';
import { ADVANTAGE_DIAGRAMS } from './diagrams/advantage';
import { BUSINESS_DIAGRAMS } from './diagrams/business';
import { FINANCE_DIAGRAMS } from './diagrams/finance';
import { OPERATING_DIAGRAMS } from './diagrams/operating';
import { EXECUTION_DIAGRAMS } from './diagrams/execution';
import type { ModelDefinition, ModelSample } from './types';

export const ALL_MODELS: ModelDefinition[] = [...ENVIRONMENT_MODELS, ...PORTFOLIO_MODELS, ...ADVANTAGE_MODELS, ...BUSINESS_MODELS, ...FINANCE_MODELS, ...OPERATING_MODELS, ...EXECUTION_MODELS];

const SAMPLES: Record<string, ModelSample> = { ...ENVIRONMENT_SAMPLES, ...PORTFOLIO_SAMPLES, ...ADVANTAGE_SAMPLES, ...BUSINESS_SAMPLES, ...FINANCE_SAMPLES, ...OPERATING_SAMPLES, ...EXECUTION_SAMPLES };
const DIAGRAMS: Record<string, () => string> = { ...ENVIRONMENT_DIAGRAMS, ...PORTFOLIO_DIAGRAMS, ...ADVANTAGE_DIAGRAMS, ...BUSINESS_DIAGRAMS, ...FINANCE_DIAGRAMS, ...OPERATING_DIAGRAMS, ...EXECUTION_DIAGRAMS };

const BY_ID = new Map(ALL_MODELS.map((m) => [m.toolId, m]));

export const getModelDefinition = (toolId: string): ModelDefinition | null => BY_ID.get(toolId) ?? null;
export const getModelSample = (toolId: string): ModelSample | null => SAMPLES[toolId] ?? null;

/** The reference diagram as SVG markup, drawn fresh (the drawing functions are pure). Null when the framework has none. */
export function getModelDiagramSvg(toolId: string): string | null {
  const draw = DIAGRAMS[toolId];
  return draw ? draw() : null;
}

export const listModelIds = (): string[] => ALL_MODELS.map((m) => m.toolId);
