// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { makeOnlineVersion, type MakeOnlineDeps } from '@/lib/marketplace/makeOnline';
import type { SourceReading } from '@/lib/forms/source';
import type { ToolInput } from '@/lib/tools/repo';

const asset = { slug: 'change-readiness-kit', title: 'Change Readiness Kit', description: 'Check how ready your team is.' };
const reading = { fileName: 'kit.xlsx', kind: 'excel', elements: [], warnings: [], truncated: false } as unknown as SourceReading;
const tool = { slug: 'some-other-slug', name: 'Change Readiness Kit', category: 'strategy', definition: {}, status: 'PUBLISHED' } as unknown as ToolInput;

function deps(over: Partial<MakeOnlineDeps> = {}): MakeOnlineDeps & { saved: ToolInput[] } {
  const saved: ToolInput[] = [];
  return {
    saved,
    readFile: async () => ({ name: 'kit.xlsx', data: Buffer.from('x') }),
    readSource: async () => reading,
    toolState: async () => null,
    build: async () => ({ kind: 'ok', tool, coverage: null, notes: ['n1'] }),
    save: async (t) => { saved.push(t); return { slug: t.slug, name: t.name, status: String(t.status) }; },
    category: 'Strategy' as never,
    practice: 'Strategy' as never,
    ...over,
  };
}

describe('make a fill-online version of a toolkit', () => {
  it('saves a draft under the SAME slug as the toolkit and never publishes', async () => {
    const d = deps();
    const r = await makeOnlineVersion(asset, d);
    expect(r).toMatchObject({ kind: 'ok', slug: 'change-readiness-kit', status: 'NEEDS_REVIEW' });
    expect(d.saved[0].slug).toBe('change-readiness-kit');
    expect(d.saved[0].status).toBe('NEEDS_REVIEW');
  });
  it('asks the builder for a toolkit built from the toolkit’s own file', async () => {
    const build = vi.fn(deps().build);
    await makeOnlineVersion(asset, deps({ build }));
    const req = build.mock.calls[0][0];
    expect(req.assetType).toBe('toolkit');
    expect(req.name).toBe('Change Readiness Kit');
    expect(req.readings).toEqual([reading]);
  });
  it('does nothing when an online version already exists', async () => {
    const build = vi.fn();
    const r = await makeOnlineVersion(asset, deps({ toolState: async () => ({ replaceable: false }), build }));
    expect(r).toEqual({ kind: 'exists', slug: 'change-readiness-kit' });
    expect(build).not.toHaveBeenCalled();
  });
  it('rebuilds an unreviewed draft made by the document reader, over the same slug', async () => {
    const d = deps({ toolState: async () => ({ replaceable: true }) });
    const r = await makeOnlineVersion(asset, d);
    expect(r.kind).toBe('ok');
    expect(d.saved[0].slug).toBe('change-readiness-kit');
  });
  it('says so when no file is attached, and does not call the AI', async () => {
    const build = vi.fn();
    expect(await makeOnlineVersion(asset, deps({ readFile: async () => null, build }))).toEqual({ kind: 'no_file' });
    expect(build).not.toHaveBeenCalled();
  });
  it('gives the reading error in plain words', async () => {
    const r = await makeOnlineVersion(asset, deps({ readSource: async () => { throw new Error('No text could be read from that PDF.'); } }));
    expect(r).toEqual({ kind: 'unreadable', reason: 'No text could be read from that PDF.' });
  });
  it('passes AI trouble through and saves nothing', async () => {
    const d = deps({ build: async () => ({ kind: 'ai_down', reason: 'No AI provider is switched on.' }) });
    expect(await makeOnlineVersion(asset, d)).toEqual({ kind: 'ai_down', reason: 'No AI provider is switched on.' });
    expect(d.saved).toEqual([]);
    const f = deps({ build: async () => ({ kind: 'failed', reason: 'bad' }) });
    expect((await makeOnlineVersion(asset, f)).kind).toBe('failed');
    expect(f.saved).toEqual([]);
  });
});
