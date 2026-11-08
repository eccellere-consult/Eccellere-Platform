"use client";

import { useMemo, useRef, useState } from "react";
import { interpret, sampleOf, type DeclarativeTool } from "@/lib/strategyModels/declarative";
import type { Column, ModelValues, Row, TablePart } from "@/lib/strategyModels/types";
import { expandTable, evalColumn, cleanTable, labelColumnKey } from "@/lib/strategyModels/values";
import { hasReport, reportOf } from "@/lib/agents/report";

/**
 * "Use it on your data": fill the agent's form on this page, or upload the Excel template, and read the report straight away.
 * Works without an account. Nothing is saved or sent anywhere (the figures stay in this browser tab), and no AI is used.
 * The report can be printed or saved as PDF, or downloaded as Excel. Saving, AI help and versioning stay in the full tool.
 */
const INPUT = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-eccellere-gold";
const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep";
const BTN = "border border-eccellere-ink px-4 py-2 text-sm font-medium text-eccellere-ink hover:bg-eccellere-ink hover:text-eccellere-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-eccellere-gold";
const BTN_GOLD = "bg-eccellere-gold px-4 py-2 text-sm font-medium text-eccellere-ink hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-eccellere-ink";

function Control({ col, row, values, id, onChange }: { col: Column; row: Row; values: ModelValues; id: string; onChange: (v: string) => void }) {
  const v = row[col.key] ?? "";
  if (col.type === "computed") return <span id={id} className="block py-2 text-sm font-medium text-eccellere-ink">{evalColumn(col, row, values) || "—"}</span>;
  if (col.type === "select") {
    return <select id={id} className={INPUT} value={v} onChange={(e) => onChange(e.target.value)}><option value="">Choose…</option>{(col.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>;
  }
  if (col.type === "longtext") return <textarea id={id} rows={3} className={INPUT} value={v} onChange={(e) => onChange(e.target.value)} />;
  return <input id={id} className={INPUT} inputMode={col.type === "number" || col.type === "rating" ? "decimal" : undefined} value={v} onChange={(e) => onChange(e.target.value)} />;
}

export default function AgentRunner({ tool, slug, name }: { tool: DeclarativeTool; slug: string; name: string }) {
  const def = useMemo(() => interpret(tool), [tool]);
  const sample = useMemo(() => sampleOf(tool), [tool]);
  const [values, setValues] = useState<ModelValues>({ fields: {}, tables: {} });
  const [isSample, setIsSample] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const parts = def.sections.flatMap((s) => s.parts);
  const report = useMemo(() => reportOf(def, values), [def, values]);
  const ready = hasReport(report);
  const maxBar = (c: { bars: { value: number }[] }) => Math.max(...c.bars.map((b) => Math.abs(b.value)), 1e-9);

  const setField = (k: string, v: string) => { setIsSample(false); setValues((c) => ({ ...c, fields: { ...c.fields, [k]: v } })); };
  const setRows = (t: TablePart, rows: Row[]) => { setIsSample(false); setValues((c) => ({ ...c, tables: { ...c.tables, [t.key]: rows } })); };

  function loadSample() {
    if (!sample) return;
    setValues({ fields: { ...sample.values }, tables: JSON.parse(JSON.stringify(sample.tables)) });
    setIsSample(true); setMsg({ kind: "ok", text: "Sample loaded: a fictional company. Change any figure to try your own." });
  }
  function clearAll() { setValues({ fields: {}, tables: {} }); setIsSample(false); setMsg(null); }

  async function upload(file: File) {
    setMsg(null);
    if (!/\.xlsx$/i.test(file.name)) return setMsg({ kind: "warn", text: "Please choose the Excel template (.xlsx) downloaded from this page." });
    try {
      const wbk = await import("@/lib/tools/workbook");
      const r = wbk.readWorkbook(def, await file.arrayBuffer());
      if (!r.answered) return setMsg({ kind: "warn", text: `No answers were found in that file. ${r.notes.join(" ")}`.trim() });
      setValues({ fields: { ...r.values.fields }, tables: { ...r.values.tables } }); setIsSample(false);
      setMsg({ kind: "ok", text: `Read ${r.answered} part${r.answered === 1 ? "" : "s"} from ${file.name}. Check them below.` });
    } catch { setMsg({ kind: "warn", text: "That file could not be read. Is it the Excel template from this page?" }); }
  }

  function save(bytes: Uint8Array, file: string) {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = file; a.click(); URL.revokeObjectURL(url);
  }
  async function downloadTemplate(withSample: boolean) {
    try { const w = await import("@/lib/tools/workbook"); save(w.workbookBytes(w.buildWorkbook(name, def, withSample ? sample : null)), `${slug}-${withSample ? "sample" : "template"}.xlsx`); }
    catch { setMsg({ kind: "warn", text: "Your browser could not make the workbook. Please try again." }); }
  }
  async function downloadReport() {
    try {
      const [w, r] = await Promise.all([import("@/lib/tools/workbook"), import("@/lib/agents/report")]);
      save(w.workbookBytes(r.reportWorkbook(name, report, isSample)), `${slug}-report.xlsx`);
    } catch { setMsg({ kind: "warn", text: "Your browser could not make the report workbook. Please try again." }); }
  }

  return (
    <div className="border border-eccellere-ink/10 bg-white">
      <style>{`@media print { body * { visibility: hidden !important; } #agent-report, #agent-report * { visibility: visible !important; } #agent-report { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; } .no-print { display: none !important; } }`}</style>

      <div className="no-print border-b border-eccellere-ink/10 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void downloadTemplate(false)} className={BTN}>Download blank Excel template</button>
          <button type="button" onClick={() => fileRef.current?.click()} className={BTN}>Upload filled template</button>
          <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" aria-label="Upload the filled Excel template" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          {sample && <button type="button" onClick={loadSample} className={BTN}>Fill with the sample</button>}
          <button type="button" onClick={clearAll} className="text-sm text-ink-mid underline underline-offset-2">Clear</button>
        </div>
        <p className="mt-3 text-xs text-ink-mid">Nothing you type here is saved or sent anywhere, and no AI is used. Use the full tool if you want your work saved.</p>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.kind === "ok" ? "text-gold-deep" : "text-[#B3392B]"}`}>{msg.text}</p>}
      </div>

      <form className="no-print p-5" onSubmit={(e) => e.preventDefault()} aria-label={`${name} form`}>
        {def.sections.map((s) => (
          <fieldset key={s.key} className="mb-6 min-w-0">
            {s.title && <legend className="font-display text-lg text-eccellere-ink">{s.title}</legend>}
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {s.parts.filter((p) => p.kind === "field").map((p) => {
                if (p.kind !== "field") return null;
                const id = `f-${p.key}`;
                return (
                  <div key={p.key} className={p.type === "longtext" ? "md:col-span-2" : ""}>
                    <label htmlFor={id} className={LABEL}>{p.label}{p.unit ? ` (${p.unit})` : ""}</label>
                    <p className="mb-1 text-xs text-ink-mid">{p.help}</p>
                    {p.type === "select" ? (
                      <select id={id} className={INPUT} value={values.fields[p.key] ?? ""} onChange={(e) => setField(p.key, e.target.value)}><option value="">Choose…</option>{(p.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>
                    ) : p.type === "longtext" ? (
                      <textarea id={id} rows={3} className={INPUT} value={values.fields[p.key] ?? ""} onChange={(e) => setField(p.key, e.target.value)} />
                    ) : (
                      <input id={id} className={INPUT} inputMode={p.type === "number" || p.type === "rating" ? "decimal" : undefined} placeholder={p.example ? `e.g. ${p.example}` : undefined} value={values.fields[p.key] ?? ""} onChange={(e) => setField(p.key, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
            {s.parts.filter((p): p is TablePart => p.kind === "table").map((t) => {
              const rows = expandTable(t, values.tables[t.key]);
              const nameKey = labelColumnKey(t);
              return (
                <div key={t.key} className="mt-5">
                  <p className="text-sm font-semibold text-eccellere-ink">{t.label}</p>
                  <p className="mb-2 text-xs text-ink-mid">{t.help}</p>
                  <div className="border border-eccellere-ink/10">
                    {rows.map((r, i) => (
                      <div key={i} className={`p-3 ${i > 0 ? "border-t border-eccellere-ink/10" : ""}`}>
                        {t.fixedRows && <p className="mb-2 text-sm font-semibold text-eccellere-ink">{r[nameKey]}</p>}
                        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                          {t.columns.filter((_, ci) => !(t.fixedRows && ci === 0)).map((c) => {
                            const id = `t-${t.key}-${i}-${c.key}`;
                            return (
                              <div key={c.key} className={c.type === "text" ? "min-w-[200px] flex-1" : "min-w-[120px]"}>
                                <label htmlFor={id} className={LABEL}>{c.header}{c.unit ? ` (${c.unit})` : ""}{c.type === "computed" ? " · worked out" : ""}</label>
                                <div className="mt-1"><Control col={c} row={r} values={values} id={id} onChange={(v) => setRows(t, rows.map((x, j) => (j === i ? { ...x, [c.key]: v } : x)))} /></div>
                              </div>
                            );
                          })}
                        </div>
                        {!t.fixedRows && rows.length > t.minRows && (
                          <button type="button" className="mt-2 text-xs text-ink-mid underline" onClick={() => setRows(t, cleanTable(t, rows.filter((_, j) => j !== i)))}>Remove this {t.rowLabel.toLowerCase()}</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!t.fixedRows && rows.length < t.maxRows && <button type="button" className={`${BTN} mt-3 px-3 py-1.5 text-xs`} onClick={() => setRows(t, [...rows, {}])}>+ Add a {t.rowLabel.toLowerCase()}</button>}
                </div>
              );
            })}
          </fieldset>
        ))}
        {parts.length === 0 && <p className="text-sm text-ink-mid">This agent has no form fields.</p>}
      </form>

      {/* The report */}
      <div className="border-t-2 border-eccellere-gold bg-eccellere-ink p-5 text-eccellere-cream no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">Report {isSample ? "· sample, not real" : ""}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!ready} onClick={() => window.print()} className={`${BTN_GOLD} disabled:opacity-40`}>Print or save as PDF</button>
            <button type="button" disabled={!ready} onClick={() => void downloadReport()} className="border border-eccellere-gold px-4 py-2 text-sm font-medium text-eccellere-cream hover:bg-eccellere-gold hover:text-eccellere-ink disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light">Download Excel report</button>
          </div>
        </div>
        {!ready && <p className="mt-3 text-sm text-white/70" role="status">Fill in the form above, or press &ldquo;Fill with the sample&rdquo;, and the report appears here.</p>}
      </div>

      {ready && (
        <div id="agent-report" className="bg-eccellere-cream p-5 text-eccellere-ink" aria-live="polite">
          <div className="mb-4 hidden border-b-2 border-eccellere-gold pb-2 print:block">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep">ECCELLERE+</p>
            <p className="font-display text-2xl">{name}: report</p>
            <p className="text-xs">{isSample ? "Fictional sample company. Not real data." : "Worked out from the figures entered."} · www.eccellere.co.in</p>
          </div>
          <h3 className="text-sm font-semibold">Headline results</h3>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {report.results.map((r) => (
              <li key={r.label} className="border border-eccellere-gold/50 bg-white px-4 py-3">
                <p className="text-xs text-ink-mid">{r.label}</p>
                <p className="mt-1 font-display text-2xl">{r.value}</p>
              </li>
            ))}
          </ul>

          {report.charts.map((c) => (
            <figure key={c.title} className="mt-6 border border-eccellere-ink/10 bg-white p-4">
              <figcaption className="text-sm font-semibold">{c.title}{c.unit ? ` (${c.unit})` : ""}</figcaption>
              <ul className="mt-3 space-y-2">
                {c.bars.map((b) => (
                  <li key={b.label} className="grid grid-cols-[minmax(80px,180px)_1fr_auto] items-center gap-3 text-xs">
                    <span className="truncate">{b.label}</span>
                    <span className="h-4 bg-eccellere-cream" role="img" aria-label={`${b.label}: ${b.text}`}>
                      <span className={`block h-4 ${b.value < 0 ? "bg-[#B3392B]" : "bg-eccellere-gold"}`} style={{ width: `${Math.max(2, (Math.abs(b.value) / maxBar(c)) * 100)}%` }} />
                    </span>
                    <span className="tabular-nums">{b.text}</span>
                  </li>
                ))}
              </ul>
            </figure>
          ))}

          {report.working.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Working figures</h3>
              <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                {report.working.map((w) => <div key={w.label} className="border-b border-eccellere-ink/10 pb-1"><dt className="text-xs text-ink-mid">{w.label}</dt><dd>{w.value}</dd></div>)}
              </dl>
            </>
          )}

          {report.tables.map((t) => (
            <div key={t.title} className="mt-6 overflow-x-auto border border-eccellere-ink/10 bg-white">
              <p className="px-3 pt-3 text-sm font-medium">{t.title}</p>
              <table className="mt-2 w-full border-collapse text-sm">
                <thead><tr className="border-b border-eccellere-ink/10">{t.headers.map((h) => <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gold-deep">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-eccellere-ink/5">{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 align-top text-ink-mid">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          ))}
          <p className="mt-6 text-xs text-ink-mid">Every figure is worked out by the agent&apos;s own formulas. No AI wrote any number. Check the inputs before you rely on the answer.</p>
        </div>
      )}
    </div>
  );
}
