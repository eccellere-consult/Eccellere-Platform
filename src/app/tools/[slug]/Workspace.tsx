"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, Sparkles, Undo2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { interpret, type DeclarativeTool } from "@/lib/strategyModels/declarative";
import { cleanTable, completeness, computeDerived, computeOutputs, evalColumn, expandTable, fieldsFromValues, valuesFromFields, labelColumnKey } from "@/lib/strategyModels/values";
import type { Column, FieldPart, ModelDefinition, ModelValues, Part, Row, TablePart } from "@/lib/strategyModels/types";
import { loadModelDefinition } from "@/lib/strategyModels/groups";
import { BTN_LINE, BTN_MAIN, CARD, FIELD, LABEL } from "../styles";
import { worksheetText } from "@/lib/tools/worksheetText";
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
const input = FIELD;

/** 1-to-5 (or whatever the scale is) as a row of square buttons, the way the Strategy Hub pages show a rating. */
function Rating({ label, scale, value, onChange }: { label: string; scale: { min: number; max: number; low: string; high: string }; value: string; onChange: (v: string) => void }) {
  const steps = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => String(scale.min + i));
  return (
    <div role="radiogroup" aria-label={`${label} (${scale.min} = ${scale.low}, ${scale.max} = ${scale.high})`} className="inline-flex border border-eccellere-border">
      {steps.map((s) => (
        <button key={s} type="button" role="radio" aria-checked={value === s} onClick={() => onChange(value === s ? "" : s)}
          className={cn("h-8 w-8 border-r border-eccellere-border text-sm font-medium last:border-r-0 transition-colors", value === s ? "bg-eccellere-gold-deep text-white" : "bg-white text-eccellere-ink hover:bg-eccellere-cream")}>{s}</button>
      ))}
    </div>
  );
}

const cellLabel = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-light";

