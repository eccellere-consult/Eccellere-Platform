"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, HelpCircle, Loader2, Printer, Sparkles, Undo2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { interpret, type DeclarativeTool } from "@/lib/strategyModels/declarative";
import { cleanTable, completeness, computeDerived, computeOutputs, evalColumn, expandTable, fieldsFromValues, valuesFromFields, labelColumnKey } from "@/lib/strategyModels/values";
import type { Column, FieldPart, ModelDefinition, ModelValues, Part, Row, TablePart } from "@/lib/strategyModels/types";
import { loadModelDefinition } from "@/lib/strategyModels/groups";
import { fingerprintFields, type StrategyActionable, type StrategyAnalysis, type StrategyRecommendation } from "@/lib/strategyFillinTypes";
import type { FrameworkField } from "@/lib/strategyFrameworks";

interface Saved {
  fields: FrameworkField[];
  recommendations: StrategyRecommendation[];
  actionables: StrategyActionable[];
  analysis: (StrategyAnalysis & { figuresToCheck?: string[] }) | null;
  analysisFingerprint: string | null;
  analysisAt: string | null;
  previousFields: FrameworkField[] | null;
  version: number;
  updatedAt: string | null;
}

const SAVE_DELAY_MS = 1200;
const input = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm text-eccellere-ink placeholder:text-ink-light/70 focus:border-eccellere-gold focus:outline-none";

