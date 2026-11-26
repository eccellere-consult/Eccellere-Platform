/**
 * Linked steps, as the worksheet shows them: earlier answers recalled at the top of a step, and rows added for each entry of an earlier table.
 * Pure functions, so the screens and the tests share one answer.
 */
import { linkedChoices } from './declarative';
import type { ModelDefinition, ModelValues, Part, Section, TablePart } from './types';

export interface RecallItem {
  key: string;
  label: string;
  /** What was answered: one line for a field, one line per filled row for a table. Empty when nothing is answered yet. */
  lines: string[];
}

const MAX_ROWS = 12;

function findPart(def: ModelDefinition, key: string): Part | undefined {
  for (const s of def.sections) for (const p of s.parts) if (p.key === key) return p;
  return undefined;
}

/** The earlier answers a step asks to show, in the order it names them. Unknown keys are skipped. */
export function recallItems(def: ModelDefinition, s: Pick<Section, 'recall'>, v: ModelValues): RecallItem[] {
  const out: RecallItem[] = [];
  for (const key of s.recall ?? []) {
    const p = findPart(def, key);
    if (!p) continue;
    if (p.kind === 'field') {
      const x = (v.fields[p.key] ?? '').trim();
      out.push({ key, label: p.label, lines: x ? [x] : [] });
      continue;
    }
    const cols = p.columns.filter((c) => c.type !== 'computed');
    const lines = (v.tables[p.key] ?? [])
      .map((r) => cols.map((c) => (r[c.key] ?? '').trim()).filter(Boolean).slice(0, 3).join(' — '))
      .filter(Boolean);
    out.push({ key, label: p.label, lines: lines.length > MAX_ROWS ? [...lines.slice(0, MAX_ROWS), `and ${lines.length - MAX_ROWS} more`] : lines });
  }
  return out;
}

/**
 * For a table with a linked column: the earlier entries that have no row here yet, so one click can add a row for each.
 * Only the first linked column counts; a table with fixed rows never gets rows added.
 */
export function missingLinkedRows(t: TablePart, v: ModelValues): { col: string; values: string[] } | null {
  if (t.fixedRows || t.board) return null;
  const c = t.columns.find((x) => x.type === 'text' && x.optionsFrom);
  if (!c) return null;
  const have = new Set((v.tables[t.key] ?? []).map((r) => (r[c.key] ?? '').trim().toLowerCase()).filter(Boolean));
  const room = Math.max(0, t.maxRows - (v.tables[t.key] ?? []).filter((r) => Object.values(r).some((x) => (x ?? '').trim())).length);
  const values = linkedChoices(c, v).filter((x) => !have.has(x.toLowerCase())).slice(0, room);
  return values.length ? { col: c.key, values } : null;
}
