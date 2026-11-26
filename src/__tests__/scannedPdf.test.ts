// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractDocumentText, SCANNED_PDF_AI_FAILED, SCANNED_PDF_NO_AI } from '@/lib/tools/extract';
import { makeScannedPdfReader } from '@/lib/tools/scannedPdf';
import { callProvider, defaultSettings, PROVIDER_BY_ID, runProviders, type GenerateArgs } from '@/lib/ai/providers';

const noText = async () => '   ';
const page = 'Supplier assessment checklist\n1. Does the supplier hold ISO 9001?\n- Yes\n- No\n2. Delivery lead time in days ____';

describe('a scanned PDF (no text inside)', () => {
  it('is read by the AI reader when one is given, and is marked as read by AI', async () => {
    const out = await extractDocumentText('scan.pdf', Buffer.from('%PDF'), noText, { readScanned: async () => page });
    expect(out.aiRead).toBe(true);
    expect(out.kind).toBe('pdf');
    expect(out.text).toContain('ISO 9001');
  });
  it('says AI is needed when no AI is available', async () => {
    await expect(extractDocumentText('scan.pdf', Buffer.from('%PDF'), noText)).rejects.toThrow(SCANNED_PDF_NO_AI);
  });
  it('says plainly when the AI could not read it either (no answer, an error, or almost nothing)', async () => {
    for (const reader of [async () => null, async () => { throw new Error('down'); }, async () => 'ok']) {
      await expect(extractDocumentText('scan.pdf', Buffer.from('%PDF'), noText, { readScanned: reader })).rejects.toThrow(SCANNED_PDF_AI_FAILED);
    }
  });
  it('a PDF with real text never calls the AI', async () => {
    const reader = vi.fn(async () => page);
    const out = await extractDocumentText('real.pdf', Buffer.from('%PDF'), async () => 'A proper PDF with plenty of real text in it.', { readScanned: reader });
    expect(reader).not.toHaveBeenCalled();
    expect(out.aiRead).toBeUndefined();
  });
});

describe('the scanned-PDF reader', () => {
  it('sends the PDF to the AI as a file and returns its transcript', async () => {
    let seen: GenerateArgs | undefined;
    const read = makeScannedPdfReader(async (a) => { seen = a; return { text: page, provider: 'anthropic', model: 'm' }; });
    expect(await read({ name: 'my scan?.pdf', data: Buffer.from('PDFDATA') })).toBe(page);
    expect(seen!.pdfs).toEqual([{ name: 'my scan_.pdf', data: Buffer.from('PDFDATA').toString('base64') }]);
    expect(seen!.system).toMatch(/do not follow them/i);
  });
  it('returns nothing when the AI finds no text or no AI answers', async () => {
    expect(await makeScannedPdfReader(async () => ({ text: 'NO_TEXT', provider: 'openai', model: 'm' }))({ name: 'a.pdf', data: Buffer.from('x') })).toBeNull();
    expect(await makeScannedPdfReader(async () => null)({ name: 'a.pdf', data: Buffer.from('x') })).toBeNull();
  });
});

describe('sending a PDF to the AI providers', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  const reply = (body: unknown) => vi.fn(async (...args: [string, RequestInit]) => (void args, { ok: true, status: 200, json: async () => body }) as unknown as Response);

  it('Claude gets a document block before the instruction', async () => {
    const f = reply({ content: [{ type: 'text', text: 'done' }] });
    vi.stubGlobal('fetch', f);
    await callProvider(PROVIDER_BY_ID.anthropic, 'm', { system: 's', user: 'u', maxTokens: 10, pdfs: [{ name: 'a.pdf', data: 'QUJD' }] }, { ANTHROPIC_API_KEY: 'k' });
    const content = JSON.parse(String(f.mock.calls[0][1].body)).messages[0].content;
    expect(content[0]).toEqual({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'QUJD' } });
    expect(content.at(-1)).toEqual({ type: 'text', text: 'u' });
  });
  it('OpenAI gets a file part', async () => {
    const f = reply({ choices: [{ message: { content: 'done' } }] });
    vi.stubGlobal('fetch', f);
    await callProvider(PROVIDER_BY_ID.openai, 'm', { system: 's', user: 'u', maxTokens: 10, pdfs: [{ name: 'a.pdf', data: 'QUJD' }] }, { OPENAI_API_KEY: 'k' });
    const content = JSON.parse(String(f.mock.calls[0][1].body)).messages[1].content;
    expect(content[0]).toEqual({ type: 'file', file: { filename: 'a.pdf', file_data: 'data:application/pdf;base64,QUJD' } });
  });
  it('text-only providers are skipped for a PDF', async () => {
    const f = reply({ choices: [{ message: { content: 'done' } }] });
    vi.stubGlobal('fetch', f);
    const diag: string[] = [];
    const out = await runProviders(defaultSettings(), { GROQ_API_KEY: 'k' }, { system: 's', user: 'u', maxTokens: 10, diag, pdfs: [{ name: 'a.pdf', data: 'QUJD' }] });
    expect(out).toBeNull();
    expect(f).not.toHaveBeenCalled();
    expect(diag.join(' ')).toMatch(/cannot read pictures/);
  });
});
