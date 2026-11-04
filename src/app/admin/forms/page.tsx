"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { ASSET_TYPES } from "@/lib/tools/taxonomy";

const field = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";
const ACCEPT = ".xlsx,.docx,.pdf,.pptx,.csv,.tsv,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,image/*";

type Path = "upload" | "describe" | "template";
interface Element { id: string; file: string; kind: string; text: string; where: string }
interface Match { slug: string; name: string; why: string; status: string; byAi: boolean }
interface Analysis { aiReady: boolean; files: { name: string; elements: number; warnings: string[] }[]; elements: Element[]; counts: Record<string, number>; warnings: string[]; templates: Match[]; templatesByAi: boolean }
interface Item { id: string; kind: string; text: string; where: string; status: string; target?: string; note?: string }
interface Counts { required: number; mapped: number; auto: number; excluded: number; proposed: number; notCovered: number; notSent: number; closedPct: number }
interface Coverage { counts: Counts; assumptions: string[]; approximations: string[]; items: Item[] }
interface Result { slug: string; name: string; status: string; quality: { errors: string[]; warnings: string[]; standards?: { score: number; level: string; band: string } }; notes: string[]; coverage: Coverage | null }
interface Built { slug: string; name: string; status: string; category: string; mode: string | null; formType: string | null; errors: number; warnings: number; standards: { score: number; band: string } | null; coverage: Counts | null }

const KIND: Record<string, string> = { heading: "headings", question: "questions", option: "answer options", instruction: "instructions", tablehead: "table headers", row: "table rows", formula: "formulas", note: "notes" };
const STATUS: Record<string, string> = { mapped: "In the form", auto: "In the form (matched by words)", "proposed-exclusion": "AI suggests leaving out", "not-covered": "Not in the form", "not-sent": "Not sent to the AI", excluded: "Left out on purpose" };

