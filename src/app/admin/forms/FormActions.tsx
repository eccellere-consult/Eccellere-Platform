"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";

/**
 * What a person can do with a form they have just built, right where they are: look at it as clients will see it, tidy it automatically,
 * ask the AI to fix it, or delete it. Used under the result of a build and in the list of forms built so far.
 */
export default function FormActions({ slug, status, onChanged, onDeleted, aiReady }: {
  slug: string; status: string; aiReady: boolean; onChanged: () => void; onDeleted: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [version, setVersion] = useState(0);
  const live = status === "PUBLISHED";

  async function act(action: "tidy" | "fix") {
    setBusy(action); setMsg(null);
    try {
      const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await readJson(r);
      if (!r.ok) setMsg({ ok: false, text: d.error ?? "That did not work." });
      else {
        const left = typeof d.after === "number" ? d.after : null;
        setMsg({ ok: left === 0, text: [d.applied ? (left === 0 ? "Fixed: no problems left." : `Improved: ${d.before} problems down to ${left}.`) : "Nothing could be changed.", ...(d.notes ?? []).slice(0, 3)].join(" ") });
        setVersion((v) => v + 1);
        onChanged();
      }
    } catch { setMsg({ ok: false, text: "Lost the connection. Please try again." }); }
    setBusy(null);
  }

  async function remove() {
    if (!confirm("Delete this form for good? This cannot be undone.")) return;
    setBusy("delete"); setMsg(null);
    const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`, { method: "DELETE" });
    const d = await readJson(r);
    setBusy(null);
    if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Could not delete it." });
    onDeleted();
  }

  const btn = "border border-eccellere-ink/25 bg-white px-3 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => setPreview((p) => !p)}>{preview ? "Hide preview" : "Preview as clients see it"}</button>
        {!live && <button type="button" className={btn} disabled={!!busy} onClick={() => act("tidy")}>{busy === "tidy" ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Clean up automatically (no AI)"}</button>}
        {!live && <button type="button" className={btn} disabled={!!busy || !aiReady} onClick={() => act("fix")}>{busy === "fix" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Fixing… up to two minutes</> : "Fix with AI"}</button>}
        {!live && <button type="button" className="border border-red-300 bg-white px-3 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!!busy} onClick={remove}>{busy === "delete" ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Delete"}</button>}
        {live && <span className="text-xs text-ink-mid">Live for clients: withdraw it in Review and publish before changing or deleting it.</span>}
      </div>
      {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-emerald-800" : "text-red-700"}`} role="status">{msg.text}</p>}
      {preview && (
        <div className="mt-3 border border-eccellere-border bg-white">
          <p className="border-b border-eccellere-border px-3 py-1.5 text-xs text-ink-mid">Preview. Nothing you type here is saved. <a className="underline" href={`/consulting/library/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">Open in a new tab</a></p>
          <iframe key={version} title="Preview of the form" src={`/consulting/library/${encodeURIComponent(slug)}`} className="h-[720px] w-full" />
        </div>
      )}
    </div>
  );
}
