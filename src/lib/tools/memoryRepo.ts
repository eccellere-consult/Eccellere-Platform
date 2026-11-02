/** In-memory ToolsRepo. Used by the tests and by local trials with no database; behaves like the Prisma one. */
import type { FillinRow, FillinWrite, ItemRecord, JobRecord, ToolInput, ToolRecord, ToolsRepo } from './repo';

let counter = 0;
const nid = (p: string) => `${p}_${++counter}`;

export function createMemoryRepo(): ToolsRepo & { tools: Map<string, ToolRecord>; items: Map<string, ItemRecord> } {
  const tools = new Map<string, ToolRecord>();
  const fillins = new Map<string, FillinRow>();
  const jobs = new Map<string, JobRecord>();
  const items = new Map<string, ItemRecord>();
  const key = (u: string, t: string, c: number) => `${u}|${t}|${c}`;

  return {
    tools,
    items,
    async getToolBySlug(slug) { return tools.get(slug) ?? null; },
    async listTools(filter) {
      return [...tools.values()]
        .filter((t) => (!filter?.status || t.status === filter.status) && (!filter?.category || t.category === filter.category))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    },
    async saveTool(input: ToolInput) {
      const now = new Date();
      const prev = tools.get(input.slug);
      const rec: ToolRecord = {
        id: prev?.id ?? nid('tool'),
        slug: input.slug,
        name: input.name,
        category: input.category,
        groupName: input.groupName ?? prev?.groupName ?? null,
        status: input.status ?? prev?.status ?? 'DRAFT',
        source: input.source ?? prev?.source ?? 'ai',
        does: input.does ?? prev?.does ?? null,
        whenToUse: input.whenToUse ?? prev?.whenToUse ?? null,
        whenNotToUse: input.whenNotToUse ?? prev?.whenNotToUse ?? null,
        definition: input.definition,
        quality: input.quality ?? prev?.quality ?? null,
        provenance: input.provenance ?? prev?.provenance ?? null,
        reviewedById: prev?.reviewedById ?? null,
        reviewedAt: prev?.reviewedAt ?? null,
        publishedAt: prev?.publishedAt ?? null,
        sortOrder: input.sortOrder ?? prev?.sortOrder ?? 0,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };
      tools.set(rec.slug, rec);
      return rec;
    },
    async patchTool(slug, patch) {
      const t = tools.get(slug);
      if (!t) return null;
      const next = { ...t, ...patch, updatedAt: new Date() };
      tools.set(slug, next);
      return next;
    },
    async getFillinRow(u, t, c) { return fillins.get(key(u, t, c)) ?? null; },
    async listFillinRows(u) { return [...fillins.values()].filter((r) => r.userId === u); },
    async writeFillinRow(u, t, c, expectedVersion, data: FillinWrite) {
      const k = key(u, t, c);
      const cur = fillins.get(k);
      if (expectedVersion === null ? !!cur : !cur || cur.version !== expectedVersion) return null;
      const row: FillinRow = { id: cur?.id ?? nid('fill'), userId: u, toolSlug: t, caseId: c, ...data, updatedAt: new Date() };
      fillins.set(k, row);
      return row;
    },
    async createJob(createdById, label, list) {
      const job: JobRecord = { id: nid('job'), createdById, label, status: 'RUNNING', pauseReason: null, createdAt: new Date() };
      jobs.set(job.id, job);
      const made = list.map((e) => {
        const it: ItemRecord = { id: nid('item'), jobId: job.id, name: e.name, category: e.category, groupName: e.groupName, slug: e.slug, status: 'QUEUED', attempts: 0, claimedAt: null, error: null, toolId: null };
        items.set(it.id, it);
        return it;
      });
      return { job, items: made };
    },
    async getJob(jobId) {
      const job = jobs.get(jobId);
      return job ? { job, items: [...items.values()].filter((i) => i.jobId === jobId) } : null;
    },
    async setJob(jobId, patch) {
      const j = jobs.get(jobId);
      if (j) jobs.set(jobId, { ...j, ...patch, pauseReason: patch.pauseReason === undefined ? j.pauseReason : patch.pauseReason });
    },
    async claimNextItem(jobId, staleBefore) {
      const next = [...items.values()].find(
        (i) => i.jobId === jobId && (i.status === 'QUEUED' || (i.status === 'DRAFTING' && i.claimedAt !== null && i.claimedAt < staleBefore)),
      );
      if (!next) return null;
      const claimed = { ...next, status: 'DRAFTING' as const, claimedAt: new Date(), attempts: next.attempts + 1 };
      items.set(next.id, claimed);
      return claimed;
    },
    async patchItem(itemId, patch) {
      const i = items.get(itemId);
      if (i) items.set(itemId, { ...i, ...patch });
    },
  };
}
