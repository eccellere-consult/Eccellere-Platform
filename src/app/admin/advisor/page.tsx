"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { BTN_LINE, BTN_MAIN, CARD, FIELD, LABEL } from "@/app/tools/styles";

interface FileRow { id: string; title: string; status: string; reason: string | null; redactions: number; mime: string; chunks: number }
interface DriveState { keyConfigured: boolean; serviceAccountEmail: string | null; tablesReady: boolean; folderIds: string[]; autoPublishClean: boolean; lastSync?: { at: string; summary: string }; files: FileRow[] }
interface Safety { enabled: boolean; envDisabled: boolean; protectedNames: string[] }

const STATUS: Record<string, string> = { PUBLISHED: "Live for clients", QUARANTINED: "Waiting for your approval", EXCLUDED: "Not used", FAILED: "Failed", REMOVED: "Removed" };

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await readJson(r).catch(() => ({}));
  return { ok: r.ok, d };
}

export default function AdvisorAdminPage() {
  const [drive, setDrive] = useState<DriveState | null>(null);
  const [safety, setSafety] = useState<Safety | null>(null);
  const [folders, setFolders] = useState("");
  const [names, setNames] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ id: string; text: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/admin/advisor/drive"), fetch("/api/admin/advisor")]);
    if (a.status === 401 || a.status === 403) return setErr("You do not have permission to manage the Advisor.");
    if (!a.ok || !b.ok) return setErr("Could not load the Advisor settings.");
    const d = (await readJson(a)) as DriveState;
    const s = (await readJson(b)) as Safety;
    setDrive(d);
    setSafety(s);
    setFolders(d.folderIds.join("\n"));
    setNames(s.protectedNames.join("\n"));
  }, []);
  useEffect(() => { load().catch(() => setErr("Could not load the Advisor settings.")); }, [load]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try { setMsg(await fn()); await load(); } catch { setMsg("Something went wrong. Please try again."); } finally { setBusy(false); }
  };

  if (err) return <div className="p-8 text-sm text-red-700">{err}</div>;
  if (!drive || !safety) return <div className="p-8 text-sm text-ink-light">Loading…</div>;

  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
  const waiting = drive.files.filter((f) => f.status === "QUARANTINED").length;

  return (
    <div className="mx-auto max-w-[900px] bg-eccellere-cream p-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-ink-mid hover:text-eccellere-gold-deep"><ChevronLeft className="h-3.5 w-3.5" /> Admin</Link>
      <h1 className="mb-1 mt-3 font-display text-3xl font-light text-eccellere-ink">Eccellere Advisor</h1>
      <p className="mb-6 text-sm text-ink-mid">Control what the Advisor knows, what it must never say, and switch it off if needed.</p>
      {msg && <p role="status" className="mb-4 border border-eccellere-border bg-white px-4 py-3 text-sm text-eccellere-ink">{msg}</p>}

      <section className={CARD}>
        <p className={LABEL}>Safety</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-eccellere-ink">
          <input
            type="checkbox"
            checked={safety.enabled}
            disabled={busy || safety.envDisabled}
            onChange={(e) => { const on = e.target.checked; run(async () => { await call("/api/admin/advisor", "PUT", { enabled: on }); return on ? "The Advisor is on." : "The Advisor is off. Clients see a polite notice."; }); }}
          />
          The Advisor is switched on {safety.envDisabled && <span className="text-red-700">(forced off in the server settings)</span>}
        </label>
        <p className="mt-4 text-sm font-medium text-eccellere-ink">Names that must never appear (one per line)</p>
        <p className="text-xs text-ink-mid">Client companies, people, brands. These are removed from every document and every answer.</p>
        <textarea className={`${FIELD} mt-2 h-28`} value={names} onChange={(e) => setNames(e.target.value)} aria-label="Protected names" />
        <button className={`${BTN_LINE} mt-2`} disabled={busy} onClick={() => run(async () => { await call("/api/admin/advisor", "PUT", { protectedNames: lines(names) }); return "Protected names saved. Run a sync to apply them to documents already read."; })}>Save names</button>
      </section>

      <section className={CARD}>
        <p className={LABEL}>Google Drive library</p>
        {!drive.tablesReady && <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">The database tables are not created yet. Run <b>advisor_tables.sql</b> in phpMyAdmin, then refresh this page.</p>}
        {!drive.keyConfigured ? (
          <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">The Google key is not set up yet. Follow <b>docs/advisor/DRIVE_SETUP.md</b>, then add it in Hostinger as <b>GOOGLE_SERVICE_ACCOUNT_JSON</b> and redeploy.</p>
        ) : (
          <p className="mt-3 text-sm text-ink-mid">Connected as <b className="text-eccellere-ink">{drive.serviceAccountEmail}</b>. Share each Drive folder you want used with this e-mail address (Viewer access).</p>
        )}
        <p className="mt-4 text-sm font-medium text-eccellere-ink">Approved folders (paste a folder link or id, one per line)</p>
        <textarea className={`${FIELD} mt-2 h-24`} value={folders} onChange={(e) => setFolders(e.target.value)} aria-label="Approved Drive folders" />
        <label className="mt-3 flex items-center gap-2 text-sm text-eccellere-ink">
          <input type="checkbox" checked={drive.autoPublishClean} onChange={(e) => setDrive({ ...drive, autoPublishClean: e.target.checked })} />
          Publish documents automatically when no names or contact details are found (not recommended at first)
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={BTN_LINE} disabled={busy} onClick={() => run(async () => { const r = await call("/api/admin/advisor/drive", "PUT", { folders: lines(folders), autoPublishClean: drive.autoPublishClean }); return r.ok ? "Folders saved." : "Could not save the folders."; })}>Save folders</button>
          <button className={BTN_MAIN} disabled={busy || !drive.keyConfigured || !drive.tablesReady} onClick={() => run(async () => { const r = await call("/api/admin/advisor/drive", "POST", { action: "sync" }); return r.ok ? `Sync finished: ${(r.d as { summary: string }).summary}.` : (r.d as { error?: string }).error ?? "Sync failed."; })}>{busy ? "Working…" : "Sync now"}</button>
        </div>
        {drive.lastSync && <p className="mt-2 text-xs text-ink-mid">Last sync {new Date(drive.lastSync.at).toLocaleString()}: {drive.lastSync.summary}</p>}
      </section>

      <section className={CARD}>
        <p className={LABEL}>Documents ({drive.files.length}){waiting ? ` · ${waiting} waiting for approval` : ""}</p>
        {!drive.files.length && <p className="mt-3 text-sm text-ink-mid">Nothing has been read yet.</p>}
        <ul className="m-0 mt-3 list-none divide-y divide-eccellere-border p-0">
          {drive.files.map((f) => (
            <li key={f.id} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-eccellere-ink">{f.title}</p>
                <span className="text-xs text-ink-mid">{STATUS[f.status] ?? f.status} · {f.chunks} parts</span>
              </div>
              {f.reason && <p className="mt-1 text-xs text-ink-mid">{f.reason}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {f.chunks > 0 && <button className={BTN_LINE} disabled={busy} onClick={async () => { const r = await fetch(`/api/admin/advisor/drive?preview=${f.id}`); const d = (await readJson(r)) as { text: string }; setPreview({ id: f.id, text: d.text }); }}>Preview</button>}
                {(f.status === "QUARANTINED" || f.status === "EXCLUDED") && f.chunks > 0 && <button className={BTN_MAIN} disabled={busy} onClick={() => run(async () => { await call("/api/admin/advisor/drive", "POST", { action: "approve", fileId: f.id }); return "Approved. Clients can now get answers from it."; })}>Approve</button>}
                {f.status === "PUBLISHED" && <button className={BTN_LINE} disabled={busy} onClick={() => run(async () => { await call("/api/admin/advisor/drive", "POST", { action: "exclude", fileId: f.id }); return "Withdrawn from the Advisor."; })}>Withdraw</button>}
              </div>
              {preview?.id === f.id && <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-eccellere-border bg-eccellere-cream p-3 text-xs text-eccellere-ink">{preview.text || "(empty)"}</pre>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
