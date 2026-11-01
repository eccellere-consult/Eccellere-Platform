"use client";

import { readJson } from "@/lib/toolkit/http";

import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import {
  scoreDiagnostic, KIT_LABEL, KIT_PURPOSE, SCALE4,
  type Blueprint, type KitField, type KitSection, type KitType, type StoredResponse,
} from "@/lib/toolkit/engine";
import { analyseDiagnostic, GOVERNANCE_CALENDAR, type DiagnosticAnalysis } from "@/lib/toolkit/analysis";
import { analyseProblemSolving, answerFor, type PSAnalysis } from "@/lib/toolkit/analysis-ps";
import { METHOD_CARDS } from "@/lib/toolkit/methods";

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

const brand = { navy: "#1B2A4A", gold: "#C9A84C", blue: "#2563A8", cream: "#FDF8EC", lightBlue: "#EAF0FA", grey: "#F5F5F5", ink: "#2C2C2C", red: "#B03A2E", green: "#1D6A3A" };

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
  data.responses.forEach((r) => (stored[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance }));
  const scores = bp.type === "DIAGNOSTIC" ? scoreDiagnostic(bp, stored) : null;
  const storedA: Record<string, StoredResponse & { confidence?: string | null }> = {};
  data.responses.forEach((r) => (storedA[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance, confidence: r.confidence }));
  const an: DiagnosticAnalysis | null = bp.type === "DIAGNOSTIC" && scores ? analyseDiagnostic(bp, storedA, scores) : null;
  const ps: PSAnalysis | null = bp.type === "PROBLEM_SOLVING" ? analyseProblemSolving(bp, storedA) : null;

  const aiUnconfirmed = data.responses.filter((r) => r.provenance === "AI-suggested").length;
  const notKnown = data.responses.filter((r) => r.provenance === "Not-known").length;
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
    if (dx) return dx;
    const px = ps ? problemSolvingBody(s.seq, ps, extra, (q, re) => answerFor(bp, storedA, q, re)) : null;
    if (px) return px;
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

const TEMPLATE_NOTE =
  "Built from the answers in this report using Eccellere's standard method. The wording of steps is a template; refine it with the owner. Nothing here is a verified fact beyond the client's own answers.";
const heatCls = (level: number | null, kind: string) =>
  kind === "unknown" ? "h-unk" : level === null ? "h-blank" : `h-${level}`;

