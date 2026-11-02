/**
 * The Excel template for a tool: a blank workbook that mirrors the on-screen form, a sample workbook with the fictional worked example filled
 * in, and a reader that takes a filled workbook back into answers. No AI is involved: the reader matches the template's own questions and
 * column headings exactly, and says what it could not use.
 *
 * Layout: sheet "How to fill"; sheet "Fields" (Section, Question, Guidance, Your answer); and one sheet per table ("Table 1", "Table 2", …)
 * with the table's title and guidance on top and one column per typed column (worked-out columns are left out).
 */
import * as XLSX from 'xlsx-js-style';
import type { ModelDefinition, ModelValues, Row, TablePart } from '@/lib/strategyModels/types';
import { labelColumnKey } from '@/lib/strategyModels/values';

export interface SampleValues { values: Record<string, string>; tables: Record<string, Row[]> }

const HEAD = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '7F611A' } }, alignment: { wrapText: true, vertical: 'top' } };
const WRAP = { alignment: { wrapText: true, vertical: 'top' } };
const GUIDE = { font: { italic: true, color: { rgb: '7A7870' } }, alignment: { wrapText: true, vertical: 'top' } };
const ANSWER = { fill: { fgColor: { rgb: 'FAF8F4' } }, alignment: { wrapText: true, vertical: 'top' } };

const tablesOf = (def: ModelDefinition): TablePart[] => def.sections.flatMap((s) => s.parts.filter((p): p is TablePart => p.kind === 'table'));
const typed = (t: TablePart) => t.columns.filter((c) => c.type !== 'computed');
const tableSheet = (n: number) => `Table ${n + 1}`;
const cell = (v: string, s: object = WRAP) => ({ t: 's' as const, v, s });

function guide(c: { type: string; options?: readonly string[]; scale?: { min: number; max: number; low: string; high: string }; help: string }): string {
  if (c.type === 'rating' && c.scale) return `${c.help} Enter a number from ${c.scale.min} (${c.scale.low}) to ${c.scale.max} (${c.scale.high}).`;
  if (c.type === 'select' && c.options?.length) return `${c.help} Choose one: ${c.options.join(', ')}.`;
  if (c.type === 'number') return `${c.help} Enter a number.`;
  return c.help;
}

export function buildWorkbook(toolName: string, def: ModelDefinition, sample?: SampleValues | null): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const howTo: string[][] = [
    [toolName],
    [sample ? 'Sample workbook: the answers are a fictional company, shown to illustrate what good looks like. Do not upload it as your own work.' : 'Blank template: it mirrors the form on the page.'],
    [''],
    ['How to fill'],
    ['1. On the "Fields" sheet, type your answer in the "Your answer" column. Do not change the Question column: it is how the answers are matched.'],
    ['2. Where a table is needed, use the sheet "Table 1", "Table 2" and so on. One row per item. Do not change the headings in row 3.'],
    ['3. Leave anything you do not know blank. It is treated as not known, never as zero.'],
    ['4. Save the file and upload it on the tool page with "Upload a filled template".'],
  ];
  const ws0 = XLSX.utils.aoa_to_sheet(howTo);
  ws0['!cols'] = [{ wch: 110 }];
  ws0.A1.s = { font: { bold: true, sz: 14 } };
  XLSX.utils.book_append_sheet(wb, ws0, 'How to fill');

  const rows: object[][] = [[cell('Section', HEAD), cell('Question', HEAD), cell('Guidance', HEAD), cell('Your answer', HEAD)]];
  for (const s of def.sections) {
    for (const p of s.parts) {
      if (p.kind !== 'field') continue;
      rows.push([cell(s.title), cell(p.label), cell(guide(p), GUIDE), cell(sample?.values[p.key] ?? '', ANSWER)]);
    }
  }
  const ws1 = XLSX.utils.aoa_to_sheet(rows as never);
  ws1['!cols'] = [{ wch: 24 }, { wch: 42 }, { wch: 60 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Fields');

  tablesOf(def).forEach((t, n) => {
    const cols = typed(t);
    const data: object[][] = [[cell(t.label, { font: { bold: true, sz: 12 } })], [cell(t.help, GUIDE)], cols.map((c) => cell(c.header, HEAD))];
    data.splice(3, 0, cols.map((c) => cell(guide(c), GUIDE)));
    const given = sample?.tables[t.key] ?? [];
    const count = t.fixedRows ? t.fixedRows.length : Math.max(t.minRows, given.length);
    const nameKey = labelColumnKey(t);
    for (let i = 0; i < count; i++) {
      const r = given[i] ?? (t.fixedRows ? { [nameKey]: t.fixedRows[i] } : {});
      data.push(cols.map((c) => cell(r[c.key] ?? (t.fixedRows && c.key === nameKey ? t.fixedRows[i] : ''), ANSWER)));
    }
    const ws = XLSX.utils.aoa_to_sheet(data as never);
    ws['!cols'] = cols.map((c) => ({ wch: c.type === 'longtext' ? 50 : c.type === 'rating' || c.type === 'number' ? 14 : 28 }));
    XLSX.utils.book_append_sheet(wb, ws, tableSheet(n));
  });
  return wb;
}

export function workbookBytes(wb: XLSX.WorkBook): Uint8Array {
  return new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);
}