function Rating({ id, scale, value, onChange }: { id: string; scale: { min: number; max: number; low: string; high: string }; value: string; onChange: (v: string) => void }) {
  const steps = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => String(scale.min + i));
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`}>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={value === s} onClick={() => onChange(value === s ? "" : s)}
            className={cn("h-9 w-9 border text-sm transition-colors", value === s ? "border-eccellere-ink bg-eccellere-ink text-white" : "border-eccellere-ink/20 bg-white hover:border-eccellere-gold")}>{s}</button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-ink-light">{scale.min} = {scale.low} · {scale.max} = {scale.high}. Click again to clear.</p>
    </div>
  );
}

function Cell({ col, row, values, onChange, id }: { col: Column; row: Row; values: ModelValues; onChange: (v: string) => void; id: string }) {
  if (col.type === "computed") return <span className="block px-2 py-2 text-sm font-medium text-eccellere-ink">{evalColumn(col, row, values) || <span className="text-ink-light">-</span>}</span>;
  const v = row[col.key] ?? "";
  if (col.type === "select") return (
    <select id={id} aria-label={col.header} className={input} value={v} onChange={(e) => onChange(e.target.value)}>
      <option value="">Not known</option>{(col.options ?? []).map((o) => <option key={o}>{o}</option>)}
    </select>
  );
  if (col.type === "rating" && col.scale) {
    const opts = Array.from({ length: col.scale.max - col.scale.min + 1 }, (_, i) => String(col.scale!.min + i));
    return (
      <select id={id} aria-label={`${col.header} (${col.scale.min} = ${col.scale.low}, ${col.scale.max} = ${col.scale.high})`} className={input} value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">Not known</option>{opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  if (col.type === "longtext") return <textarea id={id} aria-label={col.header} rows={2} className={cn(input, "min-w-[180px]")} value={v} onChange={(e) => onChange(e.target.value)} />;
  return <input id={id} aria-label={col.header} className={cn(input, col.type === "number" && "min-w-[90px]")} inputMode={col.type === "number" ? "decimal" : undefined} value={v} onChange={(e) => onChange(e.target.value)} />;
}

interface Sample { scenario: string; values: Record<string, string>; tables: Record<string, Row[]> }
export interface WorkspaceProps {
  slug: string;
  toolName: string;
  /** a tool written as data */
  definition?: DeclarativeTool;
  /** a hand-built Strategy Hub tool: its model is loaded by id */
  toolId?: string;
  /** a fictional worked example, keyed by the page's own field and table keys */
  sample?: Sample | null;
}

export default function Workspace({ slug, definition, toolId, toolName, sample }: WorkspaceProps) {
  const [def, setDef] = useState<ModelDefinition | null>(() => (definition ? interpret(definition) : null));
  const [defErr, setDefErr] = useState(false);
  useEffect(() => {
    if (def || !toolId) return;
    let live = true;
    loadModelDefinition(toolId).then((d) => { if (live) { if (d) setDef(d); else setDefErr(true); } }).catch(() => { if (live) setDefErr(true); });
    return () => { live = false; };
  }, [def, toolId]);
  if (defErr) return <p className="my-6 rounded bg-red-50 p-4 text-sm text-red-800">This worksheet could not be loaded. Please reload the page.</p>;
  if (!def) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Opening your worksheet…</p>;
  return <WorkspaceInner slug={slug} toolName={toolName} def={def} sample={sample ?? null} />;
}

/** The fictional worked example, laid out with the page's own labels. Read-only: it never touches the person's answers. */
function ExamplePanel({ def, sample, onClose }: { def: ModelDefinition; sample: Sample; onClose: () => void }) {
  return (
    <section className="no-print mt-6 rounded border border-eccellere-gold/50 bg-white p-5" aria-label="Worked example">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="font-display text-xl font-medium text-eccellere-ink">Worked example (fictional)</h2>
          <p className="mt-1 text-sm text-ink-mid">{sample.scenario}</p>
          <p className="mt-1 text-[11px] text-ink-light">An invented situation to show what good looks like. It is not saved and does not change your worksheet.</p>
        </div>
        <button type="button" className="border border-eccellere-ink/20 px-3 py-1.5 text-xs hover:bg-eccellere-cream" onClick={onClose}>Close</button>
      </div>
      <div className="mt-4 space-y-4 text-sm">
        {def.sections.map((sec) => {
          const rows = sec.parts.filter((p) => (p.kind === "field" ? !!sample.values[p.key] : !!sample.tables[p.key]?.length));
          if (!rows.length) return null;
          return (
            <div key={sec.key}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-light">{sec.title}</h3>
              <dl className="mt-1 space-y-2">
                {rows.map((p) => p.kind === "field" ? (
                  <div key={p.key}><dt className="font-medium text-eccellere-ink">{p.label}</dt><dd className="text-ink-mid">{sample.values[p.key]}</dd></div>
                ) : (
                  <div key={p.key} className="overflow-x-auto">
                    <dt className="font-medium text-eccellere-ink">{p.label}</dt>
                    <dd>
                      <table className="mt-1 w-full min-w-[420px] border-collapse text-left text-xs">
                        <thead><tr>{p.columns.filter((c) => c.type !== "computed").map((c) => <th key={c.key} className="border-b border-eccellere-ink/15 pr-2 pb-1 font-medium text-ink-light">{c.header}</th>)}</tr></thead>
                        <tbody>{sample.tables[p.key].map((r, i) => <tr key={i} className="border-t border-eccellere-ink/5 align-top">{p.columns.filter((c) => c.type !== "computed").map((c) => <td key={c.key} className="py-1 pr-2 text-ink-mid">{r[c.key] ?? ""}</td>)}</tr>)}</tbody>
                      </table>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WorkspaceInner({ slug, def, toolName, sample }: { slug: string; def: ModelDefinition; toolName: string; sample: Sample | null }) {
  const [values, setValues] = useState<ModelValues>({ fields: {}, tables: {} });
  const [sources, setSources] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Saved | null>(null);
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [loadErr, setLoadErr] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saving" | "saved" | "error" | "conflict">("idle");
  const [saveErr, setSaveErr] = useState("");
  const [brief, setBrief] = useState("");
  const [questions, setQuestions] = useState<{ question: string; why: string }[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [busy, setBusy] = useState<"fill" | "analyse" | "undo" | "questions" | null>(null);
  const [aiMsg, setAiMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const conflictRef = useRef<Saved | null>(null);

  const valuesRef = useRef(values); valuesRef.current = values;
  const sourcesRef = useRef(sources); sourcesRef.current = sources;
  const versionRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const dirty = useRef(false);

  // The situation note and the suggested questions are conveniences kept in this browser only (they are not part of the saved worksheet).
  const briefKey = `tools.brief.${slug}`;
  const questionsKey = `tools.questions.${slug}`;
  useEffect(() => {
    try {
      const b = localStorage.getItem(briefKey); if (b) setBrief(b);
      const q = localStorage.getItem(questionsKey); if (q) setQuestions(JSON.parse(q));
    } catch { /* storage unavailable: the page still works */ }
  }, [briefKey, questionsKey]);
  const changeBrief = (v: string) => { setBrief(v); try { localStorage.setItem(briefKey, v); } catch { /* ignore */ } };

  const apply = useCallback((r: Saved | null) => {
    setSaved(r);
    versionRef.current = r?.version ?? 0;
    const parsed = valuesFromFields(def, r?.fields ?? []);
    setValues(parsed.values); setSources(parsed.sources);
    valuesRef.current = parsed.values; sourcesRef.current = parsed.sources;
  }, [def]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/tools/${slug}/fillin`);
      const d = await readJson(r);
      if (!r.ok) { setLoadErr(d.error ?? "Could not load your work."); setLoad("error"); return; }
      apply(d.record ?? null);
      setLoad("ready");
    })().catch(() => { setLoadErr("Could not load your work."); setLoad("error"); });
  }, [slug, apply]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inFlight.current) return false;
    if (!dirty.current) return true;
    inFlight.current = true; dirty.current = false; setSaveState("saving");
    try {
      const fields = fieldsFromValues(def, valuesRef.current, sourcesRef.current);
      const r = await fetch(`/api/tools/${slug}/fillin`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields, expectedVersion: versionRef.current }) });
      const d = await readJson(r);
      if (r.status === 409) { conflictRef.current = d.record ?? null; setSaveState("conflict"); return false; }
      if (!r.ok) { dirty.current = true; setSaveErr(d.error ?? "Could not save."); setSaveState("error"); return false; }
      versionRef.current = d.record.version;
      setSaved((s) => (s ? { ...s, ...d.record } : d.record));
      setSaveState(dirty.current ? "pending" : "saved");
      return true;
    } catch {
      dirty.current = true; setSaveErr("No connection. Your changes are still on this page and will be saved when it returns."); setSaveState("error");
      return false;
    } finally {
      inFlight.current = false;
      if (dirty.current && !timer.current) timer.current = setTimeout(() => { void flush(); }, SAVE_DELAY_MS);
    }
  }, [def, slug]);

  const touch = () => {
    dirty.current = true; setSaveState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, SAVE_DELAY_MS);
  };
  useEffect(() => {
    const onHide = () => { if (dirty.current) void flush(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => { window.removeEventListener("pagehide", onHide); document.removeEventListener("visibilitychange", onHide); };
  }, [flush]);

  const setField = (key: string, v: string) => {
    setValues((c) => { const n = { ...c, fields: { ...c.fields, [key]: v } }; valuesRef.current = n; return n; });
    setSources((c) => { const n = { ...c, [key]: "Manual" }; sourcesRef.current = n; return n; });
    touch();
  };
  const setRows = (part: TablePart, rows: Row[]) => {
    setValues((c) => { const n = { ...c, tables: { ...c.tables, [part.key]: rows } }; valuesRef.current = n; return n; });
    setSources((c) => { const n = { ...c, [part.key]: "Manual" }; sourcesRef.current = n; return n; });
    touch();
  };

  async function ai(action: "fill" | "analyse" | "undo" | "questions") {
    setAiMsg(null);
    setBusy(action);
    try {
      if (dirty.current) await flush();
      const r = await fetch(`/api/tools/${slug}/ai`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, brief, expectedVersion: versionRef.current }) });
      const d = await readJson(r);
      if (r.status === 409) { conflictRef.current = d.record ?? null; setSaveState("conflict"); return; }
      if (!r.ok) { setAiMsg({ kind: "warn", text: d.error ?? "The AI helper could not do that." }); return; }
      if (action === "questions") {
        setQuestions(d.questions);
        try { localStorage.setItem(questionsKey, JSON.stringify(d.questions)); } catch { /* ignore */ }
        setAiMsg({ kind: "ok", text: `${d.questions.length} questions for your situation are below. They are not saved into the worksheet; use them to prepare your answers.` });
        return;
      }
      apply(d.record);
      setSaveState("saved");
      setAiMsg({
        kind: "ok",
        text: action === "fill" ? `The AI drafted ${d.drafted} part${d.drafted === 1 ? "" : "s"}. They are marked AI-suggested: read them, edit anything, or undo.`
          : action === "analyse" ? "Analysis written. It is based only on what is in the worksheet; check it before you rely on it." : "Your earlier answers are back.",
      });
    } catch { setAiMsg({ kind: "warn", text: "Could not reach the server. Please try again." }); }
    finally { setBusy(null); }
  }

  if (load === "loading") return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Opening your worksheet…</p>;
  if (load === "error") return <p className="my-6 rounded bg-red-50 p-4 text-sm text-red-800">{loadErr}</p>;

  const { filled, total } = completeness(def, values);
  const derived = computeDerived(def, values);
  const outputs = computeOutputs(def, values);
  const currentFields = fieldsFromValues(def, values, sources);
  const stale = !!saved?.analysis && saved.analysisFingerprint !== fingerprintFields(currentFields);
  const nothingYet = filled === 0;

  const renderPart = (p: Part, n: number) => {
    const id = `p-${p.key}`;
    const badge = sources[p.key] === "AI" || sources[p.key] === "Manual + AI"
      ? <span className="ml-2 rounded-sm bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">AI-suggested</span> : null;
    if (p.kind === "field") {
      const f: FieldPart = p;
      return (
        <div key={p.key} className="py-4">
          <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-eccellere-ink">{n}. {f.label}{f.unit ? ` (${f.unit})` : ""}{badge}</label>
          <p className="mt-1 text-xs text-ink-mid">{f.help}</p>
          <div className="mt-2">
            {f.type === "rating" && f.scale ? <Rating id={id} scale={f.scale} value={values.fields[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              : f.type === "select" ? (
                <select id={id} className={input} value={values.fields[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                  <option value="">Not known</option>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "longtext" ? (
                <textarea id={id} rows={4} className={input} value={values.fields[f.key] ?? ""} placeholder={f.example ? `For example: ${f.example}` : undefined} onChange={(e) => setField(f.key, e.target.value)} />
              ) : (
                <input id={id} className={input} inputMode={f.type === "number" ? "decimal" : undefined} value={values.fields[f.key] ?? ""} placeholder={f.example ? `For example: ${f.example}` : undefined} onChange={(e) => setField(f.key, e.target.value)} />
              )}
          </div>
        </div>
      );
    }
    const t: TablePart = p;
    const rows = expandTable(t, values.tables[t.key]);
    const nameKey = labelColumnKey(t);
    const update = (i: number, col: string, v: string) => setRows(t, rows.map((r, j) => (j === i ? { ...r, [col]: v } : r)));
    return (
      <div key={t.key} className="py-4">
        <p id={`${id}-label`} className="text-sm font-medium text-eccellere-ink">{n}. {t.label}{badge}</p>
        <p className="mt-1 text-xs text-ink-mid">{t.help}</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>{t.columns.map((c) => <th key={c.key} scope="col" title={c.help} className="border-b border-eccellere-ink/15 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-light">{c.header}</th>)}<th className="w-8" /></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="align-top">
                  {t.columns.map((c, ci) => (
                    <td key={c.key} className="p-1">
                      {t.fixedRows && ci === 0
                        ? <span className="block px-2 py-2 text-sm font-medium">{r[nameKey]}{t.rowHints?.[r[nameKey]] && <span className="block text-[11px] font-normal text-ink-light">{t.rowHints[r[nameKey]]}</span>}</span>
                        : <Cell id={`${id}-${i}-${c.key}`} col={c} row={r} values={values} onChange={(v) => update(i, c.key, v)} />}
                    </td>
                  ))}
                  <td className="p-1">
                    {!t.fixedRows && rows.length > t.minRows && (
                      <button type="button" aria-label={`Remove ${t.rowLabel.toLowerCase()} ${i + 1}`} className="px-1 py-2 text-ink-light hover:text-red-700" onClick={() => setRows(t, cleanTable(t, rows.filter((_, j) => j !== i)))}>×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!t.fixedRows && rows.length < t.maxRows && (
          <button type="button" className="mt-2 border border-eccellere-ink/20 px-3 py-1.5 text-xs hover:bg-eccellere-cream" onClick={() => setRows(t, [...rows, {}])}>+ Add a {t.rowLabel.toLowerCase()}</button>
        )}
      </div>
    );
  };

  let counter = 0;
  const a = saved?.analysis ?? null;

  return (
    <div className="mt-10">
      <div className="no-print sticky top-[72px] z-20 -mx-2 flex flex-wrap items-center gap-3 border-b border-eccellere-ink/10 bg-eccellere-cream/95 px-2 py-2 backdrop-blur" role="status" aria-live="polite">
        <div className="h-2 w-40 bg-white"><div className="h-2 bg-eccellere-gold transition-all" style={{ width: `${total ? (filled / total) * 100 : 0}%` }} /></div>
        <span className="text-xs text-ink-mid">{filled} of {total} parts started</span>
        <span className={cn("text-xs", saveState === "error" ? "text-red-700" : "text-ink-light")}>
          {saveState === "pending" && "Unsaved changes…"}{saveState === "saving" && "Saving…"}{saveState === "saved" && <><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />Saved</>}
          {saveState === "error" && saveErr}{saveState === "idle" && saved && "All saved"}
        </span>
        {sample && <button type="button" onClick={() => setShowExample((v) => !v)} className="inline-flex items-center gap-1 border border-eccellere-ink/20 bg-white px-3 py-1.5 text-xs hover:bg-eccellere-cream"><BookOpen className="h-3.5 w-3.5" /> {showExample ? "Hide" : "See"} a worked example</button>}
        <button type="button" onClick={() => window.print()} className="ml-auto inline-flex items-center gap-1 border border-eccellere-ink/20 bg-white px-3 py-1.5 text-xs hover:bg-eccellere-cream"><Printer className="h-3.5 w-3.5" /> Print or save as PDF</button>
      </div>

      {showExample && sample && <ExamplePanel def={def} sample={sample} onClose={() => setShowExample(false)} />}

      {saveState === "conflict" && (
        <div className="no-print mt-4 rounded bg-amber-50 p-4 text-sm text-amber-900">
          <p><AlertTriangle className="mr-1 inline h-4 w-4" />This worksheet was changed in another tab or window, so your latest edits were not saved.</p>
          <button className="mt-2 border border-amber-700 px-3 py-1.5 text-xs" onClick={() => { apply(conflictRef.current); setSaveState("saved"); dirty.current = false; }}>Load the saved version (discards what is on this page)</button>
        </div>
      )}

      <section className="no-print mt-6 rounded border border-violet-200 bg-violet-50/60 p-4" aria-labelledby="ai-help">
        <h2 id="ai-help" className="flex items-center gap-2 text-sm font-medium text-eccellere-ink"><Sparkles className="h-4 w-4 text-violet-700" /> AI help</h2>
        <p className="mt-1 text-xs text-ink-mid">Describe your situation in a few sentences. The AI can suggest questions to think through, draft the parts you have not filled in, and write the analysis using that context. Your own answers are never changed. Suggestions are marked and can be undone.</p>
        <textarea className={cn(input, "mt-2")} rows={3} value={brief} onChange={(e) => changeBrief(e.target.value)} placeholder="For example: we are a 200-person distributor and late customer payments are hurting cash flow…" aria-label="Your situation" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={!!busy || (!brief.trim() && nothingYet)} onClick={() => ai("fill")} className="bg-violet-700 px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40">
            {busy === "fill" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Drafting…</> : "Draft the empty parts"}
          </button>
          <button type="button" disabled={!!busy || !brief.trim()} onClick={() => ai("questions")} className="inline-flex items-center gap-1 border border-violet-300 bg-white px-3 py-2 text-xs disabled:opacity-40">
            {busy === "questions" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Thinking…</> : <><HelpCircle className="h-3.5 w-3.5" /> Suggest questions for my situation</>}
          </button>
          {saved?.previousFields && <button type="button" disabled={!!busy} onClick={() => ai("undo")} className="inline-flex items-center gap-1 border border-violet-300 bg-white px-3 py-2 text-xs"><Undo2 className="h-3.5 w-3.5" /> Undo the AI draft</button>}
        </div>
        {aiMsg && <p className={cn("mt-2 text-sm", aiMsg.kind === "ok" ? "text-emerald-800" : "text-red-700")}>{aiMsg.text}</p>}
        {questions.length > 0 && (
          <div className="mt-3 rounded bg-white p-3" aria-label="Questions for your situation">
            <h3 className="text-sm font-medium text-eccellere-ink">Questions to think through for your situation</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
              {questions.map((q, i) => <li key={i}><span className="text-eccellere-ink">{q.question}</span>{q.why && <span className="block text-xs text-ink-light">{q.why}</span>}</li>)}
            </ol>
            <button type="button" className="mt-2 text-[11px] text-ink-light underline" onClick={() => { setQuestions([]); try { localStorage.removeItem(questionsKey); } catch { /* ignore */ } }}>Clear these questions</button>
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-ink-mid">Leave anything you do not know blank. It is treated as <strong>not known</strong>, never as zero, and the analysis says so.</p>

      {def.sections.map((s, si) => (
        <section key={s.key} className="mt-6 rounded bg-white p-5 shadow-sm break-inside-avoid" aria-labelledby={`s-${s.key}`}>
          <h2 id={`s-${s.key}`} className="font-display text-xl font-medium text-eccellere-ink">{si + 1}. {s.title}</h2>
          <p className="text-sm text-ink-mid">{s.summary}</p>
          <div className="divide-y divide-eccellere-ink/5">{s.parts.map((p) => renderPart(p, ++counter))}</div>
        </section>
      ))}

      <section className="mt-6 rounded bg-eccellere-ink p-5 text-white break-inside-avoid" aria-labelledby="results">
        <h2 id="results" className="font-display text-xl font-medium">Results at a glance</h2>
        {derived.length + outputs.length === 0 ? <p className="mt-2 text-sm text-white/60">This tool has no calculated results.</p> : (
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            {derived.map((d) => <div key={d.key}><dt className="text-[11px] uppercase tracking-wider text-white/50">{d.label}</dt><dd className="text-lg">{d.value ?? <span className="text-sm text-white/50">Needs more input</span>}</dd></div>)}
            {outputs.map((o) => <div key={o.key}><dt className="text-[11px] uppercase tracking-wider text-white/50">{o.label}</dt><dd className="text-lg">{o.value || <span className="text-sm text-white/50">Needs more input</span>}</dd></div>)}
          </dl>
        )}
        <p className="mt-3 text-[11px] text-white/50">Calculated by the worksheet from your numbers, not by AI.</p>
      </section>

      <section className="mt-6 rounded bg-white p-5 shadow-sm" aria-labelledby="analysis">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="analysis" className="font-display text-xl font-medium text-eccellere-ink">Analysis and actions</h2>
          <button type="button" disabled={!!busy || filled < 2} onClick={() => ai("analyse")} className="no-print ml-auto bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40">
            {busy === "analyse" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Analysing…</> : a ? "Write it again" : "Analyse my worksheet"}
          </button>
        </div>
        {!a && <p className="mt-2 text-sm text-ink-mid">{filled < 2 ? "Fill in a couple of parts, then ask for the analysis." : "Ask for the analysis when you have filled in what you can."}</p>}
        {a && (
          <div className="mt-4 space-y-5 text-sm">
            {stale && <p className="no-print rounded bg-amber-50 p-3 text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />You have changed your answers since this was written. Press &ldquo;Write it again&rdquo; to bring it up to date.</p>}
            <p className="text-ink-mid">{a.summary}</p>
            {a.verdict && <p className="border-l-4 border-eccellere-gold bg-eccellere-cream p-3"><strong>{a.verdict.label}.</strong> {a.verdict.rationale}</p>}
            {a.findings.length > 0 && (<div><h3 className="font-medium text-eccellere-ink">What the answers show</h3><ul className="mt-2 space-y-2">{a.findings.map((f, i) => <li key={i}><strong>{f.title}.</strong> {f.detail}</li>)}</ul></div>)}
            {a.watchouts.length > 0 && (<div><h3 className="font-medium text-eccellere-ink">Watch-outs</h3><ul className="mt-2 list-disc space-y-1 pl-5">{a.watchouts.map((w, i) => <li key={i}>{w}</li>)}</ul></div>)}
            {saved!.recommendations.length > 0 && (<div><h3 className="font-medium text-eccellere-ink">Recommendations</h3><ol className="mt-2 list-decimal space-y-1 pl-5">{saved!.recommendations.map((r, i) => <li key={i}>{r.text}</li>)}</ol></div>)}
            {saved!.actionables.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="font-medium text-eccellere-ink">Action plan</h3>
                <table className="mt-2 w-full min-w-[520px] border-collapse text-left">
                  <thead><tr className="text-[11px] uppercase tracking-wide text-ink-light"><th className="pb-1 pr-3">Action</th><th className="pb-1 pr-3">Owner (role)</th><th className="pb-1 pr-3">When</th><th className="pb-1">Priority</th></tr></thead>
                  <tbody>{saved!.actionables.map((x, i) => <tr key={i} className="border-t border-eccellere-ink/10 align-top"><td className="py-2 pr-3">{x.action}</td><td className="py-2 pr-3">{x.owner}</td><td className="py-2 pr-3">{x.timeframe}</td><td className="py-2">{x.priority}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {a.figuresToCheck && a.figuresToCheck.length > 0 && (
              <p className="rounded bg-amber-50 p-3 text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />Check these figures. They are in the write-up but not in your answers or the worksheet&apos;s calculations: {a.figuresToCheck.join(", ")}.</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-6 rounded border border-eccellere-ink/10 bg-white/60 p-5 text-xs text-ink-mid break-inside-avoid" aria-labelledby="limits">
        <h2 id="limits" className="text-sm font-medium text-eccellere-ink">Sources, assumptions and limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{toolName} is a general method. The answers, figures and judgements above are yours; the worksheet does not know your business beyond what you entered.</li>
          <li>Blank answers are treated as not known. Calculations use only the numbers you entered, and show nothing until there is enough input.</li>
          <li>Parts marked AI-suggested, and the analysis, were drafted by AI from your worksheet. {a ? `The analysis was written ${saved?.analysisAt ? new Date(saved.analysisAt).toLocaleDateString() : "recently"}${a.figuresToCheck?.length ? ` and ${a.figuresToCheck.length} figure${a.figuresToCheck.length === 1 ? " was" : "s were"} flagged for you to check` : ""}.` : "No analysis has been written yet."}</li>
          <li>AI text is a draft for your judgement. A person in your organisation should approve any decision that comes from it.</li>
          <li>Your work is private to your account.</li>
        </ul>
      </section>
    </div>
  );
}
