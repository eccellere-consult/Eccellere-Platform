/**
 * deckImport.test.ts — the admin import of a deck of tools: reading a real .pptx (generated here with pptxgenjs, the library the app already uses
 * to write decks), grouping slides into tools, and drafting each tool with an AI call that is faked here. The promises tested: slide order follows the
 * deck, text is decoded, a bad reply is retried once with the problems listed, nothing is invented, and nothing unfinished is ever called "draft".
 */
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { describe, expect, it } from 'vitest';
import { buildAuthorMessages, draftTool, estimate, parseDraft, planBatches, slideHash, type CallJson } from '../lib/import/author';
import { MAX_PART_BYTES, buildSegmentMessages, candidatesFromGroups, extractDeck, heuristicCandidates, outlineForSegmenting, parseSegments } from '../lib/import/pptx';

async function makeDeck(): Promise<Buffer> {
  const p = new PptxGenJS();
  p.defineSlideMaster({ title: 'TOOL', objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9, h: 0.8 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.5, y: 1.3, w: 9, h: 2.6 }, text: '' } },
  ] });
  const s0 = p.addSlide(); s0.addText('Problem solving toolkit', { x: 1, y: 1, w: 8, h: 1 });
  const s1 = p.addSlide({ masterName: 'TOOL' });
  s1.addText('Impact–Effort Matrix', { placeholder: 'title' });
  s1.addText([{ text: 'Plot ideas by impact and effort.', options: { bullet: true, breakLine: true } }, { text: 'Do quick wins first, A & B before <C>.', options: { bullet: true } }], { placeholder: 'body' });
  s1.addTable([[{ text: 'Quadrant' }, { text: 'Action' }], [{ text: 'Quick win' }, { text: 'Do now' }]], { x: 0.5, y: 4, w: 8 });
  s1.addNotes('Speaker note: use sticky notes.');
  const s2 = p.addSlide({ masterName: 'TOOL' });
  s2.addText('5 Whys', { placeholder: 'title' });
  s2.addText('Ask why five times to reach the root cause of a problem.', { placeholder: 'body' });
  const s3 = p.addSlide(); s3.addText('Thank you', { x: 1, y: 1, w: 8, h: 1 });
  return (await p.write({ outputType: 'nodebuffer' })) as Buffer;
}

describe('reading a deck', () => {
  it('reads titles, text, tables and notes of every slide, decoded', async () => {
    const slides = await extractDeck(await makeDeck());
    expect(slides.map((s) => s.title)).toEqual(['Problem solving toolkit', 'Impact–Effort Matrix', '5 Whys', 'Thank you']);
    expect(slides[1].paragraphs).toEqual(expect.arrayContaining(['Plot ideas by impact and effort.', 'Do quick wins first, A & B before <C>.']));
    expect(slides[1].tables).toEqual([[['Quadrant', 'Action'], ['Quick win', 'Do now']]]);
    expect(slides[1].notes).toContain('Speaker note: use sticky notes.');
    expect(slides[1].text).toContain('Quick win | Do now');
    expect(slides[1].text).toContain('Notes: Speaker note');
    expect(slides.map((s) => s.index)).toEqual([1, 2, 3, 4]);
  });
  it('follows the order of the deck, not the order of the file names', async () => {
    const zip = await JSZip.loadAsync(await makeDeck());
    const xml = await zip.file('ppt/presentation.xml')!.async('string');
    const ids = [...xml.matchAll(/<p:sldId\b[^>]*\/>/g)].map((m) => m[0]);
    zip.file('ppt/presentation.xml', xml.replace(ids.join(''), [...ids].reverse().join('')));
    const slides = await extractDeck(await zip.generateAsync({ type: 'nodebuffer' }));
    expect(slides.map((s) => s.title)).toEqual(['Thank you', '5 Whys', 'Impact–Effort Matrix', 'Problem solving toolkit']);
  });
  it('says plainly when the file is not a deck', async () => {
    await expect(extractDeck(Buffer.from('hello'))).rejects.toThrow(/not a PowerPoint/);
    const empty = new JSZip(); empty.file('readme.txt', 'x');
    await expect(extractDeck(await empty.generateAsync({ type: 'nodebuffer' }))).rejects.toThrow(/No slides/);
  });
  it('refuses a zip bomb: a slide that is tiny in the file but huge once opened is never decompressed', async () => {
    const zip = await JSZip.loadAsync(await makeDeck());
    zip.file('ppt/slides/slide2.xml', 'a'.repeat(MAX_PART_BYTES + 1024), { compression: 'DEFLATE' });
    const bomb = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    expect(bomb.length).toBeLessThan(200_000); // small on disk
    await expect(extractDeck(bomb)).rejects.toThrow(/damaged or unsafe/);
  });
});

