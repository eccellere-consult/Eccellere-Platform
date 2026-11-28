"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import { TitleBlock } from "@/components/standard/AdminFrame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHECK_LABEL, CHECK_STATUSES, checklistCounts,
  type CheckItem, type CheckStatus, type ReviewProfile, type Validation,
} from "@/lib/admin/specialistReview";

type Mark = Omit<Validation, "by"> & { by: string | null };
type HistoryRow = { action: string; reason: string; by: string; at: string };
type Payload = {
  profile: ReviewProfile & { approvedBy?: string | null };
  checklist: CheckItem[];
  marks: Record<string, Mark>;
  history: HistoryRow[];
};

const STATUS_WORDS: Record<string, string> = {
  pending: "Waiting for review", "needs info": "More information asked for", active: "Approved", inactive: "Not approved / suspended",
};
const HISTORY_WORDS: Record<string, string> = {
  specialist_approved: "Approved", specialist_more_info_requested: "Asked for more information", specialist_rejected: "Rejected",
};
const markStyle: Record<CheckStatus, string> = {
  verified: "border-eccellere-ink bg-eccellere-ink text-white",
  not_verified: "border-eccellere-error bg-eccellere-error text-white",
  needs_info: "border-eccellere-gold-deep bg-eccellere-gold/15 text-eccellere-gold-deep",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-eccellere-ink/5 bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl text-eccellere-ink">{title}</h2>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr]">
      <span className="text-xs font-semibold uppercase tracking-wider text-eccellere-gold-deep">{label}</span>
      <span className={cn("text-ink-mid", empty && "italic text-ink-light")}>
        {empty ? "Not provided by applicant" : Array.isArray(value) ? (
          <span className="flex flex-wrap gap-1">
            {value.map((v) => <span key={String(v)} className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-xs text-eccellere-ink">{v}</span>)}
          </span>
        ) : value}
      </span>
    </div>
  );
}

function SafeLink({ href }: { href: string }) {
  const ok = /^https?:\/\//i.test(href);
  return ok
    ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-eccellere-gold-deep underline hover:no-underline">{href}<ExternalLink className="h-3 w-3" /></a>
    : <span>{href} <span className="text-xs text-eccellere-error">(not a web link, check by hand)</span></span>;
}

export default function ReviewSpecialist({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/specialists/${encodeURIComponent(id)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setData(j as Payload);
      setNotes(Object.fromEntries(Object.entries((j as Payload).marks).map(([k, m]) => [k, m.note])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this applicant");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isSample = !!data?.profile.isSample;

  async function mark(item: CheckItem, status: CheckStatus) {
    if (!data) return;
    const note = (notes[item.key] ?? "").trim();
    if (isSample) {
      setData({ ...data, marks: { ...data.marks, [item.key]: { key: item.key, status, note, by: "You (sample, not saved)", at: new Date().toISOString() } } });
      return;
    }
    setSaving(item.key);
    try {
      const res = await fetch(`/api/admin/specialists/${encodeURIComponent(id)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "mark", key: item.key, status, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(null);
    }
  }

  async function decide(action: "approve" | "more_info" | "reject") {
    if (!data) return;
    setMessage(null);
    const c = checklistCounts(data.checklist, data.marks as Record<string, Validation>);
    if (action === "approve") {
      const gaps: string[] = [];
      if (c.notVerified) gaps.push(`${c.notVerified} item(s) marked Not verified`);
      if (c.needsInfo) gaps.push(`${c.needsInfo} item(s) marked Needs info`);
      if (c.checked < c.total) gaps.push(`${c.total - c.checked} item(s) not checked yet`);
      if (gaps.length && !window.confirm(`Approve anyway?\n\n${gaps.join("\n")}`)) return;
    } else if (reason.trim().length < 5) {
      setMessage("Please write a short reason first. The applicant's record keeps it.");
      return;
    }
    if (isSample) { setMessage("Sample only: nothing was saved. On a real applicant this records your decision."); return; }
    setSaving("decision");
    try {
      const res = await fetch(`/api/admin/specialists/${encodeURIComponent(id)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "decide", action, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save the decision");
      setReason("");
      setMessage(action === "approve" ? "Approved and recorded." : action === "more_info" ? "Sent back for more information and recorded." : "Rejected and recorded.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save the decision");
    } finally {
      setSaving(null);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <Link href="/admin/specialists" className="inline-flex items-center gap-1 text-sm text-eccellere-gold-deep"><ChevronLeft className="h-4 w-4" />All specialists</Link>
        <div className="mt-4 rounded-md border border-eccellere-error/30 bg-eccellere-error/5 px-4 py-3 text-sm text-eccellere-error">
          {error}. <button onClick={load} className="underline hover:no-underline">Retry</button>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center justify-center py-16 text-ink-light"><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span className="text-sm">Loading applicant…</span></div>;
  }

  const p = data.profile;
  const counts = checklistCounts(data.checklist, data.marks as Record<string, Validation>);
  const groups = [...new Set(data.checklist.map((i) => i.group))];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <Link href="/admin/specialists" className="inline-flex items-center gap-1 text-sm text-eccellere-gold-deep"><ChevronLeft className="h-4 w-4" />All specialists</Link>
      <div className="mt-3">
        <TitleBlock kicker="Specialist network · Review" title={p.name} purpose="Check what this applicant submitted, mark each skill or credential, then approve, ask for more information, or reject." />
      </div>

      {isSample && (
        <div className="mb-4 rounded-md border border-eccellere-gold/30 bg-eccellere-gold/5 px-4 py-3 text-sm text-ink-mid">
          Fictional sample for the demo. Try the checklist and buttons: nothing is saved.
        </div>
      )}

      <div className="mb-6 rounded-md border border-eccellere-ink/10 bg-white px-4 py-3 text-sm text-ink-mid">
        <strong className="text-eccellere-ink">How to review:</strong> 1. Read the profile and open the LinkedIn link. 2. Mark each line in the
        checklist (Verified, Not verified or Needs info) with a short note. 3. Decide at the bottom. Every mark and decision is saved with your
        name and the time, and appears in the Audit log.
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-eccellere-ink px-3 py-1 text-xs text-white">{STATUS_WORDS[p.listStatus] ?? p.status}</span>
        <span className="text-ink-mid">Applied {p.appliedOn}</span>
        {p.approvedAt && <span className="text-ink-mid">Approved {p.approvedAt}{p.approvedBy ? ` by ${p.approvedBy}` : ""}</span>}
        {p.rejectionReason && <span className="text-ink-mid">Last reason given: “{p.rejectionReason}”</span>}
      </div>

      <div className="grid gap-6">
        <Section title="Identity and contact">
          <Field label="Name" value={p.name} />
          <Field label="Email" value={<>{p.email} {p.emailVerified ? <span className="text-xs text-eccellere-gold-deep">(email confirmed)</span> : <span className="text-xs text-ink-light">(email not confirmed)</span>}</>} />
          <Field label="Phone" value={p.phone} />
          <Field label="Last sign-in" value={p.lastLogin} />
          <Field label="Payout details on file" value={[p.payoutDetailsOnFile.bank && "Bank account", p.payoutDetailsOnFile.pan && "PAN", p.payoutDetailsOnFile.gst && "GST"].filter(Boolean) as string[]} />
        </Section>

        <Section title="Headline and bio">
          <Field label="Headline" value={p.headline} />
          <Field label="Bio" value={p.bio ? <span className="whitespace-pre-line">{p.bio}</span> : null} />
          <Field label="Video introduction" value={p.videoIntroUrl ? <SafeLink href={p.videoIntroUrl} /> : null} />
        </Section>

        <Section title="Expertise">
          <Field label="Skills / service areas" value={p.serviceDomains} />
          <Field label="Industries" value={p.sectorExpertise} />
          <Field label="Problems solved" value={p.challengesAddressed} />
          <Field label="Languages" value={p.languages} />
        </Section>

        <Section title="Experience and credentials">
          <Field label="Current role" value={[p.currentRole, p.organisation].filter(Boolean).join(" at ")} />
          <Field label="Years of experience" value={p.experienceYears} />
          <Field label="Qualifications" value={p.education} />
          <Field label="Certifications" value={p.certifications} />
          <p className="text-xs text-ink-light">Employment history and references are not asked for on the application form yet.</p>
        </Section>

        <Section title="Links, files and working terms">
          <Field label="LinkedIn" value={p.linkedinUrl ? <SafeLink href={p.linkedinUrl} /> : null} />
          <Field label="Sample work / files" value={p.portfolio} />
          <Field label="Wants to do" value={p.engagementTypes} />
          <Field label="Availability" value={[p.availability, p.monthlyHoursAvail ? `${p.monthlyHoursAvail} hours a month` : ""].filter(Boolean).join(" · ")} />
          <Field label="Hourly rate asked" value={p.hourlyRate} />
          <p className="text-xs text-ink-light">CV and certificate uploads are not collected by the application form yet.</p>
        </Section>

        <Section title="Validation checklist">
          <p className="text-ink-mid">{counts.checked} of {counts.total} checked · {counts.verified} verified · {counts.notVerified} not verified · {counts.needsInfo} need info</p>
          {groups.map((g) => (
            <div key={g} className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-eccellere-gold-deep">{g}</h3>
              <ul className="mt-2 divide-y divide-eccellere-ink/5">
                {data.checklist.filter((i) => i.group === g).map((item) => {
                  const m = data.marks[item.key];
                  return (
                    <li key={item.key} className="grid gap-2 py-3 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-medium text-eccellere-ink">{item.label}</p>
                        <p className="text-ink-mid">{item.claim}</p>
                        <input
                          aria-label={`Note for ${item.label}`}
                          value={notes[item.key] ?? ""}
                          onChange={(e) => setNotes({ ...notes, [item.key]: e.target.value })}
                          placeholder="Short note (how you checked, what is missing)"
                          maxLength={500}
                          className="mt-2 w-full rounded-md border border-eccellere-ink/10 px-3 py-1.5 text-sm focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                        />
                        {m && <p className="mt-1 text-xs text-ink-light">Marked {CHECK_LABEL[m.status]}{m.by ? ` by ${m.by}` : ""}, {when(m.at)}</p>}
                      </div>
                      <div className="flex items-start gap-1">
                        {CHECK_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={saving !== null}
                            onClick={() => mark(item, s)}
                            className={cn("rounded border px-2.5 py-1 text-xs transition-colors", m?.status === s ? markStyle[s] : "border-eccellere-ink/10 text-ink-mid hover:bg-eccellere-cream")}
                          >
                            {saving === item.key ? "…" : CHECK_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Decision">
          <label className="block text-xs font-semibold uppercase tracking-wider text-eccellere-gold-deep" htmlFor="reason">Reason (needed to ask for more information or to reject)</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000}
            placeholder="e.g. Please add your Six Sigma certificate number and two client references."
            className="w-full rounded-md border border-eccellere-ink/10 px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold" />
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving !== null} onClick={() => decide("approve")}>{saving === "decision" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}</Button>
            <Button variant="ghost" disabled={saving !== null} onClick={() => decide("more_info")}>Ask for more information</Button>
            <Button variant="ghost" disabled={saving !== null} onClick={() => decide("reject")} className="text-eccellere-error">Reject</Button>
          </div>
          {message && <p role="status" className="text-sm text-eccellere-gold-deep">{message}</p>}
          {data.history.length > 0 && (
            <div className="pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-eccellere-gold-deep">Decision history</h3>
              <ul className="mt-2 space-y-1 text-ink-mid">
                {data.history.map((h, i) => (
                  <li key={i}>{when(h.at)} · {HISTORY_WORDS[h.action] ?? h.action} by {h.by}{h.reason ? `: “${h.reason}”` : ""}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
