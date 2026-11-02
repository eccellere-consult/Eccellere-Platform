import Link from "next/link";
import type { ToolRecord } from "@/lib/tools/repo";
import { toRuntime } from "@/lib/tools/runtime";
import Workspace from "./[slug]/Workspace";

export const PRINT_CSS = "@media print{header,footer,nav,.no-print{display:none!important}main{padding-top:0!important}body{background:#fff!important}}";

const LAYER_NAMES: Record<string, string> = {
  L1: "Strategy and environment", L2: "Business model", L3: "Financial", L4: "Digital and AI", L5: "Organisation",
  L6: "Governance and KPIs", L7: "Go-to-market", L8: "People", L9: "Execution",
};
export const layerName = (l?: string) => (l ? LAYER_NAMES[l] ?? l : "");

/**
 * One tool's page, used for clients (/tools/<slug>) and for the Eccellere team (/consulting/library/<slug>): the route (what it is for and when
 * not to use it), the method and its diagram, and then the worksheet for a signed-in person. Server component.
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
  const originator = [ref.originator, ref.year].filter(Boolean).join(", ");
  const code = rt.code;
  const live = tool.status === "PUBLISHED";

  return (
    <>
      <section className="bg-eccellere-ink">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <Link href={backHref} className="no-print text-xs text-white/60 hover:text-eccellere-gold">&larr; {backLabel}</Link>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            {mode === "library" ? `${tool.practice ?? "Consulting library"} · ` : ""}{tool.category}{tool.groupName ? ` · ${tool.groupName}` : ""}
          </p>
          <h1 className="mt-2 font-display text-[clamp(30px,5vw,52px)] font-light leading-[1.1] text-eccellere-cream">{tool.name}</h1>
          <p className="mt-4 max-w-3xl text-base font-light text-white/70">{tool.does}</p>
          {mode === "library" && (
            <p className="no-print mt-4 inline-block rounded-sm bg-white/10 px-3 py-1 text-xs text-white/80">
              {live ? "Live for clients" : "Consulting library only: clients cannot see this yet"}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded bg-white p-5 shadow-sm" aria-labelledby="route">
            <h2 id="route" className="font-display text-xl font-medium text-eccellere-ink">When to use it</h2>
            <p className="mt-2 text-sm text-ink-mid">{tool.whenToUse}</p>
            {tool.whenNotToUse && (<><h3 className="mt-4 text-sm font-medium text-eccellere-ink">When not to use it</h3><p className="mt-1 text-sm text-ink-mid">{tool.whenNotToUse}</p></>)}
            <h3 className="mt-4 text-sm font-medium text-eccellere-ink">About the method</h3>
            <p className="mt-1 text-sm text-ink-mid">{ref.summary}</p>
            <p className="mt-2 text-xs text-ink-light">{originator ? `Source: ${originator}.` : "Originator not stated."}</p>
            {ref.howToRead.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-medium text-eccellere-ink">How to read the diagram</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-mid">{ref.howToRead.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </>
            )}
            {rt.next && (<><h3 className="mt-4 text-sm font-medium text-eccellere-ink">What comes next</h3><p className="mt-1 text-sm text-ink-mid">{rt.next}</p></>)}
            {code?.layer && (
              <p className="mt-4 text-xs text-ink-light">
                Framework library: {layerName(code.layer)} (layer {code.layer}), lifecycle stages {code.phaseStart} to {code.phaseEnd}.
                {code.upstream?.length ? ` Builds on: ${code.upstream.join(", ")}.` : ""}{code.downstream?.length ? ` Feeds: ${code.downstream.join(", ")}.` : ""}
              </p>
            )}
          </section>
          <section className="rounded bg-white p-4 shadow-sm" aria-label="Diagram of the method">
            {rt.diagramSvg ? <div dangerouslySetInnerHTML={{ __html: rt.diagramSvg }} /> : <p className="p-4 text-sm text-ink-light">This method has no standard diagram. The worksheet below is the whole tool.</p>}
            {ref.caption && <p className="mt-2 text-xs text-ink-light">{ref.caption}</p>}
          </section>
        </div>

        {signedIn ? (
          <Workspace
            slug={tool.slug}
            toolName={tool.name}
            toolId={code?.toolId}
            definition={code ? undefined : (tool.definition as never)}
            sample={rt.sample}
          />
        ) : (
          <section className="mt-8 rounded border border-eccellere-gold/40 bg-white p-6 text-center shadow-sm">
            <h2 className="font-display text-2xl font-medium text-eccellere-ink">{mode === "library" ? "Sign in with your Eccellere login" : "Use this tool, free"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-mid">
              {mode === "library"
                ? "The consulting library is for the Eccellere team."
                : "Sign in to open the worksheet. Your work saves as you type, the AI can draft the parts you have not filled in, and you finish with an analysis and a 30/60/90-day action plan."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href={signInHref} className="bg-eccellere-ink px-5 py-2.5 text-sm text-white hover:opacity-90">Sign in</Link>
              {mode === "client" && <Link href="/register" className="border border-eccellere-ink/30 px-5 py-2.5 text-sm text-eccellere-ink hover:bg-eccellere-cream">Create a free account</Link>}
            </div>
          </section>
        )}

        <p className="no-print mt-8 text-xs text-ink-light">
          {tool.source === "ai" ? "Drafted with AI" : tool.source === "strategy-hub" ? "Hand-built by Eccellere" : "Written"} and reviewed by Eccellere{tool.reviewedAt ? ` on ${tool.reviewedAt.toLocaleDateString("en-GB")}` : ""}. Guidance, not advice: apply your own judgement.
        </p>
      </div>
    </>
  );
}
