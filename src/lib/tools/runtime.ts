/**
 * Turns a stored tool into what the page and the AI need. A tool is one of two kinds, and both end up as the same engine (a ModelDefinition):
 *   - written as data (an AI draft, reviewed by a person): its `definition` is a DeclarativeTool, interpreted on demand;
 *   - one of the hand-built Strategy Hub tools: its `definition` points at the model in the registry ({ kind: 'code', toolId }).
 * Server code only (the registry imports every hand-built model).
 */
import { interpret, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { getModelDefinition, getModelDiagramSvg, getModelSample } from '@/lib/strategyModels/registry';
import { renderDiagram } from '@/lib/strategyModels/diagrams/templates';
import type { ModelDefinition, Reference, Row } from '@/lib/strategyModels/types';
import type { AiTool } from './ai';
import type { ToolRecord } from './repo';

/** How a hand-built tool is stored: a pointer to the model, plus where it sits in the Framework library (layer, lifecycle, golden thread). */
export interface CodeDefinition {
  kind: 'code';
  toolId: string;
  layer?: string;
  phaseStart?: number;
  phaseEnd?: number;
  nature?: string;
  upstream?: string[];
  downstream?: string[];
  next?: string;
}

export const isCodeDefinition = (d: unknown): d is CodeDefinition =>
  !!d && typeof d === 'object' && (d as { kind?: unknown }).kind === 'code' && typeof (d as { toolId?: unknown }).toolId === 'string';

/** A fictional worked example, keyed by the page's own field and table keys. */
export interface WorkedExample { scenario: string; values: Record<string, string>; tables: Record<string, Row[]> }

export interface ToolRuntime {
  def: ModelDefinition;
  sample: WorkedExample | null;
  reference: Reference;
  diagramSvg: string;
  analysisGuide: string;
  next: string;
  code: CodeDefinition | null;
}

export function toRuntime(tool: ToolRecord): ToolRuntime | null {
  if (isCodeDefinition(tool.definition)) {
    const code = tool.definition;
    const def = getModelDefinition(code.toolId);
    if (!def) return null;
    const sm = getModelSample(code.toolId);
    return { def, sample: sm ? { scenario: sm.scenario, values: sm.values, tables: sm.tables } : null, reference: def.reference, diagramSvg: getModelDiagramSvg(code.toolId) ?? '', analysisGuide: def.analysisGuide ?? '', next: code.next ?? '', code };
  }
  const d = tool.definition as DeclarativeTool;
  if (!d || !Array.isArray(d.sections)) return null;
  let svg = '';
  try { svg = d.diagram ? renderDiagram(d.diagram) : ''; } catch { svg = ''; }
  return { def: interpret(d), sample: d.sample ? { scenario: d.sample.scenario, values: d.sample.values, tables: d.sample.tables } : null, reference: d.reference, diagramSvg: svg, analysisGuide: d.analysisGuide, next: d.next ?? '', code: null };
}

export function toAiTool(tool: ToolRecord): AiTool | null {
  const rt = toRuntime(tool);
  return rt ? { name: tool.name, does: tool.does ?? '', analysisGuide: rt.analysisGuide, def: rt.def } : null;
}
