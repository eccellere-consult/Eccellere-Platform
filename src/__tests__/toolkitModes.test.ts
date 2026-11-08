// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { OFFLINE_ANCHOR, toolkitModes } from '@/lib/marketplace/modes';

describe('toolkit modes', () => {
  it('offers the online version at /tools/<same slug> when one is published', () => {
    const [online, offline] = toolkitModes('change-readiness-kit', 'Change readiness');
    expect(online.href).toBe('/tools/change-readiness-kit');
    expect(online.action).toMatch(/Open/);
    expect(offline.href).toBe(OFFLINE_ANCHOR);
  });
  it('says coming soon, with no link, when there is no published online version', () => {
    const [online, offline] = toolkitModes('x', null);
    expect(online.href).toBeNull();
    expect(online.action).toBe('Coming soon');
    expect(offline.href).toBe(OFFLINE_ANCHOR);
  });
  it('always gives the two ways in the same order', () => {
    expect(toolkitModes('a', null).map((m) => m.id)).toEqual(['online', 'offline']);
  });
});