export interface WorkbookRead { values: ModelValues; answered: number; notes: string[] }

const txt = (v: unknown) => (v === undefined || v === null ? '' : String(v)).trim();
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Takes a filled template back into answers. Only what matches the template exactly is used; the rest is listed in `notes`. */
export function readWorkbook(def: ModelDefinition, data: ArrayBuffer | Uint8Array): WorkbookRead {
  const wb = XLSX.read(data, { type: 'array' });
  const notes: string[] = [];
  const values: ModelValues = { fields: {}, tables: {} };
  let answered = 0;
  const grid = (name: string): string[][] => {
    const ws = wb.Sheets[name];
    return ws ? (XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as unknown[][]).map((r) => r.map(txt)) : [];
  };
  const check = (kind: string, value: string, label: string, c: { type: string; options?: readonly string[]; scale?: { min: number; max: number } }): string | null => {
    if (!value) return null;
    if (c.type === 'rating' && c.scale) {
      const n = Number(value);
      if (Number.isInteger(n) && n >= c.scale.min && n <= c.scale.max) return String(n);
      notes.push(`${kind} "${label}": "${value}" is not a whole number from ${c.scale.min} to ${c.scale.max}, so it was left out.`);
      return null;
    }
    if (c.type === 'select') {
      const hit = (c.options ?? []).find((o) => norm(o) === norm(value));
      if (hit) return hit;
      notes.push(`${kind} "${label}": "${value}" is not one of the choices, so it was left out.`);
      return null;
    }
    return value;
  };

  const fields = new Map(def.sections.flatMap((s) => s.parts).filter((p) => p.kind === 'field').map((p) => [norm(p.label), p] as const));
  const seen = new Set<string>();
  for (const r of grid('Fields').slice(1)) {
    const key = norm(r[1] ?? '');
    const p = fields.get(key);
    if (!p || p.kind !== 'field') { if (key && txt(r[3])) notes.push(`The question "${r[1]}" is not in this tool, so its answer was left out.`); continue; }
    const v = check('Field', txt(r[3]), p.label, p);
    if (v) { values.fields[p.key] = v; answered++; seen.add(p.key); }
  }
  if (!wb.Sheets['Fields']) notes.push('There is no "Fields" sheet. Is this the template for this tool?');

  tablesOf(def).forEach((t, n) => {
    const g = grid(tableSheet(n));
    if (!g.length) return;
    const cols = typed(t);
    const header = (g[2] ?? []).map(norm);
    const at = cols.map((c) => header.indexOf(norm(c.header)));
    if (at.some((i) => i < 0)) { notes.push(`${tableSheet(n)} ("${t.label}") has changed headings, so it was not read.`); return; }
    const out: Row[] = [];
    for (const r of g.slice(4)) {
      const row: Row = {};
      cols.forEach((c, i) => { const v = check('Table', txt(r[at[i]]), `${t.label} / ${c.header}`, c); if (v) row[c.key] = v; });
      const nameKey = labelColumnKey(t);
      const meaningful = Object.entries(row).some(([k, v]) => v && !(t.fixedRows && k === nameKey));
      if (meaningful) out.push(row);
    }
    if (out.length) { values.tables[t.key] = out.slice(0, t.maxRows); answered++; }
  });
  if (!answered) notes.push('Nothing was found to read. Fill in the "Your answer" column or the table sheets and try again.');
  return { values, answered, notes };
}
