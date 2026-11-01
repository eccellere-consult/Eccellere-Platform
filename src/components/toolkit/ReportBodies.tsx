"use client";

import type { ReactNode } from "react";
import type { Blueprint } from "@/lib/toolkit/engine";
import { GOVERNANCE_CALENDAR, type DiagnosticAnalysis } from "@/lib/toolkit/analysis";
import type { PSAnalysis } from "@/lib/toolkit/analysis-ps";
import type { PBAnalysis } from "@/lib/toolkit/analysis-pb";
import { METHOD_CARDS, PLAYBOOK_TEMPLATES } from "@/lib/toolkit/methods";

/** Section bodies for the printable report. Pure rendering: no data fetching. */
const TEMPLATE_NOTE =
  "Built from the answers in this report using Eccellere's standard method. The wording of steps is a template; refine it with the owner. Nothing here is a verified fact beyond the client's own answers.";
const heatCls = (level: number | null, kind: string) =>
  kind === "unknown" ? "h-unk" : level === null ? "h-blank" : `h-${level}`;

export function diagnosticBody(seq: number, an: DiagnosticAnalysis, bp: Blueprint, extra: ReactNode) {
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

export function problemSolvingBody(
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

export function playbookBody(seq: number, pb: PBAnalysis, extra: ReactNode) {
  const none = (msg: string) => <p className="muted">{msg}</p>;
  const yn = (b: boolean) => (b ? <span className="ok">Yes</span> : <span className="flag">No</span>);
  const flagList = (f: string[]) => (f.length ? <div className="flag">{f.join("; ")}</div> : null);
  const cell = (v: string, missing = "Not recorded") => (v ? v : <span className="muted">{missing}</span>);

  if (seq === 3) {
    return (
      <>
        <table><tbody>
          <tr><td>Workstreams / steps</td><td>{pb.workstreams.length} workstreams, {pb.steps.length} steps</td></tr>
          <tr><td>RACI rows with a problem</td><td>{pb.raci.rows.filter((r) => r.flags.length).length} of {pb.raci.rows.length}</td></tr>
          <tr><td>KPIs / benefit status</td><td>{pb.kpis.length} KPIs ({Object.entries(pb.benefitCounts).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(", ") || "none"})</td></tr>
          <tr><td>Roadmap items</td><td>{pb.roadmap.length}</td></tr>
          <tr><td>Completion gates met</td><td>{pb.gatesMetPct === null ? "No gate status stated" : `${pb.gatesMetPct}%`}</td></tr>
          <tr><td>Mobilisation checks</td><td><b>{pb.mobilisation}</b>{pb.openChecks ? ` (${pb.openChecks} of ${pb.checks.length} checks open)` : ""}</td></tr>
        </tbody></table>
        {extra}
      </>
    );
  }
  if (seq === 5) {
    return (
      <>
        {extra}
        <h3>Premise check</h3>
        <table><thead><tr><th>Check</th><th style={{ width: 70 }}>Met</th><th>Note</th></tr></thead>
          <tbody>{pb.premise.map((p) => <tr key={p.label}><td>{p.label}</td><td>{yn(p.ok)}</td><td>{p.note}</td></tr>)}</tbody></table>
        <p className="muted">A Playbook implements a decision that has already been made. If implementation evidence shows the problem or solution premise was wrong, use the re-route gate and return to a Diagnostic or Problem-Solving Kit.</p>
      </>
    );
  }
  if (seq === 8) {
    return (
      <>
        {pb.readiness.items.length === 0 ? none("No readiness items were recorded.") : (
          <table><thead><tr><th>Prerequisite</th><th style={{ width: 90 }}>Status</th><th>Owner</th></tr></thead>
            <tbody>{pb.readiness.items.map((r, i) => <tr key={i}><td>{r.item}</td><td className={r.status === "Not ready" ? "flag" : r.status === "Ready" ? "ok" : ""}>{r.status}</td><td>{cell(r.owner, "No owner")}</td></tr>)}</tbody></table>
        )}
        <p>{pb.readiness.readyPct === null ? "No readiness status was stated." : `${pb.readiness.readyPct}% of the items with a stated status are Ready.`}</p>
      </>
    );
  }
  if (seq === 9) {
    return pb.workstreams.length === 0 ? none("No workstreams were recorded.") : (
      <>
        <table><thead><tr><th style={{ width: 40 }}>ID</th><th>Workstream</th><th>Scope</th><th>Owner</th><th>Depends on</th><th>Stage gate</th><th style={{ width: 50 }}>Steps</th></tr></thead>
          <tbody>{pb.workstreams.map((w) => (
            <tr key={w.id}><td>{w.id}</td><td>{w.name}{flagList(w.flags)}</td><td>{cell(w.scope)}</td><td>{cell(w.owner, "No owner")}</td><td>{w.dependsOn.join(", ") || "None"}</td><td>{cell(w.gate, "No gate")}</td><td>{w.stepCount}</td></tr>))}</tbody></table>
        <p className="muted">Each workstream needs a named owner and a stage gate. Dependencies show what must finish first.</p>
      </>
    );
  }
  if (seq === 10) {
    return pb.steps.length === 0 ? none("No implementation steps were recorded.") : (
      <>
        <table><thead><tr><th style={{ width: 36 }}>ID</th><th>Action</th><th>Method</th><th>Output</th><th>Validation</th><th>Owner</th><th style={{ width: 40 }}>WS</th></tr></thead>
          <tbody>{pb.steps.map((s) => (
            <tr key={s.id}><td>{s.id}</td><td>{s.action}{flagList(s.flags)}</td><td>{cell(s.method)}</td><td>{cell(s.output)}</td><td>{cell(s.validation)}</td><td>{cell(s.owner, "No owner")}</td><td>{s.workstream || "-"}</td></tr>))}</tbody></table>
        <p className="muted">Every step states an action, a method, an output and how it will be validated.</p>
      </>
    );
  }
  if (seq === 11) {
    return pb.raci.rows.length === 0 ? <>{none("No RACI rows were recorded.")}{extra}</> : (
      <>
        <table><thead><tr><th>Activity</th><th>Responsible</th><th>Accountable</th><th>Consulted</th><th>Informed</th></tr></thead>
          <tbody>{pb.raci.rows.map((r, i) => (
            <tr key={i}><td>{r.activity}{flagList(r.flags)}</td><td>{r.R.join(", ") || "-"}</td><td>{r.A.join(", ") || <span className="flag">None</span>}</td><td>{r.C.join(", ") || "-"}</td><td>{r.I.join(", ") || "-"}</td></tr>))}</tbody></table>
        <p className="muted">Roles involved: {pb.raci.roles.join(", ") || "none"}. Rule: exactly one Accountable per activity, and at least one Responsible.</p>
        {pb.raci.uncovered.length > 0 && <p className="muted">Name check: no RACI activity mentions {pb.raci.uncovered.join(", ")}. This is a text match only, so confirm by hand that each workstream has an accountable owner.</p>}
      </>
    );
  }
  if (seq === 12) {
    return (
      <>
        {extra}
        <p className={pb.budget.stated ? "muted" : "flag"}>{pb.budget.note}</p>
      </>
    );
  }
  if (seq === 14) {
    return pb.risks.length === 0 ? none("No risks were recorded.") : (
      <>
        <table><thead><tr><th>Risk</th><th style={{ width: 80 }}>Likelihood</th><th style={{ width: 70 }}>Impact</th><th style={{ width: 80 }}>Rating</th><th>Counter-action</th><th>Owner</th></tr></thead>
          <tbody>{pb.risks.map((r, i) => <tr key={i}><td>{r.text}</td><td>{r.likelihood || "-"}</td><td>{r.impact || "-"}</td><td className={r.rating === "High" ? "flag" : ""}>{r.rating}</td><td>{cell(r.counter, "None stated")}</td><td>{cell(r.owner, "No owner")}</td></tr>)}</tbody></table>
        <p className="muted">{pb.risks.filter((r) => r.counter).length} of {pb.risks.length} risks have a counter-action. Aim for at least five. Ratings are likelihood times impact; unrated items are shown as Not rated, not guessed.</p>
      </>
    );
  }
  if (seq === 15) {
    return pb.kpis.length === 0 ? none("No KPIs were recorded.") : (
      <>
        <table><thead><tr><th>KPI</th><th>Baseline</th><th>Target</th><th>Formula</th><th>Owner</th><th>Cadence</th><th>Benefit status</th></tr></thead>
          <tbody>{pb.kpis.map((k, i) => (
            <tr key={i}><td>{k.name}{flagList(k.flags)}</td><td>{cell(k.baseline, "None")}</td><td>{cell(k.target, "None")}</td><td>{cell(k.formula, "None")}</td><td>{cell(k.owner, "No owner")}</td><td>{cell(k.cadence, "None")}</td><td>{k.status}</td></tr>))}</tbody></table>
        <p className="muted">Benefit status is shown as the client stated it and is counted separately: {Object.entries(pb.benefitCounts).map(([k, n]) => `${k} ${n}`).join(", ")}. Forecast benefit is not realised benefit.</p>
      </>
    );
  }
  if (seq === 16) {
    return (
      <>
        {pb.roadmap.length === 0 ? none("No roadmap was recorded.") : (
          <table><thead><tr><th style={{ width: 36 }}>ID</th><th>Phase</th><th>Activity</th><th>Owner</th><th>Start</th><th>End</th><th>Horizon</th><th>Milestone</th><th>Depends on</th><th>Gate</th></tr></thead>
            <tbody>{(new Set(pb.roadmap.filter((r) => r.kind !== "none").map((r) => r.kind)).size > 1 ? pb.roadmap : pb.roadmap.slice().sort((a, b) => (a.startDay ?? 9e9) - (b.startDay ?? 9e9))).map((r) => (
              <tr key={r.id}><td>{r.id}</td><td>{r.phase}</td><td>{r.activity}{flagList(r.flags)}</td><td>{cell(r.owner, "No owner")}</td><td>{cell(r.start, "-")}</td><td>{cell(r.end, "-")}</td><td>{r.horizon}</td><td>{cell(r.milestone, "None")}</td><td>{r.dependsOn || "-"}</td><td>{r.gate || "-"}</td></tr>))}</tbody></table>
        )}
        {pb.roadmapNotes.map((n, i) => <p key={i} className="flag">{n}</p>)}
        <p className="muted">Use 30/60/90 days for focused work and a longer roadmap for programmes. Dates are shown exactly as entered; none are assumed.</p>
      </>
    );
  }
  if (seq === 17) {
    return pb.forums.length === 0 ? none("No governance forums were recorded.") : (
      <>
        <table><thead><tr><th>Forum</th><th>Cadence</th><th>Attendees</th><th>Purpose</th></tr></thead>
          <tbody>{pb.forums.map((f, i) => <tr key={i}><td>{f.forum}</td><td>{f.cadence || "-"}</td><td>{cell(f.attendees, "-")}</td><td>{cell(f.purpose, "-")}</td></tr>)}</tbody></table>
        <p className={pb.governanceCovers.weekly && pb.governanceCovers.monthly && pb.governanceCovers.quarterly ? "muted" : "flag"}>
          Coverage: weekly {pb.governanceCovers.weekly ? "yes" : "no"}, monthly {pb.governanceCovers.monthly ? "yes" : "no"}, quarterly {pb.governanceCovers.quarterly ? "yes" : "no"}.
        </p>
      </>
    );
  }
  if (seq === 18) {
    return (
      <>
        {pb.gates.length === 0 ? none("No completion gates were recorded.") : (
          <table><thead><tr><th>Gate</th><th>Evidence required</th><th>Owner</th><th style={{ width: 80 }}>Status</th></tr></thead>
            <tbody>{pb.gates.map((g, i) => <tr key={i}><td>{g.gate}{flagList(g.flags)}</td><td>{cell(g.evidence, "None defined")}</td><td>{cell(g.owner, "No owner")}</td><td className={g.status === "Met" ? "ok" : g.status === "Open" ? "flag" : ""}>{g.status}</td></tr>)}</tbody></table>
        )}
        <p>{pb.gatesMetPct === null ? "No gate status was stated." : `${pb.gatesMetPct}% of gates with a stated status are met.`}</p>
        <h3>Mobilisation checks</h3>
        <table><thead><tr><th style={{ width: 44 }}>Check</th><th>Condition</th><th style={{ width: 70 }}>Status</th><th>Detail</th></tr></thead>
          <tbody>{pb.checks.map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.label}</td><td>{c.met ? <span className="ok">Met</span> : <span className="flag">Open</span>}</td><td>{c.detail}</td></tr>)}</tbody></table>
        <p><b>{pb.mobilisation}.</b> This report states which checks are met; it never approves mobilisation. That is the sponsor&apos;s decision.</p>
      </>
    );
  }
  if (seq === 20) {
    return (
      <>
        <p>Blank templates to use during implementation. They are generic worksheets, not client data.</p>
        {PLAYBOOK_TEMPLATES.map((t) => (
          <div key={t.id} className="method avoid">
            <div className="ibanner">{t.id} · {t.name}</div>
            <p className="muted">{t.use}</p>
            <table><thead><tr>{t.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ height: 24 }}>{c}</td>)}</tr>)}</tbody></table>
          </div>
        ))}
      </>
    );
  }
  return null;
}
