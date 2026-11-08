/**
 * Agent Control: an admin's edits to an agent's wording. The default text lives in code (catalogue.ts and pilots/index.ts); an edit only
 * overrides it, and removing the edit puts the default back. Formulas are never editable here, so no one can change a number by typing.
 */
import type { SipocText } from './sipoc';

export interface AgentEdit {
  slug: string;
  does?: string | null;
  suppliers?: string[] | null;
  process?: string[] | null;
  customers?: string[] | null;
  refresh?: string | null;
}
export interface SavedEdit extends AgentEdit { version: number; updatedBy: string | null; updatedAt: Date }
export interface EditLogEntry { version: number; editedBy: string | null; createdAt: Date; snapshot: AgentEdit | null }

export interface AgentEditRepo {
  all(): Promise<SavedEdit[]>;
  get(slug: string): Promise<SavedEdit | null>;
  /** Save an edit (or, with null, remove it) and record the new version in the history. Returns the new version number. */
  save(slug: string, edit: AgentEdit | null, by: string | null): Promise<number>;
  history(slug: string, limit?: number): Promise<EditLogEntry[]>;
}

export const LIMITS = { does: 400, line: 200, lines: 8, refresh: 300 } as const;

type Clean = { ok: true; edit: AgentEdit } | { ok: false; errors: string[] };

const text = (v: unknown, max: number, label: string, errors: string[]): string | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') { errors.push(`${label} must be text.`); return undefined; }
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (t.length > max) { errors.push(`${label} is ${t.length} characters; the limit is ${max}.`); return undefined; }
  return t;
};

const lines = (v: unknown, label: string, errors: string[]): string[] | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\r?\n/) : null;
  if (!raw) { errors.push(`${label} must be a list of lines.`); return undefined; }
  const out = raw.map((x) => String(x).replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!out.length) return null;
  if (out.length > LIMITS.lines) errors.push(`${label} has ${out.length} lines; the limit is ${LIMITS.lines}.`);
  const long = out.find((x) => x.length > LIMITS.line);
  if (long) errors.push(`${label}: a line is ${long.length} characters; the limit is ${LIMITS.line}.`);
  return out;
};

/** Check and tidy what an admin typed. An empty box means "use the default" (null). */
export function cleanEdit(slug: string, input: Record<string, unknown>): Clean {
  const errors: string[] = [];
  const edit: AgentEdit = {
    slug,
    does: text(input.does, LIMITS.does, 'The description', errors),
    suppliers: lines(input.suppliers, 'Suppliers', errors),
    process: lines(input.process, 'Process', errors),
    customers: lines(input.customers, 'Customers', errors),
    refresh: text(input.refresh, LIMITS.refresh, 'How to refresh', errors),
  };
  if (errors.length) return { ok: false, errors };
  return { ok: true, edit };
}

/** True when an edit changes nothing (every field empty): saving it is the same as resetting. */
export const isEmptyEdit = (e: AgentEdit): boolean => !e.does && !e.suppliers && !e.process && !e.customers && !e.refresh;

/** The wording a visitor sees: the edit where there is one, the default otherwise. */
export const withEdit = <T extends { does: string }>(agent: T, edit?: AgentEdit | null): T => ({ ...agent, does: edit?.does || agent.does });
export function sipocWithEdit(base: SipocText, edit?: AgentEdit | null): SipocText {
  return {
    suppliers: edit?.suppliers?.length ? edit.suppliers : base.suppliers,
    process: edit?.process?.length ? edit.process : base.process,
    customers: edit?.customers?.length ? edit.customers : base.customers,
    refresh: edit?.refresh || base.refresh,
  };
}

/** Saved edits by agent. A missing table or a database problem must never break the public pages, so any failure means "no edits". */
export async function loadEdits(repo: AgentEditRepo): Promise<Record<string, SavedEdit>> {
  try { return Object.fromEntries((await repo.all()).map((e) => [e.slug, e])); } catch { return {}; }
}

/** In-memory repo for the tests. */
export function createMemoryEditRepo(): AgentEditRepo {
  const edits = new Map<string, SavedEdit>();
  const log: (EditLogEntry & { slug: string })[] = [];
  return {
    async all() { return [...edits.values()]; },
    async get(slug) { return edits.get(slug) ?? null; },
    async save(slug, edit, by) {
      const version = Math.max(0, ...log.filter((l) => l.slug === slug).map((l) => l.version)) + 1;
      const at = new Date();
      if (edit && !isEmptyEdit(edit)) edits.set(slug, { ...edit, slug, version, updatedBy: by, updatedAt: at });
      else edits.delete(slug);
      log.push({ slug, version, editedBy: by, createdAt: at, snapshot: edit && !isEmptyEdit(edit) ? { ...edit } : null });
      return version;
    },
    async history(slug, limit = 20) { return log.filter((l) => l.slug === slug).sort((a, b) => b.version - a.version).slice(0, limit); },
  };
}
