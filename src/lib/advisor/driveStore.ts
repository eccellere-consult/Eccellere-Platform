/** The database side of the Drive library: what sync reads and writes. */
import { prisma } from "@/lib/prisma";
import type { SyncRepo } from "./sync";
import type { FileStatus } from "./ingest";

export const driveRepo: SyncRepo = {
  async stored() {
    const rows = await prisma.advFile.findMany({ select: { driveId: true, version: true, status: true } });
    return rows.map((r) => ({ driveId: r.driveId, version: r.version, status: r.status as FileStatus }));
  },

  async save(f) {
    const file = await prisma.advFile.upsert({
      where: { driveId: f.driveId },
      create: { driveId: f.driveId, name: f.name, mime: f.mime, version: f.version, title: f.title, status: f.status, reason: f.reason, redactions: f.redactions },
      update: { name: f.name, mime: f.mime, version: f.version, title: f.title, status: f.status, reason: f.reason, redactions: f.redactions, syncedAt: new Date() },
    });
    await prisma.advChunk.deleteMany({ where: { fileId: file.id } });
    if (f.chunks.length) await prisma.advChunk.createMany({ data: f.chunks.map((text, seq) => ({ fileId: file.id, seq, text })) });
  },

  async remove(driveIds) {
    const files = await prisma.advFile.findMany({ where: { driveId: { in: driveIds } }, select: { id: true } });
    await prisma.advChunk.deleteMany({ where: { fileId: { in: files.map((f) => f.id) } } });
    await prisma.advFile.updateMany({ where: { driveId: { in: driveIds } }, data: { status: "REMOVED", reason: "No longer in the approved folders; its text was deleted." } });
  },
};
