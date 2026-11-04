/**
 * Reading an uploaded form or document into a numbered list of SOURCE ELEMENTS, each with where it came from.
 *
 * Why this exists: the older upload only produced plain text for the AI to read. A form has structure (sections, questions, answer
 * options, tables, formulas, hidden rows) and the Form Builder must be able to show, afterwards, that nothing from the source was
 * silently dropped. So the reading is done here, deterministically, before any AI is involved. The AI later maps these elements into
 * a form; `reconcile.ts` then checks every element is accounted for.
 *
 * Safety: nothing in a file is executed. Excel formulas are read as text. The text of a file is data for the AI, never instructions.
 * Server code only.
 */
import { docKindOf, extractDocumentText, legacyOfficeHint, ExtractError, MAX_UPLOAD_BYTES, type DocKind } from '@/lib/tools/extract';
import { IMAGE_NAME, MAX_IMAGE_BYTES, sniffImage, type ImageReader } from './image';
import { loadXlsx } from '@/lib/spendAnalysis/xlsxLoader';

export type ElementKind = 'heading' | 'question' | 'option' | 'instruction' | 'tablehead' | 'row' | 'formula' | 'note';

export interface SourceElement {
  /** E1, E2, ... unique across every file in one build */
  id: string;
  /** which uploaded file (its name), so a two-file instrument stays traceable */
  file: string;
  kind: ElementKind;
  text: string;
  /** a human-readable location: Sheet "Survey" cell B4, Page 2 line 7, Table 1 row 3 ... */
  where: string;
}

export interface SourceReading {
  fileName: string;
  kind: DocKind;
  elements: SourceElement[];
  /** things a person should know before trusting the reading (hidden content, formulas, merged cells, cut-off) */
  warnings: string[];
  /** true when the file had more than the limit and the rest was not listed */
  truncated: boolean;
}

export const MAX_ELEMENTS = 700;
export const MAX_ELEMENT_CHARS = 400;
const MAX_ROWS_PER_SHEET = 600;

const GLYPH = /^\s*(?:[☐☑☒□■○◯●◻]|\[\s?[xX ]?\s?\]|\(\s?\))\s*/;
const BULLET = /^\s*(?:[-–•*·]|[a-hA-H][.)]|\(?[a-h]\))\s+/;
const NUMBERED = /^\s*(?:q(?:uestion)?\.?\s*)?\d{1,3}[.):]\s+\S/i;
const SECTIONISH = /^\s*(?:section|part|module|step|stage|dimension|chapter)\s+[\w.]+\s*[:.\-–—]?/i;
const INSTRUCTIONISH = /^\s*(?:note|notes|instructions?|guidance|how to (?:complete|use)|please|tick|select|rate|scale|key|legend|tip)\b/i;
const SCALE = /^\s*\d(?:\s*[-–=,/]\s*\d|\s+\d)+\s*$|^\s*\d\s*=\s*\S+/;

const clean = (s: string) => s.replace(/\u0000/g, '').replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s: string) => (s.length > MAX_ELEMENT_CHARS ? `${s.slice(0, MAX_ELEMENT_CHARS - 1)}…` : s);

/**
 * A best guess at what one line is. It is a hint for the AI and a way to count, not a final decision: the AI maps meaning, and a person
 * reviews the result. Pure function, tested directly.
 */