describe('finding the tools in a deck', () => {
  it('takes one tool per slide and skips the cover and the thank-you', async () => {
    const c = heuristicCandidates(await extractDeck(await makeDeck()));
    expect(c.map((x) => [x.name, x.slides])).toEqual([['Impact–Effort Matrix', [2]], ['5 Whys', [3]]]);
  });
  it('asks the AI to group slides, and checks the grouping against the deck', async () => {
    const slides = await extractDeck(await makeDeck());
    const m = buildSegmentMessages(outlineForSegmenting(slides), ['analytical', 'creative']);
    expect(m.system).toMatch(/at most one tool/);
    expect(m.user).toContain('2: Impact–Effort Matrix');
    const ok = parseSegments(JSON.stringify({ tools: [{ name: 'Impact-Effort', slides: [3, 2], category: 'decision-matrix' }, { name: '5 Whys', slides: [4] }], skipped: [1] }), 4);
    expect(ok.groups[0]).toEqual({ name: 'Impact-Effort', slides: [2, 3], category: 'decision-matrix' });
    expect(candidatesFromGroups(ok.groups, slides)[0].text).toContain('Quick win | Do now');
    const bad = parseSegments(JSON.stringify({ tools: [{ name: 'A', slides: [2] }, { name: 'B', slides: [2, 9] }, { name: '', slides: [3] }, 'junk'] }), 4);
    expect(bad.groups.map((g) => g.name)).toEqual(['A']);
    expect(bad.errors).toHaveLength(3);
    expect(parseSegments('not json', 4).errors[0]).toMatch(/not valid JSON/);
  });
});

// ── Drafting a tool ──────────────────────────────────────────────────────────────────────────────────────────────────

const goodTool = (over: Record<string, unknown> = {}) => ({
  slug: 'five-whys', name: '5 Whys', category: 'root-cause', does: 'Asks why five times to reach a cause that can be fixed.', whenToUse: 'When a problem keeps coming back.',
  reference: { originator: '', year: '', summary: 'Asks why repeatedly until the answer is a system, not a person.', caption: 'Stop when you reach something you can fix.', howToRead: ['Ask why.', 'Repeat until it is a system.'] },
  sections: [{ key: 'chain', title: 'The chain', summary: 'Why one to five.', parts: [
    { kind: 'field', key: 'problem', label: 'Problem', type: 'longtext', help: 'The problem in one sentence, with numbers.', example: 'Weld rework is 5.4%' },
    { kind: 'field', key: 'root_cause', label: 'Root cause', type: 'longtext', help: 'The last answer, stated as a system gap.', example: 'No utilities check' },
  ] }],
  outputs: [{ key: 'root_cause', label: 'Root cause', rule: { op: 'template', text: '{root_cause}' } }],
  analysisGuide: 'The verdict is the root cause, stated as a system gap, and whether the chain is evidenced at each step.',
  ...over,
});
const cand = { name: '5 Whys', text: 'Ask why five times\nStop at a system.', slides: [3] };
const ctx = { existingSlugs: [] as string[], deck: 'toolkit.pptx', now: () => '2026-10-17T10:00:00.000Z' };
const scripted = (replies: ({ content: string; finishReason?: string | null } | Error)[]): { call: CallJson; seen: string[] } => {
  const seen: string[] = []; let i = 0;
  return { seen, call: async (m) => { seen.push(m.user); const r = replies[Math.min(i++, replies.length - 1)]; if (r instanceof Error) throw r; return { content: r.content, finishReason: r.finishReason ?? 'stop' }; } };
};

