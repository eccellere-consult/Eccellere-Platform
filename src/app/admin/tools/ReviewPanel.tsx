"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Trash2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { renderDiagram } from "@/lib/strategyModels/diagrams/templates";
import type { DeclarativeTool, DeclPart } from "@/lib/strategyModels/declarative";

interface Quality { errors: string[]; warnings: string[]; standards?: { score: number; level: string; band: string } }
interface Suggestion { name: string; year: string; confidence: string; status: string }
interface ToolFull {
  slug: string; name: string; category: string; groupName: string | null; practice: string | null; source: string; status: string;
  definition: DeclarativeTool | null; quality: Quality | null; provenance: Record<string, unknown> | null;
  reviewedAt: string | null; publishedAt: string | null;
}
interface HandBuilt {
  reference: { originator: string; year: string; summary: string; caption: string; howToRead: string[] };
  diagramSvg: string;
  sections: { key: string; title: string; summary: string; parts: { key: string; label: string; kind: string; help: string }[] }[];
  code: { layer?: string; phaseStart?: number; phaseEnd?: number; nature?: string; upstream?: string[]; downstream?: string[] };
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", NEEDS_REVIEW: "bg-amber-100 text-amber-800", REVIEWED: "bg-sky-100 text-sky-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800", ARCHIVED: "bg-zinc-200 text-zinc-600",
};
export const statusLabel = (s: string) => ({ DRAFT: "Draft", NEEDS_REVIEW: "Needs fixing", REVIEWED: "In consulting library", PUBLISHED: "Live for clients", ARCHIVED: "Archived" }[s] ?? s);
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

