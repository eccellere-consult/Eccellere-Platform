import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { isEmptyEdit, type AgentEdit, type AgentEditRepo, type SavedEdit } from './overrides';

const strs = (v: unknown): string[] | null => (Array.isArray(v) && v.length ? v.map(String) : null);
const toEdit = (r: { slug: string; does: string | null; suppliers: unknown; process: unknown; customers: unknown; refresh: string | null }): AgentEdit => ({
  slug: r.slug, does: r.does, suppliers: strs(r.suppliers), process: strs(r.process), customers: strs(r.customers), refresh: r.refresh,
});
const jsonOrDbNull = (v: string[] | null | undefined) => (v?.length ? (v as Prisma.InputJsonValue) : Prisma.DbNull);

export const prismaEditRepo: AgentEditRepo = {
  async all() {
    const rows = await prisma.wsAgentEdit.findMany();
    return rows.map((r): SavedEdit => ({ ...toEdit(r), version: r.version, updatedBy: r.updatedBy, updatedAt: r.updatedAt }));
  },
  async get(slug) {
    const r = await prisma.wsAgentEdit.findUnique({ where: { slug } });
    return r ? { ...toEdit(r), version: r.version, updatedBy: r.updatedBy, updatedAt: r.updatedAt } : null;
  },
  async save(slug, edit, by) {
    const last = await prisma.wsAgentEditLog.findFirst({ where: { slug }, orderBy: { version: 'desc' }, select: { version: true } });
    const version = (last?.version ?? 0) + 1;
    const keep = edit && !isEmptyEdit(edit) ? edit : null;
    if (keep) {
      const data = {
        version, does: keep.does ?? null, refresh: keep.refresh ?? null, updatedBy: by,
        suppliers: jsonOrDbNull(keep.suppliers), process: jsonOrDbNull(keep.process), customers: jsonOrDbNull(keep.customers),
      };
      await prisma.wsAgentEdit.upsert({ where: { slug }, create: { slug, ...data }, update: data });
    } else {
      await prisma.wsAgentEdit.deleteMany({ where: { slug } });
    }
    await prisma.wsAgentEditLog.create({ data: { slug, version, editedBy: by, snapshot: keep ? (keep as unknown as Prisma.InputJsonValue) : Prisma.DbNull } });
    return version;
  },
  async history(slug, limit = 20) {
    const rows = await prisma.wsAgentEditLog.findMany({ where: { slug }, orderBy: { version: 'desc' }, take: limit });
    return rows.map((r) => ({ version: r.version, editedBy: r.editedBy, createdAt: r.createdAt, snapshot: (r.snapshot as AgentEdit | null) ?? null }));
  },
};
