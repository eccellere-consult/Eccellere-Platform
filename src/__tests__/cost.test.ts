import { describe, expect, it } from 'vitest';
import { OPUS_RATES, costLine, estimateCost } from '@/lib/forms/cost';
import { estimateOnline } from '@/lib/marketplace/makeOnline';
import type { SourceReading } from '@/lib/forms/source';

describe('cost shown before an AI build', () => {
  it('works the dollars out from the size of what is sent, at the published rates', () => {
    // 30,000 characters = 10,000 tokens in. One attempt, 4,500 tokens out: 10000*4/1e6 + 4500*20/1e6 = 0.04 + 0.09 = 0.13
    // Two attempts, 9,000 out each: 2 * (0.04 + 0.18) = 0.44
    const c = estimateCost(30_000);
    expect(c.inputTokens).toBe(10_000);
    expect(c.lowUsd).toBe(0.13);
    expect(c.highUsd).toBe(0.44);
    expect(c.model).toBe(OPUS_RATES.model);
  });
  it('is always a range and says what it is based on', () => {
    const c = estimateCost(90_000);
    expect(c.highUsd).toBeGreaterThan(c.lowUsd);
    expect(costLine(c)).toMatch(/^Estimated cost: about US\$\d+\.\d\d to US\$\d+\.\d\d/);
    expect(c.basis).toMatch(/per million tokens/);
  });
  it('handles an empty document', () => {
    expect(estimateCost(0).inputTokens).toBe(0);
  });
});

describe('estimating an AI build calls no AI and builds nothing', () => {
  const asset = { slug: 'k', title: 'Kit', description: 'd' };
  const reading = { fileName: 'k.docx', kind: 'word', elements: [], warnings: [], truncated: false } as unknown as SourceReading;
  const deps = (over = {}) => ({ readFile: async () => ({ name: 'k.docx', data: Buffer.from('x') }), readSource: async () => reading, toolState: async () => null, category: 'Strategy' as never, practice: 'Strategy' as never, promptSize: () => 1234, ...over });
  it('returns the prompt size', async () => { expect(await estimateOnline(asset, deps())).toEqual({ kind: 'estimate', chars: 1234 }); });
  it('leaves a reviewed or hand-made tool alone', async () => { expect(await estimateOnline(asset, deps({ toolState: async () => ({ replaceable: false }) }))).toEqual({ kind: 'exists', slug: 'k' }); });
  it('says so when there is no file', async () => { expect(await estimateOnline(asset, deps({ readFile: async () => null }))).toEqual({ kind: 'no_file' }); });
});
