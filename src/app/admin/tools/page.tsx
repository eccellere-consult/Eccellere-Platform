"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Upload, Play, Pause, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { fileToListText, isDocument, LIST_FILE_TYPES } from "@/lib/tools/listFile";
import ReviewPanel from "./ReviewPanel";
import SkillEditor from "./SkillEditor";
import Catalogue from "./Catalogue";
import { PROPOSED_LIST_TEXT } from "@/lib/tools/proposedList";

const CONCURRENCY = 3;
const RUN_KEY = "tools.currentRun";
const field = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";

interface Preview {
  entries: { name: string; category: string; practice: string; groupName: string | null }[];
  alreadyInCatalogue: string[]; skipped: { line: string; reason: string }[]; duplicates: string[];
  byCategory: Record<string, number>; byPractice: Record<string, number>; briefChars: number; briefLimit: number; briefWillBeShortened: boolean; estimate: { count: number; callsMin: number; callsMax: number; minutes: number };
}
interface RunItem { id: string; name: string; category: string; slug: string; status: string; error: string | null }
interface RunState { job: { id: string; label: string; status: string; pauseReason: string | null }; items: RunItem[] }
interface Row { slug: string; name: string; category: string; practice: string | null; source: string; groupName: string | null; status: string; errors: number; warnings: number; standards: { score: number; level: string } | null }

