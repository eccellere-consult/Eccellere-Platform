"use client";

import { Loader2, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { type DocBind, type DocBlock, type DocCell, type DocPara, type DocRun, type DocTable } from "@/lib/strategyModels/document";
import type { Column, ModelDefinition, ModelValues, TablePart } from "@/lib/strategyModels/types";
import { expandTable, labelColumnKey } from "@/lib/strategyModels/values";

/**
 * A toolkit drawn as the Word document it came from: the same paragraphs, tables, colours, shading and lists, in the same order, on a
 * sheet of "paper". Only the document's own blanks are live: an underscore line is a box to type in, an empty column is a box for each
 * row, "1 2 3 4 5" is a scale to click, a tick box is a tick box. Everything is built here from plain data; no markup from the uploaded
 * file is ever inserted.
 */

/** Calibri and Cambria are what the documents are written in; the others are close faces for computers that do not have them. */
const SANS = 'Calibri, Carlito, "DM Sans", Arial, sans-serif';
const SERIF = 'Cambria, Caladea, Georgia, "Times New Roman", serif';
const PT = 1.3333;

export const PAPER_CSS = [
  `.ws-paper{background:#fff;border:1px solid #E5E2DB;margin:0 auto 1.5rem;max-width:900px;padding:56px 64px;font-family:${SANS};font-size:14px;line-height:1.32;color:#000;overflow-wrap:break-word}`,
  ".ws-paper p,.ws-paper h2,.ws-paper h3,.ws-paper h4{margin:0;font-weight:400;font-size:inherit;line-height:inherit;white-space:pre-wrap}",
  ".ws-paper table{width:100%;border-collapse:collapse}",
  ".ws-paper td{vertical-align:top}",
  ".ws-paper .ws-in{width:100%;border:0;border-bottom:1px solid #6B695F;background:transparent;padding:2px 0;font:inherit;color:#0E0E0D}",
  ".ws-paper textarea.ws-in{border:1px solid #E5E2DB;background:#FAF8F4;padding:4px 6px;min-height:2.8em;resize:vertical;display:block}",
  ".ws-paper .ws-in:focus{outline:2px solid #B8913A;outline-offset:1px;background:#fff}",
  ".ws-paper .ws-scale{display:inline-flex;gap:1px;flex-wrap:nowrap;justify-content:center}",
  ".ws-paper .ws-scale button{width:19px;height:19px;border-radius:50%;border:1px solid transparent;background:transparent;font:inherit;cursor:pointer;line-height:1;padding:0}",
  ".ws-paper .ws-scale button:hover{border-color:currentColor}",
  ".ws-paper .ws-scale button[aria-checked=true]{background:currentColor;border-color:currentColor}",
  ".ws-paper .ws-scale button[aria-checked=true] span{color:#fff}",
  ".ws-paper .ws-chips{display:flex;gap:4px;flex-wrap:wrap}",
  ".ws-paper .ws-chips button{border:1px solid #E5E2DB;background:#fff;padding:1px 5px;font:inherit;font-size:11px;color:#3A3935;cursor:pointer}",
  ".ws-paper .ws-chips button[aria-checked=true]{border-color:#0E0E0D;background:#0E0E0D;color:#fff;font-weight:600}",
  ".ws-paper .ws-tablewrap{overflow-x:auto;max-width:100%}",
  ".ws-paper .ws-li{position:relative}",
  ".ws-paper .ws-li>.ws-mark{position:absolute;left:-1.4em;width:1.2em;text-align:right}",
  ".ws-paper .ws-pagestart{margin-top:40px}",
  ".ws-print{display:none}",
  "@media screen and (max-width:767px){.ws-paper{padding:20px 14px}.ws-paper .ws-wide{min-width:620px}.ws-paper .ws-mid{min-width:480px}}",
  "@media print{.ws-paper{border:0;padding:0;max-width:none}.ws-screen{display:none!important}.ws-print{display:block!important;min-height:1.5em;white-space:pre-wrap}.ws-print-line{border-bottom:1px solid #6B695F}.ws-paper .ws-pagestart{break-before:page;margin-top:0}.ws-paper tr{break-inside:avoid}.ws-paper{-webkit-print-color-adjust:exact;print-color-adjust:exact}}",
].join("");

const runStyle = (r: DocRun): CSSProperties | undefined => {
  const s: CSSProperties = {};
  if (r.b) s.fontWeight = 700;
  if (r.i) s.fontStyle = "italic";
  if (r.u) s.textDecoration = "underline";
  if (r.c) s.color = `#${r.c}`;
  if (r.z) s.fontSize = `${Math.round(r.z * PT * 10) / 10}px`;
  if (r.f) s.fontFamily = SERIF;
  return Object.keys(s).length ? s : undefined;
};
const Runs = ({ runs }: { runs: DocRun[] }) => <>{runs.map((r, i) => { const s = runStyle(r); return s ? <span key={i} style={s}>{r.t}</span> : r.t; })}</>;

export interface DocumentViewProps {
  document: DocBlock[];
  def: ModelDefinition;
  values: ModelValues;
  setField: (key: string, v: string) => void;
  setCell: (table: TablePart, rowName: string, col: string, v: string) => void;
  /** the "Draft with AI" control for one section of the form, and what it last said */
  onDraft: (sectionKey: string) => void;
  draftBusy: string | null;
  draftDisabled: boolean;
  draftHint: string;
  message: { key: string; kind: "ok" | "warn"; text: string } | null;
}

export default function DocumentView({ document, def, values, setField, setCell, onDraft, draftBusy, draftDisabled, draftHint, message }: DocumentViewProps) {
  const tables = new Map<string, TablePart>();
  const labels = new Map<string, string>();
  for (const s of def.sections) for (const p of s.parts) { if (p.kind === "table") tables.set(p.key, p); else labels.set(p.key, p.label); }
  const rowsOf = new Map<string, Map<string, Record<string, string>>>();
  const cellValue = (b: Extract<DocBind, { t: string }>): string => {
    const t = tables.get(b.t);
    if (!t) return "";
    let by = rowsOf.get(b.t);
    if (!by) { by = new Map(expandTable(t, values.tables[b.t]).map((r) => [r[labelColumnKey(t)], r])); rowsOf.set(b.t, by); }
    return by.get(b.r)?.[b.c] ?? "";
  };

  /** A written answer: a box on screen; in print the words in full, or a line to write on. */
  const written = (control: ReactNode, v: string, lines: number) => (
    <><div className="ws-screen">{control}</div><div className="ws-print ws-print-line" style={{ minHeight: `${lines * 1.5}em` }}>{v}</div></>
  );

  const input = (b: DocBind, tint?: string): ReactNode => {
    if ("f" in b) {
      const v = values.fields[b.f] ?? "";
      const name = labels.get(b.f) ?? "Answer";
      if (b.kind === "tick") return <input type="checkbox" aria-label={name} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-eccellere-gold-deep" checked={v === "Yes"} onChange={(e) => setField(b.f, e.target.checked ? "Yes" : "")} />;
      return b.kind === "long"
        ? written(<textarea aria-label={name} className="ws-in" rows={4} value={v} onChange={(e) => setField(b.f, e.target.value)} />, v, 4)
        : written(<input aria-label={name} className="ws-in" value={v} onChange={(e) => setField(b.f, e.target.value)} />, v, 1);
    }
    const t = tables.get(b.t);
    const col: Column | undefined = t?.columns.find((c) => c.key === b.c);
    if (!t || !col) return null;
    const v = cellValue(b);
    const name = `${col.header}: ${b.r}`;
    const set = (x: string) => setCell(t, b.r, b.c, x);
    if (b.kind === "rating" && col.scale) {
      const steps = Array.from({ length: col.scale.max - col.scale.min + 1 }, (_, i) => String(col.scale!.min + i));
      return (
        <div role="radiogroup" aria-label={name} className="ws-scale" style={{ color: tint ? `#${tint}` : "#7F611A" }}>
          {steps.map((s) => <button key={s} type="button" role="radio" aria-checked={v === s} title={v === s ? "Chosen. Click to clear." : `Choose ${s}`} onClick={() => set(v === s ? "" : s)}><span>{s}</span></button>)}
        </div>
      );
    }
    if (b.kind === "choice") return (
      <div role="radiogroup" aria-label={name} className="ws-chips">
        {(col.options ?? []).map((o) => <button key={o} type="button" role="radio" aria-checked={v === o} onClick={() => set(v === o ? "" : o)}>{o}</button>)}
      </div>
    );
    if (b.kind === "tick") return <input type="checkbox" aria-label={name} className="h-4 w-4 accent-eccellere-gold-deep" checked={v === "Yes"} onChange={(e) => set(e.target.checked ? "Yes" : "")} />;
    return b.kind === "long"
      ? written(<textarea aria-label={name} className="ws-in" rows={2} placeholder={col.header} value={v} onChange={(e) => set(e.target.value)} />, v, 2)
      : written(<input aria-label={name} className="ws-in" value={v} onChange={(e) => set(e.target.value)} />, v, 1);
  };

  const para = (p: DocPara, key: number | string, inCell = false): ReactNode => {
    const Tag = p.h === 1 ? "h2" : p.h === 2 ? "h3" : p.h === 3 ? "h4" : "p";
    const style: CSSProperties = {};
    if (p.sb) style.marginTop = p.sb;
    if (p.sa) style.marginBottom = p.sa;
    if (p.a) style.textAlign = p.a === "c" ? "center" : p.a === "r" ? "right" : "justify";
    if (p.sh) { style.background = `#${p.sh}`; style.padding = "2px 6px"; }
    if (p.bb) { style.borderBottom = `1.5px solid #${p.bb}`; style.paddingBottom = 2; }
    if (p.ind) style.paddingLeft = p.ind;
    if (p.li) style.marginLeft = `${2.4 + (p.lv ?? 0) * 1.6}em`;
    if (!p.r.length && !p.bb && !p.in) style.minHeight = inCell ? "0.9em" : Math.max(6, p.sa ?? 0);
    const cls = [p.li ? "ws-li" : "", p.pb ? "ws-pagestart" : ""].filter(Boolean).join(" ") || undefined;
    if (p.in && "f" in p.in && p.in.kind === "tick") {
      // a checklist item: its bullet gives way to a tick box, its words stay as printed
      const runs = p.r.map((r, i) => (i === 0 ? { ...r, t: r.t.replace(/^\s*[•●▪◦]\s*/, "") } : r)).filter((r) => r.t);
      return <label key={key} className={p.pb ? "ws-pagestart" : undefined} style={{ ...style, marginLeft: undefined, display: "flex", gap: 6, alignItems: "flex-start", cursor: "pointer", whiteSpace: "pre-wrap" }}>{input(p.in)}<span><Runs runs={runs} /></span></label>;
    }
    if (p.in) {
      // the line's own blank ("Name: ______") gives way to the box; the words before it stay as printed
      const runs = p.r.map((r) => ({ ...r, t: r.t.replace(/[:：]?\s*_{3,}\s*$/, "") })).filter((r) => r.t);
      return <div key={key} className={cls} style={{ ...style, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><span><Runs runs={runs} /></span><span style={{ flex: "1 1 220px" }}>{input(p.in)}</span></div>;
    }
    return <Tag key={key} className={cls} style={style}>{p.li ? <span className="ws-mark" style={runStyle({ ...p.r[0], t: "" })} aria-hidden="true">{p.li === 2 ? `${p.n ?? 1}.` : "•"}</span> : null}<Runs runs={p.r} /></Tag>;
  };

  const cell = (c: DocCell, key: number, border: string | undefined): ReactNode => {
    const style: CSSProperties = { padding: c.pd ? `${c.pd[0]}px ${c.pd[1]}px` : "5px 7px" };
    if (border) style.border = `1px solid #${border}`;
    if (c.sh) style.background = `#${c.sh}`;
    if (c.va) style.verticalAlign = c.va === "m" ? "middle" : "bottom";
    const edge = (e: string) => { const [w, col] = e.split(" "); return `${w}px solid #${col}`; };
    if (c.bt) style.borderTop = edge(c.bt);
    if (c.bl) style.borderLeft = edge(c.bl);
    // a scale keeps the colour the document printed it in
    const tint = c.p.find((p) => p.r.length)?.r[0].c;
    return (
      <td key={key} colSpan={c.s} rowSpan={c.rs} style={style}>
        {c.in ? <div style={{ textAlign: c.p[0]?.a === "c" ? "center" : undefined }}>{input(c.in, tint)}</div> : c.p.map((p, i) => para(p, i, true))}
      </td>
    );
  };

  const table = (t: DocTable, key: number): ReactNode => {
    const cols = t.w?.length ?? Math.max(...t.rows.map((r) => r.c.reduce((n, c) => n + (c.s ?? 1), 0)));
    return (
      <div key={key} className="ws-tablewrap">
        <table className={cols >= 4 ? "ws-wide" : cols === 3 ? "ws-mid" : undefined} style={t.w ? { tableLayout: "fixed" } : undefined}>
          {t.w && <colgroup>{t.w.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>}
          <tbody>{t.rows.map((r, i) => <tr key={i}>{r.c.map((c, j) => cell(c, j, t.bd))}</tr>)}</tbody>
        </table>
      </div>
    );
  };

  const draft = (sectionKey: string, key: string): ReactNode => {
    const title = def.sections.find((s) => s.key === sectionKey)?.title ?? "this part";
    return (
      <div key={key} className="no-print" style={{ margin: "14px 0 8px", fontFamily: "var(--font-body), sans-serif" }}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={draftDisabled} onClick={() => onDraft(sectionKey)} aria-label={`Draft with AI: ${title}`} className="inline-flex items-center gap-1 border border-eccellere-gold-deep bg-white px-3 py-1.5 text-xs font-medium text-eccellere-gold-deep hover:bg-eccellere-cream disabled:opacity-40">
            {draftBusy === sectionKey ? <><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Drafting…</> : <><Sparkles className="h-3.5 w-3.5" /> Draft this part with AI</>}
          </button>
          <span className="text-[11px] text-ink-light">{draftHint}</span>
        </div>
        {message?.key === sectionKey && <p role="status" className={message.kind === "ok" ? "mt-2 text-sm text-eccellere-teal" : "mt-2 text-sm text-red-700"}>{message.text}</p>}
      </div>
    );
  };

  return (
    <article className="ws-paper" aria-label="The document">
      {document.map((b, i) => (
        <div key={i}>
          {b.ai ? draft(b.ai, `ai-${i}`) : null}
          {b.k === "t" ? table(b, i) : para(b, i)}
        </div>
      ))}
    </article>
  );
}
