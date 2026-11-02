import Link from "next/link";
import type { ToolRecord } from "@/lib/tools/repo";
import { toRuntime } from "@/lib/tools/runtime";
import Workspace from "./[slug]/Workspace";
import EnlargeDiagram from "./EnlargeDiagram";
import { BTN_LINE, BTN_MAIN, CARD, LABEL } from "./styles";

export const PRINT_CSS = "@media print{header,footer,nav,.no-print{display:none!important}main{padding-top:0!important}body{background:#fff!important}}";

const LAYER_NAMES: Record<string, string> = {
  L1: "Strategy and environment", L2: "Business model", L3: "Financial", L4: "Digital and AI", L5: "Organisation",
  L6: "Governance and KPIs", L7: "Go-to-market", L8: "People", L9: "Execution",
};
export const layerName = (l?: string) => (l ? LAYER_NAMES[l] ?? l : "");


function Chip({ children }: { children: React.ReactNode }) {
  return <span className="border border-eccellere-border bg-eccellere-cream px-2.5 py-1 text-xs text-ink-mid">{children}</span>;
}

/**
 * One tool's page, used for clients (/tools/<slug>) and for the Eccellere team (/consulting/library/<slug>). It follows the Strategy Hub
 * page (for example eccellere.in/strategy-hub/ansoff) block for block: title and chips; the reference model with its caption; about the
 * model and how to read it; what it does, when to use it, what happens next; the golden thread; then the worksheet. Server component.
 */
