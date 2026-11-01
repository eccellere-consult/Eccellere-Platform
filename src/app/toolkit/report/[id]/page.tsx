"use client";

import { readJson } from "@/lib/toolkit/http";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import {
  scoreDiagnostic, KIT_LABEL, KIT_PURPOSE, SCALE4,
  type Blueprint, type KitField, type KitSection, type KitType, type StoredResponse,
} from "@/lib/toolkit/engine";
import { analyseDiagnostic, type DiagnosticAnalysis } from "@/lib/toolkit/analysis";
import { analyseProblemSolving, answerFor, type PSAnalysis } from "@/lib/toolkit/analysis-ps";
import { analysePlaybook, type PBAnalysis } from "@/lib/toolkit/analysis-pb";
import { MarkdownLite } from "@/components/toolkit/MarkdownLite";
import { isNarrativeField } from "@/lib/toolkit/narrative-plan";
import { analyseGuide, type GuideAnalysis } from "@/lib/toolkit/analysis-gd";
import { analyseLearning, type LearningAnalysis } from "@/lib/toolkit/analysis-lk";
import { diagnosticBody, problemSolvingBody, playbookBody, guideBody, learningBody } from "@/components/toolkit/ReportBodies";

type Val = string | number | null;
interface RRow { fieldId: string; value: Val; provenance: string; confidence?: string | null }
interface Ev { id?: string; fileName: string; contentType?: string; size: number; status: string }
interface Loaded {
  title: string; industry: string; kitType: KitType; recommendedType: KitType; mode: string; version: number;
  blueprint: Blueprint; responses: RRow[]; evidence: Ev[]; status: string; frozen: boolean;
  approvedBy?: string | null; submittedAt?: string | null; generatedAt: string;
}

const HOW_TO: Record<KitType, string> = {
  DIAGNOSTIC: "Read the Executive Diagnostic Brief first. Sections 5 to 9 record the context and evidence behind the assessment, section 10 holds the scored questions, and sections 12 to 19 turn the answers into findings and decisions. Items marked Not known are gaps in evidence, not zero scores.",
  PROBLEM_SOLVING: "Read the Executive Problem-Solving Brief first. Sections 5 to 7 define the problem, sections 8 to 11 test its causes, and sections 12 to 17 select and hand over a solution. Hypotheses remain hypotheses until tested.",
  PLAYBOOK: "Read the Executive Implementation Brief first. Sections 5 to 8 confirm what was agreed and how ready you are, sections 9 to 15 define how the work is done, owned and measured, and sections 16 to 19 cover delivery and sustainment.",
  GUIDE: "Use the Contents to find the topic you need. Definitions and frameworks come first, followed by step-by-step application, examples, cautions and quick references.",
  LEARNING: "Work through the modules in order. Each combines a concept, an example, practice and an assessment. Finish with the capstone, teach-back and your transfer-to-work plan.",
};

