import { describe, expect, it } from 'vitest';
import { AI_SOURCE, MIXED_SOURCE, blankFixedRows, buildAnalyzeMessages, buildGenerateMessages, describePart, fillableLabels, mergeGenerated, parseGenerated } from '../lib/strategyHubAi';
import { getModelDefinition } from '../lib/strategyModels/registry';
import { flattenStructure, tablePartsOf } from '../lib/strategyModels/values';

// With a model, the AI is told each element's own form, and what comes back is validated against it.
const bcgDef = getModelDefinition('bcg')!;
const porterDef = getModelDefinition('porter5')!;
const forcesPart = tablePartsOf(porterDef).find((t) => t.key === 'forces')!;
const bcgFramework = { name: 'BCG Matrix', layer: 'L1' as const, fields: flattenStructure(bcgDef) };
const ctx = { contextBlock: '', valueScanBlock: '', upstreamBlock: '' };

describe('describePart', () => {
  const allParts = [...bcgDef.sections, ...porterDef.sections].flatMap((s) => s.parts);
  const part = (key: string) => allParts.find((p) => p.key === key)!;

  it('gives the unit of a number', () => {
    expect(describePart(1, part('growth_cutoff'))).toContain('a number (% a year)');
  });

  it('describes a table as rows with keyed, typed columns — and leaves out the worked-out ones', () => {
    const text = describePart(2, part('lines'));
    expect(text).toContain('This is a TABLE');
    expect(text).toContain('"revenue" (a number (₹ lakh))');
    expect(text).toContain('"plan" (one of: Build | Hold | Harvest | Divest)');
    expect(text).not.toContain('"quadrant"');
  });

  it('describes a fixed table as exactly one row per named row, with a rating scale', () => {
    const text = describePart(1, part('forces'));
    expect(text).toContain('Exactly one row for each of: "Threat of new entrants"');
    expect(text).toContain('"intensity" (a whole number from 1 (weak pressure on profit) to 5 (intense pressure on profit))');
    expect(text).toContain('put the row name in "force"');
  });
});

describe('fillableLabels with a model', () => {
  const rowsJson = JSON.stringify([{ name: 'Brake pads', growth: '9' }]);
  const labels = (cur: { label: string; value: string; source?: string }[]) => fillableLabels(bcgFramework, cur, bcgDef);

  it('treats a table with no rows (or only blank ones) as unanswered, and one with data as the client\'s own', () => {
    expect(labels([{ label: 'Product lines', value: JSON.stringify([]), source: 'Manual' }])).toContain('Product lines');
    expect(labels([{ label: 'Product lines', value: JSON.stringify([{}]), source: 'Manual' }])).toContain('Product lines');
    expect(labels([{ label: 'Product lines', value: rowsJson, source: 'Manual' }])).not.toContain('Product lines');
    expect(labels([{ label: 'Product lines', value: rowsJson, source: AI_SOURCE }])).toContain('Product lines');
  });
});

describe('buildGenerateMessages with a model', () => {
  it('asks for tables under "tables", lists only what is to be drafted, and shows what the client already gave as readable text', () => {
    const current = [{ label: 'Market growth cut-off', value: '12', source: 'Manual' }];
    const fillable = fillableLabels(bcgFramework, current, bcgDef);
    const { system, user } = buildGenerateMessages({ framework: bcgFramework, structure: bcgDef, methodology: 'M', fillable, current, ctx });
    expect(system).toContain('"tables":[{"label"');
    expect(system).toContain('"Product lines" —');
    expect(system).not.toContain('"Market growth cut-off" —');
    expect(user).toContain('- Market growth cut-off: 12');
    expect(user).not.toContain('(left blank)');
  });

  it('asks for plain fields only when nothing to draft is a table', () => {
    const { system } = buildGenerateMessages({ framework: bcgFramework, structure: bcgDef, methodology: 'M', fillable: ['Capital allocation decision'], current: [], ctx });
    expect(system).not.toContain('"tables"');
  });
});

