"use client";

import { useEffect, useState } from "react";

/** The reference diagram in its frame, with an "Enlarge" button that opens it full width over the page (Escape or a click closes it). */
export default function EnlargeDiagram({ svg, caption }: { svg: string; caption?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="border border-eccellere-border bg-white p-2 md:p-4" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="no-print mt-3 flex items-start gap-4">
        {caption && <p className="flex-1 text-xs italic text-ink-light">{caption}</p>}
        <button type="button" onClick={() => setOpen(true)} className="ml-auto shrink-0 border border-eccellere-border bg-white px-3 py-1.5 text-xs font-medium text-eccellere-gold-deep hover:bg-eccellere-cream">Enlarge &#x2922;</button>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Diagram, enlarged" className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-full w-full max-w-[1100px] overflow-auto bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
            <button type="button" autoFocus onClick={() => setOpen(false)} className="mt-3 border border-eccellere-gold-deep px-4 py-2 text-xs font-medium text-eccellere-gold-deep hover:bg-eccellere-cream">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
