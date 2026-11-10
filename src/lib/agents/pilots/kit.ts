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
