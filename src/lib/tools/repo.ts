/**
 * Storage contract for the Tools marketplace. The business rules (version checks, one-at-a-time drafting, the publish
 * gate) live in service.ts and only talk to this interface, so they are tested against the in-memory copy and run
 * against Prisma in production (prismaRepo.ts).
 */
import type { FieldChangeReason, StrategyActionable, StrategyAnalysis, StrategyRecommendation } from '@/lib/strategyFillinTypes';
import type { FrameworkField } from '@/lib/strategyFrameworks';

export type ToolStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED';
export type ItemStatus = 'QUEUED' | 'DRAFTING' | 'DRAFT' | 'NEEDS_REVIEW' | 'FAILED' | 'REVIEWED' | 'PUBLISHED';
export type JobStatus = 'RUNNING' | 'PAUSED' | 'DONE';

export interface QualityResult {
  errors: string[];
  warnings: string[];
  /** the Eccellere Standards of Depth and Quality score for the tool (see standards.ts) */
  standards?: { score: number; level: string; band: string };
}

export interface ToolRecord {
  id: string;
  slug: string;
  name: string;
  category: string;
  groupName: string | null;
  practice: string | null;
  status: ToolStatus;
  source: 'ai' | 'hand' | 'strategy-hub';
  does: string | null;
  whenToUse: string | null;
  whenNotToUse: string | null;
  definition: unknown;
  quality: QualityResult | null;
  provenance: Record<string, unknown> | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
export type ToolInput = Pick<ToolRecord, 'slug' | 'name' | 'category' | 'definition'> &
  Partial<Pick<ToolRecord, 'groupName' | 'practice' | 'status' | 'source' | 'does' | 'whenToUse' | 'whenNotToUse' | 'quality' | 'provenance' | 'sortOrder'>>;

export interface FillinRow {
  id: string;
  userId: string;
  toolSlug: string;
  caseId: number;
  fields: FrameworkField[];
  recommendations: StrategyRecommendation[];
  actionables: StrategyActionable[];
  analysis: StrategyAnalysis | null;
  analysisFingerprint: string | null;
  analysisAt: Date | null;
  previousFields: FrameworkField[] | null;
  previousReason: FieldChangeReason | null;
  version: number;
  updatedAt: Date;
}
export type FillinWrite = Omit<FillinRow, 'id' | 'userId' | 'toolSlug' | 'caseId' | 'updatedAt'>;

export interface JobRecord { id: string; createdById: string; label: string; status: JobStatus; pauseReason: string | null; createdAt: Date }
export interface ItemRecord {
  id: string;
  jobId: string;
  name: string;
  category: string;
  groupName: string | null;
  practice: string | null;
  brief: string | null;
  slug: string;
  status: ItemStatus;
  attempts: number;
  claimedAt: Date | null;
  error: string | null;
  toolId: string | null;
}

export interface ToolsRepo {
  // catalogue
  getToolBySlug(slug: string): Promise<ToolRecord | null>;
  listTools(filter?: { status?: ToolStatus; category?: string }): Promise<ToolRecord[]>;
  /** Creates the tool, or replaces its content if the slug exists. Never touches review/publish fields on replace. */
  saveTool(input: ToolInput): Promise<ToolRecord>;
  patchTool(slug: string, patch: Partial<Pick<ToolRecord, 'category' | 'groupName' | 'practice' | 'status' | 'reviewedById' | 'reviewedAt' | 'publishedAt' | 'quality' | 'sortOrder'>>): Promise<ToolRecord | null>;
  /** Permanently removes a tool row. People's saved work in it is not touched (the service refuses when any exists). */
  deleteTool(slug: string): Promise<boolean>;
  /** How many people have saved work in this tool. */
  countFillinsFor(toolSlug: string): Promise<number>;
  // people's work
  getFillinRow(userId: string, toolSlug: string, caseId: number): Promise<FillinRow | null>;
  listFillinRows(userId: string): Promise<FillinRow[]>;
  /** Insert (when `expectedVersion` is null) or update only if the stored version still equals `expectedVersion`. Returns the row, or null when the version moved. */
  writeFillinRow(userId: string, toolSlug: string, caseId: number, expectedVersion: number | null, data: FillinWrite): Promise<FillinRow | null>;
  // batch drafting
  createJob(createdById: string, label: string, items: { name: string; category: string; groupName: string | null; practice: string | null; brief?: string | null; slug: string }[]): Promise<{ job: JobRecord; items: ItemRecord[] }>;
  getJob(jobId: string): Promise<{ job: JobRecord; items: ItemRecord[] } | null>;
  setJob(jobId: string, patch: { status?: JobStatus; pauseReason?: string | null }): Promise<void>;
  /** Atomically move ONE queued item (or one whose drafting started before `staleBefore`) to DRAFTING. Null when nothing is available. */
  claimNextItem(jobId: string, staleBefore: Date): Promise<ItemRecord | null>;
  /** Remove one name from a run (and nothing else). */
  deleteItem(itemId: string): Promise<void>;
  /** Remove a whole run and the names in it. Tools already drafted from it are kept. */
  deleteJob(jobId: string): Promise<void>;
  patchItem(itemId: string, patch: Partial<Pick<ItemRecord, 'status' | 'error' | 'toolId' | 'attempts'>>): Promise<void>;
}
