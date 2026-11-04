"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";

interface Skill { kind: "draft" | "assist" | "form"; title: string; text: string; isCustom: boolean; updatedAt: string | null; defaultText: string }

/** The two skill files that tell the AI how to build a tool page and how to help a person using one. Plain text; edit and save. */
export default function SkillEditor() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [tab, setTab] = useState<"draft" | "assist" | "form">("draft");
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/tools/skill");
      const d = await readJson(r);
      if (!r.ok) return setErr(d.error ?? "Could not load the skill files.");
      setSkills(d.skills);
      setText(Object.fromEntries((d.skills as Skill[]).map((s) => [s.kind, s.text])));
    })().catch(() => setErr("Could not load the skill files."));
  }, []);

  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!skills) return <p className="text-sm text-ink-light"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</p>;
  const cur = skills.find((s) => s.kind === tab)!;
  const value = text[tab] ?? "";
  const changed = value.trim() !== cur.text.trim();

  async function send(body: Record<string, unknown>, ok: string) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/tools/skill", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: tab, ...body }) });
    const d = await readJson(r);
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "warn", text: d.error ?? "Could not save." });
    setSkills((all) => all!.map((s) => (s.kind === tab ? { ...s, ...d.skill } : s)));
    setText((t) => ({ ...t, [tab]: d.skill.text }));
    setMsg({ kind: "ok", text: ok });
  }

  const download = () => {
    const blob = new Blob([value], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `eccellere-tools-${tab}-skill.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="inline-flex border border-eccellere-ink/20 text-xs" role="tablist">
        {skills.map((s) => (
          <button key={s.kind} role="tab" aria-selected={tab === s.kind} onClick={() => { setTab(s.kind); setMsg(null); }} className={cn("px-3 py-1.5", tab === s.kind ? "bg-eccellere-ink text-white" : "hover:bg-eccellere-cream")}>
            {s.kind === "draft" ? "Drafting skill" : s.kind === "form" ? "Form builder skill" : "Assist skill"}{s.isCustom && " (edited)"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-mid">{cur.title}.</p>
      <p className="mt-1 text-xs text-ink-light">
        {tab === "draft"
          ? "Applies to the next tool the AI drafts, redrafts or completes. Tools already drafted are not changed."
          : tab === "form"
            ? "Applies to the next form built in the Form builder (from a prompt, an upload or a template). Forms already built are not changed."
            : "Applies to the next time a person asks the AI to draft answers, suggest questions or write an analysis."}
        {" "}The code always keeps: the format the AI must return, the tool&apos;s name taken from your list, originator and year left for a person to confirm, the quality and standards checks, and review before anything is shown to a client.
      </p>
      <textarea className="mt-3 min-h-[360px] w-full border border-eccellere-ink/20 bg-white p-3 font-mono text-xs leading-relaxed focus:border-eccellere-gold focus:outline-none" value={value} onChange={(e) => { setText((t) => ({ ...t, [tab]: e.target.value })); setMsg(null); }} aria-label={cur.title} spellCheck />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={busy || !changed} onClick={() => send({ text: value }, "Saved. It applies from the next AI request.")}>
          {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save skill file"}
        </button>
        <button className="inline-flex items-center gap-1 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={busy || !cur.isCustom} onClick={() => confirm("Go back to the built-in text? Your edits are replaced.") && send({ reset: true }, "Back to the built-in text.")}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset to built-in
        </button>
        <button className="inline-flex items-center gap-1 border border-eccellere-ink/20 px-3 py-2 text-xs hover:bg-eccellere-cream" onClick={download}><Download className="h-3.5 w-3.5" /> Download as .md</button>
        {cur.updatedAt && <span className="text-[11px] text-ink-light">Last edited {new Date(cur.updatedAt).toLocaleString()}</span>}
        {msg && <span className={cn("text-sm", msg.kind === "ok" ? "text-emerald-700" : "text-red-700")}>{msg.text}</span>}
      </div>
    </div>
  );
}
