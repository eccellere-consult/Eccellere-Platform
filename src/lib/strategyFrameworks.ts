/**
 * strategyFrameworks.ts — persistence for the Strategy Hub framework
 * catalogue (`strategy_frameworks` table). Not to be confused with
 * strategyMatrixEngine.ts, which is a completely different, already-live
 * feature (CEO Cockpit's 10-focus-area x 3-horizon benchmarking engine) —
 * see the memory note "Strategy Hub vs Strategy Matrix" for why these two
 * must stay separate. This file does no AI calls (see
 * strategyFrameworkGenerator.ts for the AI-assisted authoring draft).
 */

import pool from './mysql';
import { getModelDefinition } from './strategyModels/registry';
import { flattenStructure } from './strategyModels/values';
import { effectiveLinks, type LinkRow, type Links } from './strategyFrameworkLinks';

export type FrameworkLayer = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9';
export type FrameworkNature = 'diagnostic' | 'design' | 'decision' | 'quantitative' | 'governance' | 'execution';
/** `in_review` sits between draft and published: an admin submits a
 * finished draft for review, and publishing is a separate, deliberate
 * approval action rather than flipping a dropdown. There is only one admin
 * role in this system, so this is an authoring-discipline gate (nothing
 * reaches clients without a distinct approve step and a passing
 * completeness check), not a two-person segregation-of-duties control. */
export type FrameworkStatus = 'draft' | 'in_review' | 'published' | 'deprecated';

/** Tiering tag, not a tenancy/role — every framework stays in one shared
 * catalogue; this just decides which self-service clients see it. `both` is
 * the safe default (see ensureStrategyFrameworksTable) so nothing currently
 * published silently disappears the moment this column lands. A future
 * `consulting_pro`-facing surface (not built yet) would request the
 * unfiltered catalogue instead of filtering by this at all. */
export type FrameworkAudience = 'msme' | 'consulting_pro' | 'both';

export interface FrameworkField {
  label: string;
  value: string;
  source: string;
  /** Optional additional worked examples beyond `value` — added for the
   * framework-quality pass; absent/empty on every field authored before
   * this existed, which is fine since `value` alone still renders. */
  examples?: string[];
}

