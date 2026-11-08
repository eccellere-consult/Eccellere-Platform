// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { flowOf } from '@/lib/agents/flow';
import { inputsOf, outputsOf } from '@/lib/agents/sipoc';
import { PILOTS } from '@/lib/agents/pilots';

describe('agent flow', () => {
  for (const p of PILOTS) {
    it(`${p.agent}: six numbered steps in order, each with something to show`, () => {
      const steps = flowOf(p.sipoc, inputsOf(p.tool), outputsOf(p.tool));
      expect(steps.map((s) => s.name)).toEqual(['Perceive', 'Context', 'Memory', 'Reason', 'Action', 'Learn']);
      expect(steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
      for (const s of steps) { expect(s.meaning.length).toBeGreaterThan(10); expect(s.points.length, `${p.agent} ${s.name}`).toBeGreaterThan(0); }
    });
    it(`${p.agent}: Reason shows its own process and Action its own results`, () => {
      const steps = flowOf(p.sipoc, inputsOf(p.tool), outputsOf(p.tool));
      expect(steps[3].points[0]).toBe(p.sipoc.process[0]);
      expect(steps[4].points[0]).toBe(outputsOf(p.tool).find((o) => o.kind === 'result')!.label);
    });
  }
});
