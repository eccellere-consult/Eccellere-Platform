"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Upload, Play, Pause, RotateCcw } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { LIST_FILE_TYPES, fileToListText } from "@/lib/tools/listFile";
import ReviewPanel, { StatusChip, statusLabel } from "./ReviewPanel";

const CONCURRENCY = 3;
const RUN_KEY = "tools.currentRun";
const field = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";

interface Preview {
  entries: { name: string; category: string; groupName: string | null }[];
  alreadyInCatalogue: string[]; skipped: { line: string; reason: string }[]; duplicates: string[];
  byCategory: Record<string, number>; estimate: { count: number; callsMin: number; callsMax: number; minutes: number };
}
interface RunItem { id: string; name: string; category: string; slug: string; status: string; error: string | null }
interface RunState { job: { id: string; label: string; status: string; pauseReason: string | null }; items: RunItem[] }
interface Row { slug: string; name: string; category: string; groupName: string | null; status: string; errors: number; warnings: number; standards: { score: number; level: string } | null }

export default function AdminToolsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [aiReady, setAiReady] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // add
  const [mode, setMode] = useState<"list" | "one">("list");
  const [category, setCategory] = useState("Auto");
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

  // catalogue
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [open, setOpen] = useState<string | null>(null);

  const loadCatalogue = useCallback(async () => {
    const r = await fetch("/api/admin/tools");
    if (r.status === 401 || r.status === 403) return setLoadErr("You do not have permission to manage tools.");
    const d = await readJson(r);
    if (!r.ok) return setLoadErr(d.error ?? "Could not load the tools.");
    setLoadErr(null); setCategories(d.categories); setAiReady(d.aiReady); setRows(d.tools);
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
    try { const id = localStorage.getItem(RUN_KEY); if (id) loadRun(id).catch(() => {}); } catch { /* storage unavailable */ }
  }, [loadCatalogue, loadRun]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setText(await fileToListText(f)); setPreview(null); setAddErr(null); }
    catch (x) { setAddErr(x instanceof Error ? x.message : "Could not read that file."); }
  }

  const listText = () => (mode === "one" ? `${oneName.trim()}${oneGroup.trim() ? ` | ${oneGroup.trim()}` : ""}` : text);

  async function check() {
    setChecking(true); setAddErr(null); setPreview(null);
    const r = await fetch("/api/admin/tools/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: listText(), category, dryRun: true }) });
    const d = await readJson(r);
    setChecking(false);
    if (!r.ok) return setAddErr(d.error ?? "Could not check that list.");
    setPreview(d as Preview);
  }

  async function startDrafting() {
    setStarting(true); setAddErr(null);
    const r = await fetch("/api/admin/tools/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: listText(), category }) });
    const d = await readJson(r);
    setStarting(false);
    if (!r.ok) return setAddErr(d.error ?? "Could not start.");
    try { localStorage.setItem(RUN_KEY, d.jobId); } catch { /* ignore */ }
    setPreview(null); setText(""); setOneName(""); setOneGroup("");
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
  const shown = rows.filter((r) => (filterCat === "All" || r.category === filterCat) && (filterStatus === "All" || r.status === filterStatus));
  const canCheck = listText().trim().length > 0 && !checking;

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-ink-mid hover:text-eccellere-gold"><ChevronLeft className="h-3 w-3" /> Admin</Link>
      <h1 className="mt-3 font-display text-3xl font-light text-eccellere-ink">Tools marketplace</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink-mid">
        Add tools by name, one at a time or from a list or file. The AI drafts each one to the Eccellere standard (a route, a guided workspace, a calculation,
        guidance on reading the result, and a 30/60/90 action plan). You review every draft, then publish it into the section you choose.
        Nothing reaches a client until you mark it reviewed.
      </p>
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
          <label className="ml-auto text-xs text-ink-mid">Marketplace section
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
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream">
              <Upload className="h-4 w-4" /> Upload a file (.txt, .csv, .xlsx)
              <input type="file" accept={LIST_FILE_TYPES} className="sr-only" onChange={onFile} />
            </label>
            <span className="ml-3 text-[11px] text-ink-light">Spreadsheets: column A is the tool name, column B (optional) the group.</span>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="text-xs text-ink-mid">Tool name<input className={cn(field, "mt-1")} value={oneName} onChange={(e) => { setOneName(e.target.value); setPreview(null); }} placeholder="for example: Pareto Analysis" /></label>
            <label className="text-xs text-ink-mid">Group (optional)<input className={cn(field, "mt-1")} value={oneGroup} onChange={(e) => { setOneGroup(e.target.value); setPreview(null); }} placeholder="for example: Root cause" /></label>
          </div>
        )}

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
                <p className="mt-1 text-xs text-ink-mid">
                  {Object.entries(preview.byCategory).map(([c, n]) => `${c}: ${n}`).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-ink-mid">
                  About {preview.estimate.callsMin} to {preview.estimate.callsMax} AI calls and roughly {preview.estimate.minutes} minute{preview.estimate.minutes === 1 ? "" : "s"} with three running at a time.
                  The tool names and categories (nothing else) are sent to your AI provider. Keep this page open while it runs; if you close it, press Continue later.
                </p>
                <ul className="mt-2 max-h-40 overflow-auto text-xs text-ink-mid">
                  {preview.entries.slice(0, 200).map((e) => <li key={e.name}>{e.name} <span className="text-ink-light">→ {e.category}{e.groupName ? ` · ${e.groupName}` : ""}</span></li>)}
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

      {/* 2. run */}
      {run && (
        <section className="mt-6 rounded bg-white p-5 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-medium text-eccellere-ink">2. Drafting: {run.job.label}</h2>
            <span className="text-xs text-ink-mid">{finished} of {total} done</span>
            <div className="ml-auto flex gap-2">
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
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. catalogue */}
      <section className="mt-6 rounded bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-medium text-eccellere-ink">3. Review and publish</h2>
          <span className="text-xs text-ink-mid">{rows.length} tool{rows.length === 1 ? "" : "s"}, {rows.filter((r) => r.status === "PUBLISHED").length} live</span>
          <select aria-label="Filter by section" className={cn(field, "ml-auto w-48")} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option>All</option>{categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Filter by status" className={cn(field, "w-40")} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All statuses</option>
            {["DRAFT", "NEEDS_REVIEW", "REVIEWED", "PUBLISHED", "ARCHIVED"].map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        {shown.length === 0 ? (
          <p className="mt-4 text-sm text-ink-light">{rows.length === 0 ? "No tools yet. Add some above." : "No tools match those filters."}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-ink-light"><tr><th className="py-2 pr-3">Tool</th><th className="pr-3">Section</th><th className="pr-3">Status</th><th className="pr-3">Standard</th><th className="pr-3">Checks</th><th /></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.slug} className={cn("border-t border-eccellere-ink/5", open === r.slug && "bg-eccellere-cream")}>
                    <td className="py-2 pr-3 font-medium text-eccellere-ink">{r.name}{r.groupName && <span className="block text-[11px] font-normal text-ink-light">{r.groupName}</span>}</td>
                    <td className="pr-3 text-xs text-ink-mid">{r.category}</td>
                    <td className="pr-3"><StatusChip s={r.status} /></td>
                    <td className="pr-3 text-xs">{r.standards ? `${r.standards.score}/100 · ${r.standards.level}` : "-"}</td>
                    <td className="pr-3 text-xs">{r.errors > 0 ? <span className="text-red-700">{r.errors} to fix</span> : <span className="text-emerald-700">clear</span>}{r.warnings > 0 && <span className="text-ink-light"> · {r.warnings} notes</span>}</td>
                    <td className="text-right"><button className="border border-eccellere-ink/20 px-3 py-1 text-xs hover:bg-white" onClick={() => setOpen(open === r.slug ? null : r.slug)}>{open === r.slug ? "Close" : r.status === "PUBLISHED" ? "View" : "Review"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && <ReviewPanel key={open} slug={open} categories={categories} onChanged={() => loadCatalogue().catch(() => {})} onClose={() => setOpen(null)} />}
    </div>
  );
}
