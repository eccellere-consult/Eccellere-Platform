"use client";

import { readJson } from "@/lib/toolkit/http";
import { NarrativePanel, type NarrEntry } from "@/components/toolkit/NarrativePanel";
import { isNarrativeField } from "@/lib/toolkit/narrative";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Printer, Paperclip, Check, CircleDot, Circle, Lock, Loader2, Trash2, Send, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overallProgress, sectionProgress, scoreDiagnostic, KIT_LABEL,
  type Blueprint, type KitField, type KitSection, type StoredResponse,
} from "@/lib/toolkit/engine";

type Val = string | number | null;
interface Resp { value: Val; provenance: string; confidence?: string | null; basis?: string }
interface Evidence { id: string; fileName: string; size: number; status: string }
interface KitData {
  id: string; title: string; industry: string; kitType: keyof typeof KIT_LABEL; status: "DRAFT" | "IN_PROGRESS" | "SUBMITTED";
  version: number; blueprint: Blueprint; blueprintSource: string; mode: string;
}

const inputCls =
  "w-full rounded-none border border-eccellere-ink/20 bg-white px-3 py-2 text-sm text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:bg-eccellere-cream disabled:text-ink-mid";

const PROV_STYLE: Record<string, string> = {
  "AI-suggested": "bg-purple-100 text-purple-800",
  "Client-entered": "bg-sky-100 text-sky-800",
  "Client-confirmed": "bg-emerald-100 text-emerald-800",
  "Not-known": "bg-amber-100 text-amber-800",
  "Not-applicable": "bg-gray-200 text-gray-700",
};

const RAG_STYLE: Record<string, string> = {
  Red: "bg-red-100 text-red-800", Amber: "bg-amber-100 text-amber-800", Green: "bg-emerald-100 text-emerald-800", "Not scored": "bg-gray-100 text-gray-600",
};

