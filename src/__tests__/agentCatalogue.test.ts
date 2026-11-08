import { describe, expect, it } from 'vitest';
import { AREAS, allAgents, pilotCount } from '@/lib/agents/catalogue';

describe('Agent Marketplace catalogue', () => {
  it('carries the 21 agents of the original 7 areas, three per area', () => {
    const original = AREAS.filter((a) => !a.proposed);
    expect(original).toHaveLength(7);
    for (const a of original) expect(a.agents).toHaveLength(3);
    expect(allAgents()).toHaveLength(21);
  });
  it('has no overlap: every area id, code, agent slug and agent name appears once', () => {
    const uniq = (xs: string[]) => new Set(xs).size === xs.length;
    expect(uniq(AREAS.map((a) => a.id))).toBe(true);
    expect(uniq(AREAS.map((a) => a.code))).toBe(true);
    expect(uniq(allAgents().map((a) => a.slug))).toBe(true);
    expect(uniq(allAgents().map((a) => a.name))).toBe(true);
  });
  it('fills the gaps with proposed areas that promise no agents yet', () => {
    const extra = AREAS.filter((a) => a.proposed);
    expect(extra.map((a) => a.id).sort()).toEqual(['data', 'risk', 'service']);
    for (const a of extra) expect(a.agents).toEqual([]);
  });
  it('only calls an agent a pilot when a working tool exists for it', () => {
    for (const a of allAgents()) expect(a.status === 'pilot').toBe(!!a.tool);
    expect(pilotCount()).toBe(allAgents().filter((a) => a.tool).length);
  });
});