export interface StrategyFrameworkRow {
  id: number;
  toolId: string;
  name: string;
  layer: FrameworkLayer;
  phaseStart: number;
  phaseEnd: number;
  nature: FrameworkNature;
  does: string;
  whenToUse: string;
  /** Added for the framework-quality pass (§61 of the AI Consulting OS
   * assessment) — optional, same "old rows still parse" idiom as
   * agentCfoEngine.ts's `effortScore?`, since none of the original 31
   * seeded frameworks have this authored yet. rowToFramework always
   * defaults it to '' on read, so it's never actually undefined once
   * loaded — optional only so pre-existing StrategyFrameworkInput literals
   * (the seed arrays) don't need touching until their content pass. */
  whenNotToUse?: string;
  evidenceRequirements?: string;
  /** Free text, not a numeric field — left blank for pure design/decision
   * frameworks that don't score (e.g. Business Model Canvas), populated for
   * diagnostic/quantitative ones where a rubric genuinely helps. */
  scoringGuidance?: string;
  /** One paragraph on how this framework's output should read in a
   * handoff/summary — feeds a later export/report phase, not consumed by
   * anything yet. */
  reportTemplate?: string;
  nextStep: string;
  fields: FrameworkField[];
  upstreamTools: string[];
  downstreamTools: string[];
  industryTemplates: unknown | null;
  status: FrameworkStatus;
  audience?: FrameworkAudience;
  /** True when the framework has a published model (strategyModels): its fields are the model's own and are managed in code, not edited here. */
  hasModel?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StrategyFrameworkSummary = Pick<
  StrategyFrameworkRow,
  'id' | 'toolId' | 'name' | 'layer' | 'phaseStart' | 'phaseEnd' | 'nature' | 'status' | 'audience' | 'updatedAt'
>;

export type StrategyFrameworkInput = Omit<StrategyFrameworkRow, 'id' | 'createdAt' | 'updatedAt'>;

export interface ListFilters {
  layer?: FrameworkLayer;
  status?: FrameworkStatus;
  audience?: FrameworkAudience;
}

let tableEnsured = false;
export async function ensureStrategyFrameworksTable(): Promise<void> {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS strategy_frameworks (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      tool_id               VARCHAR(50) UNIQUE NOT NULL,
      name                  VARCHAR(200) NOT NULL,
      layer                 ENUM('L1','L2','L3','L4','L5','L6','L7','L8','L9') NOT NULL,
      phase_start           TINYINT NOT NULL,
      phase_end             TINYINT NOT NULL,
      nature                ENUM('diagnostic','design','decision','quantitative','governance','execution') NOT NULL DEFAULT 'diagnostic',
      does                  TEXT,
      when_to_use           TEXT,
      when_not_to_use       TEXT,
      evidence_requirements TEXT,
      scoring_guidance      TEXT,
      report_template       TEXT,
      next_step             TEXT,
      fields                JSON NOT NULL,
      upstream_tools        JSON,
      downstream_tools      JSON,
      industry_templates    JSON,
      status                ENUM('draft','in_review','published','deprecated') NOT NULL DEFAULT 'draft',
      audience              ENUM('msme','consulting_pro','both') NOT NULL DEFAULT 'both',
      created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_layer (layer),
      INDEX idx_status (status),
      INDEX idx_audience (audience)
    )
  `).catch(() => {});
  // Defensive widen for tables created before 'in_review' existed — same
  // additive ALTER idiom used elsewhere in this codebase (e.g.
  // transformation_frameworks.linked_game_plan_id). MODIFY on an ENUM that
  // already has the value is a no-op, so this is safe to run every boot.
  await pool.query(
    `ALTER TABLE strategy_frameworks MODIFY COLUMN status
       ENUM('draft','in_review','published','deprecated') NOT NULL DEFAULT 'draft'`
  ).catch(() => {});
  // Defensive additive ALTERs for the framework-quality + tiering pass —
  // each wrapped individually (mirrors auth.ts's `ALTER TABLE clients ADD
  // COLUMN role ...`.catch(() => {})` idiom) so a column that already
  // exists on a given install doesn't block the rest. `audience`'s
  // NOT NULL DEFAULT 'both' means every pre-existing row is automatically
  // backfilled visible-to-everyone the moment this lands.
  await pool.query(`ALTER TABLE strategy_frameworks ADD COLUMN when_not_to_use TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_frameworks ADD COLUMN evidence_requirements TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_frameworks ADD COLUMN scoring_guidance TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE strategy_frameworks ADD COLUMN report_template TEXT`).catch(() => {});
  await pool.query(
    `ALTER TABLE strategy_frameworks ADD COLUMN audience ENUM('msme','consulting_pro','both') NOT NULL DEFAULT 'both'`
  ).catch(() => {});
  await pool.query(`ALTER TABLE strategy_frameworks ADD INDEX idx_audience (audience)`).catch(() => {});
  tableEnsured = true;
}

/**
 * Pure completeness check gating any move toward `published`. Enforced
 * server-side in the POST/PUT handlers, not just in the builder UI — a
 * direct API call must not be able to publish a half-authored catalogue
 * entry that every client would then see. Returns the reasons it can't be
 * published (empty array = publishable).
 *
 * Deliberately NOT length-based: the founder's requirement is that
 * catalogue content be authored diligently and at whatever length accuracy
 * demands, so this checks that each piece is PRESENT and that the golden
 * thread is declared — never that it is under/over some character count.
 */
export function publishBlockers(framework: Pick<
  StrategyFrameworkRow,
  'name' | 'does' | 'whenToUse' | 'nextStep' | 'fields'
>): string[] {
  const blockers: string[] = [];
  if (!framework.name?.trim()) blockers.push('Framework name is empty.');
  if (!framework.does?.trim()) blockers.push('"What this does" is empty.');
  if (!framework.whenToUse?.trim()) blockers.push('"When to use it" is empty.');
  if (!framework.nextStep?.trim()) blockers.push('"What happens next" is empty — every published framework must declare the golden thread it feeds.');
  const usableFields = (framework.fields ?? []).filter((f) => f?.label?.trim());
  if (usableFields.length === 0) {
    blockers.push('Add at least one guided fill-in field.');
  } else {
    const unlabelledValues = usableFields.filter((f) => !f.value?.trim());
    if (unlabelledValues.length > 0) {
      blockers.push(`${unlabelledValues.length} field(s) have no illustrative example value: ${unlabelledValues.map((f) => `"${f.label}"`).join(', ')}.`);
    }
  }
  return blockers;
}

function parseJsonMaybe<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToFramework(row: Record<string, unknown>): StrategyFrameworkRow {
  // A framework with a model has the model's own fields — in the model's order, under the model's names — whatever the
  // catalogue row says: the structure is managed in code so it can match the published model exactly.
  const model = getModelDefinition(row.tool_id as string);
  return {
    id: row.id as number,
    toolId: row.tool_id as string,
    name: row.name as string,
    layer: row.layer as FrameworkLayer,
    phaseStart: row.phase_start as number,
    phaseEnd: row.phase_end as number,
    nature: row.nature as FrameworkNature,
    does: (row.does as string) ?? '',
    whenToUse: (row.when_to_use as string) ?? '',
    whenNotToUse: (row.when_not_to_use as string) ?? '',
    evidenceRequirements: (row.evidence_requirements as string) ?? '',
    scoringGuidance: (row.scoring_guidance as string) ?? '',
    reportTemplate: (row.report_template as string) ?? '',
    nextStep: (row.next_step as string) ?? '',
    fields: model ? flattenStructure(model) : parseJsonMaybe<FrameworkField[]>(row.fields, []),
    hasModel: !!model,
    upstreamTools: parseJsonMaybe<string[]>(row.upstream_tools, []),
    downstreamTools: parseJsonMaybe<string[]>(row.downstream_tools, []),
    industryTemplates: parseJsonMaybe<unknown | null>(row.industry_templates, null),
    status: row.status as FrameworkStatus,
    audience: (row.audience as FrameworkAudience) ?? 'both',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listStrategyFrameworks(filters: ListFilters = {}): Promise<StrategyFrameworkSummary[]> {
  await ensureStrategyFrameworksTable();
  const clauses: string[] = [];
  const params: string[] = [];
  if (filters.layer) { clauses.push('layer = ?'); params.push(filters.layer); }
  if (filters.status) { clauses.push('status = ?'); params.push(filters.status); }
  if (filters.audience) { clauses.push('(audience = ? OR audience = "both")'); params.push(filters.audience); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT id, tool_id, name, layer, phase_start, phase_end, nature, status, audience, updated_at
     FROM strategy_frameworks ${where} ORDER BY layer ASC, phase_start ASC, name ASC`,
    params
  ) as [Record<string, unknown>[], unknown];
  return rows.map((row) => ({
    id: row.id as number,
    toolId: row.tool_id as string,
    name: row.name as string,
    layer: row.layer as FrameworkLayer,
    phaseStart: row.phase_start as number,
    phaseEnd: row.phase_end as number,
    nature: row.nature as FrameworkNature,
    status: row.status as FrameworkStatus,
    audience: (row.audience as FrameworkAudience) ?? 'both',
    updatedAt: String(row.updated_at),
  }));
}

export async function listStrategyFrameworksFull(filters: ListFilters = {}): Promise<StrategyFrameworkRow[]> {
  await ensureStrategyFrameworksTable();
  const clauses: string[] = [];
  const params: string[] = [];
  if (filters.layer) { clauses.push('layer = ?'); params.push(filters.layer); }
  if (filters.status) { clauses.push('status = ?'); params.push(filters.status); }
  if (filters.audience) { clauses.push('(audience = ? OR audience = "both")'); params.push(filters.audience); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM strategy_frameworks ${where} ORDER BY layer ASC, phase_start ASC, name ASC`,
    params
  ) as [Record<string, unknown>[], unknown];
  return rows.map(rowToFramework);
}

export async function getStrategyFrameworkByToolId(toolId: string): Promise<StrategyFrameworkRow | null> {
  await ensureStrategyFrameworksTable();
  const [rows] = await pool.query(
    'SELECT * FROM strategy_frameworks WHERE tool_id = ? LIMIT 1',
    [toolId]
  ) as [Record<string, unknown>[], unknown];
  if (!rows || rows.length === 0) return null;
  return rowToFramework(rows[0]);
}

/** Rejects (returns null) if `tool_id` already exists — this is a small,
 * shared, curated catalogue, not one admin's own siloed tool list, so an
 * accidental slug collision should surface as an error rather than
 * silently overwrite a published, in-use row. */
export async function createStrategyFramework(input: StrategyFrameworkInput): Promise<StrategyFrameworkRow | null> {
  await ensureStrategyFrameworksTable();
  const existing = await getStrategyFrameworkByToolId(input.toolId);
  if (existing) return null;
  await pool.query(
    `INSERT INTO strategy_frameworks (
      tool_id, name, layer, phase_start, phase_end, nature, does, when_to_use, when_not_to_use,
      evidence_requirements, scoring_guidance, report_template, next_step,
      fields, upstream_tools, downstream_tools, industry_templates, status, audience
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.toolId, input.name, input.layer, input.phaseStart, input.phaseEnd, input.nature,
      input.does, input.whenToUse, input.whenNotToUse ?? '',
      input.evidenceRequirements ?? '', input.scoringGuidance ?? '', input.reportTemplate ?? '', input.nextStep,
      JSON.stringify(input.fields), JSON.stringify(input.upstreamTools), JSON.stringify(input.downstreamTools),
      input.industryTemplates ? JSON.stringify(input.industryTemplates) : null,
      input.status, input.audience ?? 'both',
    ]
  );
  return getStrategyFrameworkByToolId(input.toolId);
}

/** `tool_id` itself is immutable once created (same UX as a tool slug
 * elsewhere in this app) — pass every other field via `input`. Note:
 * renaming a field's `label` here silently orphans any client's already-
 * saved strategy_fillins value for that field (fillins match by label, the
 * only id a field has) — it isn't deleted, just stops matching on restore
 * and falls back to this framework's own default value instead. */
export async function updateStrategyFramework(
  toolId: string,
  input: Partial<StrategyFrameworkInput>
): Promise<StrategyFrameworkRow | null> {
  await ensureStrategyFrameworksTable();
  const existing = await getStrategyFrameworkByToolId(toolId);
  if (!existing) return null;

  const merged: StrategyFrameworkInput = { ...existing, ...input };
  // The fields of a framework with a model are not editable: whatever was posted, the model's own are kept.
  const model = getModelDefinition(toolId);
  if (model) merged.fields = flattenStructure(model);
  await pool.query(
    `UPDATE strategy_frameworks SET
      name = ?, layer = ?, phase_start = ?, phase_end = ?, nature = ?,
      does = ?, when_to_use = ?, when_not_to_use = ?,
      evidence_requirements = ?, scoring_guidance = ?, report_template = ?, next_step = ?,
      fields = ?, upstream_tools = ?, downstream_tools = ?, industry_templates = ?, status = ?, audience = ?
     WHERE tool_id = ?`,
    [
      merged.name, merged.layer, merged.phaseStart, merged.phaseEnd, merged.nature,
      merged.does, merged.whenToUse, merged.whenNotToUse ?? '',
      merged.evidenceRequirements ?? '', merged.scoringGuidance ?? '', merged.reportTemplate ?? '', merged.nextStep,
      JSON.stringify(merged.fields), JSON.stringify(merged.upstreamTools), JSON.stringify(merged.downstreamTools),
      merged.industryTemplates ? JSON.stringify(merged.industryTemplates) : null,
      merged.status, merged.audience ?? 'both',
      toolId,
    ]
  );
  return getStrategyFrameworkByToolId(toolId);
}

/**
 * Hard delete. Unlike `tools.active`'s soft-flag convention, the catalogue
 * already has `status: 'deprecated'` as its soft-retire path — so a real
 * DELETE here means "this entry was a mistake and should leave the
 * catalogue entirely", which is exactly what an authoring workflow needs.
 * Any client's saved strategy_fillins rows for this tool_id are left in
 * place on purpose: `tool_id` is an unconstrained VARCHAR by design (see
 * this file's header and the submissions.tool_slug precedent), so a
 * client's own historical answers survive a catalogue correction rather
 * than being cascade-deleted out from under them.
 */
export async function deleteStrategyFramework(toolId: string): Promise<boolean> {
  await ensureStrategyFrameworksTable();
  const [result] = await pool.query(
    'DELETE FROM strategy_frameworks WHERE tool_id = ?',
    [toolId]
  ) as [{ affectedRows: number }, unknown];
  return result.affectedRows > 0;
}

/** Every framework's declared links, for building the two-way golden thread. */
export async function listLinkRows(): Promise<LinkRow[]> {
  await ensureStrategyFrameworksTable();
  const [rows] = await pool.query('SELECT tool_id, upstream_tools, downstream_tools FROM strategy_frameworks') as [Record<string, unknown>[], unknown];
  return rows.map((r) => ({
    toolId: r.tool_id as string,
    upstreamTools: parseJsonMaybe<string[]>(r.upstream_tools, []),
    downstreamTools: parseJsonMaybe<string[]>(r.downstream_tools, []),
  }));
}

/** The tools that feed this one and the tools it feeds, counting a link declared on either side. */
export async function getEffectiveLinks(toolId: string): Promise<Links> {
  return effectiveLinks(await listLinkRows()).get(toolId) ?? { upstream: [], downstream: [] };
}

