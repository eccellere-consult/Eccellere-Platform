"use client";

import { useState } from "react";
import type { Demo } from "@/lib/agents/demo";

/**
 * The one-click demo: the whole agent on a fictional company. Everything is worked out on the server from the tool's own sample and
 * formulas; pressing the button only reveals it. Nothing is saved, no account is needed and no AI is called.
 */
export default function DemoPanel({ demo, name }: { demo: Demo; name: string }) {
  const [open, setOpen] = useState(false);
  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gold-deep align-top";
  const td = "px-3 py-2 align-top text-sm text-ink-mid";

  return (
    <div className="border border-eccellere-ink bg-eccellere-ink text-eccellere-cream">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-eccellere-gold/40 px-5 py-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">Demo · sample, not real</p>
          <p className="mt-1 text-sm text-white/70">{demo.scenario}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="bg-eccellere-gold px-5 py-2 text-sm font-medium text-eccellere-ink hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
        >
          {open ? "Hide the demo" : `Run the ${name} demo`}
        </button>
      </div>

      {open && (
        <div className="bg-eccellere-cream p-5 text-eccellere-ink">
          <p className="border border-eccellere-gold/50 bg-white px-3 py-2 text-xs text-ink-mid" role="status">
            This is a fictional company. Nothing here is saved, and no AI was used: every figure below comes from the agent&apos;s own formulas.
          </p>

          <h3 className="mt-6 text-sm font-semibold">1. Sample inputs</h3>
          <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
            {demo.fields.map((f) => (
              <div key={f.label} className="border-b border-eccellere-ink/10 pb-1">
                <dt className="text-xs text-ink-mid">{f.label}</dt>
                <dd>{f.value}{f.unit ? <span className="text-ink-mid"> {f.unit}</span> : null}</dd>
              </div>
            ))}
          </dl>

          {demo.tables.map((t) => (
            <div key={t.title} className="mt-5 overflow-x-auto border border-eccellere-ink/10 bg-white">
              <p className="px-3 pt-3 text-sm font-medium">{t.title}</p>
              <table className="mt-2 w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-eccellere-ink/10">
                    {t.columns.map((c) => (
                      <th key={c.header} className={th}>{c.header}{c.computed ? <span className="ml-1 normal-case tracking-normal text-ink-mid">(worked out)</span> : null}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-eccellere-ink/5">
                  {t.rows.map((r, i) => (
                    <tr key={i}>{r.map((cell, j) => <td key={j} className={td}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <h3 className="mt-6 text-sm font-semibold">2. Headline results</h3>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {demo.results.map((r) => (
              <li key={r.label} className="border border-eccellere-gold/50 bg-white px-4 py-3">
                <p className="text-xs text-ink-mid">{r.label}</p>
                <p className="mt-1 font-display text-2xl text-eccellere-ink">{r.value}</p>
              </li>
            ))}
          </ul>

          {demo.working.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">3. Working figures</h3>
              <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                {demo.working.map((w) => (
                  <div key={w.label} className="border-b border-eccellere-ink/10 pb-1">
                    <dt className="text-xs text-ink-mid">{w.label}</dt>
                    <dd>{w.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      )}
    </div>
  );
}
