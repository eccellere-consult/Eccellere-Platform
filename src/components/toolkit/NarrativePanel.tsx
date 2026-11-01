"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, Trash2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readJson } from "@/lib/toolkit/http";
import { narrativeSpec } from "@/lib/toolkit/narrative";
import type { KitType } from "@/lib/toolkit/engine";

export interface NarrEntry {
  text: string;
  unsupported: string[];
  provenance: string;
  provider?: string | null;
}

const PROV_STYLE: Record<string, string> = {
  "AI-suggested": "bg-purple-100 text-purple-800",
  "Client-entered": "bg-sky-100 text-sky-800",
  "Client-confirmed": "bg-emerald-100 text-emerald-800",
};
const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

export function NarrativePanel(props: {
  kitId: string;
  type: KitType;
  seq: number;
  entry?: NarrEntry;
  locked: boolean;
  /** called after the server accepts a change; undefined means the narrative was removed */
  onChange: (entry: NarrEntry | undefined) => void;
}) {
  const { kitId, type, seq, entry, locked, onChange } = props;
  const spec = narrativeSpec(type, seq);
  const [text, setText] = useState(entry?.text ?? "");
  const [busy, setBusy] = useState<"draft" | "save" | "confirm" | "remove" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => { setText(entry?.text ?? ""); }, [entry?.text, seq]);
  if (!spec) return null;

  const dirty = Boolean(entry) && text !== entry?.text;

  async function call(kind: "draft" | "save" | "confirm" | "remove") {
    setBusy(kind);
    setNote(null);
    try {
      let r: Response;
      if (kind === "draft") r = await fetch(`/api/toolkits/${kitId}/narrative`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seq }) });
      else if (kind === "remove") r = await fetch(`/api/toolkits/${kitId}/narrative?seq=${seq}`, { method: "DELETE" });
      else r = await fetch(`/api/toolkits/${kitId}/narrative`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seq, text, confirm: kind === "confirm" }) });
      const d = await readJson(r);
      if (!r.ok) { setNote(d.error ?? "Could not save the narrative."); return; }
      if (kind === "remove") { onChange(undefined); setText(""); return; }
      if (kind === "draft" && !d.text) { setNote(d.note ?? "AI could not draft this section."); return; }
      onChange({ text: d.text, unsupported: d.unsupported ?? [], provenance: d.provenance, provider: d.provider });
      setNote(kind === "draft" ? "Draft added. It is AI-written: read it, correct anything wrong, then confirm it." : kind === "confirm" ? "Confirmed." : "Saved.");
    } catch {
      setNote("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 border border-eccellere-gold/40 bg-eccellere-cream/40 p-4" aria-label="Section narrative">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-eccellere-ink">Section narrative for the report</h3>
          <p className="text-xs text-ink-mid">
            The connecting text a finished kit has around the tables ({spec.minWords}-{spec.maxWords} words). Based only on your answers, the analysis and your evidence.
          </p>
        </div>
        {entry && <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PROV_STYLE[entry.provenance] ?? "bg-gray-100"}`}>{entry.provenance.replace("-", " ")}</span>}
      </div>

      {!entry && !locked && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => call("draft")}>
            {busy === "draft" ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</> : <><Sparkles className="h-4 w-4" /> Draft narrative with AI</>}
          </Button>
          <p className="mt-2 text-xs text-ink-light">Works best after the answers in this and the earlier sections are filled in. Takes up to a minute.</p>
        </div>
      )}
      {!entry && locked && <p className="mt-3 text-xs text-ink-light">No narrative was written for this section.</p>}

      {entry && (
        <div className="mt-3">
          <textarea
            className="w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm leading-relaxed focus:border-eccellere-gold focus:outline-none"
            rows={14}
            value={text}
            readOnly={locked}
            onChange={(e) => setText(e.target.value)}
            aria-label="Narrative text"
          />
          <p className="mt-1 text-xs text-ink-light">{wordCount(text)} words. Plain text with simple formatting (### headings, - bullets, | tables). Links and HTML are removed.</p>

          {entry.unsupported.length > 0 && (
            <div className="mt-2 flex gap-2 rounded bg-amber-50 p-3 text-xs text-amber-900" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <b>Check these figures.</b> They do not appear in your answers, the analysis or your evidence, so the AI may have made them up: {entry.unsupported.join(", ")}.
                Remove or correct them before you submit.
              </div>
            </div>
          )}

          {!locked && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={Boolean(busy) || !dirty} onClick={() => call("save")}>{busy === "save" ? "Saving…" : "Save edits"}</Button>
              {entry.provenance === "AI-suggested" && !dirty && (
                <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => call("confirm")}><Check className="h-4 w-4" /> Confirm as written</Button>
              )}
              <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={() => { if (window.confirm("Replace this narrative with a new AI draft? Your current text will be lost.")) call("draft"); }}>
                {busy === "draft" ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</> : <><Sparkles className="h-4 w-4" /> Write again</>}
              </Button>
              <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={() => { if (window.confirm("Remove this narrative from the report?")) call("remove"); }}><Trash2 className="h-4 w-4" /> Remove</Button>
            </div>
          )}
        </div>
      )}
      {note && <p className="mt-2 text-xs text-ink-mid" role="status">{note}</p>}
    </div>
  );
}
