import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { computeDerived, computeOutputs } from '@/lib/strategyModels/values';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';

// A computed column is worked out on screen and never stored in the saved rows. A rule that reads one (the top row by it, a total of it)
// must work it out again, or the result silently never appears. This was found by the Tools marketplace; these tests keep it fixed.
const values = (rows: Record<string, string>[]) => ({ fields: {}, tables: { options: rows } });

describe('rules that read a computed column', () => {
  const def = interpret(EXAMPLE_TOOL);

  it("'top' picks the row with the highest worked-out value", () => {
    const out = computeOutputs(def, values([{ option: 'A', impact: '4', effort: '2' }, { option: 'B', impact: '3', effort: '2' }, { option: 'C', impact: '5', effort: '5' }]));
    expect(out.find((o) => o.key === 'start_with')?.value).toBe('A');
  });

  it('shows nothing until a row can be worked out, rather than guessing', () => {
    const out = computeOutputs(def, values([{ option: 'A', impact: '4' }]));
    expect(out.find((o) => o.key === 'start_with')?.value ?? '').toBe('');
  });

  it("'agg' over a computed column sums and counts the worked-out values", () => {
    const tool: DeclarativeTool = JSON.parse(JSON.stringify(EXAMPLE_TOOL));
    tool.derived = [
      { key: 'total_ratio', label: 'Total', rule: { op: 'calc', expr: { agg: 'sum', table: 'options', col: 'ratio' }, format: 'dp1' } },
      { key: 'worked_out', label: 'Rows worked out', rule: { op: 'calc', expr: { agg: 'count', table: 'options', col: 'ratio' }, format: 'int' } },
    ];
    expect(qualityGate(tool).blockers).toEqual([]);
    const d = computeDerived(interpret(tool), values([{ option: 'A', impact: '4', effort: '2' }, { option: 'B', impact: '3', effort: '2' }, { option: 'C', impact: '5' }]));
    expect(d.find((x) => x.key === 'total_ratio')?.value).toBe('3.5'); // 2 + 1.5; row C has no effort, so it is not counted
    expect(d.find((x) => x.key === 'worked_out')?.value).toBe('2');
  });

  it("'weighted' can use a computed column as its value", () => {
    const tool: DeclarativeTool = JSON.parse(JSON.stringify(EXAMPLE_TOOL));
    tool.derived = [{ key: 'w', label: 'Weighted', rule: { op: 'weighted', table: 'options', value: 'ratio', weight: 'impact', format: 'dp1' } }];
    const d = computeDerived(interpret(tool), values([{ option: 'A', impact: '4', effort: '2' }, { option: 'B', impact: '2', effort: '2' }]));
    expect(d[0].value).toBe('1.7'); // (2 x 4 + 1 x 2) / 6
  });
});