/** One column of a row card: its small capitals label (with the scale legend for a rating), then the control. */
function Cell({ col, row, values, onChange, id }: { col: Column; row: Row; values: ModelValues; onChange: (v: string) => void; id: string }) {
  const v = row[col.key] ?? "";
  const legend = col.type === "rating" && col.scale ? <span className="mt-0.5 block text-[11px] normal-case tracking-normal text-ink-light">{col.scale.min} = {col.scale.low}<br />{col.scale.max} = {col.scale.high}</span> : null;
  let control: React.ReactNode;
  if (col.type === "computed") control = <span id={id} className="block py-1.5 text-sm font-medium text-eccellere-ink">{evalColumn(col, row, values) || <span className="text-ink-light">&mdash;</span>}</span>;
  else if (col.type === "select") control = (
    <select id={id} className={input} value={v} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose…</option>{(col.options ?? []).map((o) => <option key={o}>{o}</option>)}
    </select>
  );
  else if (col.type === "rating" && col.scale) control = <Rating label={col.header} scale={col.scale} value={v} onChange={onChange} />;
  else if (col.type === "longtext") control = <textarea id={id} rows={3} className={input} value={v} onChange={(e) => onChange(e.target.value)} />;
  else control = <input id={id} className={cn(input, col.type === "number" && "max-w-[160px]")} inputMode={col.type === "number" ? "decimal" : undefined} value={v} onChange={(e) => onChange(e.target.value)} />;
  return (
    <div className={cn(col.type === "longtext" && "basis-full", col.type === "text" && "min-w-[220px] flex-1")}>
      <label htmlFor={id} className={cellLabel} title={col.help}>{col.header}{col.unit ? ` (${col.unit})` : ""}{legend}</label>
      <div className="mt-1.5">{control}</div>
    </div>
  );
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
    <section className={`${CARD} no-print`} aria-label="Worked example">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="m-0 font-display text-2xl font-light text-eccellere-ink">Worked example (fictional)</h2>
          <p className="mt-1 text-sm text-ink-mid">{sample.scenario}</p>
          <p className="mt-1 text-[11px] text-ink-light">An invented situation to show what good looks like. It is not saved and does not change your worksheet.</p>
        </div>
        <button type="button" className={`${BTN_LINE} px-3 py-1.5 text-xs`} onClick={onClose}>Close</button>
      </div>
      <div className="mt-4 space-y-4 text-sm">
        {def.sections.map((sec) => {
          const rows = sec.parts.filter((p) => (p.kind === "field" ? !!sample.values[p.key] : !!sample.tables[p.key]?.length));
          if (!rows.length) return null;
          return (
            <div key={sec.key}>
              <h3 className={LABEL}>{sec.title}</h3>
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ kind: "ok" | "warn"; text: string; notes: string[] } | null>(null);
  const [busy, setBusy] = useState<"fill" | "analyse" | "undo" | "questions" | null>(null);
  const [busySection, setBusySection] = useState<string | null>(null);
  const [secMsg, setSecMsg] = useState<{ key: string; kind: "ok" | "warn"; text: string } | null>(null);
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
      // 402: not on a paid plan. Retrying cannot help, so do not keep the change queued (that would retry every few seconds).
      if (r.status === 402) { setSaveErr(d.error ?? "Saving your own work needs a paid plan."); setSaveState("error"); return false; }
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

  async function downloadWorkbook(withSample: boolean) {
    try {
      const wbk = await import("@/lib/tools/workbook");
      const bytes = wbk.workbookBytes(wbk.buildWorkbook(toolName, def, withSample ? sample : null));
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url; link.download = `${slug}-${withSample ? "sample" : "template"}.xlsx`; link.click();
      URL.revokeObjectURL(url);
    } catch { setUploadMsg({ kind: "warn", text: "Your browser could not make the workbook. Please try again.", notes: [] }); }
  }

  /** Reads a filled template and puts its answers into the worksheet (autosave then keeps them). Answers not in the file stay as they are. */
  async function uploadWorkbook(file: File) {
    setUploadMsg(null);
    if (!/\.xlsx$/i.test(file.name)) return setUploadMsg({ kind: "warn", text: "Please choose the Excel template (.xlsx) downloaded from this page.", notes: [] });
    try {
      const wbk = await import("@/lib/tools/workbook");
      const r = wbk.readWorkbook(def, await file.arrayBuffer());
      if (!r.answered) return setUploadMsg({ kind: "warn", text: "No answers were found in that file.", notes: r.notes });
      const next: ModelValues = { fields: { ...valuesRef.current.fields, ...r.values.fields }, tables: { ...valuesRef.current.tables, ...r.values.tables } };
      setValues(next); valuesRef.current = next;
      const src = { ...sourcesRef.current, ...Object.fromEntries([...Object.keys(r.values.fields), ...Object.keys(r.values.tables)].map((k) => [k, "Manual"])) };
      setSources(src); sourcesRef.current = src;
      touch();
      setUploadMsg({ kind: "ok", text: `Read ${r.answered} part${r.answered === 1 ? "" : "s"} from ${file.name}. Check them below; your work saves as usual.`, notes: r.notes });
    } catch { setUploadMsg({ kind: "warn", text: "That file could not be read. Is it the Excel template from this page?", notes: [] }); }
  }

  async function ai(action: "fill" | "analyse" | "undo" | "questions", sectionKey?: string) {
    const say = (m: { kind: "ok" | "warn"; text: string } | null) => { if (sectionKey && m) setSecMsg({ ...m, key: sectionKey }); else setAiMsg(m); };
    setAiMsg(null); setSecMsg(null);
    setBusy(action);
    setBusySection(sectionKey ?? null);
    try {
      if (dirty.current) await flush();
      const r = await fetch(`/api/tools/${slug}/ai`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, brief, sectionKey, questions: action === "fill" ? questions : undefined, expectedVersion: versionRef.current }) });
      const d = await readJson(r);
      if (r.status === 409) { conflictRef.current = d.record ?? null; setSaveState("conflict"); return; }
      if (!r.ok) { say({ kind: "warn", text: d.error ?? "The AI helper could not do that." }); return; }
      if (action === "questions") {
        setQuestions(d.questions);
        try { localStorage.setItem(questionsKey, JSON.stringify(d.questions)); } catch { /* ignore */ }
        say({ kind: "ok", text: `${d.questions.length} questions for your situation are below. They are not saved into the worksheet; use them to prepare your answers.` });
        return;
      }
      apply(d.record);
      setSaveState("saved");
      say({
        kind: "ok",
        text: action === "fill" ? `The AI drafted ${d.drafted} part${d.drafted === 1 ? "" : "s"}. They are marked AI-suggested: read them, edit anything, or undo.`
          : action === "analyse" ? "Analysis written. It is based only on what is in the worksheet; check it before you rely on it." : "Your earlier answers are back.",
      });
    } catch { say({ kind: "warn", text: "Could not reach the server. Please try again." }); }
    finally { setBusy(null); setBusySection(null); }
  }

  if (load === "loading") return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Opening your worksheet…</p>;
  if (load === "error") return <p className="my-6 rounded bg-red-50 p-4 text-sm text-red-800">{loadErr}</p>;

  const { filled, total } = completeness(def, values);
  const derived = computeDerived(def, values);
  const outputs = computeOutputs(def, values);
  const currentFields = fieldsFromValues(def, values, sources);
  const stale = !!saved?.analysis && saved.analysisFingerprint !== fingerprintFields(currentFields);
  const nothingYet = filled === 0;

  const aiBadge = (key: string) => (sources[key] === "AI" || sources[key] === "Manual + AI"
    ? <span className="ml-2 rounded-sm bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-800">AI-suggested</span> : null);

  const renderPart = (p: Part) => {
    const id = `p-${p.key}`;
    const badge = aiBadge(p.key);
    if (p.kind === "field") {
      const f: FieldPart = p;
      const eg = f.example ? `e.g. ${f.example}` : undefined;
      return (
        <div key={p.key} className="mt-7">
          <label id={`${id}-label`} htmlFor={id} className="block text-sm leading-relaxed font-semibold text-eccellere-ink">{f.label}{f.unit ? ` (${f.unit})` : ""}{badge}</label>
          <p className="mt-1 text-xs text-ink-light">{f.help}</p>
          <div className="mt-2.5">
            {f.type === "rating" && f.scale ? <Rating label={f.label} scale={f.scale} value={values.fields[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              : f.type === "select" ? (
                <select id={id} className={input} value={values.fields[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                  <option value="">Choose…</option>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "longtext" ? (
                <textarea id={id} rows={4} className={input} value={values.fields[f.key] ?? ""} placeholder={eg} onChange={(e) => setField(f.key, e.target.value)} />
              ) : (
                <input id={id} className={input} inputMode={f.type === "number" ? "decimal" : undefined} value={values.fields[f.key] ?? ""} placeholder={eg} onChange={(e) => setField(f.key, e.target.value)} />
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
      <div key={t.key} className="mt-7">
        <p id={`${id}-label`} className="text-sm leading-relaxed font-semibold text-eccellere-ink">{t.label}{badge}</p>
        <p className="mt-1 text-xs text-ink-light">{t.help}</p>
        <div className="mt-3 border border-eccellere-border">
          {rows.map((r, i) => (
            <div key={i} className={cn("p-4", i > 0 && "border-t border-eccellere-border")}>
              {t.fixedRows && (
                <div className="mb-3">
                  <p className="text-sm leading-relaxed font-semibold text-eccellere-ink">{r[nameKey]}</p>
                  {t.rowHints?.[r[nameKey]] && <p className="mt-0.5 text-xs text-ink-light">{t.rowHints[r[nameKey]]}</p>}
                </div>
              )}
              <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                {t.columns.filter((c, ci) => !(t.fixedRows && ci === 0)).map((c) => (
                  <Cell key={c.key} id={`${id}-${i}-${c.key}`} col={c} row={r} values={values} onChange={(v) => update(i, c.key, v)} />
                ))}
              </div>
              {!t.fixedRows && rows.length > t.minRows && (
                <button type="button" aria-label={`Remove ${t.rowLabel.toLowerCase()} ${i + 1}`} className="mt-3 text-xs text-ink-light underline hover:text-red-700" onClick={() => setRows(t, cleanTable(t, rows.filter((_, j) => j !== i)))}>Remove this {t.rowLabel.toLowerCase()}</button>
              )}
            </div>
          ))}
        </div>
        {!t.fixedRows && rows.length < t.maxRows && (
          <button type="button" className={cn(BTN_LINE, "mt-3 px-3 py-1.5 text-xs")} onClick={() => setRows(t, [...rows, {}])}>+ Add a {t.rowLabel.toLowerCase()}</button>
        )}
      </div>
    );
  };

  const a = saved?.analysis ?? null;
  const saveText = saveState === "pending" ? "Unsaved changes…" : saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? saveErr : saved ? "All saved" : "Your work saves as you type.";

  function download() {
    const text = worksheetText({ toolName, def, values, analysis: a, recommendations: saved?.recommendations, actionables: saved?.actionables });
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = `${slug}.txt`; link.click();
      URL.revokeObjectURL(url);
    } catch { setAiMsg({ kind: "warn", text: "Your browser could not make the download. Use Print, then save as PDF." }); }
  }

  return (
    <div>
      {/* AI help: the situation note, the questions and the draft of the empty parts */}
      <section className={cn(CARD, "no-print")} aria-labelledby="ai-help">
        <h2 id="ai-help" className={cn(LABEL, "flex items-center gap-2")}><Sparkles className="h-3.5 w-3.5" /> AI help</h2>
        <p className="mt-2 text-sm text-ink-mid">Describe your situation in a few sentences. The AI can suggest questions to think through, draft the parts you have not filled in, and write the analysis using that context. Your own answers are never changed. Suggestions are marked and can be undone.</p>
        <textarea className={cn(input, "mt-3")} rows={3} value={brief} onChange={(e) => changeBrief(e.target.value)} placeholder="e.g. we are a 200-person distributor and late customer payments are hurting cash flow…" aria-label="Your situation" />
        <button type="button" disabled={!!busy || (!brief.trim() && nothingYet)} onClick={() => ai("fill")} className={cn(BTN_MAIN, "mt-3 w-full")}>
          {busy === "fill" && !busySection ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Drafting…</> : "Draft the empty parts"}
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!!busy || !brief.trim()} onClick={() => ai("questions")} className={cn(BTN_LINE, "inline-flex items-center gap-1 px-3 py-1.5 text-xs")}>
            {busy === "questions" ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Thinking…</> : <><HelpCircle className="h-3.5 w-3.5" /> Suggest questions for my situation</>}
          </button>
          {saved?.previousFields && <button type="button" disabled={!!busy} onClick={() => ai("undo")} className={cn(BTN_LINE, "inline-flex items-center gap-1 px-3 py-1.5 text-xs")}><Undo2 className="h-3.5 w-3.5" /> Undo the AI draft</button>}
        </div>
        {aiMsg && <p className={cn("mt-3 text-sm", aiMsg.kind === "ok" ? "text-eccellere-teal" : "text-red-700")}>{aiMsg.text}</p>}
        {questions.length > 0 && (
          <div className="mt-4 border border-eccellere-border bg-eccellere-cream/60 p-4" aria-label="Questions for your situation">
            <h3 className="text-sm font-semibold text-eccellere-ink">Questions to think through for your situation</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
              {questions.map((q, i) => <li key={i}><span className="text-eccellere-ink">{q.question}</span>{q.why && <span className="block text-xs text-ink-light">{q.why}</span>}</li>)}
            </ol>
            <button type="button" className="mt-2 text-[11px] text-ink-light underline" onClick={() => { setQuestions([]); try { localStorage.removeItem(questionsKey); } catch { /* ignore */ } }}>Clear these questions</button>
          </div>
        )}
      </section>

      <section className={cn(CARD, "no-print")} aria-label="Worked example and template">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="min-w-[260px] flex-1">
            <p className={LABEL}>{sample ? "Worked example & template" : "Template"}</p>
            <h2 className="m-0 mt-1 font-display text-2xl font-light text-eccellere-ink">{sample ? "See it worked — or fill it in offline" : "Fill it in offline"}</h2>
            <p className="mt-2 text-sm text-ink-light">{sample ? "A fictional company's completed example, a blank Excel template that mirrors the form below, and an upload that reads a filled one back. No AI is needed." : "A blank Excel template that mirrors the form below, and an upload that reads a filled one back. No AI is needed."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {sample && <button type="button" onClick={() => setShowExample((v) => !v)} className={BTN_MAIN}>{showExample ? "Hide the worked example" : "See a worked example"}</button>}
            <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()} className={BTN_LINE}>Upload a filled template</button>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" aria-label="Upload a filled template" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadWorkbook(f); }} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-eccellere-border pt-4">
          <p className="text-xs text-ink-light">New to this? The template has a &ldquo;How to fill&rdquo; sheet. The sample is a fictional company and is never saved as your data. Only a filled template of this tool is read; it fills your worksheet and replaces the answers it contains.</p>
          <div className="flex gap-4 text-xs font-medium text-eccellere-gold-deep">
            {sample && <button type="button" className="underline" onClick={() => void downloadWorkbook(true)}>Download sample workbook</button>}
            <button type="button" className="underline" onClick={() => void downloadWorkbook(false)}>Download blank template</button>
          </div>
        </div>
        {uploadMsg && <p className={cn("mt-3 text-sm", uploadMsg.kind === "ok" ? "text-eccellere-teal" : "text-red-700")}>{uploadMsg.text}{uploadMsg.notes.length > 0 && <span className="mt-1 block text-xs text-ink-mid">{uploadMsg.notes.join(" ")}</span>}</p>}
      </section>
      {showExample && sample && <ExamplePanel def={def} sample={sample} onClose={() => setShowExample(false)} />}

      {saveState === "conflict" && (
        <div className="no-print mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p><AlertTriangle className="mr-1 inline h-4 w-4" />This worksheet was changed in another tab or window, so your latest edits were not saved.</p>
          <button className="mt-2 border border-amber-700 px-3 py-1.5 text-xs" onClick={() => { apply(conflictRef.current); setSaveState("saved"); dirty.current = false; }}>Load the saved version (discards what is on this page)</button>
        </div>
      )}

      {/* progress and saving */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1" role="status" aria-live="polite">
        <p id="stage-2" className={cn(LABEL, "scroll-mt-24")}>Guided fill-in &mdash; no length limit, be as detailed as the evidence supports</p>
        <p className={cn("text-xs font-medium", saveState === "error" ? "text-red-700" : "text-eccellere-teal")}>
          {saveState === "saved" && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}{saveText}
        </p>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 w-24 bg-eccellere-border"><div className="h-1.5 bg-eccellere-gold transition-all" style={{ width: `${total ? (filled / total) * 100 : 0}%` }} /></div>
        <span className="text-xs text-ink-mid">{filled} of {total} parts answered</span>
      </div>
      <p className="mb-6 text-xs text-ink-light">Leave anything you do not know blank. It is treated as <strong>not known</strong>, never as zero, and the analysis says so.</p>

      {def.sections.map((s) => (
        <section key={s.key} className={cn(CARD, "break-inside-avoid")} aria-labelledby={`s-${s.key}`}>
          <h3 id={`s-${s.key}`} className={`${LABEL} m-0`}>{s.title}</h3>
          <p className="mt-1.5 text-sm text-ink-mid">{s.summary}</p>
          <div className="no-print mt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={!!busy || (!brief.trim() && nothingYet)} onClick={() => ai("fill", s.key)} className={cn(BTN_LINE, "inline-flex items-center gap-1 px-3 py-1.5 text-xs")}>
              {busy === "fill" && busySection === s.key ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Drafting this section…</> : <><Sparkles className="h-3.5 w-3.5" /> Draft this section with AI</>}
            </button>
            <span className="text-[11px] text-ink-light">{!brief.trim() && nothingYet ? "Describe your situation in AI help (top of the page) first." : questions.length ? "Uses your situation note and the suggested questions. Only empty parts are drafted; your answers are never changed." : "Uses your situation note. Only empty parts are drafted; your answers are never changed."}</span>
          </div>
          {secMsg?.key === s.key && <p role="status" className={cn("no-print mt-3 text-sm", secMsg.kind === "ok" ? "text-eccellere-teal" : "text-red-700")}>{secMsg.text}</p>}
          {s.parts.map((p) => renderPart(p))}
        </section>
      ))}

      {derived.length + outputs.length > 0 && (
        <section className={cn(CARD, "break-inside-avoid")} aria-labelledby="results">
          <h3 id="results" className={`${LABEL} m-0`}>Results at a glance</h3>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            {derived.map((d) => <div key={d.key}><dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-light">{d.label}</dt><dd className="mt-1 font-display text-2xl text-eccellere-ink">{d.value ?? <span className="font-sans text-sm text-ink-light">Needs more input</span>}</dd></div>)}
            {outputs.map((o) => <div key={o.key}><dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-light">{o.label}</dt><dd className="mt-1 font-display text-2xl text-eccellere-ink">{o.value || <span className="font-sans text-sm text-ink-light">Needs more input</span>}</dd></div>)}
          </dl>
          <p className="mt-4 text-[11px] text-ink-light">Calculated by the worksheet from your numbers, not by AI.</p>
        </section>
      )}

      <div className="no-print mb-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className={BTN_LINE}>Print</button>
        <button type="button" onClick={download} className={BTN_LINE}>Download</button>
      </div>

      <section id="stage-3" className={cn(CARD, "scroll-mt-24")} aria-labelledby="analysis">
        <p className={LABEL}>End output</p>
        <h2 id="analysis" className="m-0 mt-1 font-display text-2xl font-light text-eccellere-ink">Analysis, Recommendations &amp; Actionables</h2>
        <button type="button" disabled={!!busy || filled < 1} onClick={() => ai("analyse")} className="no-print mt-4 w-full bg-eccellere-ink px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:bg-ink-light disabled:opacity-100">
          {busy === "analyse" ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Analysing…</> : a ? "Write it again" : "Analyse & recommend"}
        </button>
        {!a && <p className="mt-3 text-xs text-ink-light">{filled < 1 ? "Fill in at least one part first — the analysis is grounded in your answers." : "Ask for the analysis when you have filled in what you can."}</p>}
        {a && (
          <div className="mt-6 space-y-6 text-sm">
            {stale && <p className="no-print border border-amber-300 bg-amber-50 p-3 text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />You have changed your answers since this was written. Press &ldquo;Write it again&rdquo; to bring it up to date.</p>}
            <p className="text-sm leading-relaxed text-ink-mid">{a.summary}</p>
            {a.verdict && <p className="border-l-4 border-eccellere-gold bg-eccellere-cream p-4 leading-relaxed"><strong>{a.verdict.label}.</strong> {a.verdict.rationale}</p>}
            {a.findings.length > 0 && (<div><h3 className={LABEL}>What the answers show</h3><ul className="mt-2 space-y-2 leading-relaxed">{a.findings.map((f, i) => <li key={i}><strong>{f.title}.</strong> {f.detail}</li>)}</ul></div>)}
            {a.watchouts.length > 0 && (<div><h3 className={LABEL}>Watch-outs</h3><ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">{a.watchouts.map((w, i) => <li key={i}>{w}</li>)}</ul></div>)}
            {saved!.recommendations.length > 0 && (<div><h3 className={LABEL}>Recommendations</h3><ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">{saved!.recommendations.map((r, i) => <li key={i}>{r.text}</li>)}</ol></div>)}
            {saved!.actionables.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className={LABEL}>Action plan</h3>
                <table className="mt-2 w-full min-w-[520px] border-collapse text-left">
                  <thead><tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-light"><th className="border-b border-eccellere-border pb-1 pr-3">Action</th><th className="border-b border-eccellere-border pb-1 pr-3">Owner (role)</th><th className="border-b border-eccellere-border pb-1 pr-3">When</th><th className="border-b border-eccellere-border pb-1">Priority</th></tr></thead>
                  <tbody>{saved!.actionables.map((x, i) => <tr key={i} className="border-t border-eccellere-border align-top"><td className="py-2 pr-3">{x.action}</td><td className="py-2 pr-3">{x.owner}</td><td className="py-2 pr-3">{x.timeframe}</td><td className="py-2">{x.priority}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {a.figuresToCheck && a.figuresToCheck.length > 0 && (
              <p className="border border-amber-300 bg-amber-50 p-3 text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />Check these figures. They are in the write-up but not in your answers or the worksheet&apos;s calculations: {a.figuresToCheck.join(", ")}.</p>
            )}
          </div>
        )}
      </section>

      <details className="border border-eccellere-border bg-white p-5 text-xs text-ink-mid break-inside-avoid md:px-8" aria-labelledby="limits">
        <summary id="limits" className="flex cursor-pointer list-none items-center justify-between"><span className={LABEL}>Methodology</span><span className="text-xs text-eccellere-gold-deep">How is this analysed? &darr;</span></summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
          <li>{toolName} is a general method. The answers, figures and judgements above are yours; the worksheet does not know your business beyond what you entered.</li>
          <li>Blank answers are treated as not known. Calculations use only the numbers you entered, and show nothing until there is enough input.</li>
          <li>Parts marked AI-suggested, and the analysis, were drafted by AI from your worksheet. {a ? `The analysis was written ${saved?.analysisAt ? new Date(saved.analysisAt).toLocaleDateString() : "recently"}${a.figuresToCheck?.length ? ` and ${a.figuresToCheck.length} figure${a.figuresToCheck.length === 1 ? " was" : "s were"} flagged for you to check` : ""}.` : "No analysis has been written yet."}</li>
          <li>AI text is a draft for your judgement. A person in your organisation should approve any decision that comes from it.</li>
          <li>Your work is private to your account.</li>
        </ul>
      </details>
    </div>
  );
}
