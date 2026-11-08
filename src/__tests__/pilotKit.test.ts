// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { interpret, sampleOf } from '@/lib/strategyModels/declarative';
import { buildWorkbook, readWorkbook, workbookBytes } from '@/lib/tools/workbook';
import { PILOTS } from '@/lib/agents/pilots';

describe('every pilot ships a working Excel kit', () => {
  for (const p of PILOTS) {
    const def = interpret(p.tool);
    const sample = sampleOf(p.tool)!;

    it(`${p.tool.name}: the sample workbook reads back to exactly the sample`, () => {
      const bytes = workbookBytes(buildWorkbook(p.tool.name, def, sample));
      const r = readWorkbook(def, bytes);
      for (const [k, v] of Object.entries(sample.values)) expect(r.values.fields[k] ?? '', `${p.agent}: field ${k}`).toBe(v);
      for (const [k, rows] of Object.entries(sample.tables)) {
        const got = (r.values.tables[k] ?? []) as Record<string, string>[];
        expect(got.length, `${p.agent}: rows in ${k}`).toBe(rows.length);
        rows.forEach((row, i) => { for (const [ck, cv] of Object.entries(row)) expect(got[i][ck] ?? '', `${p.agent}: ${k}[${i}].${ck}`).toBe(cv); });
      }
    });

    it(`${p.tool.name}: the blank template builds and reads back empty`, () => {
      const bytes = workbookBytes(buildWorkbook(p.tool.name, def, null));
      const r = readWorkbook(def, bytes);
      expect(Object.values(r.values.fields).filter((x) => String(x).trim())).toEqual([]);
    });
  }
});