const brand = { navy: "#1B2A4A", gold: "#C9A84C", blue: "#2563A8", teal: "#1A6B72", cream: "#FDF8EC", lightBlue: "#EAF0FA", grey: "#F5F5F5", ink: "#2C2C2C", red: "#B03A2E", green: "#1D6A3A" };

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Loaded | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/toolkits/${id}`);
      if (r.status === 401) return setErr("Please sign in to view this report.");
      if (!r.ok) return setErr("Report not found.");
      const d = await readJson(r);
      const sub = d.submission;
      // A submitted kit reports from its frozen snapshot. If it was reopened, the live draft is shown and labelled.
      if (d.kit.status === "SUBMITTED" && sub?.snapshot) {
        const s = sub.snapshot;
        setData({
          title: s.meta.title, industry: s.meta.industry, kitType: s.meta.kitType, recommendedType: s.meta.recommendedType,
          mode: s.meta.mode, version: s.meta.version, blueprint: s.blueprint, responses: s.responses, evidence: s.evidence,
          status: "SUBMITTED", frozen: true, approvedBy: sub.approvedBy, submittedAt: sub.submittedAt, generatedAt: s.meta.generatedAt,
        });
      } else {
        setData({
          title: d.kit.title, industry: d.kit.industry, kitType: d.kit.kitType, recommendedType: d.kit.recommendedType,
          mode: d.kit.mode, version: d.kit.version, blueprint: d.kit.blueprint, responses: d.responses, evidence: d.evidence,
          status: d.kit.status, frozen: false, approvedBy: null, submittedAt: null, generatedAt: new Date().toISOString(),
        });
      }
    })().catch(() => setErr("Could not load the report."));
  }, [id]);

  const map = useMemo(() => {
    const m = new Map<string, RRow>();
    data?.responses.forEach((r) => m.set(r.fieldId, r));
    return m;
  }, [data]);

  if (err) return <div style={{ padding: 40 }}>{err} <Link href="/dashboard/toolkits">Back</Link></div>;
  if (!data) return <div style={{ padding: 40 }}>Loading report…</div>;

  const { blueprint: bp } = data;
  const stored: Record<string, StoredResponse> = {};
  const answerRows = data.responses.filter((r) => !isNarrativeField(r.fieldId));
  answerRows.forEach((r) => (stored[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance }));
  const scores = bp.type === "DIAGNOSTIC" ? scoreDiagnostic(bp, stored) : null;
  const storedA: Record<string, StoredResponse & { confidence?: string | null }> = {};
  answerRows.forEach((r) => (storedA[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance, confidence: r.confidence }));
  const an: DiagnosticAnalysis | null = bp.type === "DIAGNOSTIC" && scores ? analyseDiagnostic(bp, storedA, scores) : null;
  const ps: PSAnalysis | null = bp.type === "PROBLEM_SOLVING" ? analyseProblemSolving(bp, storedA) : null;
  const pb: PBAnalysis | null = bp.type === "PLAYBOOK" ? analysePlaybook(bp, storedA) : null;
  const gd: GuideAnalysis | null = bp.type === "GUIDE" ? analyseGuide(bp, storedA) : null;
  const lk: LearningAnalysis | null = bp.type === "LEARNING" ? analyseLearning(bp, storedA) : null;

  const aiUnconfirmed = answerRows.filter((r) => r.provenance === "AI-suggested").length;
  const notKnown = answerRows.filter((r) => r.provenance === "Not-known").length;

  // AI-drafted section narratives (stored as NARR.<section number>)
  const narrative: Record<number, { text: string; unsupported: string[]; provenance: string }> = {};
  for (const r of data.responses) {
    if (!isNarrativeField(r.fieldId)) continue;
    const v = (r.value ?? {}) as { text?: string; unsupported?: string[] };
    const seq = Number(r.fieldId.slice(5));
    if (seq && v.text) narrative[seq] = { text: v.text, unsupported: v.unsupported ?? [], provenance: r.provenance };
  }
  const narrativeList = Object.values(narrative);
  const narrAi = narrativeList.filter((n) => n.provenance === "AI-suggested").length;
  const narrEdited = narrativeList.length - narrAi;
  const narrFlagged = narrativeList.filter((n) => n.unsupported.length > 0).length;
  const isDraft = data.status !== "SUBMITTED" || !data.frozen;

  const answer = (f: KitField) => {
    const r = map.get(f.id);
    if (!r) return <span className="muted">Not provided</span>;
    if (r.provenance === "Not-known") return <span className="flag">Not known</span>;
    if (r.provenance === "Not-applicable") return <span className="muted">Not applicable</span>;
    if (r.value === null || r.value === "") return <span className="muted">Not provided</span>;
    if (f.type === "scale4") return <>{SCALE4[Number(r.value) - 1] ?? String(r.value)}</>;
    return <span style={{ whiteSpace: "pre-wrap" }}>{String(r.value)}</span>;
  };
  const tag = (f: KitField) => {
    const r = map.get(f.id);
    if (!r || ["Client-entered"].includes(r.provenance)) return null;
    return <span className={`tag ${r.provenance === "AI-suggested" ? "ai" : ""}`}>{r.provenance.replace("-", " ")}{r.provenance === "AI-suggested" && r.confidence ? ` · ${r.confidence}` : ""}</span>;
  };

  const fieldBlocks = (s: KitSection) => (
    <>{s.fields.map((f) => (
      <div key={f.id} className="field avoid">
        <div className="label">{f.label} <span className="fid">[{f.id}]</span> {tag(f)}</div>
        <div className="answer">{answer(f)}</div>
      </div>))}</>
  );

  const sectionBody = (s: KitSection) => {
    const extra = s.fields.length ? fieldBlocks(s) : null;
    const dx = an ? diagnosticBody(s.seq, an, bp, extra) : null;
    // Sections 13-19 combine the computed analysis with the client's own notes; never drop the latter.
    if (dx) return s.seq >= 13 && s.seq <= 19 && extra ? <>{dx}{extra}</> : dx;
    const px = ps ? problemSolvingBody(s.seq, ps, extra, (q, re) => answerFor(bp, storedA, q, re)) : null;
    if (px) return px;
    const bx = pb ? playbookBody(s.seq, pb, extra) : null;
    if (bx) return bx;
    const gx = gd ? guideBody(s.seq, gd, extra) : null;
    if (gx) return gx;
    const lx = lk ? learningBody(s.seq, lk, extra) : null;
    if (lx) return lx;
    if (bp.type === "DIAGNOSTIC" && s.seq === 7) {
      return (
        <table><thead><tr><th>ID</th><th>Dimension</th><th>Purpose</th><th>Weight</th></tr></thead>
          <tbody>{bp.modules.map((m) => <tr key={m.id}><td>{m.id}</td><td>{m.name}</td><td>{m.purpose}</td><td>{m.weight}%</td></tr>)}</tbody></table>
      );
    }
    if (bp.type === "DIAGNOSTIC" && s.seq === 10) {
      return <>{bp.modules.map((m) => (
        <div key={m.id} className="avoid">
          <h3>{m.id} · {m.name}</h3>
          <table><thead><tr><th style={{ width: 60 }}>ID</th><th>Question</th><th style={{ width: 130 }}>Response</th><th style={{ width: 90 }}>Source</th></tr></thead>
            <tbody>{s.fields.filter((f) => f.module === m.id).map((f) => {
              const r = map.get(f.id);
              return <tr key={f.id}><td>{f.id.replace("DX10.", "")}</td><td>{f.label}</td><td>{answer(f)}</td><td>{r ? r.provenance.replace("-", " ") : ""}</td></tr>;
            })}</tbody></table>
        </div>))}</>;
    }
    if (bp.type === "DIAGNOSTIC" && s.seq === 11) {
      return <p>Each question is answered on a four-level scale: {SCALE4.join("; ")}. A dimension score is the simple average of its answered questions. The overall score is the average of dimension scores using the weights in section 7 (proposed weights totalling 100%). Questions marked Not known or Not applicable are excluded from the average and reported as coverage; they are never treated as zero. Ratings: below 2.0 Red, 2.0 to under 3.0 Amber, 3.0 and above Green. Maturity scores are indicative ordinal bands, not precise measurements.</p>;
    }
    if (bp.type === "DIAGNOSTIC" && s.seq === 12 && scores) {
      return (
        <table><thead><tr><th>Dimension</th><th>Weight</th><th>Score (1-4)</th><th>Rating</th><th>Answered</th><th>Not known</th></tr></thead>
          <tbody>{scores.modules.map((m) => <tr key={m.moduleId}><td>{m.name}</td><td>{m.weight}%</td><td>{m.score ?? "n/a"}</td><td className={`rag ${m.rag}`}>{m.rag}</td><td>{m.answered}/{m.total}</td><td>{m.unknown}</td></tr>)}
            <tr className="total"><td>Overall (weighted)</td><td>100%</td><td>{scores.overall ?? "n/a"}</td><td className={`rag ${scores.overallRag}`}>{scores.overallRag}</td><td /><td /></tr></tbody></table>
      );
    }
    if (s.seq === 1) return null;
    if (s.fields.length) return fieldBlocks(s);
    if (s.title.startsWith("How to Use")) return <p>{HOW_TO[bp.type]}</p>;
    if (s.kind === "auto" && /Annexure/i.test(s.title)) return null; // rendered below with disclosure
    return <p className="muted">This section is assembled from the answers in the other sections of this report. Where a conclusion is not supported by evidence, it is shown as an open question rather than stated as fact.</p>;
  };

  const lastSeq = bp.sections.length;

  return (
    <div className="report">
      <style>{css(brand)}</style>
      <div className="toolbar no-print">
        <Link href={`/dashboard/toolkits/${id}`}><ArrowLeft size={14} /> Back to toolkit</Link>
        <span>{isDraft ? "Draft preview. Submit the toolkit to produce the final approved report." : "Final report"}</span>
        <button onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</button>
      </div>

      {/* Cover */}
      <section className="cover">
        <div className="brandmark">ECCELLERĒ</div>
        <p className="kicker">{KIT_LABEL[bp.type]}</p>
        <h1>{data.title}</h1>
        <p className="sub">{KIT_PURPOSE[bp.type]}</p>
        <table className="meta"><tbody>
          <tr><td>Industry</td><td>{data.industry}</td></tr>
          <tr><td>Report version</td><td>v{data.version} · {isDraft ? "DRAFT" : "Final"}</td></tr>
          <tr><td>Date</td><td>{fmtDate(data.submittedAt ?? data.generatedAt)}</td></tr>
          <tr><td>Approved by</td><td>{data.approvedBy ?? "Not yet approved"}</td></tr>
          <tr><td>Preparation</td><td>{data.mode === "CLIENT_LED" ? "Completed by the client" : "Completed by the client with AI assistance (see disclosure)"}</td></tr>
        </tbody></table>
        {isDraft && <p className="draftmark">DRAFT · NOT APPROVED</p>}
      </section>

      {/* Contents */}
      <section className="toc">
        <h2 className="plain">Contents</h2>
        <ol>{bp.sections.map((s) => <li key={s.id}><a href={`#s${s.seq}`}><span>{s.seq}. {s.title}</span></a></li>)}</ol>
      </section>

      {bp.sections.map((s) => (
        <section key={s.id} id={`s${s.seq}`} className="sec">
          {s.seq === 1 ? null : (
            <>
              <h2>{s.seq}. {s.title}</h2>
              <p className="purpose">{s.purpose}</p>
              {narrative[s.seq] && (
                <div className="narr">
                  <div className="narrtag">{narrative[s.seq].provenance === "AI-suggested" ? "AI-drafted narrative, not yet reviewed by the client" : narrative[s.seq].provenance === "Client-confirmed" ? "AI-drafted narrative, confirmed by the client" : "Narrative edited by the client"}</div>
                  <MarkdownLite text={narrative[s.seq].text} />
                  {narrative[s.seq].unsupported.length > 0 && <p className="flag">Figures to verify (not found in the inputs): {narrative[s.seq].unsupported.join(", ")}</p>}
                </div>
              )}
              {sectionBody(s)}
              {s.seq === 2 && data.approvedBy && (
                <div className="field"><div className="label">Approved by</div><div className="answer">{data.approvedBy}{data.submittedAt ? `, ${fmtDate(data.submittedAt)}` : ""}</div></div>
              )}
            </>
          )}
          {s.seq === lastSeq && (
            <>
              <h3>Source register</h3>
              {data.evidence.length === 0 ? <p className="muted">No files were uploaded. All content is client-entered or AI-suggested from the context provided.</p> : (
                <table><thead><tr><th>#</th><th>File</th><th>Text read</th></tr></thead>
                  <tbody>{data.evidence.map((e, i) => <tr key={i}><td>E{i + 1}</td><td>{e.fileName}</td><td>{e.status === "EXTRACTED" ? "Yes" : "No (not usable by AI)"}</td></tr>)}</tbody></table>
              )}
              <h3>AI disclosure, assumptions and limitations</h3>
              <ul>
                <li>{data.mode === "CLIENT_LED" ? "This report was completed by the client; AI help was available on request." : "AI was used to draft some answers. Each AI draft is labelled in this report and counts as the client's answer only once confirmed or edited."}</li>
                <li>{aiUnconfirmed} answer(s) remain AI-suggested and unconfirmed. {notKnown} answer(s) are recorded as Not known.</li>
                {narrativeList.length > 0 && <li>{narrativeList.length} section narrative(s) were drafted with AI from the client&apos;s own answers, the computed analysis and uploaded evidence: {narrAi} not yet reviewed, {narrEdited} reviewed or edited by the client.{narrFlagged > 0 ? ` ${narrFlagged} contain figures that could not be matched to the inputs and are marked for verification.` : ""} AI-written text is not independent evidence.</li>}
                <li>Client statements have not been independently verified. Benchmarks are included only where a source is cited; otherwise &quot;Benchmark not established&quot; applies.</li>
                <li>This report supports a management decision. It is not legal, tax, regulatory or financial advice. Verify such matters with qualified specialists.</li>
                <li>Report generated {fmtDate(data.generatedAt)}. Reviewer and approver names are as entered by the client; no certification or expert review is implied.</li>
              </ul>
            </>
          )}
        </section>
      ))}
      <footer className="printfoot no-print">End of report</footer>
    </div>
  );
}

