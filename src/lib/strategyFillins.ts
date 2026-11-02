/**
 * strategyFillins.ts — per-client persistence for a Strategy Hub framework: its guided fill-in, the AI's written
 * analysis of it, and the Recommendations & Actionables generated from it (see /api/strategy-hub/fillin, /generate and
 * /analyze). One row per (client, tool_id), upsert only — the UI has no history/multi-instance concept, so neither does
 * this table. The shapes, the freshness fingerprint and the validators live in strategyFillinTypes.ts (pure).
 *
 * Everything the AI produces is saved by the SERVER at the moment it is produced — never left to a follow-up request
 * from the browser — so a closed tab, a dropped connection or a forgotten Save can no longer lose it, and so the tools
 * downstream in the golden thread can always read it as input.
 *
 * Matches fields by label (see FrameworkField in strategyFrameworks.ts) — labels are this system's de facto field id.
 *
 * No character limits on any stored text — `fields`/`analysis`/`recommendations`/`actionables` are JSON/LONGTEXT
 * columns, and callers must not truncate a client's own analysis. Consultant-grade output should be able to run long.
 */

import pool from './mysql';
import type { FrameworkField } from './strategyFrameworks';
import {
  EMPTY_RECORD,
  fingerprintFields,
  type FieldChangeReason,
  type FillinRecord,
  type StrategyActionable,
  type StrategyAnalysis,
  type StrategyRecommendation,
} from './strategyFillinTypes';

export type { FillinRecord, StrategyActionable, StrategyAnalysis, StrategyRecommendation, FieldChangeReason };

let tableEnsured = false;
export async function ensureStrategyFillinsTable(): Promise<void> {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS strategy_fillins (
      id                   INT AUTO_INCREMENT PRIMARY KEY,
      client_id            INT NOT NULL,
      tool_id              VARCHAR(50) NOT NULL,
      fields               JSON NOT NULL,
      recommendations      JSON,
      actionables          JSON,
      analysis             JSON,
      analysis_fingerprint VARCHAR(32),
      analysis_at          TIMESTAMP NULL,
      previous_fields      JSON,
      previous_reason      VARCHAR(16),
      created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_client_tool (client_id, tool_id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      INDEX idx_client (client_id)
    )
  `).catch(() => {});
  // Defensive additive ALTERs for rows created before each column existed — same idiom as strategyFrameworks.ts. Each is
  // wrapped on its own so a column that is already there never blocks the rest.
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN recommendations JSON`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN actionables JSON`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN analysis JSON`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN analysis_fingerprint VARCHAR(32)`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN analysis_at TIMESTAMP NULL`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN previous_fields JSON`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_fillins ADD COLUMN previous_reason VARCHAR(16)`).catch(() => {});
  tableEnsured = true;
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== 'string') return raw as T;
  if (!raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const parseArray = <T>(raw: unknown): T[] => {
  const v = parseJson<unknown>(raw, []);
  return Array.isArray(v) ? (v as T[]) : [];
};

const toIso = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d.toISOString() : String(v);
};

function rowToRecord(row: Record<string, unknown>): FillinRecord {
  const analysis = parseJson<StrategyAnalysis | null>(row.analysis, null);
  const previous = parseArray<FrameworkField>(row.previous_fields);
  return {
    fields: parseArray<FrameworkField>(row.fields),
    recommendations: parseArray<StrategyRecommendation>(row.recommendations),
    actionables: parseArray<StrategyActionable>(row.actionables),
    analysis: analysis && typeof analysis === 'object' ? analysis : null,
    analysisFingerprint: row.analysis_fingerprint ? String(row.analysis_fingerprint) : null,
    analysisAt: toIso(row.analysis_at),
    previousFields: previous.length > 0 ? previous : null,
    previousReason: previous.length > 0 && row.previous_reason ? (String(row.previous_reason) as FieldChangeReason) : null,
    updatedAt: toIso(row.updated_at),
  };
}

/** Full saved record for one (client, tool) — fields, analysis, recommendations and actionables. Null if the client has
 * never saved anything for this tool. */
export async function getFillin(clientId: number, toolId: string): Promise<FillinRecord | null> {
  await ensureStrategyFillinsTable();
  const [rows] = (await pool.query(
    `SELECT fields, recommendations, actionables, analysis, analysis_fingerprint, analysis_at,
            previous_fields, previous_reason, updated_at
     FROM strategy_fillins WHERE client_id = ? AND tool_id = ? LIMIT 1`,
    [clientId, toolId]
  )) as [Record<string, unknown>[], unknown];
  if (!rows || rows.length === 0) return null;
  return rowToRecord(rows[0]);
}

/** Back-compat narrow accessor — fields only. */
export async function getFillinFields(clientId: number, toolId: string): Promise<FrameworkField[] | null> {
  const record = await getFillin(clientId, toolId);
  return record ? record.fields : null;
}

