/**
 * import/pptx.ts — reads the text out of a PowerPoint deck so an admin can turn its tools into pages. A .pptx is a zip of XML files; this reads
 * the slides in presentation order (not file-name order: a reordered deck keeps its old file names), with their title, text, tables and
 * speaker notes. It needs only `jszip`, which pptxgenjs already brings, and no XML library: the few tags it needs are read with small patterns.
 *
 * Limits, said plainly: text inside pictures is not read (a slide that is only an image comes out empty); SmartArt and charts give their
 * labels at best; a slide with no usable text is skipped by the caller, not guessed at.
 */
import JSZip from 'jszip';

export interface SlideText {
  /** 1-based position in the deck. */
  index: number;
  title: string;
  paragraphs: string[];
  /** Each table as rows of cells. */
  tables: string[][][];
  notes: string;
  /** Everything above as one block of plain text, for the AI. */
  text: string;
}

const decode = (s: string): string => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');

/** The paragraphs of an XML fragment, each as plain text (runs joined, line breaks as spaces). */
const paragraphsOf = (xml: string): string[] =>
  [...xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
    .map((m) => decode([...m[0].matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\s*\/>/g)].map((t) => (t[1] === undefined ? ' ' : t[1])).join('')).replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const shapesOf = (xml: string) => [...xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)].map((m) => ({ type: /<p:ph\b[^>]*?\btype="([A-Za-z]+)"/.exec(m[0])?.[1] ?? '', paragraphs: paragraphsOf(m[0]) }));

const tablesOf = (xml: string): string[][][] =>
  [...xml.matchAll(/<a:tbl>[\s\S]*?<\/a:tbl>/g)].map((t) =>
    [...t[0].matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)].map((r) => [...r[0].matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)].map((c) => paragraphsOf(c[0]).join(' '))));

async function read(zip: JSZip, path: string): Promise<string | null> {
  const f = zip.file(path);
  return f ? f.async('string') : null;
}

/** The slide files in presentation order: from presentation.xml and its relationships, falling back to the numbers in the file names. */
async function slidePaths(zip: JSZip): Promise<string[]> {
  const byNumber = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(/(\d+)\.xml$/.exec(a)![1]) - Number(/(\d+)\.xml$/.exec(b)![1]));
  const pres = await read(zip, 'ppt/presentation.xml'), rels = await read(zip, 'ppt/_rels/presentation.xml.rels');
  if (!pres || !rels) return byNumber;
  const target = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [/\bId="([^"]+)"/.exec(m[0])?.[1] ?? '', /\bTarget="([^"]+)"/.exec(m[0])?.[1] ?? '']));
  const ordered = [...pres.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map((m) => target.get(m[1])).filter((t): t is string => !!t).map((t) => `ppt/${t.replace(/^\/?(ppt\/)?/, '')}`);
  return ordered.length && ordered.every((p) => zip.file(p)) ? ordered : byNumber;
}

export const MAX_SLIDES = 600;
/** The most one XML part (a slide, its notes, the slide list) may expand to. A real slide is a few KB; a zip bomb is a tiny file that expands to gigabytes. */
export const MAX_PART_BYTES = 8 * 1024 * 1024;

/** The size a part declares in the zip's own directory, before anything is decompressed. JSZip keeps it on a private field; absent means "unknown". */
const declaredSize = (f: JSZip.JSZipObject): number | undefined => (f as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;

/** Reads every slide of a .pptx. Throws a plain-words error when the file is not a PowerPoint deck. */
export async function extractDeck(bytes: Uint8Array | ArrayBuffer | Buffer): Promise<SlideText[]> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('That file is not a PowerPoint (.pptx) deck. Save the deck as .pptx and try again.'); }
  const oversize = Object.values(zip.files).find((f) => /^ppt\/(slides|notesSlides)\/[^/]+\.xml$|^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels)$/.test(f.name) && (declaredSize(f) ?? 0) > MAX_PART_BYTES);
  if (oversize) throw new Error('That file looks damaged or unsafe (a slide expands to an unreasonable size), so it was not read.');
  const paths = await slidePaths(zip);
  if (!paths.length) throw new Error('No slides were found in that file.');
  if (paths.length > MAX_SLIDES) throw new Error(`The deck has ${paths.length} slides; the limit is ${MAX_SLIDES}. Split it and upload the parts.`);
  const out: SlideText[] = [];
  for (let i = 0; i < paths.length; i++) {
    const xml = (await read(zip, paths[i])) ?? '';
    const shapes = shapesOf(xml);
    const titleShape = shapes.find((s) => (s.type === 'title' || s.type === 'ctrTitle') && s.paragraphs.length);
    const title = titleShape ? titleShape.paragraphs.join(' ') : '';
    const body = shapes.filter((s) => s !== titleShape).flatMap((s) => s.paragraphs);
    const tables = tablesOf(xml);
    const relPath = paths[i].replace(/slides\/(slide\d+\.xml)$/, 'slides/_rels/$1.rels');
    const notesTarget = /<Relationship\b[^>]*notesSlide[^>]*>/.exec((await read(zip, relPath)) ?? '')?.[0];
    const notesFile = notesTarget ? /\bTarget="\.\.\/(notesSlides\/[^"]+)"/.exec(notesTarget)?.[1] : undefined;
    const notesXml = notesFile ? await read(zip, `ppt/${notesFile}`) : null;
    const notes = notesXml ? shapesOf(notesXml).filter((s) => s.type === 'body').flatMap((s) => s.paragraphs).join(' ') : '';
    // A slide with no title placeholder: its first line stands in as the title (it stays in `paragraphs` too, so nothing is lost).
    const heading = title || body[0] || '';
    const text = [heading, ...(title ? body : body.slice(1)), ...tables.flatMap((t) => t.map((r) => r.join(' | '))), notes ? `Notes: ${notes}` : ''].filter(Boolean).join('\n');
    out.push({ index: i + 1, title: heading, paragraphs: body, tables, notes, text });
  }
  return out;
}

