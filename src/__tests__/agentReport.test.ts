// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx-js-style';
import { interpret, sampleOf } from '@/lib/strategyModels/declarative';
import type { ModelValues } from '@/lib/strategyModels/types';
import { PILOTS } from '@/lib/agents/pilots';
import { demoOf } from '@/lib/agents/demo';
import { hasReport, reportOf, reportWorkbook } from '@/lib/agents/report';

describe('agent report', () => {
  for (const p of PILOTS) {
    const def = interpret(p.tool);
    const s = sampleOf(p.tool)!;
    const values = { fields: s.values, tables: s.tables } as ModelValues;

    it(`${p.agent}: the report on the sample has the same headline results as the demo`, () => {
      const r = reportOf(def, values);
      expect(hasReport(r)).toBe(true);
      const demo = demoOf(p.tool)!;
      expect(r.results).toEqual(demo.results);
      expect(r.tables.length).toBeGreaterThan(0);
    });

    it(`${p.agent}: the results workbook has a Results sheet with those results`, () => {
      const r = reportOf(def, values);
      const wb = XLSX.read(XLSX.write(reportWorkbook(p.tool.name, r, true), { type: 'array', bookType: 'xlsx' }), { type: 'array' });
      expect(wb.SheetNames[0]).toBe('Results');
      const text = JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets.Results, { header: 1 }));
      for (const x of r.results) { expect(text).toContain(x.label); expect(text).toContain(x.value); }
      expect(wb.SheetNames.length).toBe(1 + r.tables.length);
    });
  }

  it('an empty form gives no report and no charts', () => {
    const r = reportOf(interpret(PILOTS[0].tool), { fields: {}, tables: {} });
    expect(hasReport(r)).toBe(false);
    expect(r.charts).toEqual([]);
  });

  it('the capital allocation sample charts NPV per project from the agent’s own formula', () => {
    const p = PILOTS.find((x) => x.agent === 'capital-allocation-advisor')!;
    const s = sampleOf(p.tool)!;
    const r = reportOf(interpret(p.tool), { fields: s.values, tables: s.tables } as ModelValues);
    expect(r.charts.length).toBeGreaterThan(0);
    expect(r.charts[0].bars.length).toBe(s.tables[Object.keys(s.tables)[0]].length);
    for (const b of r.charts[0].bars) expect(Number.isFinite(b.value)).toBe(true);
  });
});
