"use client";

import { cn } from "@/lib/utils";
import type { Grid } from "@/lib/marketplace/grid";

/** A grid of service area (rows) against sector (columns). Each number is a count of toolkits; pressing one shows exactly those toolkits below. */
export function MarketGrid({ grid, selectedCategory, selectedSector, onPick }: {
  grid: Grid;
  selectedCategory: string;
  selectedSector: string;
  onPick: (category: string, sector: string) => void;
}) {
  return (
    <section aria-labelledby="grid-title" className="border-b border-eccellere-ink/10 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Find by function and industry</p>
        <h2 id="grid-title" className="mt-2 font-display text-3xl font-light text-eccellere-ink">What do you need, and for which industry?</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-mid">Each number is how many toolkits fit. Press a number to see them. A toolkit made for every industry is counted in every column.</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Number of toolkits by service area and industry</caption>
            <thead>
              <tr>
                <th scope="col" className="w-48 border-b border-eccellere-border px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-ink-light">Function</th>
                {grid.columns.map((c) => (
                  <th key={c} scope="col" className={cn("border-b border-eccellere-border px-3 py-3 text-center text-[11px] font-medium uppercase tracking-[0.12em]", selectedSector === c ? "text-eccellere-gold-deep" : "text-ink-light")}>{c}</th>
                ))}
                <th scope="col" className="border-b border-eccellere-border px-3 py-3 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ink-light">All</th>
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row, r) => (
                <tr key={row}>
                  <th scope="row" className={cn("border-b border-eccellere-border px-3 py-3 text-left font-medium", selectedCategory === row ? "text-eccellere-gold-deep" : "text-eccellere-ink")}>{row}</th>
                  {grid.columns.map((col, k) => {
                    const n = grid.cells[r][k].count;
                    const on = selectedCategory === row && selectedSector === col;
                    return (
                      <td key={col} className="border-b border-eccellere-border p-1 text-center">
                        {n > 0 ? (
                          <button type="button" onClick={() => onPick(row, col)} aria-label={`${n} toolkit${n === 1 ? "" : "s"}: ${row} for ${col}`}
                            className={cn("h-10 w-full min-w-[56px] rounded-sm font-mono text-sm transition-colors", on ? "bg-eccellere-ink text-white" : "bg-eccellere-gold/10 text-eccellere-gold-deep hover:bg-eccellere-gold/25")}>{n}</button>
                        ) : (
                          <span className="block h-10 w-full min-w-[56px] rounded-sm bg-eccellere-cream/60 font-mono text-sm leading-10 text-ink-light" title="No toolkits yet">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-eccellere-border p-1 text-center">
                    {grid.rowTotals[r] > 0
                      ? <button type="button" onClick={() => onPick(row, "All Sectors")} aria-label={`${grid.rowTotals[r]} toolkits: ${row}, all industries`} className="h-10 w-full min-w-[56px] rounded-sm font-mono text-sm text-eccellere-ink underline hover:bg-eccellere-ink/5">{grid.rowTotals[r]}</button>
                      : <span className="block h-10 w-full min-w-[56px] font-mono text-sm leading-10 text-ink-light">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-light">{grid.total} toolkit{grid.total === 1 ? "" : "s"} in total. A dash means none yet.</p>
      </div>
    </section>
  );
}
