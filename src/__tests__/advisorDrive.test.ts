import { describe, expect, it } from 'vitest';
import { chunkText, safeTitle, screenDocument } from '@/lib/advisor/ingest';
import { personCues, redactPersonCues } from '@/lib/advisor/identity';
import { buildCorpus, search } from '@/lib/advisor/knowledge';
import { serviceAccount, supported, type DriveClient, type DriveFile } from '@/lib/advisor/drive';
import { syncDrive, versionOf, type FileWrite, type StoredFile, type SyncRepo } from '@/lib/advisor/sync';

const CLEAN = 'Working capital improves when receivables are collected faster.\n\nInventory days fall with better forecasting.';

describe('screening a document', () => {
  it('chunks by paragraph and never exceeds the size', () => {
    const chunks = chunkText(Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ${'word '.repeat(40)}`).join('\n\n'), 600);
    expect(chunks.length).toBeGreaterThan(5);
    expect(chunks.every((c) => c.length <= 620)).toBe(true);
    expect(chunkText('')).toEqual([]);
  });

  it('spots people named after cues and replaces them, but leaves ordinary sentences alone', () => {
    const t = 'Prepared by Asha Rao. Dear Mr Shah, thank you. We write to our customers and dear friends.';
    expect(personCues(t)).toBeGreaterThanOrEqual(2);
    const r = redactPersonCues(t);
    expect(r.text).not.toMatch(/Asha|Shah/);
    expect(personCues(CLEAN)).toBe(0);
  });

  it('holds everything for approval by default, holds anything with names whatever the setting, and publishes clean text only when allowed', () => {
    expect(screenDocument('Playbook.docx', CLEAN, [], { autoPublishClean: false, index: 1 }).status).toBe('QUARANTINED');
    expect(screenDocument('Playbook.docx', CLEAN, [], { autoPublishClean: true, index: 1 }).status).toBe('PUBLISHED');
    const named = screenDocument('Notes.docx', 'Prepared by Asha Rao for Orion Industries Pvt Ltd (asha@orion.com).', [], { autoPublishClean: true, index: 1 });
    expect(named.status).toBe('QUARANTINED');
    expect(named.chunks.join(' ')).not.toMatch(/Asha|Orion|asha@/);
    expect(screenDocument('Empty.txt', '   ', [], { autoPublishClean: true, index: 1 }).status).toBe('EXCLUDED');
  });

  it('keeps a plain file name as the title but hides one that names someone', () => {
    expect(safeTitle('Working Capital Playbook.docx', [], 1)).toBe('Working Capital Playbook');
    expect(safeTitle('Proposal for Ravi Kumar.docx', [], 2)).toBe('Eccellere knowledge document 2');
    expect(safeTitle('Zephyr Gears review.docx', ['Zephyr Gears'], 3)).toBe('Eccellere knowledge document 3');
  });
});

describe('searching the library', () => {
  it('finds library pieces, gives them no link, and lists each document once', () => {
    const corpus = buildCorpus([], [
      { id: 'a', title: 'Working Capital Playbook', seq: 0, text: 'Receivables and debtor days drive working capital.' },
      { id: 'b', title: 'Working Capital Playbook', seq: 1, text: 'Working capital also depends on inventory days.' },
    ]);
    const hits = search(corpus, 'how do I improve working capital and debtor days').filter((h) => h.kind === 'knowledge');
    expect(hits).toHaveLength(1);
    expect(hits[0].href).toBe('');
    expect(hits[0].ref).toBeDefined();
  });
});

describe('the Google key', () => {
  it('reads the service account from the environment and rejects bad values', () => {
    const k = serviceAccount({ GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'bot@x.iam.gserviceaccount.com', private_key: 'a\\nb' }) } as never);
    expect(k?.client_email).toBe('bot@x.iam.gserviceaccount.com');
    expect(k?.private_key).toBe('a\nb');
    expect(serviceAccount({} as never)).toBeNull();
    expect(serviceAccount({ GOOGLE_SERVICE_ACCOUNT_JSON: '{nope' } as never)).toBeNull();
    expect(supported('application/pdf')).toBe(false);
    expect(supported('application/vnd.google-apps.document')).toBe(true);
  });
});

// A stand-in for Drive and for the database.
function fake(files: DriveFile[], texts: Record<string, string>) {
  const db = new Map<string, FileWrite>();
  const repo: SyncRepo = {
    stored: async () => [...db.values()].map((f): StoredFile => ({ driveId: f.driveId, version: f.version, status: f.status })),
    save: async (f) => { db.set(f.driveId, f); },
    remove: async (ids) => { for (const id of ids) db.set(id, { ...db.get(id)!, status: 'REMOVED', chunks: [] }); },
  };
  const drive: DriveClient = {
    listFiles: async () => files,
    readText: async (f) => (supported(f.mimeType) ? { text: texts[f.id] ?? '' } : { skipped: 'This file type (pdf) cannot be read yet.' }),
  };
  return { db, repo, drive };
}
const doc = (id: string, name: string, extra: Partial<DriveFile> = {}): DriveFile => ({ id, name, mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-11-01T00:00:00Z', ...extra });

describe('syncing the Drive folders', () => {
  it('reads new files into quarantine, skips unreadable types, and does nothing on a second run', async () => {
    const files = [doc('1', 'Playbook'), doc('2', 'Scan.pdf', { mimeType: 'application/pdf' })];
    const { db, repo, drive } = fake(files, { '1': CLEAN });
    const first = await syncDrive({ drive, repo, folderIds: ['f'], protectedNames: [], autoPublishClean: false });
    expect(first).toMatchObject({ seen: 2, added: 1, quarantined: 1, skipped: 1 });
    expect(db.get('1')?.status).toBe('QUARANTINED');
    expect(db.get('2')?.status).toBe('EXCLUDED');
    const second = await syncDrive({ drive, repo, folderIds: ['f'], protectedNames: [], autoPublishClean: false });
    expect(second).toMatchObject({ added: 0, updated: 0, unchanged: 2 });
  });

  it('re-screens a changed file and deletes the text of a file that has left the folders', async () => {
    const f1 = doc('1', 'Playbook');
    const f2 = doc('2', 'Other');
    const { db, repo, drive } = fake([f1, f2], { '1': CLEAN, '2': CLEAN });
    await syncDrive({ drive, repo, folderIds: ['f'], protectedNames: [], autoPublishClean: true });
    expect(db.get('1')?.status).toBe('PUBLISHED');

    const changed = { ...f1, modifiedTime: '2026-11-02T00:00:00Z' };
    const gone = fake([changed], { '1': 'Prepared by Asha Rao. ' + CLEAN });
    gone.db.set('1', db.get('1')!); gone.db.set('2', db.get('2')!);
    const r = await syncDrive({ drive: gone.drive, repo: gone.repo, folderIds: ['f'], protectedNames: [], autoPublishClean: true });
    expect(r).toMatchObject({ updated: 1, removed: 1 });
    expect(versionOf(changed)).not.toBe(db.get('1')?.version);
    expect(gone.db.get('1')?.status).toBe('QUARANTINED'); // names appeared, so a person must look again
    expect(gone.db.get('1')?.chunks.join(' ')).not.toMatch(/Asha/);
    expect(gone.db.get('2')).toMatchObject({ status: 'REMOVED', chunks: [] });
  });

  it('stops after a batch and says how many are left; a failing file is recorded without its name', async () => {
    const files = Array.from({ length: 5 }, (_, i) => doc(String(i), `Secret Client ${i}`));
    const { db, repo } = fake(files, {});
    const drive: DriveClient = { listFiles: async () => files, readText: async (f) => { if (f.id === '0') throw new Error('boom'); return { text: CLEAN }; } };
    const r = await syncDrive({ drive, repo, folderIds: ['f'], protectedNames: [], autoPublishClean: false, maxFiles: 3 });
    expect(r).toMatchObject({ failed: 1, remaining: 2 });
    expect(r.errors.join(' ')).not.toMatch(/Secret Client/);
    expect(db.get('0')?.status).toBe('FAILED');
  });
});