function diagnosticBody(seq: number, an: DiagnosticAnalysis, bp: Blueprint, extra: ReactNode) {
  if (seq === 3) {
    return (
      <>
        <p>This brief summarises what the answers in this report show. Scores are indicative maturity levels (1 to 4), not precise measurements, and every finding is a hypothesis until it is tested.</p>
        <table><tbody>
          <tr><td>Overall maturity (weighted)</td><td>{an.overall ?? "Not scored"} <span className={`rag ${an.overallRag}`}>{an.overallRag}</span></td></tr>
          <tr><td>Dimensions Red / Amber / Green</td><td>{an.counts.red} / {an.counts.amber} / {an.counts.green}{an.counts.notScored ? ` (${an.counts.notScored} not scored)` : ""}</td></tr>
          <tr><td>Questions answered, or marked Not known / N/A</td><td>{an.evidenceCoverage}%</td></tr>
          <tr><td>Weak answers recorded as findings</td><td>{an.findings.length}</td></tr>
          <tr><td>AI-suggested answers not yet confirmed</td><td>{an.aiUnconfirmed}</td></tr>
        </tbody></table>
        {an.topGaps.length > 0 ? (
          <>
            <h3>Largest gaps to the target</h3>
            <ol>{an.topGaps.map((g) => <li key={g.moduleId}><b>{g.name}</b>: score {g.score} against a target of {g.target} (priority index {g.priorityIndex}).</li>)}</ol>
          </>
        ) : <p className="muted">No dimension is below the target level, or there are not yet enough scored answers to rank gaps.</p>}
        {extra}
      </>
    );
  }
  if (seq === 12) {
    return (
      <>
        <table><thead><tr><th>Dimension</th><th>Weight</th><th>Score (1-4)</th><th>Rating</th><th>Evidence coverage</th></tr></thead>
          <tbody>
            {an.gaps.map((g) => <tr key={g.moduleId}><td>{g.name}</td><td>{g.weight}%</td><td>{g.score ?? "n/a"}</td><td className={`rag ${g.rag}`}>{g.rag}</td><td>{g.coverage}%</td></tr>)}
            <tr className="total"><td>Overall (weighted)</td><td>100%</td><td>{an.overall ?? "n/a"}</td><td className={`rag ${an.overallRag}`}>{an.overallRag}</td><td /></tr>
          </tbody></table>
        <h3>Heatmap by question</h3>
        <p className="muted">One square per question. Grey means Not known or N/A; white means not answered. Darker red means a weaker answer.</p>
        <div className="heat">{an.heat.map((h) => (
          <div key={h.moduleId} className="heatrow avoid"><span className="heatname">{h.name}</span>
            <span className="heatcells">{h.cells.map((c) => <i key={c.id} className={heatCls(c.level, c.kind)} title={`${c.id}: ${c.level ?? c.kind}`} />)}</span></div>))}</div>
        <p className="legend"><i className="h-1" /> 1 Ad hoc <i className="h-2" /> 2 Developing <i className="h-3" /> 3 Established <i className="h-4" /> 4 Leading <i className="h-unk" /> Not known / N/A <i className="h-blank" /> Not answered</p>
      </>
    );
  }
  if (seq === 13) {
    return (
      <>
        <table><thead><tr><th>Dimension</th><th>Weight</th><th>Current</th><th>Target</th><th>Gap</th><th>Priority index</th><th>Rank</th></tr></thead>
          <tbody>{an.gaps.map((g) => <tr key={g.moduleId}><td>{g.name}</td><td>{g.weight}%</td><td>{g.score ?? "n/a"}</td><td>{g.target}</td><td>{g.gap ?? "n/a"}</td><td>{g.priorityIndex}</td><td>{g.rank ?? "-"}</td></tr>)}</tbody></table>
        <p className="muted">Priority index = weight x gap. The target of {an.target} (Established) is a default assumption, not a sourced benchmark. Benchmark not established: no external benchmark with a cited source was provided, so do not read these gaps as comparisons with other companies.</p>
      </>
    );
  }
  if (seq === 14) {
    return (
      <>
        <p>Each branch below is a dimension rated Red or Amber. The leaves are the weakest answers, written as <b>hypotheses to test</b>. They are not confirmed root causes.</p>
        {an.tree.length === 0 ? <p className="muted">No dimension is rated Red or Amber, or there are not yet enough scored answers.</p> : (
          <ul className="tree">{an.tree.map((t) => (
            <li key={t.moduleId}><b>{t.name}</b> <span className={`rag ${t.rag}`}>{t.rag}</span>
              <ul>{t.causes.length
                ? t.causes.map((c) => <li key={c.findingId}><span className="fid">{c.findingId}</span> Weak answer to test: {c.text}</li>)
                : <li className="muted">No single answer scored 1 or 2; review the dimension as a whole.</li>}</ul></li>))}</ul>
        )}
      </>
    );
  }
  if (seq === 15) {
    return (
      <>
        {an.findings.length === 0 ? <p className="muted">No answer scored 1 or 2, so no findings are recorded.</p> : (
          <table><thead><tr><th style={{ width: 40 }}>ID</th><th>Observation</th><th>Evidence</th><th style={{ width: 70 }}>Confidence</th><th style={{ width: 80 }}>Severity</th><th style={{ width: 60 }}>Action</th></tr></thead>
            <tbody>{an.findings.map((f) => (
              <tr key={f.id}><td>{f.id}</td><td><b>{f.moduleName}.</b> {f.question}</td><td>{f.evidence}. Status: {f.status}.</td><td>{f.confidence}</td><td>{f.severity}</td><td>{f.initiativeId}</td></tr>))}</tbody></table>
        )}
        <p className="muted">Confidence is Low for client statements and AI suggestions, and Medium when the answer was extracted from an uploaded source. It is never High until a finding has been independently validated.</p>
        <h3>Evidence gaps</h3>
        {an.evidenceGaps.length === 0 ? <p className="muted">Every question has an answer.</p> : (
          <table><thead><tr><th>Dimension</th><th>Question</th><th style={{ width: 90 }}>Status</th></tr></thead>
            <tbody>{an.evidenceGaps.slice(0, 40).map((g) => <tr key={g.questionId}><td>{g.moduleName}</td><td>{g.question}</td><td>{g.reason}</td></tr>)}</tbody></table>
        )}
        {an.evidenceGaps.length > 40 && <p className="muted">{an.evidenceGaps.length - 40} more evidence gaps are not listed.</p>}
      </>
    );
  }
  if (seq === 16) {
    const hi = Math.max(1, Math.ceil(an.initiatives.length / 3));
    return (
      <>
        <p>Value is ranked, not priced. No financial baseline or target values were provided, so no rupee figure is stated.</p>
        {an.initiatives.length === 0 ? <p className="muted">No dimension is below target, so no opportunity is ranked.</p> : (
          <table><thead><tr><th>Rank</th><th>Dimension</th><th>Priority index</th><th>Opportunity band</th><th>Value at stake</th></tr></thead>
            <tbody>{an.initiatives.map((i, idx) => (
              <tr key={i.id}><td>{idx + 1}</td><td>{an.gaps.find((g) => g.moduleId === i.moduleId)?.name}</td><td>{i.priorityIndex}</td><td>{idx < hi ? "High" : idx < hi * 2 ? "Medium" : "Lower"}</td><td className="muted">Not quantified</td></tr>))}</tbody></table>
        )}
        <p className="muted">To quantify value, record a baseline, target, period and formula for each KPI in section 9. Keep benefit types (cash release, revenue, margin, cost, risk) separate to avoid double counting.</p>
      </>
    );
  }
  if (seq === 17) {
    return (
      <>
        {an.initiatives.length === 0 ? <p className="muted">No initiatives are proposed because no dimension is below target.</p> : (
          <>
            <table><thead><tr><th style={{ width: 40 }}>ID</th><th>Initiative</th><th>Priority</th><th>Wave</th><th>Findings addressed</th></tr></thead>
              <tbody>{an.initiatives.map((i) => <tr key={i.id}><td>{i.id}</td><td>{i.title}</td><td>{i.priorityIndex}</td><td>{i.horizon}</td><td>{i.findingIds.join(", ") || "-"}</td></tr>)}</tbody></table>
            {an.initiatives.map((i) => (
              <div key={i.id} className="initiative avoid">
                <div className="ibanner">{i.id} · {i.title} <span>{i.horizon}</span></div>
                <table><tbody>
                  <tr><td style={{ width: 130 }}>Objective</td><td>{i.objective}</td></tr>
                  <tr><td>Owner</td><td className="muted">To be named by the sponsor (none assumed)</td></tr>
                  <tr><td>KPI</td><td>{i.kpi}</td></tr>
                  <tr><td>Completion gate</td><td>{i.gate}</td></tr>
                </tbody></table>
                <ol>{i.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
              </div>))}
            <p className="muted">{TEMPLATE_NOTE}</p>
          </>
        )}
      </>
    );
  }
  if (seq === 18) {
    return (
      <>
        {an.initiatives.length === 0 ? <p className="muted">No roadmap is proposed because no initiatives were identified.</p> : (
          <table><thead><tr><th>Horizon</th><th>Initiative</th><th>Key activities</th><th>Decision gate</th><th>KPI</th></tr></thead>
            <tbody>{an.initiatives.slice().sort((a, b) => a.wave - b.wave).map((i) => (
              <tr key={i.id}><td>{i.horizon}</td><td>{i.id} {i.title}</td><td>{i.steps.slice(0, 3).join(" ")}</td><td>{i.gate}</td><td>{i.kpi}</td></tr>))}</tbody></table>
        )}
        <h3>Governance calendar</h3>
        <table><thead><tr><th>Cadence</th><th>Forum</th><th>Purpose</th></tr></thead>
          <tbody>{GOVERNANCE_CALENDAR.map((g) => <tr key={g.cadence}><td>{g.cadence}</td><td>{g.forum}</td><td>{g.purpose}</td></tr>)}</tbody></table>
        <p className="muted">{TEMPLATE_NOTE} Dates are not fixed because no start date was provided; count each horizon from the date the sponsor approves the plan.</p>
      </>
    );
  }
  if (seq === 19) {
    return (
      <>
        <p>These are the decisions this report asks the sponsor to take. The report does not take them on the sponsor&apos;s behalf.</p>
        <ol>{an.decisions.map((d, i) => <li key={i}>{d}</li>)}</ol>
        <p className="muted">Recommendations follow the answers and are limited by the evidence listed in section 15.{bp.industry ? ` Industry context: ${bp.industry}.` : ""}</p>
      </>
    );
  }
  return null;
}

function problemSolvingBody(
  seq: number,
  ps: PSAnalysis,
  extra: ReactNode,
  getA: (seq: number, re: RegExp) => string,
) {
  const none = (msg: string) => <p className="muted">{msg}</p>;
  const yn = (b: boolean) => (b ? <span className="ok">Yes</span> : <span className="flag">No</span>);

  if (seq === 3) {
    const top = ps.topOption;
    return (
      <>
        <table><tbody>
          <tr><td>Hypotheses recorded</td><td>{ps.counts.total} ({ps.counts.validated} validated, {ps.counts.rejected} rejected, {ps.counts.inconclusive} inconclusive, {ps.counts.untested} untested)</td></tr>
          <tr><td>Options on the longlist</td><td>{ps.options.rows.length} ({ps.options.distinct} distinct)</td></tr>
          <tr><td>Highest weighted option</td><td>{top ? `${top.name} (${top.weighted} out of 5)${ps.closeCall ? ", a close call" : ""}` : "None scored yet"}</td></tr>
          <tr><td>Decision recorded</td><td>{ps.decision.decision || "Not yet"}{ps.decision.owner ? ` by ${ps.decision.owner}` : ""}</td></tr>
          <tr><td>Decision gate</td><td><b>{ps.readiness}</b>{ps.openGates ? ` (${ps.openGates} gate${ps.openGates > 1 ? "s" : ""} open)` : ""}</td></tr>
        </tbody></table>
        {extra}
      </>
    );
  }
  if (seq === 6) {
    return (
      <>
        {extra}
        <h3>Problem-definition check</h3>
        <table><thead><tr><th>Check</th><th style={{ width: 70 }}>Met</th><th>Note</th></tr></thead>
          <tbody>{ps.problemChecks.map((c) => <tr key={c.label}><td>{c.label}</td><td>{yn(c.ok)}</td><td>{c.note}</td></tr>)}</tbody></table>
        <p className="muted">These checks test whether the statement is specific and measurable. They do not judge whether the problem is the right one.</p>
      </>
    );
  }
  if (seq === 8) {
    return (
      <>
        {ps.tree.nodes.length === 0 ? none("No issue tree was provided.") : (
          <ul className="tree">{ps.tree.nodes.map((n, i) => <li key={i} style={{ marginLeft: n.depth * 18, borderLeftWidth: n.depth === 0 ? 3 : 0 }}>{n.depth === 0 ? <b>{n.text}</b> : n.text}</li>)}</ul>
        )}
        {ps.tree.notes.map((n, i) => <p key={i} className="flag">{n}</p>)}
        <p className="muted">MECE self-test: (1) Could any item belong in two branches? (2) Is anything important missing? (3) Does each branch use the same kind of split? (4) Can each leaf be tested with data?</p>
      </>
    );
  }
  if (seq === 9) {
    return (
      <>
        {extra}
        <h3>Methods available for this kit</h3>
        <table><thead><tr><th style={{ width: 50 }}>Ref</th><th>Method</th><th>Use it when</th></tr></thead>
          <tbody>{METHOD_CARDS.map((m) => <tr key={m.id}><td>{m.id}</td><td>{m.name}</td><td>{m.whenToUse}</td></tr>)}</tbody></table>
        <p className="muted">Each method is described step by step, with a blank worksheet, in section 19.</p>
      </>
    );
  }
  if (seq === 10) {
    return ps.hypotheses.length === 0 ? none("No hypotheses were recorded.") : (
      <>
        <table><thead><tr><th style={{ width: 36 }}>ID</th><th>Hypothesis</th><th>Evidence for</th><th>Evidence against</th><th>Test</th><th style={{ width: 70 }}>Confidence</th></tr></thead>
          <tbody>{ps.hypotheses.map((h) => (
            <tr key={h.id}><td>{h.id}</td><td>{h.statement}</td><td>{h.evidenceFor || <span className="muted">Not recorded</span>}</td><td>{h.evidenceAgainst || <span className="flag">Not recorded</span>}</td><td>{h.test || <span className="flag">Not defined</span>}</td><td>{h.confidence}</td></tr>))}</tbody></table>
        <p className="muted">{ps.counts.noCounterEvidence} of {ps.counts.total} hypotheses have no counter-evidence recorded. A hypothesis is a candidate cause to test, not a finding.</p>
      </>
    );
  }
  if (seq === 11) {
    return (
      <>
        {ps.hypotheses.length === 0 ? none("No hypotheses were recorded, so no causes can be validated.") : (
          <table><thead><tr><th style={{ width: 36 }}>ID</th><th>Hypothesis</th><th style={{ width: 90 }}>Status</th><th>Evidence that decided it</th></tr></thead>
            <tbody>{ps.hypotheses.map((h) => (
              <tr key={h.id}><td>{h.id}</td><td>{h.statement}</td><td className={h.status === "Validated" ? "ok" : h.status === "Untested" ? "flag" : ""}>{h.status}</td><td>{h.validationEvidence || <span className="muted">None recorded</span>}{h.flags.filter((f) => /no evidence/.test(f)).map((f) => <div key={f} className="flag">{f}</div>)}</td></tr>))}</tbody></table>
        )}
        <p>{ps.counts.validated} validated, {ps.counts.rejected} rejected, {ps.counts.inconclusive} inconclusive and {ps.counts.untested} untested. Only validated causes should drive the choice of solution.</p>
        {extra}
      </>
    );
  }
  if (seq === 13) {
    return (
      <>
        {ps.options.rows.length === 0 ? none("No options were listed.") : (
          <table><thead><tr><th style={{ width: 40 }}>ID</th><th>Option</th></tr></thead>
            <tbody>{ps.options.rows.map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.name}</td></tr>)}</tbody></table>
        )}
        {ps.options.notes.map((n, i) => <p key={i} className="flag">{n}</p>)}
        <p className="muted">Generate widely first, then narrow. Include a &quot;do nothing&quot; and a &quot;do the minimum&quot; option so the case for change is visible.</p>
      </>
    );
  }
  if (seq === 14) {
    return (
      <>
        <h3>Criteria and weights</h3>
        <table><thead><tr><th>Criterion</th><th style={{ width: 90 }}>Weight %</th><th style={{ width: 90 }}>Basis</th></tr></thead>
          <tbody>{ps.criteria.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.weight}</td><td>{c.proposed ? "Proposed" : "Entered"}</td></tr>)}</tbody></table>
        {ps.criteriaNotes.map((n, i) => <p key={i} className="muted">{n}</p>)}
        <h3>Scores (1 = poor, 5 = excellent) and ranking</h3>
        {ps.options.rows.length === 0 ? none("No options to appraise.") : (
          <table><thead><tr><th style={{ width: 36 }}>ID</th><th>Option</th>{ps.criteria.map((c, i) => <th key={i} title={c.name}>C{i + 1}</th>)}<th>Weighted</th><th>Rank</th></tr></thead>
            <tbody>{ps.options.rows.map((o) => (
              <tr key={o.id}><td>{o.id}</td><td>{o.name}{o.flags.length > 0 && <div className="flag">{o.flags.join("; ")}</div>}</td>
                {o.scores.map((s, i) => <td key={i}>{s === null ? <span className="muted">?</span> : s}</td>)}
                <td>{o.weighted === null ? <span className="muted">Not scored</span> : o.weighted}</td><td>{o.rank ?? "-"}</td></tr>))}</tbody></table>
        )}
        <p className="muted">Criteria C1 to C{ps.criteria.length} follow the order in the table above. An unknown score (?) is left out and the remaining weights are rescaled; it is never treated as zero.</p>
        {ps.topOption && (
          <p>
            Highest weighted option: <b>{ps.topOption.name}</b> ({ps.topOption.weighted}).{" "}
            {ps.topStable === false ? <span className="flag">The top option changes if all criteria are weighted equally, so the ranking depends on the weights. Discuss them before deciding. </span> : ps.topStable === true ? "It is also first with equal weights. " : ""}
            {ps.closeCall ? <span className="flag">The top two options are within a quarter of a point: treat this as a close call. </span> : ""}
          </p>
        )}
        <p className="muted">A weighted score informs the decision. It does not replace judgement about risk, reversibility and fit.</p>
      </>
    );
  }
  if (seq === 15) {
    return (
      <>
        {extra}
        <h3>Pilot design check</h3>
        <table><thead><tr><th>Element</th><th style={{ width: 70 }}>Found</th></tr></thead>
          <tbody>{ps.pilotChecks.map((c) => <tr key={c.label}><td>{c.label}</td><td>{yn(c.found)}</td></tr>)}</tbody></table>
        <p className="muted">This is a keyword check of what was written. It cannot tell whether the pilot design is sound.</p>
      </>
    );
  }
  if (seq === 16) {
    return (
      <>
        <table><tbody>
          <tr><td style={{ width: 170 }}>Recommended solution</td><td>{ps.decision.recommended || <span className="muted">Not recorded</span>}</td></tr>
          <tr><td>Decision</td><td>{ps.decision.decision || <span className="flag">Not yet taken</span>}</td></tr>
          <tr><td>Decision owner</td><td>{ps.decision.owner || <span className="muted">Not named</span>}</td></tr>
          <tr><td>Rationale</td><td>{ps.decision.rationale || <span className="muted">Not recorded</span>}</td></tr>
        </tbody></table>
        <h3>Decision gate</h3>
        <table><thead><tr><th style={{ width: 40 }}>Gate</th><th>Condition</th><th style={{ width: 80 }}>Status</th><th>Detail</th></tr></thead>
          <tbody>{ps.gates.map((g) => <tr key={g.id}><td>{g.id}</td><td>{g.label}</td><td>{g.met === null ? <span className="muted">Not yet</span> : g.met ? <span className="ok">Met</span> : <span className="flag">Open</span>}</td><td>{g.detail}</td></tr>)}</tbody></table>
        <p><b>{ps.readiness}.</b> This report records the decision; it never makes or approves it. Only the named decision owner can approve a solution.</p>
      </>
    );
  }
  if (seq === 17) {
    const validated = ps.hypotheses.filter((h) => h.status === "Validated");
    const risks = ps.risks.filter((r) => r.rating === "High").slice(0, 5);
    const row = (k: string, v: ReactNode) => <tr key={k}><td style={{ width: 190 }}>{k}</td><td>{v || <span className="muted">Not recorded</span>}</td></tr>;
    return (
      <>
        {ps.readiness === "Not ready" && <p className="flag">This brief is a working draft: {ps.openGates > 0 ? `${ps.openGates} decision gate${ps.openGates > 1 ? "s are" : " is"} open` : "no solution has been approved"} (section 16). Do not start implementation from it.</p>}
        <table><tbody>
          {row("Problem statement", <span style={{ whiteSpace: "pre-wrap" }}>{getA(6, /Problem statement/i)}</span>)}
          {row("Success criteria", <span style={{ whiteSpace: "pre-wrap" }}>{getA(6, /Success criteria/i)}</span>)}
          {row("Validated causes", validated.length ? <ul>{validated.map((h) => <li key={h.id}>{h.id}: {h.statement}</li>)}</ul> : null)}
          {row("Solution to implement", ps.decision.recommended)}
          {row("Design constraints", <span style={{ whiteSpace: "pre-wrap" }}>{getA(12, /Solution principles/i)}</span>)}
          {row("Pilot", <span style={{ whiteSpace: "pre-wrap" }}>{getA(15, /Pilot design/i)}</span>)}
          {row("Highest risks", risks.length ? <ul>{risks.map((r, i) => <li key={i}>{r.text}{r.counter ? ` (counter-action: ${r.counter})` : ""}</li>)}</ul> : null)}
          {row("Decision owner and decision", ps.decision.decision ? `${ps.decision.decision}${ps.decision.owner ? `, ${ps.decision.owner}` : ""}` : "")}
        </tbody></table>
        <p className="muted">Re-route gate: if implementation evidence shows the problem or the solution premise was wrong, return to this kit instead of pushing on. The Playbook then adds workstreams, owners, controls and benefits tracking.</p>
      </>
    );
  }
  if (seq === 18) {
    return (
      <>
        {ps.risks.length === 0 ? none("No risks, assumptions or open questions were recorded.") : (
          <table><thead><tr><th>Item</th><th style={{ width: 80 }}>Likelihood</th><th style={{ width: 70 }}>Impact</th><th style={{ width: 80 }}>Rating</th><th>Counter-action</th></tr></thead>
            <tbody>{ps.risks.map((r, i) => <tr key={i}><td>{r.text}</td><td>{r.likelihood || "-"}</td><td>{r.impact || "-"}</td><td className={r.rating === "High" ? "flag" : ""}>{r.rating}</td><td>{r.counter || "-"}</td></tr>)}</tbody></table>
        )}
        <p className="muted">Write each item as: risk | likelihood (High, Medium, Low) | impact | counter-action. Items without ratings are shown as Not rated, not guessed. Include what would change the recommendation.</p>
      </>
    );
  }
  if (seq === 19) {
    return (
      <>
        <p>Reference methods, with when to use them, steps, common errors and a blank worksheet. Illustrations are generic and are not client data.</p>
        {METHOD_CARDS.map((m) => (
          <div key={m.id} className="method avoid">
            <div className="ibanner">{m.id} · {m.name}</div>
            <table><tbody>
              <tr><td style={{ width: 130 }}>Purpose</td><td>{m.purpose}</td></tr>
              <tr><td>Use when</td><td>{m.whenToUse}</td></tr>
              <tr><td>Do not use when</td><td>{m.whenNotToUse}</td></tr>
            </tbody></table>
            <ol>{m.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <p><b>Common errors:</b> {m.commonErrors.join(" ")}</p>
            <p className="muted">{m.illustration}</p>
            <table><thead><tr>{m.worksheet.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{m.worksheet.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ height: 24 }}>{c}</td>)}</tr>)}</tbody></table>
          </div>
        ))}
      </>
    );
  }
  return null;
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
.ok{color:#1d6a3a;font-weight:600}.method{margin:16px 0}
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