const css = (c: typeof brand) => `
.report{font-family:Calibri,Carlito,'Segoe UI',Arial,sans-serif;color:${c.ink};background:#fff;max-width:900px;margin:0 auto;padding:0 28px 60px;font-size:11pt;line-height:1.5}
.report h1,.report h2,.report h3{font-family:Cambria,Georgia,serif;color:${c.navy}}
.toolbar{position:sticky;top:0;display:flex;gap:16px;align-items:center;justify-content:space-between;background:${c.lightBlue};padding:10px 14px;margin:0 -28px 24px;font-size:13px;z-index:5}
.toolbar a,.toolbar button{display:inline-flex;gap:6px;align-items:center;color:${c.navy};background:none;border:0;cursor:pointer;font:inherit;text-decoration:none}
.toolbar button{background:${c.gold};padding:7px 14px;font-weight:600}
.cover{background:${c.navy};color:#fff;padding:70px 50px;margin:0 -28px;min-height:520px;position:relative}
.cover h1{color:#fff;font-size:26pt;line-height:1.2;margin:10px 0 14px}
.cover .brandmark{letter-spacing:.25em;color:${c.gold};font-family:Cambria,serif;font-size:15pt;margin-bottom:60px}
.cover .kicker{color:${c.gold};text-transform:uppercase;letter-spacing:.2em;font-size:10pt}
.cover .sub{color:#d6dbe6;max-width:560px}
.cover table.meta{margin-top:40px;background:transparent;width:auto}
.cover table.meta td{color:#fff;border:0;padding:3px 24px 3px 0;background:transparent}
.cover table.meta td:first-child{color:${c.gold}}
.draftmark{position:absolute;right:40px;bottom:30px;border:2px solid ${c.gold};color:${c.gold};padding:6px 14px;letter-spacing:.15em;font-weight:700}
.toc{padding-top:30px}
.toc h2.plain{border:0}
.toc ol{list-style:none;padding:0;margin:0}
.toc li{border-bottom:1px dotted #bbb;padding:5px 0}
.toc a{color:${c.ink};text-decoration:none}
.sec{padding-top:22px}
.sec h2{background:${c.navy};color:#fff;padding:9px 14px;font-size:15pt;margin:28px 0 8px}
.sec h3{color:${c.blue};font-size:12.5pt;margin:20px 0 6px}
.purpose{font-style:italic;color:#555;margin:0 0 12px}
.field{background:${c.cream};border-left:3px solid ${c.gold};padding:8px 12px;margin:10px 0}
.field .label{font-weight:700;color:${c.navy};font-size:10.5pt}
.fid{font-weight:400;color:#888;font-size:8pt}
.field .answer{margin-top:3px}
.muted{color:#888;font-style:italic}.flag{color:${c.red};font-weight:600}
.tag{display:inline-block;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:#e5e7eb;padding:1px 6px;margin-left:6px;vertical-align:middle}
.tag.ai{background:#ede9fe;color:#5b21b6}
table{border-collapse:collapse;width:100%;margin:8px 0 14px;font-size:10pt}
th{background:${c.navy};color:#fff;text-align:left;padding:6px 8px}
td{padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top}
tbody tr:nth-child(even) td{background:${c.grey}}
tr.total td{font-weight:700;background:${c.lightBlue}!important}
.rag{font-weight:700}.rag.Red{color:${c.red}}.rag.Amber{color:#b7791f}.rag.Green{color:${c.green}}
.avoid{break-inside:avoid}
.ok{color:#1d6a3a;font-weight:600}
.narr{border-left:4px solid ${c.teal};background:#fff;padding:2px 14px 6px;margin:10px 0 16px}
.narrtag{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#5b21b6;margin:6px 0 4px}
.narr .md p{margin:6px 0}.narr .md h3{margin:12px 0 4px}.narr .md ul,.narr .md ol{margin:6px 0;padding-left:22px}.method{margin:16px 0}
.heat{margin:6px 0}.heatrow{display:flex;gap:10px;align-items:center;margin:3px 0}.heatname{width:240px;font-size:9.5pt}.heatcells{display:flex;gap:3px;flex-wrap:wrap}
.heat i,.legend i{display:inline-block;width:14px;height:14px;border:1px solid #cfcfcf;vertical-align:middle}
.h-1{background:#b03a2e}.h-2{background:#e6a23c}.h-3{background:#9bc98b}.h-4{background:#1d6a3a}.h-unk{background:#c7c7c7}.h-blank{background:#fff}
.legend{font-size:9pt;color:#555}.legend i{margin:0 3px 0 10px}
ul.tree,ul.tree ul{list-style:none;padding-left:18px;margin:4px 0}ul.tree>li{margin:8px 0;border-left:3px solid #C9A84C;padding-left:10px}
.initiative{margin:14px 0}.ibanner{background:#1A6B72;color:#fff;padding:6px 10px;font-weight:700;display:flex;justify-content:space-between}
.ibanner span{font-weight:400}
@media print{
  @page{size:A4;margin:18mm 16mm 20mm}
  @page{@bottom-center{content:"Page " counter(page);font-size:9pt;color:#666}}
  .no-print{display:none!important}
  .report{max-width:none;padding:0;font-size:10.5pt}
  .cover{margin:0;min-height:250mm;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .toc{break-after:page}
  .sec h2,th,.field,.tag,tr.total td,.draftmark,.heat i,.legend i,.ibanner{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sec h2{break-after:avoid}
}
`;
