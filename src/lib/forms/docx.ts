/**
 * Reading a Word file AS A DOCUMENT: its paragraphs and tables in order, each with the look it had (bold, colour, size, heading face,
 * alignment, shading, borders, list bullets and numbers, page starts). The result is the plain data of strategyModels/document.ts, which
 * the page draws itself. Nothing in the file is run, and no markup from the file is ever passed on.
 *
 * What is read: the main text. What is not: page headers and footers, pictures, text boxes, footnotes, comments and tracked changes
 * (deleted text is left out). Each of these is reported in `notes` when the file has it. Server code only.
 */
import type { DocBlock, DocCell, DocPara, DocRun, DocTable } from '@/lib/strategyModels/document';

interface Node { name: string; attrs: Record<string, string>; kids: Node[]; text: string }

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
  if (e[0] === '#') { const n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
  return ENT[e] ?? m;
});

/** A small reader for the XML inside a Word file: elements, attributes and text. No entities are expanded beyond the five standard ones. */
export function parseXml(xml: string): Node {
  const root: Node = { name: '#root', attrs: {}, kids: [], text: '' };
  const stack: Node[] = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) { top.text += m[1]; continue; }
    if (m[6] !== undefined) { top.text += decode(m[6]); continue; }
    if (!m[3]) continue;
    if (m[2]) { if (stack.length > 1) stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? '');
    const node: Node = { name: m[3], attrs, kids: [], text: '' };
    top.kids.push(node);
    if (!m[5]) stack.push(node);
  }
  return root;
}

const kid = (n: Node | undefined, name: string): Node | undefined => n?.kids.find((k) => k.name === name);
const kidsOf = (n: Node | undefined, name: string): Node[] => (n ? n.kids.filter((k) => k.name === name) : []);
const val = (n: Node | undefined, name: string, attr = 'w:val'): string | undefined => kid(n, name)?.attrs[attr];
const find = (n: Node, name: string): Node | undefined => { for (const k of n.kids) { if (k.name === name) return k; const d = find(k, name); if (d) return d; } return undefined; };
const HEX = /^[0-9A-Fa-f]{6}$/;
const colour = (v: string | undefined): string | undefined => (v && HEX.test(v) ? v.toUpperCase() : undefined);
/** twentieths of a point → pixels (96 per inch) */
const px = (twips: string | undefined): number | undefined => { const n = Number(twips); return twips !== undefined && Number.isFinite(n) ? Math.round(n / 15) : undefined; };
const SERIF = /cambria|georgia|times|garamond|caladea|serif|merriweather|playfair|lora|baskerville|palatino|bookman|constantia/i;

interface RunLook { b?: boolean; i?: boolean; u?: boolean; c?: string; z?: number; f?: boolean; caps?: boolean }
interface ParaLook { a?: 'c' | 'r' | 'j'; sb?: number; sa?: number; h?: 1 | 2 | 3; run: RunLook }

const on = (n: Node | undefined, name: string): boolean | undefined => { const k = kid(n, name); if (!k) return undefined; const v = k.attrs['w:val']; return !(v === '0' || v === 'false' || v === 'none'); };

function runLook(rPr: Node | undefined): RunLook {
  const o: RunLook = {};
  if (!rPr) return o;
  const set = <K extends keyof RunLook>(k: K, v: RunLook[K] | undefined) => { if (v !== undefined) o[k] = v; };
  set('b', on(rPr, 'w:b')); set('i', on(rPr, 'w:i')); set('u', on(rPr, 'w:u')); set('caps', on(rPr, 'w:caps'));
  set('c', colour(val(rPr, 'w:color')));
  const sz = Number(val(rPr, 'w:sz'));
  if (Number.isFinite(sz) && sz > 0) o.z = sz / 2;
  const font = kid(rPr, 'w:rFonts')?.attrs['w:ascii'];
  if (font) o.f = SERIF.test(font);
  return o;
}
const jc = (v: string | undefined): ParaLook['a'] => (v === 'center' ? 'c' : v === 'right' || v === 'end' ? 'r' : v === 'both' || v === 'distribute' ? 'j' : undefined);

export interface DocxRead { blocks: DocBlock[]; notes: string[] }