/** Every tool this client has saved something for — what the hub overview and the connections panel read. */
export async function listFillins(clientId: number): Promise<(FillinRecord & { toolId: string })[]> {
  await ensureStrategyFillinsTable();
  const [rows] = (await pool.query(
    `SELECT tool_id, fields, recommendations, actionables, analysis, analysis_fingerprint, analysis_at,
            previous_fields, previous_reason, updated_at
     FROM strategy_fillins WHERE client_id = ?`,
    [clientId]
  )) as [Record<string, unknown>[], unknown];
  return (rows ?? []).map((row) => ({ toolId: String(row.tool_id), ...rowToRecord(row) }));
}

export interface SaveOptions {
  /** Set when `fields` changed in bulk (an AI fill, a template or document import): the previous fields are kept once so it can be undone. */
  snapshotReason?: FieldChangeReason;
}

/**
 * Partial save — updates only the keys provided, preserving whatever else was already stored (saving edited fields must
 * not wipe a previously generated analysis, and vice versa). Read-merge-write, same discipline as clientProjects.ts's
 * updateTask — a row is small enough that this is simple and always internally consistent.
 *
 * `analysis` is stored with the fingerprint of the fields it was written from, so a later change to the fields shows the
 * analysis as out of date (fillinStatus) instead of silently presenting it as current.
 */
export async function saveFillin(
  clientId: number,
  toolId: string,
  updates: Partial<Pick<FillinRecord, 'fields' | 'recommendations' | 'actionables'>> & { analysis?: StrategyAnalysis | null },
  opts: SaveOptions = {}
): Promise<FillinRecord> {
  await ensureStrategyFillinsTable();
  const existing = (await getFillin(clientId, toolId)) ?? EMPTY_RECORD;

  const fields = updates.fields ?? existing.fields;
  const fieldsChanged = updates.fields !== undefined && JSON.stringify(updates.fields.map((f) => [f.label, f.value])) !== JSON.stringify(existing.fields.map((f) => [f.label, f.value]));

  let previousFields = existing.previousFields;
  let previousReason = existing.previousReason;
  if (fieldsChanged) {
    if (opts.snapshotReason && existing.fields.some((f) => (f.value ?? '').trim())) {
      previousFields = existing.fields;
      previousReason = opts.snapshotReason;
    } else if (!opts.snapshotReason) {
      // A manual edit after an AI fill / import means the client has accepted it: the undo no longer applies.
      previousFields = null;
      previousReason = null;
    }
  }

  const analysis = updates.analysis !== undefined ? updates.analysis : existing.analysis;
  // The fingerprint is stamped only when the analysis is (re)written; otherwise it is carried as it was.
  const analysisFingerprint = updates.analysis !== undefined ? (updates.analysis ? fingerprintFields(fields) : null) : existing.analysisFingerprint;
  const analysisAt = updates.analysis !== undefined ? (updates.analysis ? new Date() : null) : existing.analysisAt ? new Date(existing.analysisAt) : null;

  await pool.query(
    `INSERT INTO strategy_fillins
       (client_id, tool_id, fields, recommendations, actionables, analysis, analysis_fingerprint, analysis_at, previous_fields, previous_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       fields = VALUES(fields), recommendations = VALUES(recommendations), actionables = VALUES(actionables),
       analysis = VALUES(analysis), analysis_fingerprint = VALUES(analysis_fingerprint), analysis_at = VALUES(analysis_at),
       previous_fields = VALUES(previous_fields), previous_reason = VALUES(previous_reason), updated_at = CURRENT_TIMESTAMP`,
    [
      clientId,
      toolId,
      JSON.stringify(fields),
      JSON.stringify(updates.recommendations ?? existing.recommendations),
      JSON.stringify(updates.actionables ?? existing.actionables),
      analysis ? JSON.stringify(analysis) : null,
      analysisFingerprint,
      analysisAt,
      previousFields ? JSON.stringify(previousFields) : null,
      previousFields ? previousReason : null,
    ]
  );
  const saved = await getFillin(clientId, toolId);
  return saved ?? { ...EMPTY_RECORD, fields, previousFields, previousReason };
}

/** Back-compat narrow mutator — fields only (preserves any existing analysis/recommendations/actionables). */
export async function saveFillinFields(clientId: number, toolId: string, fields: FrameworkField[]): Promise<void> {
  await saveFillin(clientId, toolId, { fields });
}

/** Puts the fields back as they were before the last AI fill / import. Returns null when there is nothing to undo. */
export async function undoFieldChange(clientId: number, toolId: string): Promise<FillinRecord | null> {
  const existing = await getFillin(clientId, toolId);
  if (!existing?.previousFields) return null;
  await pool.query(
    `UPDATE strategy_fillins SET fields = ?, previous_fields = NULL, previous_reason = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE client_id = ? AND tool_id = ?`,
    [JSON.stringify(existing.previousFields), clientId, toolId]
  );
  return getFillin(clientId, toolId);
}
