import type { DeclarativeTool, DeclPart } from '@/lib/strategyModels/declarative';

/**
 * SIPOC for an agent: Suppliers, Inputs, Process, Outputs, Customers. The Process, Suppliers and Customers lines are written by a person
 * (drafts the owner confirms); the Inputs and Outputs are read straight from the tool definition so they can never drift from what the tool really asks and returns.
 */
export interface SipocText {
  suppliers: string[];
  process: string[];
  customers: string[];
  /** how fresh data should be and who refreshes it */
  refresh: string;
}

export interface InputItem { label: string; unit?: string; help: string; kind: 'field' | 'table'; columns?: { header: string; unit?: string; computed: boolean }[]; example?: string }
export interface OutputItem { label: string; kind: 'result' | 'working' }

const parts = (tool: DeclarativeTool): DeclPart[] => tool.sections.flatMap((s) => s.parts);

/** What the tool asks the user for: every field and every table, with the columns the user fills in (computed columns are listed as worked out). */
export function inputsOf(tool: DeclarativeTool): InputItem[] {
  return parts(tool).map((p) =>
    p.kind === 'field'
      ? { kind: 'field' as const, label: p.label, unit: p.unit, help: p.help ?? '', example: p.example }
      : { kind: 'table' as const, label: p.label, help: p.help ?? '', columns: p.columns.map((c) => ({ header: c.header, unit: c.unit, computed: c.type === 'computed' })) },
  );
}

/** What the tool returns: the headline results and the working figures beside them. */
export function outputsOf(tool: DeclarativeTool): OutputItem[] {
  return [
    ...(tool.outputs ?? []).map((o) => ({ label: o.label, kind: 'result' as const })),
    ...(tool.derived ?? []).map((d) => ({ label: d.label, kind: 'working' as const })),
  ];
}
