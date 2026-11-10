import { describe, expect, it } from 'vitest';
import { buildGrid, sectorColumns } from '@/lib/marketplace/grid';

const FIXED = ['Manufacturing', 'Retail'];
const ROWS = ['Strategy', 'Digital'];

describe('the function x industry grid', () => {
  const assets = [
    { category: 'Strategy', sectors: ['Manufacturing'] },
    { category: 'Strategy', sectors: ['Manufacturing', 'Retail'] },
    { category: 'Strategy', sectors: ['All Sectors'] },
    { category: 'Digital', sectors: ['Healthcare'] },
    { category: 'Organisation', sectors: ['Retail'] }, // not one of the rows: ignored
  ];

  it('counts each toolkit in the sectors it is made for, and an All Sectors toolkit in every column', () => {
    const g = buildGrid(assets, ROWS, FIXED);
    expect(g.cells[0].map((c) => c.count)).toEqual([3, 2]);
    expect(g.cells[1].map((c) => c.count)).toEqual([0, 0]);
    expect(g.rowTotals).toEqual([3, 1]);
    expect(g.columnTotals).toEqual([3, 2]);
    expect(g.total).toBe(4);
  });

  it('leaves an empty cell at 0, never a made-up number', () => {
    const g = buildGrid([], ROWS, FIXED);
    expect(g.cells.flat().every((c) => c.count === 0)).toBe(true);
    expect(g.total).toBe(0);
  });

  it('keeps the fixed sectors first and adds the most common extra sectors from the data', () => {
    const cols = sectorColumns(assets, FIXED, 2);
    expect(cols.slice(0, 2)).toEqual(FIXED);
    expect(cols).toContain('Healthcare');
    expect(sectorColumns([{ category: 'x', sectors: ['A'] }, { category: 'x', sectors: ['A'] }, { category: 'x', sectors: ['B'] }], [], 1)).toEqual(['A']);
  });

  it('counts a toolkit with no sector listed as meant for every industry', () => {
    const g = buildGrid([{ category: 'Strategy', sectors: [] }], ROWS, FIXED);
    expect(g.cells[0].map((c) => c.count)).toEqual([1, 1]);
  });
});
