/**
 * Tools marketplace rules, independent of the database (see repo.ts). Everything a person can break is decided here:
 * what a pasted list means, that one name is drafted by one request at a time, that a draft never reaches clients
 * without a person marking it reviewed, and that two browser tabs cannot silently overwrite each other's work.
 */
import { EMPTY_RECORD, fingerprintFields, type FieldChangeReason, type FillinRecord, type StrategyAnalysis } from '@/lib/strategyFillinTypes';
import type { FrameworkField } from '@/lib/strategyFrameworks';
import type { FillinRow, ItemRecord, ToolInput, ToolRecord, ToolsRepo } from './repo';

/** A drafting request that has not finished within this long is treated as dead and its name is offered again. */
export const STALE_DRAFT_MS = 3 * 60 * 1000;
export const MAX_NAME_LENGTH = 80;
export const MAX_LIST_ITEMS = 300;
/** Rough time for one AI draft; used only for the estimate shown before a run. */
export const SECONDS_PER_DRAFT = 40;
export const CONCURRENCY = 3;

// ── The pasted list ──────────────────────────────────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, (m) => ` ${m.slice(1, -1)} `)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** The marketplace sections a tool can sit in. The admin picks one from a drop-down; this is the order they are shown in. */
export const MARKET_CATEGORIES = ['Problem solving', 'Business analysis', 'Strategy', 'Project Management', 'Change Management', 'Decision Models', 'Others'] as const;
export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export const asMarketCategory = (x: string): MarketCategory | null =>
  MARKET_CATEGORIES.find((c) => c.toLowerCase() === x.trim().toLowerCase()) ?? null;

/** Where a list heading such as "Root cause" belongs when the admin lets the list decide ('Auto'). */
export function suggestCategory(group: string): MarketCategory {
  const g = group.toLowerCase();
  if (!g) return 'Others';
  if (/change|adoption|stakeholder/.test(g)) return 'Change Management';
  if (/decision/.test(g)) return 'Decision Models';
  if (/strateg|alignment/.test(g)) return 'Strategy';
  if (/project|performance/.test(g)) return 'Project Management';
  if (/(root cause|creative|problem|process improvement)/.test(g)) return 'Problem solving';
  if (/(risk|quality|monitor|financ|analy)/.test(g)) return 'Business analysis';
  return 'Others';
}

export interface ListEntry { name: string; category: MarketCategory; groupName: string | null; slug: string }
export interface ParsedList {
  entries: ListEntry[];
  /** lines that were not a tool (too long, or empty after cleaning), shown back so nothing vanishes silently */
  skipped: { line: string; reason: string }[];
  /** names repeated inside the pasted text (kept once) */
  duplicates: string[];
}

/**
 * One tool per line, `Name` or `Name | Group`. A line starting with `#` sets the group for the lines under it, so a grouped list can be
 * pasted as it is. The marketplace category is the one chosen in the drop-down, or, for 'Auto', worked out from the group; a line that ends
 * `| Strategy` (any marketplace category) overrides both. Bullets and trailing `*` / `~` marks are ignored. Prose lines are skipped and reported.
 */