export default function ToolkitWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [kit, setKit] = useState<KitData | null>(null);
  const [resp, setResp] = useState<Record<string, Resp>>({});
  const [narr, setNarr] = useState<Record<number, NarrEntry>>({});
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error" | "idle">("idle");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [panel, setPanel] = useState<"form" | "evidence">("form");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [approver, setApprover] = useState("");
  const [submitErr, setSubmitErr] = useState<string[] | string | null>(null);
  const pending = useRef<Map<string, Resp>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/toolkits/${id}`);
    if (r.status === 401) { setLoadErr("Please sign in to open this toolkit."); return; }
    if (!r.ok) { setLoadErr("This toolkit could not be found."); return; }
    const d = await readJson(r);
    setKit(d.kit);
    const m: Record<string, Resp> = {};
    const nm: Record<number, NarrEntry> = {};
    for (const x of d.responses) {
      if (isNarrativeField(x.fieldId)) {
        const seq = Number(String(x.fieldId).slice(5));
        const v = (x.value ?? {}) as { text?: string; unsupported?: string[]; provider?: string | null };
        if (seq && v.text) nm[seq] = { text: v.text, unsupported: v.unsupported ?? [], provenance: x.provenance, provider: v.provider };
        continue;
      }
      m[x.fieldId] = { value: x.value, provenance: x.provenance, confidence: x.confidence };
    }
    setResp(m);
    setNarr(nm);
    setEvidence(d.evidence);
    setActiveId((cur) => cur || d.kit.blueprint.sections.find((s: KitSection) => s.fields.length)?.id || d.kit.blueprint.sections[0].id);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const locked = kit?.status === "SUBMITTED";
  const bp = kit?.blueprint;

  const stored: Record<string, StoredResponse> = useMemo(() => {
    const o: Record<string, StoredResponse> = {};
    for (const [k, v] of Object.entries(resp)) o[k] = { fieldId: k, value: v.value, provenance: v.provenance };
    return o;
  }, [resp]);
  const progress = useMemo(() => (bp ? overallProgress(bp, stored) : null), [bp, stored]);

  // ── autosave ────────────────────────────────────────────────────────────
  const flush = useCallback(async () => {
    if (!pending.current.size) return;
    const batch = Array.from(pending.current.entries());
    pending.current = new Map();
    setSaveState("saving");
    try {
      const r = await fetch(`/api/toolkits/${id}/responses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: batch.map(([fieldId, v]) => ({ fieldId, value: v.value, provenance: v.provenance, confidence: v.confidence })),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setSaveState(pending.current.size ? "saving" : "saved");
      setKit((k) => (k && k.status === "DRAFT" ? { ...k, status: "IN_PROGRESS" } : k));
    } catch {
      for (const [k, v] of batch) if (!pending.current.has(k)) pending.current.set(k, v);
      setSaveState("error");
    }
  }, [id]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 900);
  }, [flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function setField(fieldId: string, next: Resp) {
    if (locked) return;
    setResp((cur) => ({ ...cur, [fieldId]: next }));
    pending.current.set(fieldId, next);
    setSaveState("saving");
    schedule();
  }
  const edit = (fieldId: string, value: Val) => setField(fieldId, { value, provenance: "Client-entered" });
  const mark = (fieldId: string, provenance: "Not-known" | "Not-applicable") => setField(fieldId, { value: null, provenance });
  const confirm = (fieldId: string) => setField(fieldId, { ...resp[fieldId], provenance: "Client-confirmed" });

  // ── AI draft ────────────────────────────────────────────────────────────
  async function aiDraft(section: KitSection, moduleId?: string) {
    setAiBusy(moduleId ?? section.id);
    setAiNote(null);
    try {
      await flush();
      const r = await fetch(`/api/toolkits/${id}/ai`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: section.id, moduleId }),
      });
      const d = await readJson(r);
      if (!r.ok) { setAiNote(d.error ?? "AI draft failed."); return; }
      let applied = 0;
      for (const s of d.suggestions as Array<{ fieldId: string; value: Val; confidence: string; basis: string }>) {
        if (s.value === null || s.value === "") continue;
        const next: Resp = { value: s.value, provenance: "AI-suggested", confidence: s.confidence, basis: s.basis };
        setResp((cur) => ({ ...cur, [s.fieldId]: next }));
        pending.current.set(s.fieldId, next);
        applied++;
      }
      if (applied) { setSaveState("saving"); schedule(); }
      setAiNote(applied ? `${applied} AI draft${applied > 1 ? "s" : ""} added. Review each one: they are not confirmed until you accept or edit them.` : d.note ?? "AI had nothing reliable to add here.");
    } catch {
      setAiNote("AI draft failed. You can complete this section yourself.");
    } finally {
      setAiBusy(null);
    }
  }

  // ── evidence ────────────────────────────────────────────────────────────
  async function upload(list: FileList | null) {
    if (!list || !list.length) return;
    setUploading(true); setUploadMsg(null);
    for (const f of Array.from(list)) {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(`/api/toolkits/${id}/evidence`, { method: "POST", body: fd });
      const d = await readJson(r);
      if (r.ok) { setEvidence((e) => [...e, { id: d.id, fileName: d.fileName, size: d.size, status: d.status }]); if (d.note) setUploadMsg(d.note); }
      else setUploadMsg(`${f.name}: ${d.error ?? "upload failed"}`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  async function removeEvidence(eid: string) {
    const r = await fetch(`/api/toolkits/${id}/evidence?evidenceId=${eid}`, { method: "DELETE" });
    if (r.ok) setEvidence((e) => e.filter((x) => x.id !== eid));
  }

  // ── submit / reopen ─────────────────────────────────────────────────────
  async function submit() {
    setSubmitErr(null);
    await flush();
    const r = await fetch(`/api/toolkits/${id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedBy: approver }),
    });
    const d = await readJson(r);
    if (!r.ok) { setSubmitErr(d.missingSections?.length ? d.missingSections : d.error ?? "Could not submit."); return; }
    setShowSubmit(false);
    await load();
  }
  async function reopen() {
    if (!window.confirm("Reopen as a new version? Your submitted version is kept.")) return;
    const r = await fetch(`/api/toolkits/${id}/reopen`, { method: "POST" });
    if (r.ok) await load();
  }

  if (loadErr) return <div className="p-10 text-sm text-red-700">{loadErr} <Link className="underline" href="/dashboard/toolkits">Back to My Toolkits</Link></div>;
  if (!kit || !bp || !progress) return <div className="p-10 text-sm text-ink-light">Loading…</div>;

  const section = bp.sections.find((s) => s.id === activeId) ?? bp.sections[0];
  const idx = bp.sections.findIndex((s) => s.id === section.id);

  return (
    <div className="flex min-h-screen flex-col">
      {/* top bar */}
      <div className="sticky top-0 z-20 border-b border-eccellere-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/toolkits" className="text-ink-mid hover:text-eccellere-gold" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="min-w-0 basis-[calc(100%-2rem)] sm:basis-auto sm:flex-1 2xl:flex-1">
            <p className="truncate text-sm font-medium text-eccellere-ink">{kit.title}</p>
            <p className="text-[11px] text-ink-mid">{KIT_LABEL[kit.kitType]} · {kit.industry} · v{kit.version}{kit.blueprintSource === "ai" ? " · AI-tailored questions" : ""}</p>
          </div>
          <div className="w-32">
            <div className="h-1.5 overflow-hidden rounded bg-eccellere-ink/10"><div className="h-full bg-eccellere-gold" style={{ width: `${progress.percent}%` }} /></div>
            <p className="mt-0.5 text-right text-[10px] text-ink-mid">{progress.percent}% answered</p>
          </div>
          <span className={cn("text-[11px]", saveState === "error" ? "text-red-600" : "text-ink-mid")} aria-live="polite">
            {saveState === "saving" && "Saving…"}{saveState === "saved" && "All changes saved"}{saveState === "error" && "Not saved. Retrying on next edit"}
          </span>
          <Button size="sm" variant={panel === "evidence" ? "default" : "secondary"} onClick={() => setPanel(panel === "form" ? "evidence" : "form")}>
            <Paperclip className="h-4 w-4" /> Evidence ({evidence.length})
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <a href={`/toolkit/report/${id}`} target="_blank" rel="noreferrer"><Printer className="h-4 w-4" /> Report</a>
          </Button>
          {locked ? (
            <Button size="sm" onClick={reopen}><Lock className="h-4 w-4" /> Reopen as new version</Button>
          ) : (
            <Button size="sm" onClick={() => setShowSubmit(true)}><Send className="h-4 w-4" /> Submit</Button>
          )}
        </div>
        {locked && <p className="mt-2 rounded bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">Submitted and locked. Open the report to print or save as PDF.</p>}
      </div>

      <div className="flex flex-1">
        {/* section nav */}
        <nav className="hidden w-72 shrink-0 overflow-y-auto border-r border-eccellere-ink/10 bg-white p-4 md:block" aria-label="Report sections">
          <ul>
            {bp.sections.map((s) => {
              const p = sectionProgress(s, stored);
              const Icon = s.fields.length === 0 ? Circle : p.complete && p.answered > 0 ? Check : CircleDot;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => { setActiveId(s.id); setPanel("form"); window.scrollTo({ top: 0 }); }}
                    className={cn("flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs", s.id === section.id && panel === "form" ? "bg-eccellere-gold/15 text-eccellere-ink" : "text-ink-mid hover:bg-eccellere-cream")}
                  >
                    <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", p.complete && p.answered > 0 ? "text-emerald-600" : "text-eccellere-gold")} />
                    <span><span className="text-ink-light">{s.seq}.</span> {s.title}{s.fields.length > 0 && <span className="ml-1 text-ink-light">({p.answered}/{p.total})</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 p-4 lg:p-8">
          {panel === "evidence" ? (
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-2xl font-light text-eccellere-ink">Evidence and source files</h2>
              <p className="mt-1 text-sm text-ink-mid">Files are private to you. AI reads their text as information only, never as instructions. Scanned images are not supported yet.</p>
              <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md" className="hidden" onChange={(e) => upload(e.target.files)} />
              <Button className="mt-4" size="sm" disabled={locked || uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Paperclip className="h-4 w-4" /> Add files</>}
              </Button>
              {uploadMsg && <p className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-800">{uploadMsg}</p>}
              <ul className="mt-5 space-y-2">
                {evidence.length === 0 && <li className="text-sm text-ink-light">No files yet.</li>}
                {evidence.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded bg-white p-3 text-sm shadow-sm">
                    <span className="min-w-0 flex-1 truncate">{e.fileName} <span className="text-xs text-ink-light">({(e.size / 1024).toFixed(0)} KB)</span></span>
                    <span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase", e.status === "EXTRACTED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                      {e.status === "EXTRACTED" ? "Text read" : "Could not read text"}
                    </span>
                    {!locked && <button onClick={() => removeEvidence(e.id)} aria-label={`Remove ${e.fileName}`}><Trash2 className="h-4 w-4 text-ink-light hover:text-red-600" /></button>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <SectionView
              kit={kit} section={section} resp={resp} stored={stored} locked={Boolean(locked)}
              aiBusy={aiBusy} aiNote={aiNote} edit={edit} mark={mark} confirm={confirm} aiDraft={aiDraft}
              narr={narr} onNarr={(seq, e) => setNarr((cur) => { const n = { ...cur }; if (e) n[seq] = e; else delete n[seq]; return n; })}
              onPrev={idx > 0 ? () => { setActiveId(bp.sections[idx - 1].id); window.scrollTo({ top: 0 }); } : undefined}
              onNext={idx < bp.sections.length - 1 ? () => { setActiveId(bp.sections[idx + 1].id); window.scrollTo({ top: 0 }); } : undefined}
            />
          )}
        </main>
      </div>

      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Submit toolkit">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl text-eccellere-ink">Submit for approval</h3>
            <p className="mt-2 text-xs text-ink-mid">Submitting locks this version and creates the final report. A named person must approve. AI never approves on your behalf.</p>
            {!progress.readyToSubmit && (
              <div className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-900">
                <p className="flex items-center gap-1 font-medium"><AlertTriangle className="h-3.5 w-3.5" /> Required answers are missing in:</p>
                <ul className="mt-1 list-disc pl-5">{progress.missingSections.slice(0, 8).map((m) => <li key={m}>{m}</li>)}</ul>
                <p className="mt-1">Use &quot;Not known&quot; where you genuinely cannot answer.</p>
              </div>
            )}
            <label className="mt-4 block text-sm font-medium" htmlFor="approver">Approved by (name and role)</label>
            <input id="approver" className={cn(inputCls, "mt-1")} value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="e.g. Priya Sharma, Managing Director" />
            {submitErr && <p className="mt-3 text-sm text-red-700">{Array.isArray(submitErr) ? `Still missing: ${submitErr.join("; ")}` : submitErr}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSubmit(false)}>Cancel</Button>
              <Button disabled={approver.trim().length < 2 || !progress.readyToSubmit} onClick={submit}>Approve and submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section view ───────────────────────────────────────────────────────────

function SectionView(props: {
  kit: KitData; section: KitSection; resp: Record<string, Resp>; stored: Record<string, StoredResponse>; locked: boolean;
  aiBusy: string | null; aiNote: string | null;
  edit: (id: string, v: Val) => void; mark: (id: string, p: "Not-known" | "Not-applicable") => void; confirm: (id: string) => void;
  aiDraft: (s: KitSection, moduleId?: string) => void; onPrev?: () => void; onNext?: () => void;
  narr: Record<number, NarrEntry>; onNarr: (seq: number, e: NarrEntry | undefined) => void;
}) {
  const { kit, section, resp, stored, locked, aiBusy, aiNote, edit, mark, confirm, aiDraft, onPrev, onNext, narr, onNarr } = props;
  const bp = kit.blueprint;
  const hasAi = section.fields.some((f) => f.aiDraftable);
  const isModules = kit.kitType === "DIAGNOSTIC" && section.seq === 10;
  const isScorecard = kit.kitType === "DIAGNOSTIC" && section.seq === 12;
  const scores = isScorecard ? scoreDiagnostic(bp, stored) : null;

  const renderField = (f: KitField) => (
    <FieldRow key={f.id} f={f} r={resp[f.id]} locked={locked} edit={edit} mark={mark} confirm={confirm} />
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">{section.stage} · Section {section.seq} of {bp.sections.length}</p>
      <h2 className="mt-1 font-display text-3xl font-light leading-tight text-eccellere-ink">{section.title}</h2>
      <p className="mt-2 text-sm text-ink-mid">{section.purpose}</p>

      {section.fields.length === 0 && !isScorecard && (
        <div className="mt-6 rounded bg-white p-5 text-sm text-ink-mid shadow-sm">
          {section.kind === "auto"
            ? "This section is generated automatically in the report from your context and answers. Nothing to fill in here."
            : "This section is assembled in the report from your answers in other sections, with every statement labelled as fact, client statement, calculation or recommendation."}
        </div>
      )}

      {scores && (
        <div className="mt-6 overflow-x-auto rounded bg-white p-4 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-xs text-ink-light"><th className="py-2">Dimension</th><th>Weight</th><th>Score (1-4)</th><th>Rating</th><th>Answered</th><th>Not known</th></tr></thead>
            <tbody>
              {scores.modules.map((m) => (
                <tr key={m.moduleId} className="border-b border-eccellere-ink/5">
                  <td className="py-2 pr-2">{m.name}</td><td>{m.weight}%</td><td>{m.score ?? "—"}</td>
                  <td><span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase", RAG_STYLE[m.rag])}>{m.rag}</span></td>
                  <td>{m.answered}/{m.total}</td><td>{m.unknown}</td>
                </tr>
              ))}
              <tr className="font-medium"><td className="py-2">Overall (weighted)</td><td>100%</td><td>{scores.overall ?? "—"}</td><td><span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase", RAG_STYLE[scores.overallRag])}>{scores.overallRag}</span></td><td /><td /></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-light">Calculated from your answers in section 10. &quot;Not known&quot; and not-applicable items are excluded from the average, never counted as zero. Ratings are indicative maturity bands, not precise measurements.</p>
        </div>
      )}

      {hasAi && !locked && !isModules && (
        <div className="mt-5">
          <Button size="sm" variant="secondary" disabled={Boolean(aiBusy)} onClick={() => aiDraft(section)}>
            {aiBusy === section.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</> : <><Sparkles className="h-4 w-4" /> Draft empty fields with AI</>}
          </Button>
        </div>
      )}
      {aiNote && <p className="mt-3 rounded bg-purple-50 p-3 text-xs text-purple-900" role="status">{aiNote}</p>}

      {isModules
        ? bp.modules.map((m) => (
            <div key={m.id} className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-eccellere-gold/40 pb-2">
                <div><h3 className="font-display text-xl text-eccellere-ink">{m.id} · {m.name}</h3><p className="text-xs text-ink-mid">{m.purpose} · weight {m.weight}%</p></div>
                {!locked && (
                  <Button size="sm" variant="secondary" disabled={Boolean(aiBusy)} onClick={() => aiDraft(section, m.id)}>
                    {aiBusy === m.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</> : <><Sparkles className="h-4 w-4" /> Draft with AI</>}
                  </Button>
                )}
              </div>
              <div className="mt-4 space-y-4">{section.fields.filter((f) => f.module === m.id).map(renderField)}</div>
            </div>
          ))
        : <div className="mt-6 space-y-5">{section.fields.map(renderField)}</div>}

      <NarrativePanel kitId={kit.id} type={kit.kitType} seq={section.seq} entry={narr[section.seq]} locked={locked} onChange={(e) => onNarr(section.seq, e)} />

      <div className="mt-10 flex justify-between">
        <Button variant="ghost" disabled={!onPrev} onClick={onPrev}><ArrowLeft className="h-4 w-4" /> Previous</Button>
        <Button variant="secondary" disabled={!onNext} onClick={onNext}>Next section</Button>
      </div>
    </div>
  );
}

function FieldRow({ f, r, locked, edit, mark, confirm }: {
  f: KitField; r?: Resp; locked: boolean;
  edit: (id: string, v: Val) => void; mark: (id: string, p: "Not-known" | "Not-applicable") => void; confirm: (id: string) => void;
}) {
  const unknown = r?.provenance === "Not-known" || r?.provenance === "Not-applicable";
  const val = r?.value ?? "";
  const off = locked || unknown;
  return (
    <div className="rounded bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label htmlFor={f.id} className="text-sm font-medium text-eccellere-ink">{f.label}{f.required && <span className="text-red-600"> *</span>}</label>
        {r && r.provenance && (
          <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", PROV_STYLE[r.provenance] ?? "bg-gray-100")}>
            {r.provenance.replace("-", " ")}{r.provenance === "AI-suggested" && r.confidence ? ` · ${r.confidence} confidence` : ""}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-mid">{f.guidance}</p>

      <div className="mt-3">
        {f.type === "longtext" && <textarea id={f.id} rows={5} className={inputCls} disabled={off} value={String(val)} onChange={(e) => edit(f.id, e.target.value)} />}
        {f.type === "text" && <input id={f.id} className={inputCls} disabled={off} value={String(val)} onChange={(e) => edit(f.id, e.target.value)} />}
        {f.type === "number" && <input id={f.id} type="number" className={inputCls} disabled={off} value={String(val)} onChange={(e) => edit(f.id, e.target.value === "" ? null : Number(e.target.value))} />}
        {f.type === "select" && (
          <select id={f.id} className={inputCls} disabled={off} value={String(val)} onChange={(e) => edit(f.id, e.target.value)}>
            <option value="">Select…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}
        {f.type === "scale4" && (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.label}>
            {f.options?.map((o, i) => (
              <button key={o} type="button" role="radio" aria-checked={Number(val) === i + 1} disabled={off}
                onClick={() => edit(f.id, i + 1)}
                className={cn("rounded border px-3 py-1.5 text-xs", Number(val) === i + 1 ? "border-eccellere-gold bg-eccellere-gold/20 font-medium" : "border-eccellere-ink/15 hover:border-eccellere-gold/50", off && "opacity-60")}>
                {o}
              </button>
            ))}
          </div>
        )}
        {f.type === "yesno" && (
          <div className="flex gap-2">{["Yes", "No"].map((o) => (
            <button key={o} type="button" disabled={off} onClick={() => edit(f.id, o)} className={cn("rounded border px-4 py-1.5 text-xs", val === o ? "border-eccellere-gold bg-eccellere-gold/20" : "border-eccellere-ink/15")}>{o}</button>
          ))}</div>
        )}
      </div>

      {r?.provenance === "AI-suggested" && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-purple-900">
          {r.basis && <span>Basis: {r.basis}</span>}
          {!locked && <button className="font-medium underline" onClick={() => confirm(f.id)}>Confirm this answer</button>}
          <span className="text-ink-light">or edit it above</span>
        </div>
      )}
      {!locked && (
        <div className="mt-2 flex gap-3 text-[11px] text-ink-light">
          {unknown
            ? <button className="underline hover:text-eccellere-gold" onClick={() => edit(f.id, "")}>Answer this instead</button>
            : <>
                <button className="underline hover:text-eccellere-gold" onClick={() => mark(f.id, "Not-known")}>Not known</button>
                <button className="underline hover:text-eccellere-gold" onClick={() => mark(f.id, "Not-applicable")}>Not applicable</button>
              </>}
        </div>
      )}
    </div>
  );
}
