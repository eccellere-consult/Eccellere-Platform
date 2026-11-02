"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { renderDiagram } from "@/lib/strategyModels/diagrams/templates";
import type { DeclarativeTool, DeclPart } from "@/lib/strategyModels/declarative";

interface Quality { errors: string[]; warnings: string[]; standards?: { score: number; level: string; band: string } }
interface ToolFull {
  slug: string; name: string; category: string; groupName: string | null; status: string;
  definition: DeclarativeTool; quality: Quality | null; provenance: Record<string, unknown> | null;
  reviewedAt: string | null; publishedAt: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", NEEDS_REVIEW: "bg-amber-100 text-amber-800", REVIEWED: "bg-sky-100 text-sky-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800", ARCHIVED: "bg-zinc-200 text-zinc-600",
};
export const statusLabel = (s: string) => ({ DRAFT: "Draft", NEEDS_REVIEW: "Needs fixing", REVIEWED: "Reviewed", PUBLISHED: "Live", ARCHIVED: "Off marketplace" }[s] ?? s);
export const StatusChip = ({ s }: { s: string }) => (
  <span className={cn("inline-block rounded-sm px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[s] ?? "bg-slate-100")}>{statusLabel(s)}</span>
);

const field = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";

function PartPreview({ p }: { p: DeclPart }) {
  if (p.kind === "table") {
    return (
      <li className="rounded border border-eccellere-ink/10 p-3">
        <p className="text-sm font-medium text-eccellere-ink">{p.label} <span className="text-[11px] font-normal text-ink-light">table</span></p>
        <p className="mt-1 text-xs text-ink-mid">{p.help}</p>
        <p className="mt-2 text-[11px] text-ink-light">Columns: {p.columns.map((c) => `${c.header}${c.type === "computed" ? " (calculated)" : ""}`).join(" · ")}</p>
      </li>
    );
  }
  return (
    <li className="rounded border border-eccellere-ink/10 p-3">
      <p className="text-sm font-medium text-eccellere-ink">{p.label} <span className="text-[11px] font-normal text-ink-light">{p.type}</span></p>
      <p className="mt-1 text-xs text-ink-mid">{p.help}</p>
      {p.example && <p className="mt-1 text-[11px] italic text-ink-light">Example: {p.example}</p>}
    </li>
  );
}

export default function ReviewPanel({ slug, categories, onChanged, onClose }: { slug: string; categories: string[]; onChanged: () => void; onClose: () => void }) {
  const [tool, setTool] = useState<ToolFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [looksRight, setLooksRight] = useState(false);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`);
    const d = await readJson(r);
    if (!r.ok) return setErr(d.error ?? "Could not load this tool.");
    const t = d.tool as ToolFull;
    setTool(t);
    setLooksRight(false);
    setDirty(false);
    const def = t.definition;
    setEdit({
      name: t.name, does: def.does ?? "", whenToUse: def.whenToUse ?? "", whenNotToUse: def.whenNotToUse ?? "", next: def.next ?? "",
      analysisGuide: def.analysisGuide ?? "", summary: def.reference?.summary ?? "", caption: def.reference?.caption ?? "",
      originator: def.reference?.originator ?? "", year: def.reference?.year ?? "",
    });
  }, [slug]);
  useEffect(() => { load().catch(() => setErr("Could not load this tool.")); }, [load]);

  async function call(label: string, url: string, init: RequestInit) {
    setBusy(label); setErr(null);
    try {
      const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const d = await readJson(r);
      if (!r.ok) { setErr(d.error ?? "That did not work."); return false; }
      await load(); onChanged();
      return true;
    } catch { setErr("Could not reach the server."); return false; }
    finally { setBusy(null); }
  }
  const post = (action: string) => call(action, `/api/admin/tools/${encodeURIComponent(slug)}`, { method: "POST", body: JSON.stringify({ action }) });
  const saveEdits = () => call("save", `/api/admin/tools/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify({ edits: {
      name: edit.name, does: edit.does, whenToUse: edit.whenToUse, whenNotToUse: edit.whenNotToUse, next: edit.next, analysisGuide: edit.analysisGuide,
      reference: { summary: edit.summary, caption: edit.caption, originator: edit.originator, year: edit.year },
    } }),
  });
  const refile = (category: string) => call("category", `/api/admin/tools/${encodeURIComponent(slug)}`, { method: "PATCH", body: JSON.stringify({ category }) });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setEdit((c) => ({ ...c, [k]: e.target.value })); setDirty(true); };

  if (err && !tool) return <div className="rounded bg-red-50 p-4 text-sm text-red-800">{err} <button className="underline" onClick={onClose}>Close</button></div>;
  if (!tool) return <div className="p-6 text-sm text-ink-light"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div>;

  const def = tool.definition;
  const q = tool.quality;
  const live = tool.status === "PUBLISHED";
  const diagram = def.diagram ? (() => { try { return renderDiagram(def.diagram); } catch { return ""; } })() : "";
  const prov = tool.provenance ?? {};

  return (
    <section className="mt-6 rounded bg-white p-5 shadow-sm ring-1 ring-eccellere-gold/40" aria-label={`Review ${tool.name}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-light text-eccellere-ink">{tool.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-mid">
            <StatusChip s={tool.status} />
            {tool.groupName && <span>Group: {tool.groupName}</span>}
            {typeof prov.provider === "string" && <span>Drafted by {String(prov.provider)} ({String(prov.model)}), confidence {String(prov.confidence)}</span>}
            {tool.reviewedAt && <span>Reviewed {new Date(tool.reviewedAt).toLocaleDateString()}</span>}
          </p>
        </div>
        <label className="text-xs text-ink-mid">Marketplace section
          <select className={cn(field, "mt-1 w-52")} value={tool.category} disabled={!!busy} onChange={(e) => refile(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button className="border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream" onClick={onClose}>Close</button>
      </div>

      {err && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-800">{err}</p>}

      {q?.standards && (
        <div className={cn("mt-4 rounded p-3 text-sm", q.standards.level === "L2" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900")}>
          <strong>Eccellere standard: {q.standards.score}/100, {q.standards.band}, level {q.standards.level}.</strong>{" "}
          {q.standards.level === "L2" ? "Meets the focused-tool standard (route, intake, calculation, interpretation, action plan)." : "Below the focused-tool standard. See the notes below."}
        </div>
      )}
      {q && q.errors.length > 0 && (
        <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-800">
          <p className="flex items-center gap-1 font-medium"><XCircle className="h-4 w-4" /> Must be fixed before this can be marked reviewed</p>
          <ul className="mt-1 list-disc pl-5">{q.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {q && q.warnings.length > 0 && (
        <details className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">
          <summary className="flex cursor-pointer items-center gap-1 font-medium"><AlertTriangle className="inline h-4 w-4" /> {q.warnings.length} things to check</summary>
          <ul className="mt-2 list-disc pl-5">{q.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </details>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-light">Wording (you can correct this)</h3>
          {([
            ["name", "Name", false], ["does", "What it does", true], ["whenToUse", "When to use it", true], ["whenNotToUse", "When not to use it", true],
            ["next", "What to do next", true], ["analysisGuide", "How the analysis reads the result", true],
            ["summary", "Reference card: summary", true], ["caption", "Reference card: caption", false],
          ] as const).map(([k, label, long]) => (
            <label key={k} className="mt-3 block text-xs text-ink-mid">{label}
              {long
                ? <textarea className={cn(field, "mt-1 min-h-[64px]")} value={edit[k] ?? ""} onChange={set(k)} disabled={live} />
                : <input className={cn(field, "mt-1")} value={edit[k] ?? ""} onChange={set(k)} disabled={live} />}
            </label>
          ))}
          <div className="mt-3 grid grid-cols-[1fr_100px] gap-3">
            <label className="block text-xs text-ink-mid">Originator <span className="text-ink-light">(only from a source you opened; the AI never fills this)</span>
              <input className={cn(field, "mt-1")} value={edit.originator ?? ""} onChange={set("originator")} placeholder="Originator not stated" disabled={live} />
            </label>
            <label className="block text-xs text-ink-mid">Year
              <input className={cn(field, "mt-1")} value={edit.year ?? ""} onChange={set("year")} disabled={live} />
            </label>
          </div>
          {!live && (
            <button className="mt-4 bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!dirty || !!busy} onClick={saveEdits}>
              {busy === "save" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save changes and re-check"}
            </button>
          )}
          <p className="mt-2 text-[11px] text-ink-light">Saving re-runs the quality and standards checks and sends the tool back to review. Sections, fields and calculations are changed by drafting again.</p>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-light">What a client will see</h3>
          {diagram ? <div className="mt-2 border border-eccellere-ink/10 p-2" dangerouslySetInnerHTML={{ __html: diagram }} /> : <p className="mt-2 text-xs text-ink-light">No diagram for this tool.</p>}
          <ol className="mt-4 space-y-4">
            {def.sections.map((s) => (
              <li key={s.key}>
                <p className="text-sm font-medium text-eccellere-ink">{s.title}</p>
                <p className="text-xs text-ink-mid">{s.summary}</p>
                <ul className="mt-2 space-y-2">{s.parts.map((p) => <PartPreview key={p.key} p={p} />)}</ul>
              </li>
            ))}
          </ol>
          {(def.outputs?.length ?? 0) > 0 && <p className="mt-4 text-xs text-ink-mid"><strong>Results shown:</strong> {def.outputs!.map((o) => o.label).join(", ")}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-eccellere-ink/10 pt-4">
        {!live && (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#B8913A]" checked={looksRight} onChange={(e) => setLooksRight(e.target.checked)} disabled={tool.status === "REVIEWED" || (q?.errors.length ?? 1) > 0 || dirty} />
              Looks right: I have read this tool and it is accurate
            </label>
            <button className="bg-eccellere-gold px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!looksRight || !!busy || tool.status === "REVIEWED"} onClick={() => post("review")}>
              {busy === "review" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Mark reviewed"}
            </button>
            <button className="bg-emerald-700 px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={tool.status !== "REVIEWED" || !!busy} onClick={() => post("publish")}>
              {busy === "publish" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Publish to marketplace"}
            </button>
            <button className="border border-eccellere-ink/20 px-4 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Draft this tool again from its name? Your corrections will be replaced.") && post("redraft")}>
              {busy === "redraft" ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Drafting (up to 2 minutes)…</> : "Draft again with AI"}
            </button>
          </>
        )}
        {live && (
          <>
            <span className="flex items-center gap-1 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Live on the marketplace</span>
            <button className="border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Take this tool off the marketplace? People's saved work is kept.") && post("unpublish")}>
              Take off marketplace
            </button>
          </>
        )}
      </div>
    </section>
  );
}