export default function AdminToolsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [practices, setPractices] = useState<string[]>([]);
  const [aiReady, setAiReady] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // add
  const [mode, setMode] = useState<"list" | "one">("list");
  const [category, setCategory] = useState("Auto");
  const [practice, setPractice] = useState("Auto");
  const [brief, setBrief] = useState("");
  const [extracting, setExtracting] = useState<"list" | "source" | null>(null);
  const [hubMsg, setHubMsg] = useState<string | null>(null);
  const [hubBusy, setHubBusy] = useState(false);
  const [text, setText] = useState("");
  const [oneName, setOneName] = useState("");
  const [oneGroup, setOneGroup] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);

  // run
  const [run, setRun] = useState<RunState | null>(null);
  const [driving, setDriving] = useState(false);
  const stopRef = useRef(false);
  const [runNote, setRunNote] = useState<string | null>(null);

  // suggest with AI
  const [topic, setTopic] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  // catalogue
  const [open, setOpen] = useState<string | null>(null);

  const loadCatalogue = useCallback(async () => {
    const r = await fetch("/api/admin/tools");
    if (r.status === 401 || r.status === 403) return setLoadErr("You do not have permission to manage tools.");
    const d = await readJson(r);
    if (!r.ok) return setLoadErr(d.error ?? "Could not load the tools.");
    setLoadErr(null); setCategories(d.categories); setPractices(d.practices ?? []); setAiReady(d.aiReady); setRows(d.tools);
  }, []);

  const loadRun = useCallback(async (id: string) => {
    const r = await fetch(`/api/admin/tools/jobs/${id}`);
    const d = await readJson(r);
    if (!r.ok) return null;
    const s = d as RunState;
    setRun(s);
    return s;
  }, []);

  useEffect(() => {
    loadCatalogue().catch(() => setLoadErr("Could not load the tools."));
    // /admin/tools?open=<slug> opens that tool's review panel (the Form Builder links here)
    try { const want = new URLSearchParams(window.location.search).get("open"); if (want) setOpen(want); } catch { /* no address bar */ }
    try { const id = localStorage.getItem(RUN_KEY); if (id) loadRun(id).catch(() => {}); } catch { /* storage unavailable */ }
  }, [loadCatalogue, loadRun]);

  /** Reads a PDF, Word or PowerPoint file on the server and returns its text. */
  async function extract(f: File): Promise<string> {
    const form = new FormData();
    form.append("file", f);
    const r = await fetch("/api/admin/tools/extract", { method: "POST", body: form });
    const d = await readJson(r);
    if (!r.ok) throw new Error(d.error ?? "Could not read that file.");
    return `${d.text}${d.truncated ? "\n\n[Only the first part of the document was kept.]" : ""}`;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setAddErr(null);
    try {
      if (isDocument(f.name)) { setExtracting("list"); setText(await extract(f)); }
      else setText(await fileToListText(f));
      setPreview(null);
    } catch (x) { setAddErr(x instanceof Error ? x.message : "Could not read that file."); }
    finally { setExtracting(null); }
  }

  /** A document as the content the AI builds the tool from: its text goes into the context box, where it can be read and edited. */
  async function onSourceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setAddErr(null); setExtracting("source");
    try {
      const t = await extract(f);
      setBrief((b) => `${b.trim() ? `${b.trim()}\n\n` : ""}[From ${f.name}]\n${t}`);
      setPreview(null);
    } catch (x) { setAddErr(x instanceof Error ? x.message : "Could not read that file."); }
    finally { setExtracting(null); }
  }

  /** Puts the proposed consulting list in the box, one tool per line, so nothing has to be copied from a file. */
  function loadProposed() {
    setMode("list"); setText(PROPOSED_LIST_TEXT); setPreview(null); setAddErr(null); setSuggestMsg(null);
  }

  /** The AI proposes well-known tools for a topic; they are added to the list box as lines to edit before anything is drafted. */
  async function suggest() {
    setSuggesting(true); setSuggestMsg(null); setAddErr(null);
    const have = text.split(/\r?\n/).map((l) => l.split("|")[0].trim()).filter(Boolean);
    const r = await fetch("/api/admin/tools/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, practice, have }) });
    const d = await readJson(r);
    setSuggesting(false);
    if (!r.ok) return setSuggestMsg(d.error ?? "Could not get suggestions.");
    const lines = (d.tools as { name: string; group: string }[]).map((t) => (t.group ? `${t.name} | ${t.group}` : t.name));
    setMode("list"); setText((t) => `${t.trim() ? `${t.trim()}\n` : ""}${lines.join("\n")}`); setPreview(null);
    setSuggestMsg(`${lines.length} tools added to the list below. Delete any you do not want, then check the list.`);
  }

  async function removeItem(itemId: string) {
    if (!run) return;
    await fetch(`/api/admin/tools/jobs/${run.job.id}?item=${encodeURIComponent(itemId)}`, { method: "DELETE" });
    await loadRun(run.job.id);
  }

  async function deleteRun() {
    if (!run || !confirm("Delete this run from the list? Tools already drafted from it are kept in the catalogue below.")) return;
    stopRef.current = true;
    await fetch(`/api/admin/tools/jobs/${run.job.id}`, { method: "DELETE" });
    try { localStorage.removeItem(RUN_KEY); } catch { /* ignore */ }
    setRun(null); setRunNote(null);
  }

  async function seedHub() {
    setHubBusy(true); setHubMsg(null);
    const r = await fetch("/api/admin/tools/seed-hub", { method: "POST" });
    const d = await readJson(r);
    setHubBusy(false);
    if (!r.ok) return setHubMsg(d.error ?? "Could not add them.");
    setHubMsg(`${d.added.length} added, ${d.skipped.length} were already there.${d.missing.length ? ` Missing: ${d.missing.join(", ")}.` : ""}`);
    loadCatalogue().catch(() => {});
  }

  const listText = () => (mode === "one" ? `${oneName.trim()}${oneGroup.trim() ? ` | ${oneGroup.trim()}` : ""}` : text);

  async function check() {
    setChecking(true); setAddErr(null); setPreview(null);
    const r = await fetch("/api/admin/tools/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: listText(), category, practice, brief, dryRun: true }) });
    const d = await readJson(r);
    setChecking(false);
    if (!r.ok) return setAddErr(d.error ?? "Could not check that list.");
    setPreview(d as Preview);
  }

  async function startDrafting() {
    setStarting(true); setAddErr(null);
    const r = await fetch("/api/admin/tools/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: listText(), category, practice, brief }) });
    const d = await readJson(r);
    setStarting(false);
    if (!r.ok) return setAddErr(d.error ?? "Could not start.");
    try { localStorage.setItem(RUN_KEY, d.jobId); } catch { /* ignore */ }
    setPreview(null); setText(""); setOneName(""); setOneGroup(""); setBrief("");
    const s = await loadRun(d.jobId);
    if (s) drive(d.jobId);
  }

  /** The page drives the run: three workers each ask for one name at a time until nothing is left, the AI is down, or Pause is pressed. */
  async function drive(jobId: string) {
    if (driving) return;
    stopRef.current = false; setDriving(true); setRunNote(null);
    const worker = async () => {
      while (!stopRef.current) {
        let d;
        try {
          const r = await fetch(`/api/admin/tools/jobs/${jobId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "step" }) });
          d = await readJson(r);
          if (!r.ok) { setRunNote(d.error ?? "A step failed."); stopRef.current = true; return; }
        } catch { setRunNote("Lost the connection. Press Continue to carry on from where it stopped."); stopRef.current = true; return; }
        if (d.kind === "paused") { setRunNote(`Paused: ${d.reason}`); stopRef.current = true; }
        if (d.kind === "idle") return;
        await loadRun(jobId);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    const s = await loadRun(jobId);
    setDriving(false);
    loadCatalogue().catch(() => {});
    if (s && s.job.status === "DONE" && !stopRef.current) setRunNote("Drafting finished. Review each draft below, then publish.");
  }

  async function runAction(action: "resume" | "retry") {
    if (!run) return;
    await fetch(`/api/admin/tools/jobs/${run.job.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    await loadRun(run.job.id);
    drive(run.job.id);
  }

  if (loadErr) return <div className="p-8 text-sm text-red-700">{loadErr}</div>;

  const counts = (run?.items ?? []).reduce<Record<string, number>>((a, i) => ((a[i.status] = (a[i.status] ?? 0) + 1), a), {});
  const total = run?.items.length ?? 0;
  const finished = total - (counts.QUEUED ?? 0) - (counts.DRAFTING ?? 0);
  const canCheck = listText().trim().length > 0 && !checking;

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-ink-mid hover:text-eccellere-gold"><ChevronLeft className="h-3 w-3" /> Admin</Link>
      <h1 className="mt-3 font-display text-3xl font-light text-eccellere-ink">Tools marketplace</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink-mid">
        Add tools by name, one at a time or from a list or file. The AI drafts each one to the Eccellere standard (a route, a guided workspace, a calculation,
        guidance on reading the result, and a 30/60/90 action plan). You review every draft, then publish it into the section you choose.
        Reviewed tools join the Eccellere consulting library; nothing reaches a client until you expose it.
      </p>
      <p className="mt-2 text-sm"><Link className="text-eccellere-gold underline" href="/consulting/library">Open the consulting library</Link></p>
      {!aiReady && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">No AI provider is switched on with a key, so drafting cannot start. Set one up under <Link className="underline" href="/admin/ai-settings">AI providers</Link>.</p>}

      {/* 1. add */}
      <section className="mt-6 rounded bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-medium text-eccellere-ink">1. Add tools</h2>
          <div className="inline-flex border border-eccellere-ink/20 text-xs" role="tablist">
            {(["list", "one"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setPreview(null); }} className={cn("px-3 py-1.5", mode === m ? "bg-eccellere-ink text-white" : "hover:bg-eccellere-cream")}>
                {m === "list" ? "Paste or upload a list" : "Write one tool"}
              </button>
            ))}
          </div>
          <label className="ml-auto text-xs text-ink-mid">Consulting practice
            <select className={cn(field, "mt-1 w-56")} value={practice} onChange={(e) => { setPractice(e.target.value); setPreview(null); }}>
              <option value="Auto">Auto: decide from the list&apos;s headings</option>
              {practices.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs text-ink-mid">Marketplace section
            <select className={cn(field, "mt-1 w-64")} value={category} onChange={(e) => { setCategory(e.target.value); setPreview(null); }}>
              <option value="Auto">Auto: decide from the list&apos;s headings</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        {mode === "list" ? (
          <div className="mt-4">
            <textarea className={cn(field, "min-h-[150px] font-mono")} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }}
              placeholder={"One tool per line.\n5 Why Analysis\nFishbone Diagram | Root cause\n\nA line starting with # sets the group for the lines under it:\n# Decision making\nPugh Matrix\nKano Model"} aria-label="List of tool names" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" className="border border-eccellere-gold px-3 py-2 text-xs text-eccellere-gold hover:bg-eccellere-gold/10" onClick={loadProposed}>Load the proposed consulting list ({PROPOSED_LIST_TEXT.split("\n").filter(Boolean).length} tools)</button>
              {text.trim() && <button type="button" className="inline-flex items-center gap-1 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream" onClick={() => { setText(""); setPreview(null); }}><Trash2 className="h-3.5 w-3.5" /> Clear the box</button>}
            </div>
            <div className="mt-3 rounded border border-violet-200 bg-violet-50/60 p-3">
              <label className="text-xs font-medium text-eccellere-ink" htmlFor="topic"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-violet-700" />Suggest tools with AI</label>
              <div className="mt-1 flex flex-wrap gap-2">
                <input id="topic" className={cn(field, "min-w-[260px] flex-1")} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What do you need tools for? For example: change management for a bank" />
                <button type="button" className="bg-violet-700 px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={suggesting || topic.trim().length < 3 || !aiReady} onClick={suggest}>
                  {suggesting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Suggest 15 tools"}
                </button>
              </div>
              {suggestMsg && <p className="mt-1 text-xs text-ink-mid">{suggestMsg}</p>}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream">
              {extracting === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload a list (.txt, .csv, .xlsx, .pdf, .docx, .pptx)
              <input type="file" accept={LIST_FILE_TYPES} className="sr-only" onChange={onFile} />
            </label>
            <span className="ml-3 text-[11px] text-ink-light">Spreadsheets: column A is the tool name, column B (optional) the group. From a PDF, Word or PowerPoint file the text is read and put in the box; delete anything that is not a tool name.</span>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="text-xs text-ink-mid">Tool name<input className={cn(field, "mt-1")} value={oneName} onChange={(e) => { setOneName(e.target.value); setPreview(null); }} placeholder="for example: Pareto Analysis" /></label>
            <label className="text-xs text-ink-mid">Group (optional)<input className={cn(field, "mt-1")} value={oneGroup} onChange={(e) => { setOneGroup(e.target.value); setPreview(null); }} placeholder="for example: Root cause" /></label>
          </div>
        )}

        <div className="mt-4 rounded border border-eccellere-ink/10 bg-eccellere-cream/50 p-3">
          <label className="text-xs font-medium text-eccellere-ink" htmlFor="brief">Content or context for the AI to build from (optional)</label>
          <p className="mt-1 text-[11px] text-ink-light">Describe the audience and setting, or upload the source: a course deck, a PDF, a Word document or a slide deck. The AI builds the tool from it where it applies. You can read and edit the text before using it. Uploaded files are read, not stored.</p>
          <textarea id="brief" className={cn(field, "mt-2 min-h-[90px]")} value={brief} onChange={(e) => { setBrief(e.target.value); setPreview(null); }} placeholder="For example: for the finance team of a mid-sized distributor, who already use Excel for cash forecasts…" />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 border border-eccellere-ink/20 bg-white px-3 py-2 text-xs hover:bg-eccellere-cream">
            {extracting === "source" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload a document as source (PDF, Word, PowerPoint)
            <input type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.md" className="sr-only" onChange={onSourceFile} />
          </label>
          {brief.trim() && <span className="ml-3 text-[11px] text-ink-light">{brief.trim().length.toLocaleString("en-GB")} characters</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!canCheck} onClick={check}>
            {checking ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Check the list"}
          </button>
          {addErr && <span className="text-sm text-red-700">{addErr}</span>}
        </div>

        {preview && (
          <div className="mt-4 rounded border border-eccellere-ink/15 p-4 text-sm">
            <p className="font-medium text-eccellere-ink">{preview.estimate.count} new tool{preview.estimate.count === 1 ? "" : "s"} ready to draft</p>
            {preview.estimate.count > 0 && (
              <>
                <p className="mt-1 text-xs text-ink-mid">Sections: {Object.entries(preview.byCategory).map(([c, n]) => `${c}: ${n}`).join(" · ")}</p>
                <p className="mt-1 text-xs text-ink-mid">Practices: {Object.entries(preview.byPractice).map(([c, n]) => `${c}: ${n}`).join(" · ")}</p>
                {preview.briefChars > 0 && (
                  <p className={cn("mt-1 text-xs", preview.briefWillBeShortened ? "text-amber-800" : "text-ink-mid")}>
                    Your context ({preview.briefChars.toLocaleString("en-GB")} characters) is sent with every tool in this run.
                    {preview.briefWillBeShortened ? ` It will be cut to the first ${preview.briefLimit.toLocaleString("en-GB")} characters because the run has many tools. For a long document, add one tool at a time.` : ""}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-mid">
                  About {preview.estimate.callsMin} to {preview.estimate.callsMax} AI calls and roughly {preview.estimate.minutes} minute{preview.estimate.minutes === 1 ? "" : "s"} with three running at a time.
                  The tool names and categories (nothing else) are sent to your AI provider. Keep this page open while it runs; if you close it, press Continue later.
                </p>
                <ul className="mt-2 max-h-40 overflow-auto text-xs text-ink-mid">
                  {preview.entries.slice(0, 200).map((e) => <li key={e.name}>{e.name} <span className="text-ink-light">→ {e.category} · {e.practice}{e.groupName ? ` · ${e.groupName}` : ""}</span></li>)}
                </ul>
              </>
            )}
            {preview.alreadyInCatalogue.length > 0 && <p className="mt-2 text-xs text-amber-800">Already in the catalogue, so skipped: {preview.alreadyInCatalogue.join(", ")}</p>}
            {preview.duplicates.length > 0 && <p className="mt-2 text-xs text-amber-800">Repeated in your list, kept once: {preview.duplicates.join(", ")}</p>}
            {preview.skipped.length > 0 && (
              <div className="mt-2 text-xs text-amber-800">Lines that are not tool names, left out:
                <ul className="list-disc pl-5">{preview.skipped.slice(0, 8).map((s, i) => <li key={i}>&ldquo;{s.line}&rdquo;: {s.reason}</li>)}</ul>
              </div>
            )}
            {preview.estimate.count > 0 && (
              <button className="mt-3 bg-eccellere-gold px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={starting || !aiReady || driving} onClick={startDrafting}>
                {starting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `Start drafting ${preview.estimate.count} tool${preview.estimate.count === 1 ? "" : "s"}`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Strategy Hub tools */}
      <section className="mt-6 rounded bg-white p-5 shadow-sm">
        <h2 className="font-medium text-eccellere-ink">Strategy Hub tools</h2>
        <p className="mt-1 text-sm text-ink-mid">
          The 36 hand-built Strategy Hub tools (PESTEL, Porter, Business Model Canvas, OKRs and more), with their hand-drawn diagrams and worked examples.
          Adding them puts them in the consulting library, placed by practice, layer and lifecycle stage. They are not shown to clients until you expose them.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className="bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={hubBusy} onClick={seedHub}>
            {hubBusy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `Add the Strategy Hub tools to the library (${rows.filter((r) => r.source === "strategy-hub").length} of 36 added)`}
          </button>
          {hubMsg && <span className="text-sm text-ink-mid">{hubMsg}</span>}
        </div>
      </section>

      {/* 2. run */}
      {run && (
        <section className="mt-6 rounded bg-white p-5 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-medium text-eccellere-ink">2. Drafting: {run.job.label}</h2>
            <span className="text-xs text-ink-mid">{finished} of {total} done</span>
            <div className="ml-auto flex gap-2">
              <button className="inline-flex items-center gap-1 border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50" onClick={deleteRun}><Trash2 className="h-3 w-3" /> Delete this run</button>
              {driving
                ? <button className="inline-flex items-center gap-1 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream" onClick={() => { stopRef.current = true; }}><Pause className="h-3 w-3" /> Pause</button>
                : (counts.QUEUED ?? 0) + (counts.DRAFTING ?? 0) > 0 && <button className="inline-flex items-center gap-1 bg-eccellere-ink px-3 py-2 text-xs text-white" onClick={() => runAction("resume")}><Play className="h-3 w-3" /> Continue</button>}
              {(counts.FAILED ?? 0) > 0 && !driving && <button className="inline-flex items-center gap-1 border border-eccellere-gold px-3 py-2 text-xs text-eccellere-gold" onClick={() => runAction("retry")}><RotateCcw className="h-3 w-3" /> Retry {counts.FAILED} failed</button>}
            </div>
          </div>
          <div className="mt-3 h-2 w-full bg-eccellere-cream"><div className="h-2 bg-eccellere-gold transition-all" style={{ width: `${total ? (finished / total) * 100 : 0}%` }} /></div>
          <p className="mt-2 text-xs text-ink-mid">
            {(["DRAFT", "NEEDS_REVIEW", "FAILED", "DRAFTING", "QUEUED"] as const).filter((s) => counts[s]).map((s) => `${counts[s]} ${s === "DRAFT" ? "drafted" : s === "NEEDS_REVIEW" ? "need fixing" : s === "FAILED" ? "failed" : s === "DRAFTING" ? "drafting now" : "waiting"}`).join(" · ")}
          </p>
          {(runNote || run.job.pauseReason) && <p className="mt-2 rounded bg-amber-50 p-3 text-sm text-amber-900">{runNote ?? run.job.pauseReason}</p>}
          <ul className="mt-3 max-h-56 overflow-auto text-xs">
            {run.items.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2 border-b border-eccellere-ink/5 py-1">
                <span className="w-44 shrink-0 truncate text-eccellere-ink">{i.name}</span>
                <span className={cn("shrink-0", i.status === "FAILED" ? "text-red-700" : i.status === "NEEDS_REVIEW" ? "text-amber-700" : "text-ink-light")}>{i.status === "DRAFT" ? "drafted" : i.status === "NEEDS_REVIEW" ? "needs fixing" : i.status.toLowerCase()}</span>
                {i.error && <span className="text-red-700">{i.error}</span>}
                <span className="ml-auto flex shrink-0 gap-2">
                  {(i.status === "DRAFT" || i.status === "NEEDS_REVIEW") && <button className="underline" onClick={() => setOpen(i.slug)}>Open</button>}
                  {i.status !== "DRAFTING" && <button className="text-red-700 underline" aria-label={`Remove ${i.name} from this run`} onClick={() => removeItem(i.id)}>Remove</button>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Catalogue rows={rows} categories={categories} open={open} setOpen={setOpen} reload={() => loadCatalogue().catch(() => {})} aiReady={aiReady} />

      <section className="mt-6 rounded bg-white p-5 shadow-sm">
        <h2 className="font-medium text-eccellere-ink">Skill files</h2>
        <p className="mt-1 text-sm text-ink-mid">The instructions the AI follows to build a tool page from a topic, and to help a person using one. Edit them to change the standard; download them as .md to share.</p>
        <details className="mt-3"><summary className="cursor-pointer text-sm text-eccellere-gold">Open and edit the skill files</summary><div className="mt-4"><SkillEditor /></div></details>
      </section>

      {open && <ReviewPanel key={open} slug={open} categories={categories} practices={practices} onChanged={() => loadCatalogue().catch(() => {})} onClose={() => setOpen(null)} />}
    </div>
  );
}