export function classifyLine(raw: string, afterQuestion = false): { kind: ElementKind; text: string; level?: number } | null {
  const line = clean(raw);
  if (!line) return null;
  const md = /^(#{1,6})\s+(.*)$/.exec(raw.trim());
  if (md) return { kind: 'heading', text: clean(md[2]), level: md[1].length };
  if (GLYPH.test(raw)) return { kind: 'option', text: clean(raw.replace(GLYPH, '')) };
  if (SCALE.test(line)) return { kind: 'instruction', text: line };
  if (SECTIONISH.test(line) && line.length <= 100 && !line.endsWith('?')) return { kind: 'heading', text: line };
  if (INSTRUCTIONISH.test(line)) return { kind: 'instruction', text: line };
  if (line.endsWith('?')) return { kind: 'question', text: line };
  if (NUMBERED.test(raw)) {
    const body = line.replace(/^(?:q(?:uestion)?\.?\s*)?\d{1,3}[.):]\s+/i, '');
    // "1. Yes" right after a question is an answer option; "1. Describe your supplier base" is a question.
    return afterQuestion && body.length <= 30 && !/[?:]$/.test(body) ? { kind: 'option', text: body } : { kind: 'question', text: body };
  }
  if (BULLET.test(raw)) return afterQuestion ? { kind: 'option', text: clean(raw.replace(BULLET, '')) } : { kind: 'note', text: clean(raw.replace(BULLET, '')) };
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 4 && line.length <= 80 && letters === letters.toUpperCase() && !/[.?]$/.test(line)) return { kind: 'heading', text: line };
  if (line.endsWith(':') && line.length <= 90) return { kind: 'question', text: line.replace(/:$/, '') };
  if (line.length > 200) return { kind: 'note', text: line };
  if (line.length <= 70 && !/[.;]$/.test(line)) return { kind: afterQuestion ? 'option' : 'question', text: line };
  return { kind: 'note', text: line };
}

class Collector {
  readonly elements: SourceElement[] = [];
  readonly warnings: string[] = [];
  truncated = false;
  private counter: number;
  constructor(private file: string, startAt: number) { this.counter = startAt; }
  get next() { return this.counter; }
  add(kind: ElementKind, text: string, where: string): boolean {
    const t = clip(clean(text));
    if (!t) return true;
    if (this.elements.length >= MAX_ELEMENTS) { this.truncated = true; return false; }
    this.counter += 1;
    this.elements.push({ id: `E${this.counter}`, file: this.file, kind, text: t, where });
    return true;
  }
  warn(w: string) { if (!this.warnings.includes(w)) this.warnings.push(w); }
}

/** Lines of text (a text file, a PDF, a slide deck, Markdown) as elements, with page and line positions where the text has them. */
function fromLines(c: Collector, text: string): void {
  const pages = text.split('\f');
  let afterQuestion = false;
  let lineNo = 0;
  pages.forEach((page, p) => {
    for (const raw of page.split(/\r?\n/)) {
      lineNo += 1;
      const hit = classifyLine(raw, afterQuestion);
      if (!hit) continue;
      const where = pages.length > 1 ? `Page ${p + 1}, line ${lineNo}` : `Line ${lineNo}`;
      if (!c.add(hit.kind, hit.text, where)) return;
      afterQuestion = hit.kind === 'question' || (afterQuestion && hit.kind === 'option');
    }
  });
}

