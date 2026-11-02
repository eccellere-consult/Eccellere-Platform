/**
 * Turning an uploaded file into the `Name | Group` text the list box understands. Runs in the browser; the pure parts are tested.
 * Supported: .txt .md .csv .tsv .xlsx .xls (first sheet). Column A is the tool name, column B (optional) the group or category.
 */
export const LIST_FILE_TYPES = '.txt,.md,.csv,.tsv,.xlsx,.xls';
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Splits one CSV/TSV line, honouring double quotes. */
export function splitDelimited(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const HEADER = /^(tool|tools|tool name|name|title)$/i;

/** Rows of cells to list text. A header row is dropped; empty rows are skipped; a second column becomes the group. */
export function rowsToText(rows: string[][]): string {
  const lines: string[] = [];
  rows.forEach((cells, i) => {
    const name = (cells[0] ?? '').trim();
    if (!name) return;
    if (i === 0 && HEADER.test(name)) return;
    const second = (cells[1] ?? '').trim();
    lines.push(second ? `${name} | ${second}` : name);
  });
  return lines.join('\n');
}

export function delimitedToText(text: string, delim: ',' | '\t'): string {
  return rowsToText(text.split(/\r?\n/).filter((l) => l.trim()).map((l) => splitDelimited(l, delim)));
}

/** Reads a chosen file into list text. Throws a plain-words Error for an unsupported or oversized file. */
export async function fileToListText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is larger than 2 MB. Use a smaller list.');
  const name = file.name.toLowerCase();
  if (/\.(xlsx|xls)$/.test(name)) {
    const { loadXlsx } = await import('@/lib/spendAnalysis/xlsxLoader');
    const X = await loadXlsx();
    const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error('That workbook has no sheets.');
    const rows = X.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false }) as unknown[][];
    return rowsToText(rows.map((r) => r.map((c) => (c == null ? '' : String(c)))));
  }
  const text = await file.text();
  if (name.endsWith('.csv')) return delimitedToText(text, ',');
  if (name.endsWith('.tsv')) return delimitedToText(text, '\t');
  if (/\.(txt|md)$/.test(name)) return text;
  throw new Error('That file type is not supported. Use .txt, .md, .csv, .tsv or .xlsx.');
}