describe('parseGenerated with a model — validated, never trusted', () => {
  const fillable = ['Market growth cut-off', 'Relative share cut-off', 'Capital allocation decision', 'Product lines'];

  it('keeps a number as a number, and drops one that is not', () => {
    const ok = parseGenerated(JSON.stringify({ fields: [{ label: 'Market growth cut-off', value: '12%' }, { label: 'Relative share cut-off', value: 'about one' }] }), fillable, bcgDef);
    expect([...ok]).toEqual([['Market growth cut-off', '12']]);
  });

  it('reads a table\'s rows, drops cells that break the column\'s rule, ignores worked-out columns, and caps the rows', () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({ name: `Line ${i}`, revenue: '100', growth: '9', share: '1.2', plan: i === 0 ? 'Sell it all' : 'Hold', quadrant: 'Star' }));
    const out = parseGenerated(JSON.stringify({ tables: [{ label: 'Product lines', rows }] }), fillable, bcgDef);
    const saved = JSON.parse(out.get('Product lines')!);
    expect(saved).toHaveLength(10);
    expect(saved[0]).toEqual({ name: 'Line 0', revenue: '100', growth: '9', share: '1.2' }); // the invalid plan and the computed quadrant are gone
    expect(saved[1].plan).toBe('Hold');
  });

  it('accepts a table given as a JSON string under fields, and drops a table with no usable rows', () => {
    const asString = parseGenerated(JSON.stringify({ fields: [{ label: 'Product lines', value: JSON.stringify([{ name: 'A', revenue: '5' }]) }] }), fillable, bcgDef);
    expect(JSON.parse(asString.get('Product lines')!)).toEqual([{ name: 'A', revenue: '5' }]);
    expect(parseGenerated(JSON.stringify({ tables: [{ label: 'Product lines', rows: [{}, 'junk', null] }] }), fillable, bcgDef).has('Product lines')).toBe(false);
  });

  it('for a fixed table: aligns rows to the model\'s own rows by name, drops the rest, and bounds a rating to its scale', () => {
    const out = parseGenerated(JSON.stringify({ tables: [{ label: 'The five forces', rows: [
      { force: 'competitive RIVALRY', drivers: 'Many shops', intensity: '4/5' },
      { force: 'Threat of new entrants', drivers: 'Costly lines', intensity: 9 },
      { force: 'Invented force', drivers: 'x', intensity: 3 },
    ] }] }), ['The five forces'], porterDef);
    const saved = JSON.parse(out.get('The five forces')!);
    expect(saved).toEqual([{ force: 'Competitive rivalry', drivers: 'Many shops', intensity: '4' }, { force: 'Threat of new entrants', drivers: 'Costly lines' }]);
  });

  it('still reads a plain framework (no model) exactly as before', () => {
    expect([...parseGenerated(JSON.stringify({ fields: [{ label: 'Buyer power', value: ' High ' }] }), ['Buyer power'])]).toEqual([['Buyer power', 'High']]);
  });
});

