import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx-js-style';
import { buildWorkbook, readWorkbook, workbookBytes } from '@/lib/tools/workbook';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { interpret } from '@/lib/strategyModels/declarative';
import { parseToolList, slugify } from '@/lib/tools/service';

const def = interpret(EXAMPLE_TOOL);
const sample = EXAMPLE_TOOL.sample!;

describe('the Excel template', () => {
  it('has a how-to sheet, a fields sheet and one sheet per table', () => {
    const wb = buildWorkbook('Impact-Effort Matrix', def, null);
    expect(wb.SheetNames).toEqual(['How to fill', 'Fields', 'Table 1', 'Table 2']);
  });

  it('round-trips the worked example: the sample workbook reads back as the same answers, and worked-out columns are left out', () => {
    const bytes = workbookBytes(buildWorkbook('Impact-Effort Matrix', def, sample));
    const r = readWorkbook(def, bytes);
    expect(r.values.fields).toEqual(sample.values);
    expect(r.values.tables.options).toEqual(sample.tables.options);
    expect(r.values.tables.actions).toEqual(sample.tables.actions);
    expect(r.notes).toEqual([]);
    const sheet = XLSX.read(bytes, { type: 'array' }).Sheets['Table 1'];
    expect(JSON.stringify(sheet)).not.toContain('Impact per effort');
  });

  it('reads a blank template as nothing answered, and says so', () => {
    const r = readWorkbook(def, workbookBytes(buildWorkbook('X', def, null)));
    expect(r.answered).toBe(0);
    expect(r.notes.join(' ')).toMatch(/Nothing was found/);
  });

  it('leaves out a rating outside the scale or a choice that is not offered, and reports each', () => {
    const wb = buildWorkbook('X', def, sample);
    const t1 = wb.Sheets['Table 1'];
    t1['B5'].v = '9'; // Impact of the first option: out of 1 to 5
    wb.Sheets['Table 2']['D5'].v = 'next year'; // When: not one of the windows
    const r = readWorkbook(def, workbookBytes(wb));
    expect(r.values.tables.options[0].impact).toBeUndefined();
    expect(r.values.tables.actions[0].horizon).toBeUndefined();
    expect(r.notes.filter((n) => /left out/.test(n))).toHaveLength(2);
  });

  it('does not read a table whose headings were changed', () => {
    const wb = buildWorkbook('X', def, sample);
    wb.Sheets['Table 1']['A3'].v = 'Idea';
    const r = readWorkbook(def, workbookBytes(wb));
    expect(r.values.tables.options).toBeUndefined();
    expect(r.notes.join(' ')).toMatch(/changed headings/);
  });
});

describe('the tool list has no small limits', () => {
  it('keeps long names, accented and non-English names, and names ending in a full stop', () => {
    const long = `A ${'very '.repeat(20)}long tool name`;
    const r = parseToolList(['Value Proposition Canvas.', 'Café Matrix', 'डिज़ाइन सोच', long].join('\n'));
    expect(r.entries.map((e) => e.name)).toEqual(['Value Proposition Canvas', 'Café Matrix', 'डिज़ाइन सोच', long]);
    expect(r.skipped).toEqual([]);
    expect(slugify('Café Matrix')).toBe('café-matrix');
  });

  it('accepts a list of several hundred tools in one go', () => {
    const r = parseToolList(Array.from({ length: 800 }, (_, i) => `Tool number ${i}`).join('\n'));
    expect(r.entries).toHaveLength(800);
  });
});
