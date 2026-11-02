import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import PptxGenJS from 'pptxgenjs';
import { ExtractError, docKindOf, extractDocumentText, legacyOfficeHint, tidy, MAX_EXTRACTED_CHARS } from '@/lib/tools/extract';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import { seedHubTools, HUB_IDS } from '@/lib/tools/hub';
import { isCodeDefinition, toAiTool, toRuntime } from '@/lib/tools/runtime';
import { getLibraryTool, getPublishedTool, publishTool } from '@/lib/tools/service';
import { aiFill } from '@/lib/tools/ai';
import { isDocument, rowsToText } from '@/lib/tools/listFile';

const nodeRequire = createRequire(import.meta.url);
// the app's own parser uses require inside the Next server; here the same package is loaded for the test
const realParse = async (b: Buffer) => (await nodeRequire('officeparser').parseOffice(b)).toText() as string;

describe('reading uploaded documents', () => {
  it('knows the supported types and explains the unsupported ones', () => {
    expect(docKindOf('Deck.PPTX')).toBe('powerpoint');
    expect(docKindOf('brief.docx')).toBe('word');
    expect(docKindOf('paper.pdf')).toBe('pdf');
    expect(docKindOf('data.xlsx')).toBe('excel');
    expect(docKindOf('notes.md')).toBe('text');
    expect(docKindOf('picture.png')).toBeNull();
    expect(legacyOfficeHint('old.ppt')).toMatch(/Save it as \.docx, \.pptx/);
    expect(legacyOfficeHint('new.pptx')).toBeNull();
    expect(isDocument('x.PDF')).toBe(true);
    expect(isDocument('x.xlsx')).toBe(false);
  });

  it('reads the text of a real PowerPoint deck', async () => {
    const pptx = new PptxGenJS();
    const s1 = pptx.addSlide(); s1.addText('Pareto Analysis', { x: 1, y: 1, w: 6, h: 1 }); s1.addText('Prioritises the few critical causes that contribute to the majority of a problem.', { x: 1, y: 2, w: 8, h: 1 });
    const s2 = pptx.addSlide(); s2.addText('Fishbone Diagram: categorise and map the causes of a specific problem.', { x: 1, y: 1, w: 8, h: 1 });
    const buf = Buffer.from(await pptx.write({ outputType: 'nodebuffer' }) as Buffer);
    const out = await extractDocumentText('course.pptx', buf, realParse);
    expect(out.kind).toBe('powerpoint');
    expect(out.text).toContain('Pareto Analysis');
    expect(out.text).toContain('Fishbone Diagram');
    expect(out.truncated).toBe(false);
  });

  it('reads plain text without a parser, and refuses empty, oversized, unreadable and unsupported files in plain words', async () => {
    expect((await extractDocumentText('list.txt', Buffer.from('5 Why Analysis\nFishbone Diagram'))).text).toContain('Fishbone');
    await expect(extractDocumentText('list.txt', Buffer.from('hi'))).rejects.toMatchObject({ code: 'UNREADABLE' });
    await expect(extractDocumentText('a.png', Buffer.from('x'.repeat(100)))).rejects.toMatchObject({ code: 'UNSUPPORTED' });
    await expect(extractDocumentText('a.ppt', Buffer.from('x'.repeat(100)))).rejects.toMatchObject({ code: 'UNSUPPORTED' });
    await expect(extractDocumentText('a.docx', Buffer.alloc(11 * 1024 * 1024))).rejects.toMatchObject({ code: 'TOO_LARGE' });
    await expect(extractDocumentText('a.docx', Buffer.from('not a zip'), async () => { throw new Error('bad zip'); })).rejects.toBeInstanceOf(ExtractError);
    await expect(extractDocumentText('scan.pdf', Buffer.from('x'), async () => '   ')).rejects.toThrow(/scanned/);
  });

  it('tidies and caps long text', () => {
    expect(tidy('a\r\n\r\n\r\n\r\nb\u0000  \n').text).toBe('a\n\nb');
    const big = tidy('x'.repeat(MAX_EXTRACTED_CHARS + 50));
    expect(big.truncated).toBe(true);
    expect(big.text).toHaveLength(MAX_EXTRACTED_CHARS);
  });

  it('turns a spreadsheet row set into list lines (documents go through the server instead)', () => {
    expect(rowsToText([['Tool', 'Group'], ['Kaizen', 'Process']])).toBe('Kaizen | Process');
  });
});

describe('the 36 Strategy Hub tools in the library', () => {
  it('adds every hand-built tool once, as reviewed library entries with their place in the framework library', async () => {
    const repo = createMemoryRepo();
    const first = await seedHubTools(repo, 'admin1', () => new Date('2026-11-03T00:00:00Z'));
    expect(first.missing).toEqual([]);
    expect(first.added).toHaveLength(36);
    const bmc = (await repo.getToolBySlug('bmc'))!;
    expect(bmc).toMatchObject({ status: 'REVIEWED', source: 'strategy-hub', practice: 'Strategy', category: 'Strategy', reviewedById: 'admin1' });
    expect(isCodeDefinition(bmc.definition)).toBe(true);
    expect(bmc.definition).toMatchObject({ kind: 'code', toolId: 'bmc', layer: 'L2' });
    expect(bmc.does).toBeTruthy();
    const again = await seedHubTools(repo, 'admin1');
    expect(again.added).toEqual([]);
    expect(again.skipped).toHaveLength(36);
  });

  it('are in the library for the team, hidden from clients until exposed, then visible to both', async () => {
    const repo = createMemoryRepo();
    await seedHubTools(repo, 'admin1');
    expect(await getLibraryTool(repo, 'pestel')).not.toBeNull();
    expect(await getPublishedTool(repo, 'pestel')).toBeNull();
    await publishTool(repo, 'pestel');
    expect(await getPublishedTool(repo, 'pestel')).not.toBeNull();
  });

  it('run through the same engine: each resolves to a real model with a diagram and a reading guide', async () => {
    const repo = createMemoryRepo();
    await seedHubTools(repo, 'admin1');
    for (const id of HUB_IDS) {
      const tool = (await repo.getToolBySlug(id))!;
      const rt = toRuntime(tool);
      expect(rt, id).not.toBeNull();
      expect(rt!.def.sections.length, id).toBeGreaterThan(0);
      expect(rt!.diagramSvg, id).toContain('<svg');
      expect(toAiTool(tool), id).not.toBeNull();
    }
  });

  it('get the same AI help as any other tool (draft answers from a situation note)', async () => {
    const repo = createMemoryRepo();
    await seedHubTools(repo, 'admin1');
    const ai = toAiTool((await repo.getToolBySlug('pestel'))!)!;
    let sawSystem = '';
    const r = await aiFill(
      { explainDown: () => 'down', generate: async (a) => { sawSystem = a.system; return { text: JSON.stringify({ fields: [] }), provider: 'groq', model: 'm', finishReason: 'stop' }; } },
      { tool: ai, current: [], brief: 'We are a small auto-parts maker facing steel price swings.' },
    );
    expect(sawSystem).toContain('PESTEL');
    expect(r.ok).toBe(false); // nothing usable came back from the pretend AI, and nothing is saved
  });
});