// The five forces are the model's own rows. A client who has filled in some of them can still have the AI draft the rest.
describe('a table of the model\'s own rows the client has only partly answered', () => {
  const porterFramework = { name: "Porter's Five Forces", layer: 'L1' as const, fields: flattenStructure(porterDef) };
  const own = JSON.stringify([{ force: 'Threat of substitutes', drivers: 'EV drivetrains cut engine parts', intensity: '3' }]);
  const current = [
    { label: 'Industry and segment analysed', value: 'Precision parts for OEMs', source: 'Manual' },
    { label: 'The five forces', value: own, source: 'Manual' },
  ];

  it('is fillable while some rows are empty, and not once every row has data', () => {
    expect(blankFixedRows(forcesPart, own)).toEqual(['Threat of new entrants', 'Bargaining power of suppliers', 'Bargaining power of buyers', 'Competitive rivalry']);
    expect(fillableLabels(porterFramework, current, porterDef)).toContain('The five forces');
    const full = JSON.stringify(['Threat of new entrants', 'Bargaining power of suppliers', 'Bargaining power of buyers', 'Threat of substitutes', 'Competitive rivalry'].map((force) => ({ force, drivers: 'x' })));
    expect(blankFixedRows(forcesPart, full)).toEqual([]);
    expect(fillableLabels(porterFramework, [{ label: 'The five forces', value: full, source: 'Manual' }], porterDef)).not.toContain('The five forces');
  });

  it('is never fillable for a table of free rows the client has started (their own list)', () => {
    const lines = JSON.stringify([{ name: 'Brake pads', growth: '9' }]);
    expect(fillableLabels(bcgFramework, [{ label: 'Product lines', value: lines, source: 'Manual' }], bcgDef)).not.toContain('Product lines');
  });

  it('asks the AI only for the empty rows, and shows it the rows the client filled in', () => {
    const fillable = fillableLabels(porterFramework, current, porterDef);
    const { system, user } = buildGenerateMessages({ framework: porterFramework, structure: porterDef, methodology: 'M', fillable, current, ctx });
    expect(system).toContain('"Threat of new entrants", "Bargaining power of suppliers", "Bargaining power of buyers", "Competitive rivalry"');
    expect(system).not.toMatch(/Exactly one row for each of:[^;]*"Threat of substitutes"/);
    expect(system).toContain('already answered by the client');
    expect(user).toContain('EV drivetrains cut engine parts');
    expect(user).toContain('Precision parts for OEMs');
  });

  it('keeps the client\'s rows exactly, adds the AI\'s for the empty ones, and says the table is both', () => {
    const fillable = fillableLabels(porterFramework, current, porterDef);
    const drafted = JSON.stringify([
      { force: 'Threat of new entrants', drivers: 'AI: heavy capex', intensity: '2' },
      { force: 'Threat of substitutes', drivers: 'AI: must not replace the client\'s row', intensity: '1' },
      { force: 'Competitive rivalry', drivers: 'AI: many shops', intensity: '4' },
    ]);
    const merged = mergeGenerated(porterFramework, current, fillable, new Map([['The five forces', drafted]]), porterDef);
    const table = merged.find((f) => f.label === 'The five forces')!;
    const rows = JSON.parse(table.value);
    expect(rows.map((r: { force: string }) => r.force)).toEqual(['Threat of new entrants', 'Threat of substitutes', 'Competitive rivalry']); // in the model's own order
    expect(rows[1]).toEqual({ force: 'Threat of substitutes', drivers: 'EV drivetrains cut engine parts', intensity: '3' });
    expect(rows[0].drivers).toBe('AI: heavy capex');
    expect(table.source).toBe(MIXED_SOURCE);
    // every other field is as it was
    expect(merged.find((f) => f.label === 'Industry and segment analysed')).toMatchObject({ value: 'Precision parts for OEMs', source: 'Manual' });
  });

  it('a table the AI wrote earlier is re-drafted whole, and a blank one is drafted whole', () => {
    const aiTable = [{ label: 'The five forces', value: own, source: AI_SOURCE }];
    const drafted = JSON.stringify([{ force: 'Competitive rivalry', drivers: 'AI: many shops', intensity: '4' }]);
    const merged = mergeGenerated(porterFramework, aiTable, fillableLabels(porterFramework, aiTable, porterDef), new Map([['The five forces', drafted]]), porterDef);
    expect(merged.find((f) => f.label === 'The five forces')).toEqual({ label: 'The five forces', value: drafted, source: AI_SOURCE });
  });
});

describe('buildAnalyzeMessages with a model', () => {
  it('sends the answers as structured text with the worked-out figures, and the model\'s own guidance for the verdict', () => {
    const fields = [
      { label: 'Product lines', value: JSON.stringify([{ name: 'Brake pads', revenue: '4700', growth: '12', share: '1.4' }]), source: 'Manual' },
      { label: 'Capital allocation decision', value: 'Fund the star', source: 'Manual' },
    ];
    const { system, user } = buildAnalyzeMessages({ framework: bcgFramework, structure: bcgDef, analysisGuide: bcgDef.analysisGuide, methodology: 'M', fields, ctx });
    expect(system).toContain("HOW TO REACH THIS MODEL'S VERDICT");
    expect(system).toContain('Cash cow');
    expect(user).toContain('| Brake pads | 4700 | 12 | 1.4 | Star |');
    expect(user).toContain('- Capital allocation decision: Fund the star');
    expect(user).toContain('## Figures worked out from these answers');
  });
});