/** Comma- or tab-separated text as one table: the first row is the header. */
function fromDelimited(c: Collector, text: string, sep: string): void {
  const rows = text.split(/\r?\n/).filter((l) => l.trim());
  rows.forEach((line, i) => {
    const cells: string[] = [];
    let cur = '';
    let quoted = false;
    for (let k = 0; k < line.length; k++) {
      const ch = line[k];
      if (ch === '"') { if (quoted && line[k + 1] === '"') { cur += '"'; k++; } else quoted = !quoted; }
      else if (ch === sep && !quoted) { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    c.add(i === 0 ? 'tablehead' : 'row', cells.map((x) => clean(x)).join(' | '), `Row ${i + 1}`);
  });
}

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const stripTags = (s: string) => decode(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '));

/** A Word document: headings, paragraphs, list items and tables, in order. */
async function fromDocx(c: Collector, buffer: Buffer): Promise<void> {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const blocks = html.match(/<(h[1-6]|p|li|table)\b[\s\S]*?<\/\1>/g) ?? [];
  let heading = '';
  let para = 0;
  let tables = 0;
  let afterQuestion = false;
  for (const b of blocks) {
    const tag = /^<(\w+)/.exec(b)![1];
    if (tag === 'table') {
      tables += 1;
      const rows = b.match(/<tr\b[\s\S]*?<\/tr>/g) ?? [];
      rows.forEach((r, i) => {
        const cells = (r.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/g) ?? []).map((x) => clean(stripTags(x)));
        if (cells.some(Boolean)) c.add(i === 0 ? 'tablehead' : 'row', cells.join(' | '), `Table ${tables}, row ${i + 1}`);
      });
      if (/colspan|rowspan/i.test(b)) c.warn(`Table ${tables} has merged cells. Only the text in them is kept; check its layout against the original.`);
      afterQuestion = false;
      continue;
    }
    const text = clean(stripTags(b));
    if (!text) continue;
    para += 1;
    const where = `${heading ? `Under “${heading.slice(0, 40)}”, ` : ''}paragraph ${para}`;
    if (/^h[1-6]$/.test(tag)) { heading = text; c.add('heading', text, `Heading ${para}`); afterQuestion = false; continue; }
    const hit = classifyLine(tag === 'li' ? `- ${text}` : text, afterQuestion);
    if (hit) { c.add(hit.kind, hit.text, where); afterQuestion = hit.kind === 'question' || (afterQuestion && hit.kind === 'option'); }
  }
}

/** Drop-down lists in an .xlsx, read from the file itself (the spreadsheet library does not expose them). */
async function dropDowns(buffer: Buffer): Promise<{ sheet: string; cells: string; formula: string }[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const wbXml = await zip.file('xl/workbook.xml')?.async('string');
  const relXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!wbXml || !relXml) return [];
  const targets = new Map<string, string>();
  for (const m of relXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) targets.set(id, target.replace(/^\/?(?:xl\/)?/, 'xl/'));
  }
  const out: { sheet: string; cells: string; formula: string }[] = [];
  for (const s of wbXml.matchAll(/<sheet\b[^>]*>/g)) {
    const name = decode(/\bname="([^"]*)"/.exec(s[0])?.[1] ?? '');
    const rid = /\br:id="([^"]+)"/.exec(s[0])?.[1];
    const path = rid ? targets.get(rid) : undefined;
    const xml = path ? await zip.file(path)?.async('string') : undefined;
    if (!xml) continue;
    for (const v of xml.matchAll(/<dataValidation\b[^>]*type="list"[^>]*>[\s\S]*?<\/dataValidation>/g)) {
      const cells = /\bsqref="([^"]+)"/.exec(v[0])?.[1] ?? '';
      const formula = decode(/<formula1>([\s\S]*?)<\/formula1>/.exec(v[0])?.[1] ?? '');
      if (cells && formula) out.push({ sheet: name, cells, formula });
    }
  }
  return out;
}