export function parseToolList(text: string, chosen: MarketCategory | 'Auto' = 'Auto'): ParsedList {
  const entries: ListEntry[] = [];
  const skipped: ParsedList['skipped'] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  let current = '';
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) {
      const heading = line.replace(/^#{1,6}\s+/, '').trim();
      if (/^notes?\b/i.test(heading)) break; // a "Notes" section ends the list
      if (heading) current = heading;
      continue;
    }
    line = line.replace(/^[-•·]\s+/, '').replace(/^\d+[.)]\s+/, '');
    const [namePart, ...rest] = line.split('|');
    const name = namePart.replace(/[*~]+\s*$/, '').trim();
    const tag = rest.join('|').trim();
    // A tag after | that names a marketplace category wins; any other tag is a sub-group.
    const tagCategory = tag ? asMarketCategory(tag) : null;
    const groupName = (tagCategory ? current : tag || current) || null;
    const category: MarketCategory = tagCategory ?? (chosen === 'Auto' ? suggestCategory(current || groupName || '') : chosen);
    if (!name) { skipped.push({ line: raw.trim(), reason: 'No name on this line.' }); continue; }
    if (/[`]|[.;,]$/.test(name)) { skipped.push({ line: raw.trim().slice(0, 120), reason: 'Looks like a sentence or a note, not a tool name.' }); continue; }
    if (name.length > MAX_NAME_LENGTH) { skipped.push({ line: raw.trim().slice(0, 120), reason: `Longer than ${MAX_NAME_LENGTH} characters, so it looks like a sentence, not a tool name.` }); continue; }
    const slug = slugify(name);
    if (!slug) { skipped.push({ line: raw.trim(), reason: 'The name has no letters or numbers.' }); continue; }
    if (seen.has(slug)) { duplicates.push(name); continue; }
    seen.add(slug);
    entries.push({ name, category, groupName, slug });
  }
  if (entries.length > MAX_LIST_ITEMS) {
    for (const e of entries.splice(MAX_LIST_ITEMS)) skipped.push({ line: e.name, reason: `Over the limit of ${MAX_LIST_ITEMS} per run. Paste the rest in a second run.` });
  }
  return { entries, skipped, duplicates };
}

/** The cost line shown before drafting starts. One call per tool normally; a retry after a cut-off answer makes it up to two. */
export function estimateRun(count: number) {
  return {
    count,
    callsMin: count,
    callsMax: count * 2,
    minutes: Math.max(1, Math.ceil((count * SECONDS_PER_DRAFT) / CONCURRENCY / 60)),
  };
}

// ── Batch drafting ───────────────────────────────────────────────────────────────────────────────────────────────

export interface StartedImport {
  jobId: string;
  queued: number;
  alreadyInCatalogue: string[];
  skipped: ParsedList['skipped'];
  duplicates: string[];
}

/** The value of the category drop-down: one of the seven, or "Auto" to let the list's own headings decide. */
export function asChoice(x: unknown): MarketCategory | 'Auto' {
  if (typeof x !== 'string' || x.trim().toLowerCase() === 'auto' || !x.trim()) return 'Auto';
  const c = asMarketCategory(x);
  if (!c) throw new ToolsError('BAD_CATEGORY', `"${x}" is not one of the categories: ${MARKET_CATEGORIES.join(', ')}.`);
  return c;
}

/** What a pasted or uploaded list would do, without writing anything: shown to the admin before drafting starts. */
export async function previewImport(repo: ToolsRepo, text: string, choice: MarketCategory | 'Auto') {
  const parsed = parseToolList(text, choice);
  const alreadyInCatalogue: string[] = [];
  const fresh: ListEntry[] = [];
  for (const e of parsed.entries) {
    if (await repo.getToolBySlug(e.slug)) alreadyInCatalogue.push(e.name);
    else fresh.push(e);
  }
  const byCategory: Record<string, number> = {};
  for (const e of fresh) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
  return { entries: fresh, alreadyInCatalogue, skipped: parsed.skipped, duplicates: parsed.duplicates, byCategory, estimate: estimateRun(fresh.length) };
}

export async function startImport(repo: ToolsRepo, adminId: string, text: string, choice: MarketCategory | 'Auto' = 'Auto', label?: string): Promise<StartedImport> {
  const parsed = parseToolList(text, choice);
  const alreadyInCatalogue: string[] = [];
  const fresh: ListEntry[] = [];
  for (const e of parsed.entries) {
    if (await repo.getToolBySlug(e.slug)) alreadyInCatalogue.push(e.name);
    else fresh.push(e);
  }
  if (fresh.length === 0) throw new ToolsError('NOTHING_TO_DRAFT', 'There is no new tool name in that list. Check the lines below, or the names may already be in the catalogue.');
  const { job, items } = await repo.createJob(adminId, label?.trim() || `Run of ${fresh.length} tools`, fresh);
  return { jobId: job.id, queued: items.length, alreadyInCatalogue, skipped: parsed.skipped, duplicates: parsed.duplicates };
}

/** What the AI step reports back for one name. */
export type DraftOutcome =
  | { kind: 'ok'; tool: ToolInput }
  | { kind: 'ai_down'; reason: string } // no provider answered: stop the whole run, nothing is the tool's fault
  | { kind: 'failed'; reason: string }; // this one name could not be drafted

export type DrafterFn = (item: Pick<ItemRecord, 'name' | 'category' | 'groupName' | 'slug'>) => Promise<DraftOutcome>;

export type DraftStep =
  | { kind: 'idle'; reason: 'no_more_items' | 'job_paused' }
  | { kind: 'drafted'; item: ItemRecord; toolStatus: ToolRecord['status'] }
  | { kind: 'failed'; item: ItemRecord; reason: string }
  | { kind: 'paused'; reason: string };

/**
 * Draft ONE name. The browser calls this in a loop (three at a time). The claim is atomic, so two requests can never
 * draft the same name; a request that died leaves its name locked only for STALE_DRAFT_MS.
 */
export async function draftNext(repo: ToolsRepo, jobId: string, draft: DrafterFn, now: () => Date = () => new Date()): Promise<DraftStep> {
  const found = await repo.getJob(jobId);
  if (!found) throw new ToolsError('JOB_NOT_FOUND', 'That run was not found.');
  if (found.job.status === 'PAUSED') return { kind: 'idle', reason: 'job_paused' };
  const item = await repo.claimNextItem(jobId, new Date(now().getTime() - STALE_DRAFT_MS));
  if (!item) {
    const open = (await repo.getJob(jobId))!.items.some((i) => i.status === 'DRAFTING');
    if (!open) await repo.setJob(jobId, { status: 'DONE' });
    return { kind: 'idle', reason: 'no_more_items' };
  }
  let outcome: DraftOutcome;
  try {
    outcome = await draft({ name: item.name, category: item.category, groupName: item.groupName, slug: item.slug });
  } catch (e) {
    outcome = { kind: 'failed', reason: e instanceof Error ? e.message.slice(0, 300) : 'Unexpected error while drafting.' };
  }
  if (outcome.kind === 'ai_down') {
    await repo.patchItem(item.id, { status: 'QUEUED', error: null, attempts: item.attempts });
    await repo.setJob(jobId, { status: 'PAUSED', pauseReason: outcome.reason });
    return { kind: 'paused', reason: outcome.reason };
  }
  if (outcome.kind === 'failed') {
    await repo.patchItem(item.id, { status: 'FAILED', error: outcome.reason });
    return { kind: 'failed', item: { ...item, status: 'FAILED', error: outcome.reason }, reason: outcome.reason };
  }
  const hasErrors = (outcome.tool.quality?.errors.length ?? 0) > 0;
  const status = hasErrors ? 'NEEDS_REVIEW' : 'DRAFT';
  const saved = await repo.saveTool({ ...outcome.tool, status, source: outcome.tool.source ?? 'ai' });
  await repo.patchItem(item.id, { status, error: null, toolId: saved.id });
  return { kind: 'drafted', item: { ...item, status, toolId: saved.id }, toolStatus: status };
}

export async function resumeJob(repo: ToolsRepo, jobId: string) {
  await repo.setJob(jobId, { status: 'RUNNING', pauseReason: null });
}

/** Put FAILED names back in the queue (and unpause the run). */
export async function retryFailed(repo: ToolsRepo, jobId: string): Promise<number> {
  const found = await repo.getJob(jobId);
  if (!found) throw new ToolsError('JOB_NOT_FOUND', 'That run was not found.');
  const failed = found.items.filter((i) => i.status === 'FAILED');
  for (const i of failed) await repo.patchItem(i.id, { status: 'QUEUED', error: null, attempts: i.attempts + 1 });
  if (failed.length) await repo.setJob(jobId, { status: 'RUNNING', pauseReason: null });
  return failed.length;
}

// ── Review and publish ───────────────────────────────────────────────────────────────────────────────────────────

export class ToolsError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = 'ToolsError'; }
}

/** The person ticks "Looks right". A draft the quality gate still has errors on cannot be marked reviewed. */
export async function markReviewed(repo: ToolsRepo, slug: string, reviewerId: string, now: () => Date = () => new Date()): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED' || tool.status === 'ARCHIVED') throw new ToolsError('WRONG_STATE', 'This tool is already live or archived.');
  const errors = tool.quality?.errors ?? [];
  if (!tool.quality) throw new ToolsError('NOT_CHECKED', 'This draft has not been through the quality check yet.');
  if (errors.length) throw new ToolsError('QUALITY_ERRORS', `Fix these first: ${errors.join(' ')}`);
  const updated = await repo.patchTool(slug, { status: 'REVIEWED', reviewedById: reviewerId, reviewedAt: now() });
  return updated!;
}

/** Editing a reviewed tool sends it back to review: what was approved is no longer what is on screen. */
export async function recordEdit(repo: ToolsRepo, slug: string, quality: { errors: string[]; warnings: string[] }): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  const status = tool.status === 'PUBLISHED' ? 'PUBLISHED' : quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT';
  const patch: Parameters<ToolsRepo['patchTool']>[1] = { status, quality };
  if (tool.status !== 'PUBLISHED') { patch.reviewedById = null; patch.reviewedAt = null; }
  return (await repo.patchTool(slug, patch))!;
}

export async function publishTool(repo: ToolsRepo, slug: string, now: () => Date = () => new Date()): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') return tool;
  if (tool.status !== 'REVIEWED' || !tool.reviewedById) throw new ToolsError('NOT_REVIEWED', 'A person must tick "Looks right" before this tool goes live.');
  if ((tool.quality?.errors.length ?? 1) > 0) throw new ToolsError('QUALITY_ERRORS', 'The quality check still has errors on this tool.');
  return (await repo.patchTool(slug, { status: 'PUBLISHED', publishedAt: now() }))!;
}

export async function unpublishTool(repo: ToolsRepo, slug: string): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  return (await repo.patchTool(slug, { status: 'ARCHIVED' }))!;
}

/** What a signed-in visitor may open. Only published tools; a draft is "not found", never a hint that it exists. */
export async function getPublishedTool(repo: ToolsRepo, slug: string): Promise<ToolRecord | null> {
  const tool = await repo.getToolBySlug(slug);
  return tool && tool.status === 'PUBLISHED' ? tool : null;
}

// ── A person's work in a tool ────────────────────────────────────────────────────────────────────────────────────

export type SavedFillin = FillinRecord & { version: number };

export class VersionConflict extends ToolsError {
  constructor(public current: SavedFillin) {
    super('VERSION_CONFLICT', 'This was changed in another tab or window. Reload to see the latest, then make your change again.');
  }
}

const toRecord = (row: FillinRow): SavedFillin => ({
  fields: row.fields,
  recommendations: row.recommendations,
  actionables: row.actionables,
  analysis: row.analysis,
  analysisFingerprint: row.analysisFingerprint,
  analysisAt: row.analysisAt ? row.analysisAt.toISOString() : null,
  previousFields: row.previousFields && row.previousFields.length ? row.previousFields : null,
  previousReason: row.previousFields && row.previousFields.length ? row.previousReason : null,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

export async function getFillin(repo: ToolsRepo, userId: string, toolSlug: string, caseId = 0): Promise<SavedFillin | null> {
  const row = await repo.getFillinRow(userId, toolSlug, caseId);
  return row ? toRecord(row) : null;
}

export async function listFillins(repo: ToolsRepo, userId: string): Promise<(SavedFillin & { toolSlug: string; caseId: number })[]> {
  return (await repo.listFillinRows(userId)).map((r) => ({ toolSlug: r.toolSlug, caseId: r.caseId, ...toRecord(r) }));
}

export interface SaveOptions {
  /** The version the browser last saw. Omit only for the very first save; a mismatch raises VersionConflict. */
  expectedVersion?: number | null;
  /** Set when `fields` changed in bulk (an AI fill, a template, an import): the previous fields are kept once for undo. */
  snapshotReason?: FieldChangeReason;
  caseId?: number;
}

const sameFields = (a: readonly FrameworkField[], b: readonly FrameworkField[]) =>
  JSON.stringify(a.map((f) => [f.label, f.value])) === JSON.stringify(b.map((f) => [f.label, f.value]));

/**
 * Partial save: only the keys given change; a saved analysis is not wiped by editing fields, and the other way round.
 * The analysis carries the fingerprint of the fields it was written from, so later edits show it as out of date.
 */
export async function saveFillin(
  repo: ToolsRepo,
  userId: string,
  toolSlug: string,
  updates: Partial<Pick<FillinRecord, 'fields' | 'recommendations' | 'actionables'>> & { analysis?: StrategyAnalysis | null },
  opts: SaveOptions = {},
  now: () => Date = () => new Date(),
): Promise<SavedFillin> {
  const caseId = opts.caseId ?? 0;
  const row = await repo.getFillinRow(userId, toolSlug, caseId);
  const existing = row ? toRecord(row) : { ...EMPTY_RECORD, version: 0 };
  if (row && opts.expectedVersion != null && opts.expectedVersion !== row.version) throw new VersionConflict(existing);
  if (!row && opts.expectedVersion != null && opts.expectedVersion !== 0) throw new VersionConflict({ ...EMPTY_RECORD, version: 0 });

  const fields = updates.fields ?? existing.fields;
  const fieldsChanged = updates.fields !== undefined && !sameFields(updates.fields, existing.fields);
  let previousFields = existing.previousFields;
  let previousReason = existing.previousReason;
  if (fieldsChanged) {
    if (opts.snapshotReason && existing.fields.some((f) => (f.value ?? '').trim())) {
      previousFields = existing.fields;
      previousReason = opts.snapshotReason;
    } else if (!opts.snapshotReason) {
      previousFields = null; // a manual edit after an AI fill means it was accepted; undo no longer applies
      previousReason = null;
    }
  }
  const analysisGiven = updates.analysis !== undefined;
  const analysis = analysisGiven ? updates.analysis ?? null : existing.analysis;
  const written = await repo.writeFillinRow(userId, toolSlug, caseId, row ? row.version : null, {
    fields,
    recommendations: updates.recommendations ?? existing.recommendations,
    actionables: updates.actionables ?? existing.actionables,
    analysis,
    analysisFingerprint: analysisGiven ? (analysis ? fingerprintFields(fields) : null) : existing.analysisFingerprint,
    analysisAt: analysisGiven ? (analysis ? now() : null) : existing.analysisAt ? new Date(existing.analysisAt) : null,
    previousFields,
    previousReason,
    version: (row ? row.version : 0) + 1,
  });
  if (!written) {
    const latest = await repo.getFillinRow(userId, toolSlug, caseId);
    throw new VersionConflict(latest ? toRecord(latest) : { ...EMPTY_RECORD, version: 0 });
  }
  return toRecord(written);
}

/** Puts the fields back as they were before the last AI fill / import. Null when there is nothing to undo. */
export async function undoFieldChange(repo: ToolsRepo, userId: string, toolSlug: string, caseId = 0): Promise<SavedFillin | null> {
  const row = await repo.getFillinRow(userId, toolSlug, caseId);
  if (!row?.previousFields?.length) return null;
  const written = await repo.writeFillinRow(userId, toolSlug, caseId, row.version, {
    fields: row.previousFields,
    recommendations: row.recommendations,
    actionables: row.actionables,
    analysis: row.analysis,
    analysisFingerprint: row.analysisFingerprint,
    analysisAt: row.analysisAt,
    previousFields: null,
    previousReason: null,
    version: row.version + 1,
  });
  if (!written) {
    const latest = await repo.getFillinRow(userId, toolSlug, caseId);
    throw new VersionConflict(latest ? toRecord(latest) : { ...EMPTY_RECORD, version: 0 });
  }
  return toRecord(written);
}

/** Move a tool to another marketplace section (the admin drop-down). Allowed at any status; a live tool simply appears in its new section. */
export async function setToolCategory(repo: ToolsRepo, slug: string, category: string): Promise<ToolRecord> {
  const c = asMarketCategory(category);
  if (!c) throw new ToolsError('BAD_CATEGORY', `"${category}" is not one of the categories: ${MARKET_CATEGORIES.join(', ')}.`);
  const updated = await repo.patchTool(slug, { category: c });
  if (!updated) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  return updated;
}