export default function ToolPageView(props: {
  tool: ToolRecord;
  signedIn: boolean;
  mode: "client" | "library";
  backHref: string;
  backLabel: string;
  signInHref: string;
}) {
  const { tool, signedIn, mode, backHref, backLabel, signInHref } = props;
  const rt = toRuntime(tool);
  if (!rt) return <p className="p-10 text-sm text-red-700">This tool cannot be shown right now.</p>;
  const ref = rt.reference;
  const originator = [ref.originator, ref.year].filter(Boolean).join(" · ");
  const code = rt.code;
  const live = tool.status === "PUBLISHED";
  const hasThread = rt.buildsOn.length > 0 || rt.feeds.length > 0;

  return (
    <div className="bg-eccellere-cream">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 md:px-6">
        <Link href={backHref} className="no-print text-xs text-ink-mid hover:text-eccellere-gold-deep">&larr; {backLabel}</Link>

        <section className={`${CARD} mt-4`} aria-labelledby="tool-title">
          {mode === "library" && (
            <p className="no-print mb-4 inline-block bg-eccellere-cream px-3 py-1 text-xs text-ink-mid">
              {live ? "Live for clients" : "Consulting library only: clients cannot see this yet"}
            </p>
          )}
          <h1 id="tool-title" className="mb-3 font-display text-3xl font-light leading-tight text-eccellere-ink md:text-5xl">{tool.name}</h1>
          <div className="flex flex-wrap gap-2">
            {code?.layer && <Chip>{code.layer}</Chip>}
            {mode === "library" && tool.practice && <Chip>{tool.practice}</Chip>}
            <Chip>{tool.category}</Chip>
            {tool.groupName && <Chip>{tool.groupName}</Chip>}
            {rt.stage && <Chip>{rt.stage}</Chip>}
            {code?.nature && <Chip>{code.nature}</Chip>}
            {code?.layer && code.phaseStart != null && <Chip>Stages {code.phaseStart} to {code.phaseEnd}</Chip>}
          </div>
        </section>

        <section id="stage-1" className={`${CARD} scroll-mt-24`} aria-label="Reference model">
          <p className={`${LABEL} mb-4`}>Reference model</p>
          {rt.diagramSvg
            ? <EnlargeDiagram svg={rt.diagramSvg} caption={ref.caption} />
            : <p className="border border-eccellere-border p-6 text-sm text-ink-light">This method has no standard diagram. The worksheet below is the whole tool.</p>}

          <div className="mt-8 grid gap-8 border-t border-eccellere-border pt-8 md:grid-cols-2">
            <div>
              <h2 className="m-0 font-display text-2xl font-light text-eccellere-ink">About this model</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-mid">{ref.summary}</p>
              <p className="mt-3 text-xs font-medium text-eccellere-ink">{originator || <span className="font-normal text-ink-light">Originator not stated.</span>}</p>
            </div>
            {ref.howToRead.length > 0 && (
              <div>
                <h3 className={`${LABEL} m-0`}>How to read it</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-mid">{ref.howToRead.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </div>
            )}
          </div>
        </section>

        <section className={`${CARD} grid gap-x-10 gap-y-6 md:grid-cols-2`} aria-label="What it does, when to use it, what happens next">
          {[
            { n: 1, h: "What this does", t: tool.does, extra: "" },
            { n: 2, h: "When to use it", t: tool.whenToUse, extra: tool.whenNotToUse ? `Not when: ${tool.whenNotToUse}` : "" },
            ...(rt.next ? [{ n: 3, h: "What happens next", t: rt.next, extra: "" }] : []),
          ].map((b) => (
            <div key={b.n} className="flex gap-4">
              <span className="font-display text-lg text-eccellere-gold" aria-hidden="true">{b.n}</span>
              <div>
                <h3 className={`${LABEL} m-0`}>{b.h}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-mid">{b.t}</p>
                {b.extra && <p className="mt-1.5 text-sm leading-relaxed text-ink-light">{b.extra}</p>}
              </div>
            </div>
          ))}
        </section>

        {hasThread && (
          <section className={CARD} aria-label="Golden thread">
            <p className={`${LABEL} mb-4`}>Golden thread</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:border-r md:border-eccellere-border md:pr-6">
                <p className="text-xs text-ink-light">Builds on &larr;</p>
                <ul className="mt-2 space-y-2">{rt.buildsOn.map((n) => <li key={n} className="text-sm font-semibold text-eccellere-teal">{n}</li>)}</ul>
                {rt.buildsOn.length === 0 && <p className="mt-2 text-sm text-ink-light">A starting point: it needs no earlier tool.</p>}
              </div>
              <div>
                <p className="text-xs text-ink-light">Feeds into &rarr;</p>
                <ul className="mt-2 space-y-2">{rt.feeds.map((n) => <li key={n} className="text-sm font-semibold text-eccellere-gold-deep">{n}</li>)}</ul>
                {rt.feeds.length === 0 && <p className="mt-2 text-sm text-ink-light">An end point: its result is the output.</p>}
              </div>
            </div>
            {code?.layer && (
              <p className="mt-4 border-t border-eccellere-border pt-3 text-xs text-ink-light">
                Framework library: {layerName(code.layer)} (layer {code.layer}), lifecycle stages {code.phaseStart} to {code.phaseEnd}.
              </p>
            )}
          </section>
        )}

        {signedIn ? (
          <Workspace
            slug={tool.slug}
            toolName={tool.name}
            toolId={code?.toolId}
            definition={code ? undefined : (tool.definition as never)}
            sample={rt.sample}
          />
        ) : (
          <section className={`${CARD} text-center`}>
            <h2 className="font-display text-2xl font-light text-eccellere-ink">{mode === "library" ? "Sign in with your Eccellere login" : "Use this tool, free"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-mid">
              {mode === "library"
                ? "The consulting library is for the Eccellere team."
                : "Sign in to open the worksheet. Your work saves as you type, the AI can draft the parts you have not filled in, and you finish with an analysis and a 30/60/90-day action plan."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href={signInHref} className={BTN_MAIN}>Sign in</Link>
              {mode === "client" && <Link href="/register" className={BTN_LINE}>Create a free account</Link>}
            </div>
          </section>
        )}

        <p className="no-print mt-8 text-xs text-ink-light">
          {tool.source === "ai" ? "Drafted with AI" : tool.source === "strategy-hub" ? "Hand-built by Eccellere" : "Written"} and reviewed by Eccellere{tool.reviewedAt ? ` on ${tool.reviewedAt.toLocaleDateString("en-GB")}` : ""}. Guidance, not advice: apply your own judgement.
        </p>
      </div>
    </div>
  );
}
