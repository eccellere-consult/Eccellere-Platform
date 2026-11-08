import * as XLSX from 'xlsx-js-style';
import type { ModelDefinition, ModelValues, TablePart } from '@/lib/strategyModels/types';
import { cleanTable, computeDerived, computeOutputs, evalColumn, labelColumnKey, toNum, partsOf } from '@/lib/strategyModels/values';

/**
 * The on-screen and downloadable report for an agent run: headline results, working figures, each table with its worked-out columns, and
 * a bar chart for each table that has a worked-out numeric column. Everything comes from the tool's own formulas; nothing is typed in here.
 */
export interface ReportTable { title: string; headers: string[]; rows: string[][] }
export interface ReportBar { label: string; value: number; text: string }
export interface ReportChart { title: string; unit?: string; bars: ReportBar[] }
export interface AgentReport {
  results: { label: string; value: string }[];
  working: { label: string; value: string }[];
  tables: ReportTable[];
  charts: ReportChart[];
  inputs: { label: string; value: string }[];
}

const tablesOf = (def: ModelDefinition): TablePart[] => partsOf(def).filter((p): p is TablePart => p.kind === 'table');
const MAX_CHARTS = 2;

export function reportOf(def: ModelDefinition, values: ModelValues): AgentReport {
  const inputs: AgentReport['inputs'] = [];
  for (const p of partsOf(def)) {
    if (p.kind === 'field') {
      const v = (values.fields[p.key] ?? '').trim();
      if (v) inputs.push({ label: p.label, value: p.unit ? `${v} ${p.unit}` : v });
    }
  }

  const tables: ReportTable[] = [];
  const charts: ReportChart[] = [];
  for (const t of tablesOf(def)) {
    const rows = cleanTable(t, values.tables[t.key]);
    if (!rows.length) continue;
    tables.push({
      title: t.label,
      headers: t.columns.map((c) => (c.unit ? `${c.header} (${c.unit})` : c.header)),
      rows: rows.map((r) => t.columns.map((c) => (c.type === 'computed' ? evalColumn(c, r, values) : String(r[c.key] ?? '')))),
    });
    const col = t.columns.find((c) => c.type === 'computed' && rows.every((r) => toNum(evalColumn(c, r, values)) !== null));
    if (col && charts.length < MAX_CHARTS && rows.length > 1) {
      const nameKey = labelColumnKey(t);
      charts.push({
        title: `${col.header} by ${t.rowLabel.toLowerCase()}`,
        unit: col.unit,
        bars: rows.map((r, i) => { const text = evalColumn(col, r, values); return { label: String(r[nameKey] || `${t.rowLabel} ${i + 1}`), value: toNum(text) ?? 0, text }; }),
      });
    }
  }

  return {
    results: computeOutputs(def, values).map((o) => ({ label: o.label, value: o.value })),
    working: computeDerived(def, values).filter((d) => d.value && d.value.trim()).map((d) => ({ label: d.label, value: String(d.value).trim() })),
    tables, charts, inputs,
  };
}

/** True when there is anything worth showing as a report. */
export const hasReport = (r: AgentReport): boolean => r.results.length > 0 || r.working.length > 0;

const sheetName = (s: string, used: Set<string>): string => {
  const base = s.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Sheet';
  let n = base; let i = 2;
  while (used.has(n.toLowerCase())) n = `${base.slice(0, 25)} ${i++}`;
  used.add(n.toLowerCase());
  return n;
};

/** The results workbook: a Results sheet (headline, then working figures, then the inputs) and one sheet per table with its worked-out columns. */
export function reportWorkbook(agentName: string, report: AgentReport, sample: boolean): XLSX.WorkBook {
  const head = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '7F611A' } }, alignment: { wrapText: true, vertical: 'top' } };
  const wrap = { alignment: { wrapText: true, vertical: 'top' } };
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  const cell = (v: string, s: object = wrap) => ({ t: 's' as const, v, s });

  const rows: ReturnType<typeof cell>[][] = [
    [cell(`${agentName}: results`, { font: { bold: true, sz: 14 } })],
    [cell(sample ? 'Fictional sample company. Not real data.' : 'Worked out from the figures you entered. ECCELLERE+  www.eccellere.co.in', { font: { italic: true, color: { rgb: '7A7870' } } })],
    [],
    [cell('Headline results', head), cell('Value', head)],
    ...report.results.map((r) => [cell(r.label), cell(r.value)]),
  ];
  if (report.working.length) rows.push([], [cell('Working figures', head), cell('Value', head)], ...report.working.map((r) => [cell(r.label), cell(r.value)]));
  if (report.inputs.length) rows.push([], [cell('Your inputs', head), cell('Value', head)], ...report.inputs.map((r) => [cell(r.label), cell(r.value)]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 48 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName('Results', used));

  for (const t of report.tables) {
    const tws = XLSX.utils.aoa_to_sheet([t.headers.map((h) => cell(h, head)), ...t.rows.map((r) => r.map((c) => cell(c)))]);
    tws['!cols'] = t.headers.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, tws, sheetName(t.title, used));
  }
  return wb;
}