describe('drafting a tool with AI', () => {
  it('turns a good reply into a draft, stamped as AI-written with its slides and a hash of the text, and never invents an originator', async () => {
    const s = scripted([{ content: JSON.stringify(goodTool()) }]);
    const r = await draftTool(s.call, cand, ctx);
    expect(r.status).toBe('draft');
    expect(r.attempts).toBe(1);
    expect(r.tool!.reference.originator).toBe('');
    expect(r.tool!.source).toEqual({ deck: 'toolkit.pptx', slides: [3], hash: slideHash(cand.text), draftedBy: 'ai', draftedAt: '2026-10-17T10:00:00.000Z' });
  });
  it('retries once, naming the problem, when the reply is not JSON', async () => {
    const s = scripted([{ content: 'Sure! Here is the tool:' }, { content: JSON.stringify(goodTool()) }]);
    const r = await draftTool(s.call, cand, ctx);
    expect(r.status).toBe('draft');
    expect(r.attempts).toBe(2);
    expect(s.seen[1]).toMatch(/not valid JSON/);
  });
  it('asks for a shorter tool when the reply was cut off', async () => {
    const s = scripted([{ content: '{"slug":', finishReason: 'length' }, { content: JSON.stringify(goodTool()) }]);
    const r = await draftTool(s.call, cand, ctx);
    expect(r.status).toBe('draft');
    expect(s.seen[1]).toMatch(/MORE COMPACT/);
  });
  it('keeps a reply that still fails the gate as needs review, with the reasons, and never as a draft', async () => {
    const bad = { content: JSON.stringify(goodTool({ outputs: [] })) };
    const s = scripted([bad, bad]);
    const r = await draftTool(s.call, cand, ctx);
    expect(r.status).toBe('needs_review');
    expect(r.attempts).toBe(2);
    expect(r.issues.some((i) => /at least one output/.test(i.message))).toBe(true);
    expect(s.seen[1]).toMatch(/at least one output/);
    expect(r.tool).not.toBeNull();
  });
  it('flags a slug that is already taken', async () => {
    const r = await draftTool(scripted([{ content: JSON.stringify(goodTool()) }]).call, cand, { ...ctx, existingSlugs: ['five-whys'] });
    expect(r.status).toBe('needs_review');
    expect(r.issues.some((i) => /already exists/.test(i.message))).toBe(true);
  });
  it('fails cleanly when nothing usable comes back, or the AI call itself fails', async () => {
    const garbage = await draftTool(scripted([{ content: 'nope' }, { content: 'still nope' }]).call, cand, ctx);
    expect(garbage).toMatchObject({ status: 'failed', tool: null, attempts: 2 });
    const down = await draftTool(scripted([new Error('The AI has no credit left.')]).call, cand, ctx);
    expect(down).toMatchObject({ status: 'failed', note: 'The AI has no credit left.', attempts: 1 });
  });
  it('shows the AI the rules that matter: do not invent, use rules for arithmetic, one JSON object', () => {
    const m = buildAuthorMessages({ text: 'x'.repeat(20000), nameHint: 'Fishbone', existingSlugs: ['a', 'b'], stages: ['Define', 'Analyse'] });
    expect(m.system).toMatch(/Never invent who created the tool/);
    expect(m.system).toMatch(/RULE, never prose/);
    expect(m.system).toMatch(/Output ONLY one JSON object/);
    expect(m.system).toContain('Stage: one of Define, Analyse');
    expect(m.system).toContain('Slugs already taken (do not reuse): a, b');
    expect(m.user.length).toBeLessThan(12100);
    expect(parseDraft('{"name":"x"').parseError).toMatch(/not valid JSON/);
  });
  it('plans batches, estimates the calls before a run, and hashes text without caring about spacing', () => {
    expect(planBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(planBatches([], 5)).toEqual([]);
    expect(estimate(150, { grouping: true })).toMatchObject({ minCalls: 153, maxCalls: 303 });
    expect(estimate(150, { grouping: true }).text).toBe('150 tools: 153 to 303 AI calls, including 3 to group the slides.');
    expect(slideHash('Ask  why\n five times')).toBe(slideHash('Ask why five times'));
    expect(slideHash('a')).not.toBe(slideHash('b'));
  });
});