/** The document's own text, in order, with its look. `styles` and `numbering` are the files of the same names inside the Word file. */
export function docBlocks(documentXml: string, stylesXml = '', numberingXml = ''): DocxRead {
  const notes: string[] = [];
  // ── styles: the base look, and each named style (following "based on") ──
  const styles = stylesXml ? parseXml(stylesXml) : null;
  const base = runLook(styles ? kid(kid(find(styles, 'w:docDefaults'), 'w:rPrDefault'), 'w:rPr') : undefined);
  const baseSize = base.z ?? 11;
  const named = new Map<string, Node>();
  if (styles) for (const s of kidsOf(find(styles, 'w:styles'), 'w:style')) if (s.attrs['w:styleId']) named.set(s.attrs['w:styleId'], s);
  const styleLook = (id: string | undefined, depth = 0): ParaLook => {
    const s = id ? named.get(id) : undefined;
    if (!s || depth > 8) return { run: {} };
    const parent = styleLook(val(s, 'w:basedOn'), depth + 1);
    const pPr = kid(s, 'w:pPr');
    const sp = kid(pPr, 'w:spacing');
    const lvl = Number(val(pPr, 'w:outlineLvl'));
    const name = (val(s, 'w:name') ?? '').toLowerCase();
    const hn = /^heading ([1-9])$/.exec(name);
    const h = hn ? Math.min(3, Number(hn[1])) : Number.isFinite(lvl) && pPr && kid(pPr, 'w:outlineLvl') ? Math.min(3, lvl + 1) : undefined;
    return {
      a: jc(val(pPr, 'w:jc')) ?? parent.a, sb: px(sp?.attrs['w:before']) ?? parent.sb, sa: px(sp?.attrs['w:after']) ?? parent.sa,
      h: (h as 1 | 2 | 3 | undefined) ?? parent.h, run: { ...parent.run, ...runLook(kid(s, 'w:rPr')) },
    };
  };
  // ── numbering: which lists are bullets and which are numbers ──
  const numbered = new Map<string, boolean>();
  if (numberingXml) {
    const root = parseXml(numberingXml);
    const abstract = new Map<string, Node>();
    for (const a of kidsOf(find(root, 'w:numbering'), 'w:abstractNum')) abstract.set(a.attrs['w:abstractNumId'], a);
    for (const n of kidsOf(find(root, 'w:numbering'), 'w:num')) {
      const a = abstract.get(val(n, 'w:abstractNumId') ?? '');
      for (const l of kidsOf(a, 'w:lvl')) numbered.set(`${n.attrs['w:numId']}/${l.attrs['w:ilvl']}`, (val(l, 'w:numFmt') ?? 'bullet') !== 'bullet' && (val(l, 'w:numFmt') ?? '') !== 'none');
    }
  }
  const counters = new Map<string, number>();
  let pictures = 0, boxes = 0;

  const runsOf = (p: Node, style: RunLook): DocRun[] => {
    const out: DocRun[] = [];
    const add = (t: string, look: RunLook) => {
      if (!t) return;
      const text = look.caps ? t.toUpperCase() : t;
      const run: DocRun = { t: text };
      if (look.b) run.b = 1;
      if (look.i) run.i = 1;
      if (look.u) run.u = 1;
      if (look.f) run.f = 1;
      if (look.c && look.c !== '000000') run.c = look.c;
      if (look.z && Math.abs(look.z - baseSize) >= 0.5) run.z = look.z;
      const last = out[out.length - 1];
      if (last && last.b === run.b && last.i === run.i && last.u === run.u && last.f === run.f && last.c === run.c && last.z === run.z) last.t += text; else out.push(run);
    };
    const walk = (n: Node) => {
      for (const k of n.kids) {
        if (k.name === 'w:r') {
          const look = { ...base, ...style, ...runLook(kid(k, 'w:rPr')) };
          for (const c of k.kids) {
            if (c.name === 'w:t') add(c.text, look);
            else if (c.name === 'w:tab') add('\t', look);
            else if (c.name === 'w:br' && c.attrs['w:type'] !== 'page') add('\n', look);
            else if (c.name === 'w:noBreakHyphen') add('‑', look);
            else if (c.name === 'w:sym') { const code = parseInt(c.attrs['w:char'] ?? '', 16); if (Number.isFinite(code)) add(code === 0xf0b7 || code === 0xb7 ? '•' : code === 0xf0a8 || code === 0xf06f || code === 0xf071 ? '☐' : code === 0xf0fc || code === 0xf0fe ? '☑' : '', look); }
            else if (c.name === 'w:drawing' || c.name === 'w:pict') { if (find(c, 'w:txbxContent')) boxes += 1; else pictures += 1; }
          }
        } else if (k.name === 'w:hyperlink' || k.name === 'w:ins' || k.name === 'w:smartTag' || k.name === 'w:sdt' || k.name === 'w:sdtContent' || k.name === 'w:fldSimple') walk(k);
      }
    };
    walk(p);
    return out;
  };

  const para = (p: Node): DocPara => {
    const pPr = kid(p, 'w:pPr');
    const style = styleLook(val(pPr, 'w:pStyle'));
    const out: DocPara = { k: 'p', r: runsOf(p, style.run) };
    const a = jc(val(pPr, 'w:jc')) ?? style.a;
    if (a) out.a = a;
    if (style.h) out.h = style.h;
    const sp = kid(pPr, 'w:spacing');
    const sb = px(sp?.attrs['w:before']) ?? style.sb, sa = px(sp?.attrs['w:after']) ?? style.sa;
    if (sb) out.sb = Math.min(80, sb);
    if (sa) out.sa = Math.min(80, sa);
    const ind = px(kid(pPr, 'w:ind')?.attrs['w:left'] ?? kid(pPr, 'w:ind')?.attrs['w:start']);
    const numPr = kid(pPr, 'w:numPr');
    const numId = val(numPr, 'w:numId');
    if (numId && numId !== '0') {
      const lv = Number(val(numPr, 'w:ilvl') ?? 0) || 0;
      const key = `${numId}/${lv}`;
      if (numbered.get(key)) { out.li = 2; counters.set(key, (counters.get(key) ?? 0) + 1); out.n = counters.get(key); for (const k of [...counters.keys()]) if (k.startsWith(`${numId}/`) && Number(k.split('/')[1]) > lv) counters.delete(k); }
      else out.li = 1;
      if (lv) out.lv = Math.min(8, lv);
    } else if (ind && ind > 0) out.ind = Math.min(200, ind);
    const sh = colour(kid(pPr, 'w:shd')?.attrs['w:fill']);
    if (sh && sh !== 'FFFFFF') out.sh = sh;
    const bottom = kid(kid(pPr, 'w:pBdr'), 'w:bottom');
    if (bottom && bottom.attrs['w:val'] !== 'none' && bottom.attrs['w:val'] !== 'nil') out.bb = colour(bottom.attrs['w:color']) ?? '000000';
    if (on(pPr, 'w:pageBreakBefore') || p.kids.some((r) => r.name === 'w:r' && r.kids.some((c) => c.name === 'w:br' && c.attrs['w:type'] === 'page'))) out.pb = 1;
    return out;
  };

  const side = (b: Node | undefined): string | undefined => {
    if (!b || b.attrs['w:val'] === 'nil' || b.attrs['w:val'] === 'none') return undefined;
    const sz = Number(b.attrs['w:sz'] ?? 4);
    const w = b.attrs['w:val'] === 'thick' || b.attrs['w:val'] === 'double' ? Math.max(3, Math.round(sz / 4)) : Math.max(1, Math.round(sz / 6));
    return `${Math.min(8, w)} ${colour(b.attrs['w:color']) ?? '000000'}`;
  };

  const table = (t: Node): DocTable | null => {
    const grid = kidsOf(kid(t, 'w:tblGrid'), 'w:gridCol').map((g) => Number(g.attrs['w:w']) || 0);
    const total = grid.reduce((a, b) => a + b, 0);
    const out: DocTable = { k: 't', rows: [] };
    if (grid.length > 1 && total > 0) out.w = grid.map((g) => Math.round((g / total) * 1000) / 10);
    const tblBorders = kid(kid(t, 'w:tblPr'), 'w:tblBorders');
    const edges = new Map<string, number>();
    /** a cell that continues a merge from the row above adds to the span of the cell that started it */
    const open = new Map<number, DocCell>();
    for (const tr of kidsOf(t, 'w:tr')) {
      const row: DocCell[] = [];
      let col = 0;
      for (const tc of kidsOf(tr, 'w:tc')) {
        const tcPr = kid(tc, 'w:tcPr');
        const span = Math.max(1, Number(val(tcPr, 'w:gridSpan')) || 1);
        const merge = kid(tcPr, 'w:vMerge');
        if (merge && merge.attrs['w:val'] !== 'restart') { const head = open.get(col); if (head) head.rs = (head.rs ?? 1) + 1; col += span; continue; }
        const cell: DocCell = { p: [] };
        for (const k of tc.kids) {
          if (k.name === 'w:p') cell.p.push(para(k));
          // a table inside a cell is kept as its text, one line for each row
          else if (k.name === 'w:tbl') for (const r of kidsOf(k, 'w:tr')) cell.p.push({ k: 'p', r: kidsOf(r, 'w:tc').flatMap((c, i) => [...(i ? [{ t: '   ' }] : []), ...kidsOf(c, 'w:p').flatMap((p) => para(p).r)]) });
        }
        // Word always ends a cell with a paragraph; an empty last one is not content
        while (cell.p.length > 1 && !cell.p[cell.p.length - 1].r.length && !cell.p[cell.p.length - 1].bb) cell.p.pop();
        if (span > 1) cell.s = span;
        const sh = colour(kid(tcPr, 'w:shd')?.attrs['w:fill']);
        if (sh && sh !== 'FFFFFF') cell.sh = sh;
        const va = val(tcPr, 'w:vAlign');
        if (va === 'center') cell.va = 'm'; else if (va === 'bottom') cell.va = 'b';
        const mar = kid(tcPr, 'w:tcMar');
        const pv = px(kid(mar, 'w:top')?.attrs['w:w']), ph = px(kid(mar, 'w:left')?.attrs['w:w'] ?? kid(mar, 'w:start')?.attrs['w:w']);
        if ((pv !== undefined && pv > 8) || (ph !== undefined && ph > 10)) cell.pd = [Math.min(60, pv ?? 5), Math.min(60, ph ?? 7)];
        const b = kid(tcPr, 'w:tcBorders');
        const top = side(kid(b, 'w:top')), left = side(kid(b, 'w:left') ?? kid(b, 'w:start'));
        for (const e of [top, left, side(kid(b, 'w:bottom')), side(kid(b, 'w:right') ?? kid(b, 'w:end'))]) if (e) edges.set(e, (edges.get(e) ?? 0) + 1);
        if (top) cell.bt = top;
        if (left) cell.bl = left;
        if (merge) open.set(col, cell); else open.delete(col);
        row.push(cell);
        col += span;
      }
      if (row.length) out.rows.push({ c: row });
    }
    if (!out.rows.length) return null;
    // the most common thin edge is the table's own border; a cell keeps only an edge that differs from it
    const common = [...edges.entries()].filter(([e]) => e.startsWith('1 ')).sort((a, b) => b[1] - a[1])[0]?.[0] ?? side(kid(tblBorders, 'w:insideH')) ?? side(kid(tblBorders, 'w:top'));
    if (common) out.bd = common.split(' ')[1];
    for (const r of out.rows) for (const c of r.c) { if (c.bt === common || (c.bt && !common)) delete c.bt; if (c.bl === common) delete c.bl; }
    return out;
  };

  const body = find(parseXml(documentXml), 'w:body');
  const blocks: DocBlock[] = [];
  const walk = (n: Node | undefined) => {
    for (const k of n?.kids ?? []) {
      if (k.name === 'w:p') blocks.push(para(k));
      else if (k.name === 'w:tbl') { const t = table(k); if (t) blocks.push(t); }
      else if (k.name === 'w:sdt' || k.name === 'w:sdtContent' || k.name === 'w:ins' || k.name === 'w:customXml') walk(k);
    }
  };
  walk(body);
  // empty paragraphs at the very start and end are only spacing
  while (blocks.length && blocks[0].k === 'p' && !blocks[0].r.length && !blocks[0].bb) blocks.shift();
  while (blocks.length) { const l = blocks[blocks.length - 1]; if (l.k === 'p' && !l.r.length && !l.bb) blocks.pop(); else break; }
  if (pictures) notes.push(`${pictures} picture${pictures === 1 ? '' : 's'} in the Word file ${pictures === 1 ? 'is' : 'are'} not shown online. Check the page against the original.`);
  if (boxes) notes.push(`${boxes} text box${boxes === 1 ? '' : 'es'} in the Word file ${boxes === 1 ? 'is' : 'are'} not shown online. Check the page against the original.`);
  return { blocks, notes };
}

/** Reads the document out of a Word file. Null when the file has no readable main text. */
export async function readDocx(buffer: Buffer): Promise<DocxRead | null> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const text = async (path: string) => (await zip.file(path)?.async('string')) ?? '';
  const xml = await text('word/document.xml');
  if (!xml) return null;
  const read = docBlocks(xml, await text('word/styles.xml'), await text('word/numbering.xml'));
  if (Object.keys(zip.files).some((f) => /^word\/(header|footer)\d*\.xml$/.test(f))) read.notes.push('Page headers and footers of the Word file are not shown online.');
  return read.blocks.length ? read : null;
}