export default function FormBuilderPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [practices, setPractices] = useState<string[]>([]);
  const [aiReady, setAiReady] = useState(true);
  const [built, setBuilt] = useState<Built[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [path, setPath] = useState<Path>("upload");
  const [request, setRequest] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [assetType, setAssetType] = useState("");
  const addFiles = useCallback((more: File[]) => {
    if (!more.length) return;
    setFiles((p) => [...p, ...more].slice(0, 3));
    setAnalysis(null);
  }, []);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [base, setBase] = useState("");
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [category, setCategory] = useState("Others");
  const [practice, setPractice] = useState("Strategy");
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [pick, setPick] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [covBusy, setCovBusy] = useState(false);
  const [covMsg, setCovMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/forms");
    if (r.status === 401 || r.status === 403) return setLoadErr("You do not have permission to build forms.");
    const d = await readJson(r);
    if (!r.ok) return setLoadErr(d.error ?? "Could not load the Form Builder.");
    setLoadErr(null); setCategories(d.categories); setPractices(d.practices); setAiReady(d.aiReady); setBuilt(d.built);
    setCategory((c) => (d.categories.includes(c) ? c : d.categories[0])); setPractice((p) => (d.practices.includes(p) ? p : d.practices[0]));
  }, []);
  // a screenshot pasted with Ctrl+V anywhere on the page (upload path only)
  useEffect(() => {
    if (path !== "upload") return;
    const onPaste = (e: ClipboardEvent) => {
      const pics = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (pics.length) { e.preventDefault(); addFiles(pics.map((f, i) => (f.name && f.name !== "image.png" ? f : new File([f], `screenshot-${Date.now()}-${i}.${(f.type.split("/")[1] || "png").replace("jpeg", "jpg")}`, { type: f.type })))); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [path, addFiles]);
  useEffect(() => { load().catch(() => setLoadErr("Could not load the Form Builder.")); }, [load]);

  const canRead = path === "upload" ? files.length > 0 : request.trim().length >= 8;

  async function analyse() {
    setReading(true); setErr(null); setAnalysis(null); setResult(null);
    const fd = new FormData();
    fd.append("request", request);
    if (path === "upload") for (const f of files) fd.append("files", f);
    const r = await fetch("/api/admin/forms/analyse", { method: "POST", body: fd });
    const d = await readJson(r);
    setReading(false);
    if (!r.ok) return setErr(d.error ?? "Could not read that.");
    setAnalysis(d as Analysis);
    setBase(path === "template" && d.templates?.[0] ? d.templates[0].slug : "");
  }

  async function build() {
    if (!analysis) return;
    setBuilding(true); setErr(null); setResult(null); setCovMsg(null); setPick([]);
    const r = await fetch("/api/admin/forms/build", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request, name, audience, category, practice, assetType: assetType || undefined, baseSlug: base || undefined, elements: path === "upload" ? analysis.elements : undefined, warnings: path === "upload" ? analysis.warnings : undefined }),
    });
    const d = await readJson(r);
    setBuilding(false);
    if (!r.ok) return setErr(d.error ?? "Could not build the form.");
    setResult(d as Result);
    load().catch(() => {});
  }

  async function coverage(body: Record<string, unknown>, ok: string) {
    if (!result) return;
    setCovBusy(true); setCovMsg(null);
    const r = await fetch(`/api/admin/forms/${result.slug}/coverage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await readJson(r);
    setCovBusy(false);
    if (!r.ok) return setCovMsg(d.error ?? "Could not update.");
    setResult({ ...result, status: d.status, quality: d.quality, coverage: d.coverage });
    setPick([]); setReason(""); setCovMsg(ok);
    load().catch(() => {});
  }

  function reset() { setAnalysis(null); setResult(null); setFiles([]); setRequest(""); setName(""); setAudience(""); setBase(""); setErr(null); }

  const open = useMemo(() => result?.coverage?.items.filter((i) => ["not-covered", "proposed-exclusion", "not-sent"].includes(i.status)) ?? [], [result]);

  if (loadErr) return <div className="mx-auto max-w-3xl p-6 text-sm text-red-700">{loadErr}</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-ink-light hover:text-eccellere-ink"><ChevronLeft className="h-3.5 w-3.5" /> Admin</Link>
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold-deep">Admin</p>
      <h1 className="font-display text-3xl text-eccellere-ink">Form Builder</h1>
      <p className="mt-1 text-sm"><Link href="/admin/forms/classify" className="text-gold-deep underline underline-offset-2">Classify and deepen the whole catalogue</Link> (survey forms, transformation toolkits, daily tools; by area and sector)</p>
      <p className="mt-1 max-w-2xl text-sm text-ink-mid">Turn an Excel, Word or PDF form, a plain description, or an existing template into a form that clients can fill in. You review it, then publish it with the other tools in the marketplace. Nothing reaches a client until you do.</p>
      {!aiReady && <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">No AI provider is switched on, so a form cannot be built yet. Reading files and finding templates still work. Open &ldquo;AI Providers&rdquo; in the admin menu to switch one on.</p>}

      {/* 1. start */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-eccellere-ink">1. How do you want to start?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3" role="tablist">
          {([
            ["upload", "Upload a form", "Excel, Word, PDF, PowerPoint, CSV or text. Every question is tracked.", Upload],
            ["describe", "Describe it", "Say what you need in a few sentences.", Sparkles],
            ["template", "Start from a template", "Describe the need; the best existing templates are suggested.", FileText],
          ] as const).map(([id, title, hint, Icon]) => (
            <button key={id} role="tab" aria-selected={path === id} onClick={() => { setPath(id); reset(); }} className={cn("border p-4 text-left text-sm", path === id ? "border-eccellere-gold bg-eccellere-cream" : "border-eccellere-ink/15 hover:bg-eccellere-cream")}>
              <Icon className="h-4 w-4 text-gold-deep" />
              <span className="mt-2 block font-medium text-eccellere-ink">{title}</span>
              <span className="mt-1 block text-xs text-ink-mid">{hint}</span>
            </button>
          ))}
        </div>

        {path === "upload" && (
          <div className="mt-4">
            <p className="block text-sm text-eccellere-ink" id="fb-files-label">Files or screenshots (up to 3; no size or length limit for documents; pictures up to 5 MB each)</p>
            <div
              role="group" aria-labelledby="fb-files-label"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
              className={cn("mt-1 border-2 border-dashed p-5 text-center text-sm transition-colors", dragging ? "border-eccellere-gold bg-eccellere-gold/5" : "border-eccellere-ink/20 bg-white")}
            >
              <Upload className="mx-auto h-5 w-5 text-eccellere-gold" aria-hidden />
              <p className="mt-2 text-ink-mid">Drag files here, paste a screenshot (Ctrl+V), or</p>
              <label htmlFor="fb-files" className="mt-2 inline-block cursor-pointer border border-eccellere-ink bg-eccellere-ink px-4 py-2 text-xs text-white focus-within:outline focus-within:outline-2 focus-within:outline-eccellere-gold">Click to choose files</label>
              <input id="fb-files" type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
              <p className="mt-2 text-xs text-ink-light">Excel, Word, PDF, PowerPoint, CSV, text, or a PNG, JPG, WebP or GIF picture.</p>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between border border-eccellere-ink/10 bg-white px-3 py-1.5">
                    <span className="truncate">{f.name} <span className="text-xs text-ink-light">({Math.max(1, Math.round(f.size / 1024))} KB{/^image\//.test(f.type) ? ", read by AI" : ""})</span></span>
                    <button type="button" className="ml-3 text-xs text-ink-mid underline" onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setAnalysis(null); }} aria-label={`Remove ${f.name}`}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-ink-light">A picture is read by the AI and must be checked against the original. Scanned PDFs are not read: take a screenshot of the page instead. The file itself is not kept; the numbered list of what was in it is.</p>
          </div>
        )}
        <div className="mt-4">
          <label className="block text-sm text-eccellere-ink" htmlFor="fb-request">{path === "upload" ? "What is this form for? (optional)" : "What do you need?"}</label>
          <textarea id="fb-request" className={cn(field, "mt-1 min-h-[96px]")} value={request} onChange={(e) => { setRequest(e.target.value); setAnalysis(null); }} placeholder={path === "upload" ? "For example: our supplier onboarding checklist, for small automotive suppliers." : "For example: a monthly business review form for a retail business with three stores."} />
        </div>
        <button className="mt-3 bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={!canRead || reading} onClick={analyse}>
          {reading ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Reading…</> : path === "upload" ? "Read the file and find templates" : "Find templates"}
        </button>
        {err && !analysis && <p className="mt-3 text-sm text-red-700" role="alert">{err}</p>}
      </section>

      {/* 2. review what was read */}
      {analysis && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-eccellere-ink">2. Check what was found</h2>
          {analysis.elements.length > 0 && (
            <div className="mt-3 border border-eccellere-ink/15 bg-white p-4 text-sm">
              <p className="text-eccellere-ink">
                Read {analysis.elements.length} items from {analysis.files.map((f) => f.name).join(", ")}:{" "}
                {Object.entries(analysis.counts).map(([k, n]) => `${n} ${KIND[k] ?? k}`).join(", ")}.
              </p>
              {analysis.warnings.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">{analysis.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs underline">See the first items and where each came from</summary>
                <table className="mt-2 w-full text-left text-xs">
                  <thead><tr className="text-ink-light"><th className="py-1 pr-2">Ref</th><th className="pr-2">Type</th><th className="pr-2">Text</th><th>Where</th></tr></thead>
                  <tbody>{analysis.elements.slice(0, 25).map((e) => <tr key={e.id} className="border-t border-eccellere-ink/10 align-top"><td className="py-1 pr-2">{e.id}</td><td className="pr-2">{e.kind}</td><td className="pr-2">{e.text}</td><td className="text-ink-light">{e.where}</td></tr>)}</tbody>
                </table>
              </details>
            </div>
          )}

          <fieldset className="mt-4">
            <legend className="text-sm text-eccellere-ink">Best matching templates {analysis.templatesByAi ? "(chosen by AI from the catalogue)" : "(matched on words)"}</legend>
            <label className="mt-2 flex items-start gap-2 text-sm"><input type="radio" name="base" checked={base === ""} onChange={() => setBase("")} className="mt-1" /><span>Build from scratch, without a template</span></label>
            {analysis.templates.map((t) => (
              <label key={t.slug} className="mt-2 flex items-start gap-2 text-sm">
                <input type="radio" name="base" checked={base === t.slug} onChange={() => setBase(t.slug)} className="mt-1" />
                <span><strong>{t.name}</strong> <span className="text-xs text-ink-light">({t.status.toLowerCase().replace("_", " ")})</span><br /><span className="text-xs text-ink-mid">{t.why}</span></span>
              </label>
            ))}
            {analysis.templates.length === 0 && <p className="mt-2 text-xs text-ink-light">Nothing in the catalogue matches closely, so the form will be built from scratch.</p>}
          </fieldset>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div><label className="text-xs text-ink-mid" htmlFor="fb-name">Form name (leave empty to let the AI name it)</label><input id="fb-name" className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></div>
            <div><label className="text-xs text-ink-mid" htmlFor="fb-aud">Who fills it in? (optional)</label><input id="fb-aud" className={field} value={audience} onChange={(e) => setAudience(e.target.value)} maxLength={400} placeholder="For example: procurement managers in MSMEs" /></div>
            <div><label className="text-xs text-ink-mid" htmlFor="fb-type">Type of asset</label><select id="fb-type" className={field} value={assetType} onChange={(e) => setAssetType(e.target.value)}><option value="">Let the AI decide</option>{ASSET_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}: {t.tagline}</option>)}</select></div>
            <div><label className="text-xs text-ink-mid" htmlFor="fb-cat">Marketplace section</label><select id="fb-cat" className={field} value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-xs text-ink-mid" htmlFor="fb-prac">Consulting practice</label><select id="fb-prac" className={field} value={practice} onChange={(e) => setPractice(e.target.value)}>{practices.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <p className="mt-4 text-xs text-ink-light">When you build, the text of your request and of the file is sent to the AI service to write the form. The file itself is not kept.</p>
          <button className="mt-2 bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={building || !aiReady} onClick={build}>
            {building ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Building the form. This takes one to two minutes…</> : "Build the form"}
          </button>
          {err && <p className="mt-3 text-sm text-red-700" role="alert">{err}</p>}
        </section>
      )}

      {/* 3. result */}
      {result && (
        <section className="mt-10 border border-eccellere-gold/60 bg-white p-5" aria-live="polite">
          <h2 className="text-sm font-semibold text-eccellere-ink">3. Built: {result.name}</h2>
          <p className="mt-1 text-sm text-ink-mid">
            Saved as <strong>{result.status === "NEEDS_REVIEW" ? "needs attention" : "draft"}</strong>. Eccellere standard score{" "}
            <strong>{result.quality.standards ? `${result.quality.standards.score}/100 (${result.quality.standards.band})` : "n/a"}</strong>. It is not visible to clients.
          </p>
          {result.quality.errors.length > 0 && (<div className="mt-3"><p className="text-xs font-semibold text-red-700">To fix before it can be marked as reviewed</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-red-700">{result.quality.errors.map((e) => <li key={e}>{e}</li>)}</ul></div>)}
          {result.quality.warnings.length > 0 && (<details className="mt-3"><summary className="cursor-pointer text-xs underline">{result.quality.warnings.length} things to check</summary><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink-mid">{result.quality.warnings.map((w) => <li key={w}>{w}</li>)}</ul></details>)}

          {result.coverage && (
            <div className="mt-5 border-t border-eccellere-ink/10 pt-4">
              <h3 className="text-sm font-semibold text-eccellere-ink">Did everything from your file make it into the form?</h3>
              <p className="mt-1 text-sm text-ink-mid">
                {result.coverage.counts.mapped + result.coverage.counts.auto} of {result.coverage.counts.required} items are in the form
                {result.coverage.counts.excluded ? `, ${result.coverage.counts.excluded} left out on purpose` : ""}
                {open.length ? `, ${open.length} still open` : ". Nothing is missing"}.
              </p>
              {open.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-ink-mid">Tick the items that should be left out, say why, then confirm. Anything else must be added to the form (use &ldquo;Modify with AI&rdquo; in Tools marketplace, then Re-check).</p>
                  <ul className="mt-2 divide-y divide-eccellere-ink/10 border border-eccellere-ink/10 text-xs">
                    {open.map((i) => (
                      <li key={i.id} className="flex items-start gap-2 p-2">
                        <input type="checkbox" className="mt-0.5" checked={pick.includes(i.id)} onChange={(e) => setPick((p) => (e.target.checked ? [...p, i.id] : p.filter((x) => x !== i.id)))} aria-label={`Leave out ${i.id}`} />
                        <span><strong>{i.id}</strong> {i.text}<br /><span className="text-ink-light">{i.where} · {STATUS[i.status] ?? i.status}{i.note ? ` · ${i.note}` : ""}</span></span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input className={cn(field, "max-w-sm")} placeholder="Why are these left out?" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason for leaving items out" />
                    <button className="border border-eccellere-ink/30 px-3 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={covBusy || !pick.length || !reason.trim()} onClick={() => coverage({ exclude: pick, reason }, "Saved. Those items are recorded as left out on purpose.")}>Confirm leaving out ({pick.length})</button>
                  </div>
                </div>
              )}
              <button className="mt-3 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={covBusy} onClick={() => coverage({ recheck: true }, "Checked again against the form as it is now.")}>Re-check against the form</button>
              {covMsg && <span className="ml-3 text-sm text-ink-mid">{covMsg}</span>}
              {result.coverage.approximations.length > 0 && (<div className="mt-4"><p className="text-xs font-semibold text-eccellere-ink">Shown a little differently from your file</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink-mid">{result.coverage.approximations.map((a) => <li key={a}>{a}</li>)}</ul></div>)}
              {result.coverage.assumptions.length > 0 && (<div className="mt-4"><p className="text-xs font-semibold text-eccellere-ink">What the AI assumed</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink-mid">{result.coverage.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>)}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/admin/tools?open=${encodeURIComponent(result.slug)}`} className="bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90">Open to review and publish</Link>
            <button className="border border-eccellere-ink/20 px-4 py-2 text-xs hover:bg-eccellere-cream" onClick={reset}>Build another</button>
          </div>
        </section>
      )}

      {/* forms built so far */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-eccellere-ink">Forms built with the Form Builder</h2>
        {built.length === 0 ? <p className="mt-2 text-sm text-ink-light">None yet.</p> : (
          <table className="mt-3 w-full text-left text-xs">
            <thead><tr className="text-ink-light"><th className="py-1 pr-2">Form</th><th className="pr-2">Started from</th><th className="pr-2">Status</th><th className="pr-2">Standard</th><th className="pr-2">Source items open</th><th /></tr></thead>
            <tbody>
              {built.map((b) => (
                <tr key={b.slug} className="border-t border-eccellere-ink/10">
                  <td className="py-2 pr-2">{b.name}</td>
                  <td className="pr-2">{b.mode === "upload" ? "A file" : b.mode === "template" ? "A template" : "A description"}</td>
                  <td className="pr-2">{b.status.toLowerCase().replace("_", " ")}</td>
                  <td className="pr-2">{b.standards ? `${b.standards.score}/100` : "n/a"}</td>
                  <td className="pr-2">{b.coverage ? b.coverage.notCovered + b.coverage.proposed + b.coverage.notSent : "n/a"}</td>
                  <td><Link className="underline" href={`/admin/tools?open=${encodeURIComponent(b.slug)}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