// ── Which slides are tools ───────────────────────────────────────────────────────────────────────────────────────────

export interface ToolCandidate { slides: number[]; name: string; text: string }

const NOT_A_TOOL = /^(agenda|contents?|index|thank you|thanks|questions\??|about( us)?|references?|appendix|disclaimer|overview|introduction|summary|next steps)$/i;

/** One tool per slide, skipping slides that are plainly not tools (a title, an agenda, a thank-you, a slide with almost no text). The AI can regroup these. */
export function heuristicCandidates(slides: readonly SlideText[]): ToolCandidate[] {
  return slides
    .filter((s, i) => !(i === 0 && s.paragraphs.length <= 1 && !s.tables.length) && s.text.length >= 40 && !NOT_A_TOOL.test(s.title.trim()))
    .map((s) => ({ slides: [s.index], name: s.title || `Slide ${s.index}`, text: s.text }));
}

/** A short outline (slide number, title, first words) for asking the AI to group slides into tools. */
export const outlineForSegmenting = (slides: readonly SlideText[]): string =>
  slides.map((s) => `${s.index}: ${s.title || '(no title)'} — ${s.text.replace(/\s+/g, ' ').slice(s.title.length, s.title.length + 110).trim()}`).join('\n');

export function buildSegmentMessages(outline: string, categories: readonly string[]): { system: string; user: string } {
  return {
    system: [
      'You group the slides of a deck into TOOLS. A tool is one analytical or creative problem-solving technique, framework or decision model (for example a fishbone diagram, a 2x2 impact-effort matrix, 5 Whys). A tool can take one slide or several consecutive slides (the idea, its steps, an example).',
      'Skip slides that are not a tool: title, agenda, section dividers, thank-you, references.',
      `Give each tool a short name exactly as the deck names it, and a category from: ${categories.join(', ')}.`,
      'Every slide number may appear in at most one tool. Do not invent tools that the slides do not describe.',
      'Output ONLY a JSON object: {"tools":[{"name":"...","slides":[3,4],"category":"..."}],"skipped":[1,2]}. No markdown, no commentary.',
    ].join('\n'),
    user: `Slide outline (number: title — first words):\n${outline}`,
  };
}

/** Checks the AI's grouping against the deck: slide numbers must exist and be used once. Bad groups are dropped and reported, never repaired by guessing. */
export function parseSegments(raw: string, slideCount: number): { groups: { name: string; slides: number[]; category?: string }[]; skipped: number[]; errors: string[] } {
  const errors: string[] = [];
  let j: unknown;
  try { j = JSON.parse(raw); } catch { return { groups: [], skipped: [], errors: ['The grouping reply was not valid JSON'] }; }
  const o = (j && typeof j === 'object' ? j : {}) as { tools?: unknown; skipped?: unknown };
  const used = new Set<number>();
  const groups: { name: string; slides: number[]; category?: string }[] = [];
  for (const [i, t] of (Array.isArray(o.tools) ? o.tools : []).entries()) {
    const g = (t && typeof t === 'object' ? t : {}) as { name?: unknown; slides?: unknown; category?: unknown };
    const name = typeof g.name === 'string' ? g.name.trim() : '';
    const slides = Array.isArray(g.slides) ? [...new Set(g.slides.filter((n): n is number => Number.isInteger(n)))].sort((a, b) => a - b) : [];
    if (!name || !slides.length) { errors.push(`Group ${i + 1} has no name or no slides`); continue; }
    const bad = slides.find((n) => n < 1 || n > slideCount || used.has(n));
    if (bad !== undefined) { errors.push(`Group "${name}" uses slide ${bad}, which is out of range or already in another group`); continue; }
    slides.forEach((n) => used.add(n));
    groups.push({ name, slides, category: typeof g.category === 'string' ? g.category : undefined });
  }
  const skipped = (Array.isArray(o.skipped) ? o.skipped : []).filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= slideCount && !used.has(n));
  return { groups, skipped, errors };
}

export function candidatesFromGroups(groups: { name: string; slides: number[] }[], slides: readonly SlideText[]): ToolCandidate[] {
  return groups.map((g) => ({ slides: g.slides, name: g.name, text: g.slides.map((n) => slides[n - 1]?.text ?? '').filter(Boolean).join('\n\n') }));
}