export default function ReviewPanel({ slug, categories, practices, onChanged, onClose }: { slug: string; categories: string[]; practices: string[]; onChanged: () => void; onClose: () => void }) {
  const [tool, setTool] = useState<ToolFull | null>(null);
  const [hand, setHand] = useState<HandBuilt | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [looksRight, setLooksRight] = useState(false);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [brief, setBrief] = useState("");
  const [instruction, setInstruction] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`);
    const d = await readJson(r);
    if (!r.ok) return setErr(d.error ?? "Could not load this tool.");
    const t = d.tool as ToolFull;
    setTool(t); setHand((d.handBuilt as HandBuilt) ?? null);
    setLooksRight(false); setDirty(false);
    const def = t.definition;
    if (def) {
      setEdit({
        name: t.name, does: def.does ?? "", whenToUse: def.whenToUse ?? "", whenNotToUse: def.whenNotToUse ?? "", next: def.next ?? "",
        analysisGuide: def.analysisGuide ?? "", summary: def.reference?.summary ?? "", caption: def.reference?.caption ?? "",
        originator: def.reference?.originator ?? "", year: def.reference?.year ?? "",
      });
    }
  }, [slug]);
  useEffect(() => { load().catch(() => setErr("Could not load this tool.")); }, [load]);

  async function call(label: string, url: string, init: RequestInit) {
    setBusy(label); setErr(null); setNote(null);
    try {
      const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const d = await readJson(r);
      if (!r.ok) { setErr(d.error ?? "That did not work."); return false; }
      if (typeof d.applied === "boolean") {
        setNote(`${d.applied ? `Changed by AI. Problems: ${d.before} before, ${d.after} now.` : "The AI made no change."} ${Array.isArray(d.notes) ? d.notes.join(" ") : ""}`.trim());
        if (d.applied) setInstruction("");
      } else if (Array.isArray(d.notes) && d.notes.length) setNote(d.notes.join(" "));
      else if (Array.isArray(d.added) && d.added.length) setNote(`Added: ${d.added.join(" and ")}.`);
      await load(); onChanged();
      return true;
    } catch { setErr("Could not reach the server."); return false; }
    finally { setBusy(null); }
  }
  const url = `/api/admin/tools/${encodeURIComponent(slug)}`;
  const post = (action: string, extra: Record<string, unknown> = {}) => call(action, url, { method: "POST", body: JSON.stringify({ action, ...extra }) });
  async function del() {
    setBusy("delete"); setErr(null);
    const r = await fetch(url, { method: "DELETE" });
    const d = await readJson(r);
    setBusy(null);
    if (!r.ok) return setErr(d.error ?? "Could not delete this tool.");
    onChanged(); onClose();
  }
  const saveEdits = () => call("save", url, {
    method: "PATCH",
    body: JSON.stringify({ edits: {
      name: edit.name, does: edit.does, whenToUse: edit.whenToUse, whenNotToUse: edit.whenNotToUse, next: edit.next, analysisGuide: edit.analysisGuide,
      reference: { summary: edit.summary, caption: edit.caption, originator: edit.originator, year: edit.year },
    } }),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setEdit((c) => ({ ...c, [k]: e.target.value })); setDirty(true); };

  if (err && !tool) return <div className="rounded bg-red-50 p-4 text-sm text-red-800">{err} <button className="underline" onClick={onClose}>Close</button></div>;
  if (!tool) return <div className="p-6 text-sm text-ink-light"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div>;

  const def = tool.definition;
  const handBuilt = tool.source === "strategy-hub" || !def;
  const q = tool.quality;
  const live = tool.status === "PUBLISHED";
  const inLibrary = tool.status === "REVIEWED" || live;
  const archived = tool.status === "ARCHIVED";
  const diagram = def?.diagram ? (() => { try { return renderDiagram(def.diagram); } catch { return ""; } })() : hand?.diagramSvg ?? "";
  const prov = tool.provenance ?? {};
  const suggestion = (prov.originatorSuggestion ?? null) as Suggestion | null;
  const needsOriginator = !!def && !def.reference?.originator?.trim();
  const sections = def ? def.sections : hand?.sections ?? [];

  return (
    <section className="mt-6 rounded bg-white p-5 shadow-sm ring-1 ring-eccellere-gold/40" aria-label={`Review ${tool.name}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-light text-eccellere-ink">{tool.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-mid">
            <StatusChip s={tool.status} />
            {handBuilt && <span className="rounded-sm bg-violet-100 px-2 py-0.5 text-violet-800">Hand-built Strategy Hub tool</span>}
            {tool.groupName && <span>Group: {tool.groupName}</span>}
            {typeof prov.provider === "string" && <span>{prov.provider === "rules" ? "Built straight from your file, without AI" : `Drafted by ${String(prov.provider)} (${String(prov.model)})`}, confidence {String(prov.confidence)}{prov.customSkill ? ", edited skill file" : ""}</span>}
            {tool.reviewedAt && <span>Reviewed {new Date(tool.reviewedAt).toLocaleDateString()}</span>}
          </p>
        </div>
        <label className="text-xs text-ink-mid">Marketplace section
          <select className={cn(field, "mt-1 w-48")} value={tool.category} disabled={!!busy} onChange={(e) => call("category", url, { method: "PATCH", body: JSON.stringify({ category: e.target.value }) })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs text-ink-mid">Consulting practice
          <select className={cn(field, "mt-1 w-52")} value={tool.practice ?? ""} disabled={!!busy} onChange={(e) => call("practice", url, { method: "PATCH", body: JSON.stringify({ practice: e.target.value }) })}>
            {!tool.practice && <option value="">Not set</option>}
            {practices.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button className="border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream" onClick={onClose}>Close</button>
      </div>

      {err && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      {note && <p className="mt-3 rounded bg-sky-50 p-3 text-sm text-sky-900">{note}</p>}

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
          {!handBuilt && !live && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1 bg-eccellere-ink px-3 py-1.5 text-xs text-white disabled:opacity-40" disabled={!!busy} onClick={() => post("fix")}>
                {busy === "fix" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Fixing with AI (up to 3 minutes)…</> : <><Sparkles className="h-3.5 w-3.5" /> Fix these problems with AI</>}
              </button>
              <button className="inline-flex items-center gap-1 border border-eccellere-ink/40 bg-white px-3 py-1.5 text-xs text-eccellere-ink disabled:opacity-40" disabled={!!busy}
                onClick={() => post("fix", { instruction: ["Fix exactly these problems and change nothing else:", ...q.errors.map((e) => `- ${e}`)].join("\n") })}>
                <Sparkles className="h-3.5 w-3.5" /> Try again: send the exact problems
              </button>
              <button className="inline-flex items-center gap-1 border border-eccellere-ink/40 bg-white px-3 py-1.5 text-xs text-eccellere-ink disabled:opacity-40" disabled={!!busy}
                onClick={() => confirm("Draft this tool again from its name? Your corrections will be replaced and it goes back to review.") && post("redraft", { brief })}>
                {busy === "redraft" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Drafting (up to 3 minutes)…</> : "Draft again with AI"}
              </button>
              <span className="w-full text-xs text-red-900">If a change would make things worse it is not applied. If both fix buttons fail, use &ldquo;Draft again&rdquo;, or correct the wording yourself in the &ldquo;Wording&rdquo; boxes below (or ask for a specific change in &ldquo;Modify with AI&rdquo;).</span>
            </div>
          )}
        </div>
      )}

      {!handBuilt && needsOriginator && !live && (
        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium">Who is credited with this method?</p>
          {suggestion ? (
            <>
              <p className="mt-1">The AI suggests <strong>{suggestion.name}{suggestion.year ? `, ${suggestion.year}` : ""}</strong> (confidence {suggestion.confidence}). It has not been checked against a source, so it is not on the page yet.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="bg-eccellere-gold px-3 py-1.5 text-xs text-white disabled:opacity-40" disabled={!!busy} onClick={() => post("confirm-originator")}>I checked: use this</button>
                <span className="self-center text-xs">or type your own below under &ldquo;Originator&rdquo; and save.</span>
              </div>
            </>
          ) : (
            <p className="mt-1">No suggestion yet. Type the originator and year below if you have checked a source, or leave it and the page will say &ldquo;Originator not stated&rdquo;.{" "}
              <button className="underline disabled:opacity-40" disabled={!!busy} onClick={() => post("complete")}>Ask the AI for a suggestion</button>.</p>
          )}
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
          {handBuilt ? (
            <div className="mt-2 space-y-2 text-sm text-ink-mid">
              <p>This tool was built by hand with its own diagram, worked example and calculations. Its wording is changed in the code, not here. You can still move it between sections and practices, put it in the library, and expose it to clients.</p>
              {hand?.reference && <p><strong>Method:</strong> {hand.reference.summary}</p>}
              {hand?.code?.layer && <p className="text-xs">Framework library: layer {hand.code.layer}, lifecycle stages {hand.code.phaseStart} to {hand.code.phaseEnd}, {hand.code.nature}. Feeds: {(hand.code.downstream ?? []).join(", ") || "none"}. Built on: {(hand.code.upstream ?? []).join(", ") || "none"}.</p>}
            </div>
          ) : (
            <>
              {!live && (
                <div className="mt-3 rounded border border-violet-200 bg-violet-50/60 p-3">
                  <label className="text-xs font-medium text-eccellere-ink" htmlFor="modify"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-violet-700" />Modify with AI</label>
                  <p className="mt-1 text-[11px] text-ink-light">Tell the AI what to change, for example &ldquo;make the questions specific to banking&rdquo; or &ldquo;add a risk column to the options table&rdquo;. The page is re-checked and goes back to review.</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <input id="modify" className={cn(field, "min-w-[220px] flex-1")} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="What should change?" />
                    <button className="bg-violet-700 px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!!busy || instruction.trim().length < 5} onClick={() => post("fix", { instruction })}>
                      {busy === "fix" && instruction ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Modify"}
                    </button>
                  </div>
                </div>
              )}
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
                <label className="block text-xs text-ink-mid">Originator <span className="text-ink-light">(from a source you opened)</span>
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
            </>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-light">What a user will see</h3>
          {diagram ? <div className="mt-2 border border-eccellere-ink/10 p-2" dangerouslySetInnerHTML={{ __html: diagram }} /> : <p className="mt-2 text-xs text-red-700">No diagram yet.</p>}
          <ol className="mt-4 space-y-4">
            {sections.map((s) => (
              <li key={s.key}>
                <p className="text-sm font-medium text-eccellere-ink">{s.title}</p>
                <p className="text-xs text-ink-mid">{s.summary}</p>
                <ul className="mt-2 space-y-2">
                  {s.parts.map((p) => ("columns" in p || "type" in p)
                    ? <PartPreview key={p.key} p={p as DeclPart} />
                    : <li key={p.key} className="rounded border border-eccellere-ink/10 p-3"><p className="text-sm font-medium">{p.label} <span className="text-[11px] font-normal text-ink-light">{p.kind}</span></p><p className="mt-1 text-xs text-ink-mid">{p.help}</p></li>)}
                </ul>
              </li>
            ))}
          </ol>
          {def && (def.outputs?.length ?? 0) > 0 && <p className="mt-4 text-xs text-ink-mid"><strong>Results shown:</strong> {def.outputs!.map((o) => o.label).join(", ")}</p>}
          {def?.sample && (
            <details className="mt-4 rounded bg-eccellere-cream p-3 text-xs text-ink-mid">
              <summary className="cursor-pointer font-medium text-eccellere-ink">Worked example (fictional)</summary>
              <p className="mt-2">{def.sample.scenario}</p>
            </details>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-eccellere-ink/10 pt-4">
        {archived ? (
          <button className="border border-eccellere-ink/20 px-4 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={!!busy} onClick={() => post("restore")}>Restore to the library</button>
        ) : (
          <>
            {!inLibrary && (
              <>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[#B8913A]" checked={looksRight} onChange={(e) => setLooksRight(e.target.checked)} disabled={(q?.errors.length ?? 1) > 0 || dirty} />
                  Looks right: I have read this tool and it is accurate
                </label>
                <button className="bg-eccellere-gold px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!looksRight || !!busy} onClick={() => post("review")}>
                  {busy === "review" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Mark reviewed: add to the consulting library"}
                </button>
              </>
            )}
            {inLibrary && !live && (
              <button className="bg-emerald-700 px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!!busy} onClick={() => post("publish")}>
                {busy === "publish" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Expose to clients (marketplace)"}
              </button>
            )}
            {live && (
              <>
                <span className="flex items-center gap-1 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Live for clients and in the library</span>
                <button className="border border-eccellere-ink/20 px-4 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Withdraw this tool from clients? It stays in the consulting library, and people's saved work is kept.") && post("unpublish")}>Withdraw from clients</button>
              </>
            )}
            {!handBuilt && !live && (
              <div className="flex flex-wrap items-center gap-2">
                <input className={cn(field, "w-64")} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="New context for the AI (optional)" aria-label="New context for the AI" />
                <button className="border border-eccellere-ink/20 px-4 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Draft this tool again from its name? Your corrections will be replaced and it goes back to review.") && post("redraft", { brief })}>
                  {busy === "redraft" ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Drafting (up to 3 minutes)…</> : "Draft again with AI"}
                </button>
              </div>
            )}
            {!live && <button className="inline-flex items-center gap-1 border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Delete this tool for good? If people have saved work in it, it cannot be deleted and you should archive it instead.") && del()}>
              {busy === "delete" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : <><Trash2 className="h-3.5 w-3.5" /> Delete</>}
            </button>}
            {!live && <button className="border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!!busy} onClick={() => confirm("Archive this tool? It disappears from the library and the marketplace. Saved work by people is kept.") && post("archive")}>Archive</button>}
          </>
        )}
      </div>
    </section>
  );
}
