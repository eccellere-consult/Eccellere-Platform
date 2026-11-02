/**
 * ToolsRepo on Prisma (MariaDB). The two places where two requests could collide are done as one conditional UPDATE:
 * claiming a name to draft, and saving a person's work against the version they last saw.
 */
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { FillinRow, FillinWrite, ItemRecord, JobRecord, QualityResult, ToolRecord, ToolsRepo } from './repo';

const json = (v: unknown) => v as Prisma.InputJsonValue;
const jsonOrNull = (v: unknown) => (v === null || v === undefined ? undefined : json(v));

type ToolRow = Awaited<ReturnType<typeof prisma.wsTool.findFirstOrThrow>>;
type FillinDb = Awaited<ReturnType<typeof prisma.wsFillin.findFirstOrThrow>>;
type ItemDb = Awaited<ReturnType<typeof prisma.wsImportItem.findFirstOrThrow>>;
type JobDb = Awaited<ReturnType<typeof prisma.wsImportJob.findFirstOrThrow>>;

const toTool = (r: ToolRow): ToolRecord => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category, groupName: r.groupName, practice: r.practice,
  status: r.status as ToolRecord['status'], source: r.source as ToolRecord['source'],
  does: r.does, whenToUse: r.whenToUse, whenNotToUse: r.whenNotToUse,
  definition: r.definition, quality: (r.quality as QualityResult | null) ?? null,
  provenance: (r.provenance as Record<string, unknown> | null) ?? null,
  reviewedById: r.reviewedById, reviewedAt: r.reviewedAt, publishedAt: r.publishedAt,
  sortOrder: r.sortOrder, createdAt: r.createdAt, updatedAt: r.updatedAt,
});

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const toFillin = (r: FillinDb): FillinRow => ({
  id: r.id, userId: r.userId, toolSlug: r.toolSlug, caseId: r.caseId,
  fields: arr(r.fields), recommendations: arr(r.recommendations), actionables: arr(r.actionables),
  analysis: (r.analysis as FillinRow['analysis']) ?? null,
  analysisFingerprint: r.analysisFingerprint, analysisAt: r.analysisAt,
  previousFields: Array.isArray(r.previousFields) ? (r.previousFields as unknown as FillinRow['previousFields']) : null,
  previousReason: (r.previousReason as FillinRow['previousReason']) ?? null,
  version: r.version, updatedAt: r.updatedAt,
});

const toItem = (r: ItemDb): ItemRecord => ({
  id: r.id, jobId: r.jobId, name: r.name, category: r.category, groupName: r.groupName, practice: r.practice, brief: r.brief, slug: r.slug,
  status: r.status as ItemRecord['status'], attempts: r.attempts, claimedAt: r.claimedAt, error: r.error, toolId: r.toolId,
});
const toJob = (r: JobDb): JobRecord => ({
  id: r.id, createdById: r.createdById, label: r.label, status: r.status as JobRecord['status'], pauseReason: r.pauseReason, createdAt: r.createdAt,
});

const fillinData = (d: FillinWrite) => ({
  fields: json(d.fields),
  recommendations: json(d.recommendations),
  actionables: json(d.actionables),
  analysis: d.analysis ? json(d.analysis) : undefined,
  analysisFingerprint: d.analysisFingerprint,
  analysisAt: d.analysisAt,
  previousFields: d.previousFields ? json(d.previousFields) : undefined,
  previousReason: d.previousReason,
  version: d.version,
});

