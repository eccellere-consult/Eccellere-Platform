import type { DeclField, DeclSection, DeclTable, Expr } from '@/lib/strategyModels/declarative';

/**
 * Small builders shared by the wave-1 agent worksheets, so each tool file holds only what is specific to it.
 * Every agent worksheet ends with the same action plan (action, owner as a role, measure, 30/60/90 days), as the Eccellere standard asks.
 */
export const f = (field: string): Expr => ({ field });
export const c = (cell: string): Expr => ({ cell });

type Opt = Partial<Omit<DeclField, 'kind' | 'key' | 'label' | 'type' | 'help' | 'example'>>;
export const text = (key: string, label: string, help: string, example: string, o: Opt = {}): DeclField => ({ kind: 'field', key, label, type: 'text', help, example, ...o });
export const long = (key: string, label: string, help: string, example = '', o: Opt = {}): DeclField => ({ kind: 'field', key, label, type: 'longtext', help, example, ...o });
export const num = (key: string, label: string, unit: string, help: string, example: string): DeclField => ({ kind: 'field', key, label, type: 'number', unit, help, example });
export const pick = (key: string, label: string, options: string[], help: string, example: string): DeclField => ({ kind: 'field', key, label, type: 'select', options, help, example });

/** The closing section of every agent worksheet. */
export const actionPlan = (what: string): DeclSection => ({
  key: 'plan',
  title: 'Action plan',
  summary: `Turn the ${what} into dated actions with an owner and a measure.`,
  parts: [{
    kind: 'table', key: 'actions', label: 'Actions for the next 90 days', rowLabel: 'Action', minRows: 3, maxRows: 12,
    help: 'List the first actions in order. Give each an owner by role (not a named person), a measure that shows it worked, and when it should start.',
    columns: [
      { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
      { key: 'owner', header: 'Owner (role)', help: 'The role that is accountable, for example Finance Manager.', type: 'text' },
      { key: 'measure', header: 'Measure of success', help: 'The number or event that proves the action worked.', type: 'text' },
      { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
    ],
  } satisfies DeclTable],
});

// ── Column builders and the tool factory (wave 2 and 3 agents) ───────────────────────────────────────────────────────

import type { DeclColumn, DeclarativeTool, DeclOutput, DeclDerived, DeclPart, Rule, ToolCategory } from '@/lib/strategyModels/declarative';

export const ct = (key: string, header: string, help: string): DeclColumn => ({ key, header, help, type: 'text' });
export const cn = (key: string, header: string, help: string, unit?: string): DeclColumn => ({ key, header, help, type: 'number', ...(unit ? { unit } : {}) });
export const cr = (key: string, header: string, help: string, low: string, high: string): DeclColumn => ({ key, header, help, type: 'rating', scale: { min: 1, max: 5, low, high } });
export const cs = (key: string, header: string, help: string, options: string[]): DeclColumn => ({ key, header, help, type: 'select', options });
export const cc = (key: string, header: string, help: string, rule: Rule): DeclColumn => ({ key, header, help, type: 'computed', rule });

export const tbl = (key: string, label: string, rowLabel: string, help: string, columns: DeclColumn[], minRows = 3, maxRows = 20): DeclTable => ({ kind: 'table', key, label, rowLabel, help, columns, minRows, maxRows });
export const sec = (key: string, title: string, summary: string, parts: DeclPart[]): DeclSection => ({ key, title, summary, parts });

export interface AgentSpec {
  slug: string; name: string; category: ToolCategory;
  does: string; whenToUse: string; whenNotToUse: string; next: string;
  summary: string; caption: string; howToRead: string[];
  diagramTitle: string; diagramCaption: string; steps: [string, string][];
  sections: DeclSection[];
  /** what the closing action plan is about, e.g. "overdue invoices" */
  plan: string;
  derived: DeclDerived[]; outputs: DeclOutput[];
  analysisGuide: string;
  scenario: string; values: Record<string, string>; tables: Record<string, Record<string, string>[]>;
  actions: [string, string, string][];
}

/** Builds a complete worksheet from a short spec: the reference has no stated originator, and the closing action plan and its sample rows are added. */
export function agent(s: AgentSpec): DeclarativeTool {
  return {
    schema: 1, slug: s.slug, name: s.name, category: s.category,
    does: s.does, whenToUse: s.whenToUse, whenNotToUse: s.whenNotToUse, next: s.next,
    reference: { originator: '', year: '', summary: s.summary, caption: s.caption, howToRead: s.howToRead },
    diagram: { template: 'steps', title: s.diagramTitle, steps: s.steps.map(([name, hint]) => ({ name, hint })), caption: s.diagramCaption },
    sections: [...s.sections, actionPlan(s.plan)],
    derived: s.derived, outputs: s.outputs, analysisGuide: s.analysisGuide,
    sample: { scenario: s.scenario, values: s.values, tables: { ...s.tables, actions: s.actions.map(([action, owner, measure]) => ({ action, owner, measure, horizon: '30 days' })) } },
  };
}
