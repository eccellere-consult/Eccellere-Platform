"use client";

import { readJson } from "@/lib/toolkit/http";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Paperclip, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  routeKit,
  KIT_LABEL,
  KIT_PURPOSE,
  type Clarity,
  type Intent,
  type KitType,
} from "@/lib/toolkit/engine";
import { INDUSTRIES, TOPIC_GROUPS, OTHER_TOPIC } from "@/lib/toolkit/taxonomy";

const STEPS = ["Your need", "Company context", "Where you are", "Confirm"];

const INTENTS: Array<{ value: Intent | ""; label: string }> = [
  { value: "", label: "Not sure / let you decide" },
  { value: "discover", label: "Understand what is going wrong or where I stand" },
  { value: "solve", label: "Find the right solution to a problem I know" },
  { value: "implement", label: "Implement a solution we have already agreed" },
  { value: "reference", label: "Get a reference guide on the subject" },
  { value: "learn", label: "Build my team's capability" },
  { value: "grow", label: "Plan growth or strategy" },
];

const ACCEPT = ".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md";
const inputCls =
  "w-full rounded-none border border-eccellere-ink/20 bg-white px-4 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold";

function Quadrant({ active }: { active: string | null }) {
  const cell = (q: string, title: string, sub: string) => (
    <div
      className={cn(
        "rounded border p-3 text-center text-xs transition-colors",
        active === q ? "border-eccellere-gold bg-eccellere-gold/15 font-medium text-eccellere-ink" : "border-eccellere-ink/10 bg-white text-ink-mid",
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-[10px] opacity-80">{sub}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] items-stretch gap-1.5 text-[10px] text-ink-light">
      <span />
      <span className="text-center">Solution not agreed</span>
      <span className="text-center">Solution agreed</span>
      <span className="flex items-center [writing-mode:vertical-rl] rotate-180">Problem unclear</span>
      {cell("Q1", "Discover", "Diagnostic Kit")}
      {cell("Q2", "Validate the premise", "Diagnostic Kit")}
      <span className="flex items-center [writing-mode:vertical-rl] rotate-180">Problem clear</span>
      {cell("Q3", "Solve", "Problem-Solving Kit")}
      {cell("Q4", "Implement", "Playbook")}
    </div>
  );
}

function Choice({
  value,
  current,
  onPick,
  label,
}: {
  value: string;
  current: string;
  onPick: (v: string) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={cn(
        "rounded border px-4 py-2 text-sm transition-colors",
        current === value ? "border-eccellere-gold bg-eccellere-gold/15 text-eccellere-ink" : "border-eccellere-ink/15 bg-white text-ink-mid hover:border-eccellere-gold/50",
      )}
    >
      {label}
    </button>
  );
}

export default function NewToolkitPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [topicSel, setTopicSel] = useState("");
  const [problemText, setProblemText] = useState("");
  const [contextText, setContextText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [problemClarity, setProblemClarity] = useState<Clarity>("unsure");
  const [solutionClarity, setSolutionClarity] = useState<Clarity>("unsure");
  const [intent, setIntent] = useState<Intent | "">("");
  const [override, setOverride] = useState<KitType | "">("");
  const [mode, setMode] = useState<"CLIENT_LED" | "AI_FIRST_CUT">("AI_FIRST_CUT");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topic = topicSel && topicSel !== OTHER_TOPIC ? topicSel : "";
  const route = useMemo(
    () => routeKit({ problemClarity, solutionClarity, intent: intent || undefined }),
    [problemClarity, solutionClarity, intent],
  );
  const finalType: KitType | null = (override || route.type) as KitType | null;

  const step0Ok = Boolean(industry) && (Boolean(topic) || problemText.trim().length >= 10);
  const canNext = step === 0 ? step0Ok : step === 2 ? Boolean(finalType) : true;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((cur) => [...cur, ...Array.from(list)].slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function create() {
    setError(null);
    setBusy("Building your form…");
    try {
      const r = await fetch("/api/toolkits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          topic,
          problemText,
          contextText,
          problemClarity,
          solutionClarity,
          intent: intent || undefined,
          kitType: override || undefined,
          mode,
        }),
      });
      const d = await readJson(r);
      if (r.status === 401) throw new Error("Please sign in to create a toolkit.");
      if (!r.ok) throw new Error(d.error ?? "Could not create the toolkit.");

      const failed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading and reading file ${i + 1} of ${files.length}…`);
        const fd = new FormData();
        fd.append("file", files[i]);
        const u = await fetch(`/api/toolkits/${d.id}/evidence`, { method: "POST", body: fd });
        if (!u.ok) {
          const ud = await u.json().catch(() => ({}));
          failed.push(`${files[i].name}: ${ud.error ?? "upload failed"}`);
        }
      }
      if (failed.length) window.alert(`Your toolkit was created, but some files could not be added:\n\n${failed.join("\n")}\n\nYou can add them again inside the toolkit.`);
      router.push(`/dashboard/toolkits/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <Link href="/dashboard/toolkits" className="inline-flex items-center gap-1 text-xs text-ink-mid hover:text-eccellere-gold">
        <ArrowLeft className="h-3 w-3" /> My Toolkits
      </Link>
      <h1 className="mt-3 font-display text-3xl font-light text-eccellere-ink">Configure your own toolkit</h1>
      <p className="mt-2 text-sm text-ink-mid">
        Tell us your industry and what you want to address. We&apos;ll recommend the right type of toolkit and build a form you can complete
        yourself or with AI help.
      </p>

      <ol className="mt-8 flex gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={cn(
              "flex-1 border-t-2 pt-2",
              i === step ? "border-eccellere-gold font-medium text-eccellere-ink" : i < step ? "border-eccellere-gold/50 text-ink-mid" : "border-eccellere-ink/10 text-ink-light",
            )}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6 rounded bg-white p-6 shadow-sm">
        {step === 0 && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="industry">Industry</label>
              <select id="industry" className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">Select your industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="topic">Topic</label>
              <select id="topic" className={inputCls} value={topicSel} onChange={(e) => setTopicSel(e.target.value)}>
                <option value="">Choose a topic…</option>
                {TOPIC_GROUPS.map((g) => (
                  <optgroup key={g.domain} label={g.domain}>
                    {g.topics.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </optgroup>
                ))}
                <option>{OTHER_TOPIC}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="problem">
                Problems to address <span className="font-normal text-ink-light">(use this instead of, or along with, the topic)</span>
              </label>
              <textarea
                id="problem"
                rows={5}
                className={inputCls}
                maxLength={20000}
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="e.g. Scrap on our main line is 8% against a 3% target and customers are complaining about late deliveries."
              />
              <p className="mt-1 text-xs text-ink-light">{problemText.length.toLocaleString()} / 20,000 characters. For longer material, upload a file in the next step.</p>
              {!step0Ok && industry && <p className="mt-1 text-xs text-ink-light">Choose a topic, or describe the problem in at least a sentence.</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="context">Company context</label>
              <textarea
                id="context"
                rows={7}
                className={inputCls}
                maxLength={20000}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Size, products or services, customers, locations, recent performance, what you have already tried, constraints…"
              />
              <p className="mt-1 text-xs text-ink-light">{contextText.length.toLocaleString()} / 20,000 characters. For longer material, upload files below.</p>
              <p className="mt-1 text-xs text-ink-light">The more specific you are, the better the form and AI drafts. Optional, but recommended.</p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Supporting files <span className="font-normal text-ink-light">(optional)</span></p>
              <p className="mb-2 text-xs text-ink-mid">
                For example financial statements, a problem report or process notes. PDF, Word, PowerPoint, Excel, CSV or text, up to 10 MB each,
                up to 10 files. Files are private to you and are read as information only, never as instructions.
              </p>
              <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-4 w-4" /> Add files
              </Button>
              {files.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded bg-eccellere-cream px-3 py-1.5 text-xs">
                      <span className="truncate">{f.name} <span className="text-ink-light">({(f.size / 1024).toFixed(0)} KB)</span></span>
                      <button onClick={() => setFiles((cur) => cur.filter((_, k) => k !== i))} aria-label={`Remove ${f.name}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="text-sm font-medium">Is the problem clearly understood?</p>
              <p className="mb-2 text-xs text-ink-mid">
                Clear means you can state what is affected, the gap versus what you need, roughly how big it is, and why it matters.
              </p>
              <div className="flex flex-wrap gap-2">
                <Choice value="clear" current={problemClarity} onPick={(v) => setProblemClarity(v as Clarity)} label="Yes, clear" />
                <Choice value="unclear" current={problemClarity} onPick={(v) => setProblemClarity(v as Clarity)} label="No, not yet" />
                <Choice value="unsure" current={problemClarity} onPick={(v) => setProblemClarity(v as Clarity)} label="Not sure" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Has a solution already been chosen and agreed?</p>
              <p className="mb-2 text-xs text-ink-mid">
                A preferred vendor, technology or idea is not yet an agreed solution unless the sponsor has approved it.
              </p>
              <div className="flex flex-wrap gap-2">
                <Choice value="clear" current={solutionClarity} onPick={(v) => setSolutionClarity(v as Clarity)} label="Yes, agreed" />
                <Choice value="unclear" current={solutionClarity} onPick={(v) => setSolutionClarity(v as Clarity)} label="No, not yet" />
                <Choice value="unsure" current={solutionClarity} onPick={(v) => setSolutionClarity(v as Clarity)} label="Not sure" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="intent">What do you mainly want?</label>
              <select id="intent" className={inputCls} value={intent} onChange={(e) => setIntent(e.target.value as Intent | "")}>
                {INTENTS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 rounded bg-eccellere-cream p-4 sm:grid-cols-2">
              <Quadrant active={route.quadrant} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-eccellere-gold">Recommended</p>
                <p className="mt-1 font-display text-xl text-eccellere-ink">{route.type ? route.label : "One more answer needed"}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-mid">{route.rationale}</p>
                {route.clarifyingQuestion && <p className="mt-2 text-xs font-medium text-eccellere-ink">{route.clarifyingQuestion}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="override">
                Prefer a different type? <span className="font-normal text-ink-light">(optional)</span>
              </label>
              <select id="override" className={inputCls} value={override} onChange={(e) => setOverride(e.target.value as KitType | "")}>
                <option value="">Use the recommendation</option>
                {(Object.keys(KIT_LABEL) as KitType[]).map((k) => (
                  <option key={k} value={k}>{KIT_LABEL[k]}</option>
                ))}
              </select>
              {override && route.type && override !== route.type && (
                <p className="mt-1 text-xs text-amber-700">
                  We recommended a {route.label}. Choosing {KIT_LABEL[override]} is fine, but it may not answer the decision you face.
                </p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-ink-light">Toolkit type</dt><dd className="font-medium">{finalType ? KIT_LABEL[finalType] : "—"}</dd><dd className="text-xs text-ink-mid">{finalType && KIT_PURPOSE[finalType]}</dd></div>
              <div><dt className="text-xs text-ink-light">Industry</dt><dd>{industry}</dd></div>
              <div><dt className="text-xs text-ink-light">Topic / problem</dt><dd>{topic || "—"}{problemText && <span className="block text-xs text-ink-mid">{problemText.slice(0, 220)}{problemText.length > 220 ? "…" : ""}</span>}</dd></div>
              <div><dt className="text-xs text-ink-light">Context and files</dt><dd>{contextText ? `${contextText.length} characters` : "No text"} · {files.length} file(s)</dd></div>
            </dl>
            <div>
              <p className="text-sm font-medium">How would you like to complete it?</p>
              <div className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded border border-eccellere-ink/15 p-3 text-sm">
                  <input type="radio" name="mode" checked={mode === "AI_FIRST_CUT"} onChange={() => setMode("AI_FIRST_CUT")} className="mt-1" />
                  <span><b>AI first draft, then I edit</b><br /><span className="text-xs text-ink-mid">AI drafts sections from your context and files. Every draft is labelled and nothing counts as confirmed until you accept it.</span></span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded border border-eccellere-ink/15 p-3 text-sm">
                  <input type="radio" name="mode" checked={mode === "CLIENT_LED"} onChange={() => setMode("CLIENT_LED")} className="mt-1" />
                  <span><b>I will fill it myself</b><br /><span className="text-xs text-ink-mid">AI help stays available section by section whenever you want it.</span></span>
                </label>
              </div>
            </div>
            {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0 || Boolean(busy)} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={Boolean(busy) || !finalType} onClick={create}>
            {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> {busy}</>) : "Create my toolkit"}
          </Button>
        )}
      </div>
    </div>
  );
}