export const prismaRepo: ToolsRepo = {
  async getToolBySlug(slug) {
    const r = await prisma.wsTool.findUnique({ where: { slug } });
    return r ? toTool(r) : null;
  },
  async listTools(filter) {
    const rows = await prisma.wsTool.findMany({
      where: { ...(filter?.status ? { status: filter.status } : {}), ...(filter?.category ? { category: filter.category } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toTool);
  },
  async saveTool(input) {
    const content = {
      name: input.name, category: input.category, groupName: input.groupName ?? undefined, practice: input.practice ?? undefined, definition: json(input.definition),
      does: input.does ?? undefined, whenToUse: input.whenToUse ?? undefined, whenNotToUse: input.whenNotToUse ?? undefined,
      quality: jsonOrNull(input.quality), provenance: jsonOrNull(input.provenance),
      ...(input.status ? { status: input.status } : {}), ...(input.source ? { source: input.source } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    const r = await prisma.wsTool.upsert({ where: { slug: input.slug }, create: { slug: input.slug, ...content }, update: content });
    return toTool(r);
  },
  async deleteTool(slug) {
    const res = await prisma.wsTool.deleteMany({ where: { slug } });
    return res.count > 0;
  },
  async countFillinsFor(toolSlug) {
    return prisma.wsFillin.count({ where: { toolSlug } });
  },
  async patchTool(slug, patch) {
    try {
      const r = await prisma.wsTool.update({
        where: { slug },
        data: { ...patch, quality: patch.quality === undefined ? undefined : patch.quality === null ? undefined : json(patch.quality) },
      });
      return toTool(r);
    } catch {
      return null; // no such slug
    }
  },

  async getFillinRow(userId, toolSlug, caseId) {
    const r = await prisma.wsFillin.findUnique({ where: { userId_toolSlug_caseId: { userId, toolSlug, caseId } } });
    return r ? toFillin(r) : null;
  },
  async listFillinRows(userId) {
    return (await prisma.wsFillin.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })).map(toFillin);
  },
  async writeFillinRow(userId, toolSlug, caseId, expectedVersion, data) {
    const where = { userId_toolSlug_caseId: { userId, toolSlug, caseId } };
    if (expectedVersion === null) {
      try {
        const r = await prisma.wsFillin.create({ data: { userId, toolSlug, caseId, ...fillinData(data) } });
        return toFillin(r);
      } catch {
        return null; // someone else created it first (unique key), so the caller reports a conflict
      }
    }
    // One conditional UPDATE: succeeds only if nobody saved since the version this person saw.
    const res = await prisma.wsFillin.updateMany({
      where: { userId, toolSlug, caseId, version: expectedVersion },
      data: {
        ...fillinData(data),
        // updateMany cannot "unset" a JSON column by passing undefined, so null the optional ones explicitly
        analysis: data.analysis ? json(data.analysis) : (null as unknown as undefined),
        previousFields: data.previousFields ? json(data.previousFields) : (null as unknown as undefined),
      },
    });
    if (res.count !== 1) return null;
    const r = await prisma.wsFillin.findUnique({ where });
    return r ? toFillin(r) : null;
  },

  async createJob(createdById, label, list) {
    const job = await prisma.wsImportJob.create({ data: { createdById, label } });
    await prisma.wsImportItem.createMany({ data: list.map((e) => ({ jobId: job.id, name: e.name, category: e.category, groupName: e.groupName, practice: e.practice, brief: e.brief ?? null, slug: e.slug })) });
    const items = await prisma.wsImportItem.findMany({ where: { jobId: job.id }, orderBy: { createdAt: 'asc' } });
    return { job: toJob(job), items: items.map(toItem) };
  },
  async getJob(jobId) {
    const job = await prisma.wsImportJob.findUnique({ where: { id: jobId }, include: { items: { orderBy: { createdAt: 'asc' } } } });
    return job ? { job: toJob(job), items: job.items.map(toItem) } : null;
  },
  async setJob(jobId, patch) {
    await prisma.wsImportJob.update({ where: { id: jobId }, data: patch });
  },
  async claimNextItem(jobId, staleBefore) {
    // Look at a few candidates and try to claim each with a conditional UPDATE; the first one we win is ours.
    const candidates = await prisma.wsImportItem.findMany({
      where: { jobId, OR: [{ status: 'QUEUED' }, { status: 'DRAFTING', claimedAt: { lt: staleBefore } }] },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });
    for (const c of candidates) {
      const res = await prisma.wsImportItem.updateMany({
        where: { id: c.id, status: c.status, attempts: c.attempts },
        data: { status: 'DRAFTING', claimedAt: new Date(), attempts: c.attempts + 1 },
      });
      if (res.count === 1) {
        const fresh = await prisma.wsImportItem.findUnique({ where: { id: c.id } });
        return fresh ? toItem(fresh) : null;
      }
    }
    return null;
  },
  async deleteItem(itemId) {
    await prisma.wsImportItem.deleteMany({ where: { id: itemId } });
  },
  async deleteJob(jobId) {
    await prisma.wsImportJob.deleteMany({ where: { id: jobId } }); // the names in it go with it (cascade)
  },
  async patchItem(itemId, patch) {
    await prisma.wsImportItem.update({ where: { id: itemId }, data: patch });
  },
};