/** A workbook: every sheet (hidden ones flagged, not skipped), rows as table header / rows, formulas as text, drop-down lists as options. */
async function fromXlsx(c: Collector, buffer: Buffer): Promise<void> {
  const XLSX = await loadXlsx();
  const wb = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellDates: true });
  const meta = wb.Workbook?.Sheets ?? [];
  const lists = await dropDowns(buffer).catch(() => []);
  let formulas = 0;
  let mergedSheets = 0;
  wb.SheetNames.forEach((name, si) => {
    const ws = wb.Sheets[name];
    if (!ws || !ws['!ref']) return;
    const hiddenLevel = meta[si]?.Hidden ?? 0;
    const sheetTag = `Sheet “${name}”${hiddenLevel ? ' (hidden sheet)' : ''}`;
    if (hiddenLevel) c.warn(`The sheet “${name}” is hidden in the file. It was read and is marked hidden; decide whether it belongs in the form.`);
    if (ws['!merges']?.length) mergedSheets += 1;
    if ((ws['!cols'] ?? []).some((col) => col?.hidden)) c.warn(`The sheet “${name}” has hidden columns. They were read; check they belong.`);
    const range = XLSX.utils.decode_range(ws['!ref']);
    let lastWasRow = false;
    for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + MAX_ROWS_PER_SHEET); r++) {
      const cells: { addr: string; text: string; f?: string }[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r, c: col });
        const cell = ws[addr];
        if (!cell) continue;
        const text = clean(String(cell.w ?? cell.v ?? ''));
        if (text || cell.f) cells.push({ addr, text, f: cell.f ? String(cell.f) : undefined });
      }
      if (!cells.length) { lastWasRow = false; continue; }
      const hiddenRow = !!ws['!rows']?.[r]?.hidden;
      if (hiddenRow) c.warn(`The sheet “${name}” has hidden rows. They were read and are marked hidden.`);
      const where = `${sheetTag}, ${cells.length === 1 ? `cell ${cells[0].addr}` : `row ${r + 1}`}${hiddenRow ? ' (hidden row)' : ''}`;
      const texts = cells.map((x) => x.text).filter(Boolean);
      if (texts.length === 1 && cells.length === 1) {
        const hit = classifyLine(texts[0], false);
        if (hit) c.add(hit.kind === 'option' ? 'note' : hit.kind, hit.text, where);
        lastWasRow = false;
      } else if (texts.length) {
        const textual = texts.every((t) => Number.isNaN(Number(t.replace(/[,%₹$]/g, ''))));
        c.add(!lastWasRow && textual ? 'tablehead' : 'row', texts.join(' | '), where);
        lastWasRow = true;
      }
      for (const x of cells) {
        if (x.f) {
          formulas += 1;
          c.add('formula', `${x.addr} = ${x.f}${x.text ? `  (shows ${x.text})` : ''}`, `${sheetTag}, cell ${x.addr}`);
        }
      }
    }
    if (range.e.r - range.s.r > MAX_ROWS_PER_SHEET) c.warn(`The sheet “${name}” has more than ${MAX_ROWS_PER_SHEET} rows. Only the first ${MAX_ROWS_PER_SHEET} were read.`);
  });
  for (const l of lists) {
    let values = l.formula;
    if (/^".*"$/.test(l.formula)) values = l.formula.slice(1, -1).split(',').map((x) => x.trim()).join(', ');
    else {
      const ref = /^(?:'?([^'!]+)'?!)?\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(l.formula);
      const ws = wb.Sheets[ref?.[1] ?? l.sheet];
      if (ref && ws) {
        const got: string[] = [];
        for (const row of XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, range: `${ref[2]}${ref[3]}:${ref[4]}${ref[5]}`, defval: '' })) for (const v of row) if (String(v).trim()) got.push(String(v).trim());
        if (got.length) values = got.join(', ');
      }
    }
    c.add('option', `Allowed values for ${l.cells}: ${values}`, `Sheet “${l.sheet}”, drop-down list on ${l.cells}`);
  }
  if (formulas) c.warn(`${formulas} formula${formulas === 1 ? '' : 's'} found. They are listed as text and were not run. The form's calculations are rebuilt from the safe rule set, so check each against the original.`);
  if (mergedSheets) c.warn('Merged cells found. Only the text in them is kept; check the layout against the original.');
}

/** Largest one part of an Office file may expand to, and the most all parts together may: a zip bomb is a small file that expands to gigabytes. */
export const MAX_PART_BYTES = 40 * 1024 * 1024;
export const MAX_UNZIPPED_BYTES = 120 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 4000;

