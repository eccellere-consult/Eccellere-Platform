/**
 * Keeping the Advisor's library in step with the approved Drive folders. Dependencies are passed in so this can be tested without
 * Google or a database. A run is bounded (a few files at a time) so it finishes inside a web request; run it again to continue.
 */
import type { DriveClient, DriveFile } from "./drive";
import { supported } from "./drive";
import { screenDocument, type FileStatus } from "./ingest";

export interface StoredFile { driveId: string; version: string; status: FileStatus }
export interface FileWrite { driveId: string; name: string; mime: string; version: string; title: string; status: FileStatus; reason: string; redactions: number; chunks: string[] }
export interface SyncRepo {
  stored(): Promise<StoredFile[]>;
  save(f: FileWrite): Promise<void>;
  /** Files that are no longer in the approved folders: their text is deleted at once. */
  remove(driveIds: string[]): Promise<void>;
}
export interface SyncResult { seen: number; added: number; updated: number; unchanged: number; quarantined: number; published: number; skipped: number; failed: number; removed: number; remaining: number; errors: string[] }

export const versionOf = (f: DriveFile) => `${f.modifiedTime}|${f.md5 ?? ""}`;

export async function syncDrive(a: { drive: DriveClient; repo: SyncRepo; folderIds: string[]; protectedNames: readonly string[]; autoPublishClean: boolean; maxFiles?: number }): Promise<SyncResult> {
  const r: SyncResult = { seen: 0, added: 0, updated: 0, unchanged: 0, quarantined: 0, published: 0, skipped: 0, failed: 0, removed: 0, remaining: 0, errors: [] };
  const listed = await a.drive.listFiles(a.folderIds);
  r.seen = listed.length;
  const stored = new Map((await a.repo.stored()).map((s) => [s.driveId, s]));

  // Anything stored that is no longer listed (deleted, moved out, or access withdrawn) stops being retrievable immediately.
  const live = new Set(listed.map((f) => f.id));
  const gone = [...stored.values()].filter((s) => s.status !== "REMOVED" && !live.has(s.driveId)).map((s) => s.driveId);
  if (gone.length) { await a.repo.remove(gone); r.removed = gone.length; }

  const todo = listed.filter((f) => {
    const s = stored.get(f.id);
    const same = s && s.version === versionOf(f) && s.status !== "FAILED" && s.status !== "REMOVED";
    if (same) r.unchanged++;
    return !same;
  });
  const batch = todo.slice(0, a.maxFiles ?? 12);
  r.remaining = todo.length - batch.length;
  let index = stored.size;

  for (const f of batch) {
    const existed = stored.has(f.id);
    const base = { driveId: f.id, name: f.name, mime: f.mimeType, version: versionOf(f) };
    try {
      index++;
      if (!supported(f.mimeType)) {
        const why = (await a.drive.readText(f)) as { skipped: string };
        await a.repo.save({ ...base, title: "Unreadable file", status: "EXCLUDED", reason: why.skipped, redactions: 0, chunks: [] });
        r.skipped++;
        continue;
      }
      const got = await a.drive.readText(f);
      if ("skipped" in got) { await a.repo.save({ ...base, title: "Unreadable file", status: "EXCLUDED", reason: got.skipped, redactions: 0, chunks: [] }); r.skipped++; continue; }
      const s = screenDocument(f.name, got.text, a.protectedNames, { autoPublishClean: a.autoPublishClean, index });
      await a.repo.save({ ...base, title: s.title, status: s.status, reason: s.reason, redactions: s.redactions + s.cues, chunks: s.chunks });
      if (existed) r.updated++; else r.added++;
      if (s.status === "QUARANTINED") r.quarantined++;
      if (s.status === "PUBLISHED") r.published++;
      if (s.status === "EXCLUDED") r.skipped++;
    } catch (e) {
      r.failed++;
      r.errors.push(`File ${index}: ${e instanceof Error ? e.message : "could not be read"}`.slice(0, 200)); // never the file name: it may name a client
      await a.repo.save({ ...base, title: "Unreadable file", status: "FAILED", reason: "Reading failed; it will be retried on the next sync.", redactions: 0, chunks: [] }).catch(() => {});
    }
  }
  return r;
}
