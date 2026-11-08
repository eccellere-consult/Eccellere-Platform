"use client";

import { useState } from "react";
import { interpret, sampleOf, type DeclarativeTool } from "@/lib/strategyModels/declarative";

/**
 * The standard kit on the agent page: the sample workbook (a fictional company, filled) and the blank template (with a "How to fill" sheet).
 * Built in the browser with the same builder the tool uses, so a filled template uploads into the tool without changes. Works before the tool is open.
 */
export default function KitPanel({ tool, slug, live }: { tool: DeclarativeTool; slug: string; live: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);

  async function download(withSample: boolean) {
    setMsg(null);
    try {
      const wbk = await import("@/lib/tools/workbook");
      const bytes = wbk.workbookBytes(wbk.buildWorkbook(tool.name, interpret(tool), withSample ? sampleOf(tool) : null));
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${slug}-${withSample ? "sample" : "template"}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("Your browser could not make the workbook. Please try again.");
    }
  }

  const btn = "border border-eccellere-ink px-4 py-2 text-sm font-medium text-eccellere-ink hover:bg-eccellere-ink hover:text-eccellere-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-eccellere-gold";
  return (
    <div className="mt-6 border border-eccellere-ink bg-eccellere-ink p-5 text-eccellere-cream">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">Excel kit</p>
      <p className="mt-1 max-w-2xl text-sm text-white/70">
        The sample is a fictional company, never saved as your data. The blank template has a &ldquo;How to fill&rdquo; sheet. Fill it, then upload it in the tool.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={() => void download(true)} className="bg-eccellere-gold px-4 py-2 text-sm font-medium text-eccellere-ink hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light">Download sample workbook</button>
        <button onClick={() => void download(false)} className={`${btn} border-eccellere-gold bg-transparent text-eccellere-cream hover:bg-eccellere-gold hover:text-eccellere-ink`}>Download blank template</button>
        {live
          ? <a href={`/tools/${slug}`} className="text-sm text-gold-light underline underline-offset-2">Open the tool to upload and print →</a>
          : <span className="text-xs text-white/60">Upload and the printable report open with the tool once it is approved.</span>}
      </div>
      {msg && <p className="mt-3 text-sm text-red-300" role="status">{msg}</p>}
    </div>
  );
}
