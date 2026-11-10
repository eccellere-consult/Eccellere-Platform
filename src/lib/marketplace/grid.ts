/**
 * The marketplace "function x industry" grid: for each service area (row) and sector (column), how many published toolkits fit.
 * Counts come only from the toolkits themselves. A toolkit made for "All Sectors" counts in every sector column (the same rule the
 * Sector filter already uses), and an empty cell stays empty so the gap is visible. Pure, so it is tested without a page or database.
 */
export const ALL_SECTORS = 'All Sectors';

export interface GridAsset { category: string; sectors: string[] }
export interface GridCell { count: number }
export interface Grid {
  rows: string[];
  columns: string[];
  /** cells[row][column] */
  cells: GridCell[][];
  rowTotals: number[];
  /** Toolkits per column (an All Sectors toolkit counts in each). */
  columnTotals: number[];
  total: number;
}

/**
 * Columns: the fixed sectors first (so the grid never rearranges itself), then up to `extra` more sectors that actually appear
 * in the data, most common first.
 */
export function sectorColumns(assets: GridAsset[], fixed: string[], extra = 4): string[] {
  const known = new Set(fixed);
  const counts = new Map<string, number>();
  for (const a of assets) for (const s of a.sectors) if (s && s !== ALL_SECTORS && !known.has(s)) counts.set(s, (counts.get(s) ?? 0) + 1);
  const more = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, extra).map(([s]) => s);
  return [...fixed, ...more];
}

export function buildGrid(assets: GridAsset[], rows: string[], columns: string[]): Grid {
  const cells = rows.map(() => columns.map((): GridCell => ({ count: 0 })));
  const rowIndex = new Map(rows.map((r, i) => [r, i]));
  let total = 0;
  for (const a of assets) {
    const r = rowIndex.get(a.category);
    if (r === undefined) continue;
    total += 1;
    const everywhere = a.sectors.includes(ALL_SECTORS) || a.sectors.length === 0;
    columns.forEach((c, k) => { if (everywhere || a.sectors.includes(c)) cells[r][k].count += 1; });
  }
  return {
    rows,
    columns,
    cells,
    rowTotals: rows.map((_, r) => assets.filter((a) => a.category === rows[r]).length),
    columnTotals: columns.map((_, k) => cells.reduce((s, row) => s + row[k].count, 0)),
    total,
  };
}