/** The size a zip part declares in its own directory, read before anything is decompressed. */
const declaredSize = (f: unknown): number => (f as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;

/** Refuses an Office file (xlsx, docx and pptx are zips) whose parts declare an unreasonable size. Nothing is decompressed to find out. */
export async function assertSafeZip(buffer: Buffer): Promise<void> {
  const JSZip = (await import('jszip')).default;
  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
  try { zip = await JSZip.loadAsync(buffer); } catch { throw new ExtractError('UNREADABLE', 'That file could not be read. It may be damaged or password-protected.'); }
  const parts = Object.values(zip.files);
  const total = parts.reduce((n, f) => n + declaredSize(f), 0);
  if (parts.length > MAX_ZIP_ENTRIES || parts.some((f) => declaredSize(f) > MAX_PART_BYTES) || total > MAX_UNZIPPED_BYTES) {
    throw new ExtractError('UNREADABLE', 'That file looks damaged or unsafe (it expands to an unreasonable size), so it was not read.');
  }
}


/** A screenshot or photo: transcribed by a vision AI, then read like a text file. */
async function readPicture(fileName: string, buffer: Buffer, startAt: number, readImage?: ImageReader): Promise<SourceReading> {
  const type = sniffImage(buffer);
  if (!type) throw new ExtractError('UNSUPPORTED', 'That picture format cannot be read. Use a PNG, JPG, WebP or GIF screenshot (a phone HEIC photo can be saved as JPG first).');
  if (buffer.length > MAX_IMAGE_BYTES) throw new ExtractError('TOO_LARGE', 'That picture is larger than 5 MB. Take a smaller screenshot or crop it to the form.');
  if (!readImage) throw new ExtractError('UNSUPPORTED', 'Reading a picture needs the AI service, and it is not switched on. Check the AI providers setting, or upload the Word, Excel or PDF version.');
  const text = await readImage({ name: fileName, mediaType: type, data: buffer });
  if (text === null) throw new ExtractError('UNREADABLE', 'The AI could not read that picture. It needs an AI provider that can see pictures (Anthropic or OpenAI) with a key set. Try again, or upload the document instead.');
  if (/^NOT_A_FORM(?![A-Za-z_])/.test(text.trim())) throw new ExtractError('UNREADABLE', 'That picture does not look like a form, questionnaire, checklist or table.');
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  const c = new Collector(safeName, startAt);
  fromLines(c, text.slice(0, 40_000));
  if (c.elements.length < 2) throw new ExtractError('UNREADABLE', 'No readable questions or fields were found in that picture. Try a sharper or larger screenshot.');
  c.warn('Read from a picture by AI, not copied from a file. Check every item against the original before relying on it.');
  if (c.elements.some((e) => /\[unreadable\]/i.test(e.text))) c.warn('Some text in the picture was unreadable and is marked [unreadable].');
  if (c.truncated) c.warn(`The picture has more than ${MAX_ELEMENTS} items. Only the first ${MAX_ELEMENTS} are listed.`);
  return { fileName: safeName, kind: 'image' as DocKind, elements: c.elements, warnings: c.warnings, truncated: c.truncated };
}

/** Reads one uploaded file into source elements. Throws ExtractError with a plain-English reason when the file cannot be used. */
export async function readSource(fileName: string, buffer: Buffer, startAt = 0, opts: { readImage?: ImageReader } = {}): Promise<SourceReading> {
  if (IMAGE_NAME.test(fileName)) return readPicture(fileName, buffer, startAt, opts.readImage);
  const legacy = legacyOfficeHint(fileName);
  if (legacy) throw new ExtractError('UNSUPPORTED', legacy);
  const kind = docKindOf(fileName);
  if (!kind) throw new ExtractError('UNSUPPORTED', 'Supported files: Excel (.xlsx), Word (.docx), PDF, PowerPoint (.pptx), CSV, TXT and Markdown.');
  if (buffer.length > MAX_UPLOAD_BYTES) throw new ExtractError('TOO_LARGE', 'That file is larger than 10 MB. Use a smaller file, or split it.');
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  const c = new Collector(safeName, startAt);
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (kind === 'excel' || kind === 'word' || kind === 'powerpoint') await assertSafeZip(buffer);
  try {
    if (kind === 'excel') await fromXlsx(c, buffer);
    else if (kind === 'word') await fromDocx(c, buffer);
    else if (ext === 'csv' || ext === 'tsv') fromDelimited(c, buffer.toString('utf8'), ext === 'tsv' ? '\t' : ',');
    else if (kind === 'text') fromLines(c, buffer.toString('utf8'));
    else {
      const got = await extractDocumentText(fileName, buffer);
      fromLines(c, got.text);
      if (got.truncated) { c.truncated = true; c.warn('The document was longer than the reading limit; only the first part was read.'); }
      if (kind === 'pdf') c.warn('Positions in a PDF are line numbers in the extracted text, not page coordinates. Check tables and tick-boxes against the original.');
    }
  } catch (e) {
    if (e instanceof ExtractError) throw e;
    throw new ExtractError('UNREADABLE', 'That file could not be read. It may be damaged or password-protected.');
  }
  if (c.elements.length < 2) {
    throw new ExtractError('UNREADABLE', kind === 'pdf' ? 'No text could be read from that PDF. A scanned (picture-only) PDF needs OCR, which is not supported yet.' : 'No readable questions or fields were found in that file.');
  }
  if (c.truncated) c.warn(`The file has more than ${MAX_ELEMENTS} items. Only the first ${MAX_ELEMENTS} are listed; build the rest as a second form, or split the file.`);
  return { fileName: safeName, kind, elements: c.elements, warnings: c.warnings, truncated: c.truncated };
}

/** Elements numbered across several files: E ids continue from one file to the next. */
export async function readSources(files: { name: string; data: Buffer }[], opts: { readImage?: ImageReader } = {}): Promise<SourceReading[]> {
  const out: SourceReading[] = [];
  let n = 0;
  for (const f of files) {
    const r = await readSource(f.name, f.data, n, opts);
    n += r.elements.length;
    out.push(r);
  }
  return out;
}

export const SUBSTANTIVE: readonly ElementKind[] = ['question', 'option', 'tablehead', 'row', 'formula', 'instruction'];

/**
 * The elements as text for the AI: one line each with its id and location. Capped so the request stays a sensible size; the ids that did
 * not fit are returned so the coverage check can say they were never sent, rather than pretending they were covered.
 */
export function renderForPrompt(elements: readonly SourceElement[], maxChars = 28_000): { text: string; sent: number; notSent: string[] } {
  const lines: string[] = [];
  let used = 0;
  let i = 0;
  for (; i < elements.length; i++) {
    const e = elements[i];
    const line = `${e.id} [${e.where}] ${e.kind}: ${e.text}`;
    if (used + line.length + 1 > maxChars) break;
    lines.push(line);
    used += line.length + 1;
  }
  return { text: lines.join('\n'), sent: i, notSent: elements.slice(i).map((e) => e.id) };
}

const KINDS: readonly ElementKind[] = ['heading', 'question', 'option', 'instruction', 'tablehead', 'row', 'formula', 'note'];

/**
 * Elements sent back by the browser for the build step. The file itself is not stored between the two steps, so the list comes back
 * from the page; it is checked and trimmed here and is still only data for the AI, never instructions.
 */
export function sanitiseElements(raw: unknown): SourceElement[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SourceElement[] = [];
  for (const r of raw.slice(0, MAX_ELEMENTS)) {
    const o = r as Partial<SourceElement> | null;
    if (!o || typeof o.id !== 'string' || !/^E\d{1,4}$/.test(o.id) || seen.has(o.id)) continue;
    if (typeof o.text !== 'string' || !KINDS.includes(o.kind as ElementKind)) continue;
    const text = clip(clean(o.text));
    if (!text) continue;
    seen.add(o.id);
    out.push({ id: o.id, file: clean(String(o.file ?? 'document')).slice(0, 120) || 'document', kind: o.kind as ElementKind, text, where: clean(String(o.where ?? '')).slice(0, 160) });
  }
  return out;
}

/** Groups checked elements back into one reading per file, with the reading notes the page passed along. */
export function readingsFromElements(elements: readonly SourceElement[], warnings: readonly string[] = []): SourceReading[] {
  const byFile = new Map<string, SourceElement[]>();
  for (const e of elements) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e]);
  const notes = warnings.filter((w): w is string => typeof w === 'string').map((w) => clean(w).slice(0, 300)).slice(0, 30);
  return [...byFile].map(([fileName, els], i) => ({ fileName, kind: 'text' as DocKind, elements: els, warnings: i === 0 ? notes : [], truncated: false }));
}
