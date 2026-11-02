/**
 * boards.test.ts — the board (canvas) kind: a fishbone (regions), an affinity wall (free regions) and an impact-effort grid, tested as pure
 * functions, and through the engine's own save, template and prompt paths to prove a board really is "a table whose rows are notes".
 */
import { describe, expect, it } from 'vitest';
import { section } from '../lib/strategyModels/build';
import { UNPLACED, boardTable, cellOf, cleanBoard, countsByRegion, nudge, placeNote, quadrantOf, regionList } from '../lib/strategyModels/boards';
import { strategyKit } from '../lib/strategyModels/kit';
import { cleanTable, fieldsFromValues, renderValuesForPrompt, valuesFromFields } from '../lib/strategyModels/values';
import type { ModelValues, Row, Structure } from '../lib/strategyModels/types';

const BONES = ['Machine', 'Method', 'Material', 'Manpower', 'Measurement', 'Environment'] as const;
const fishbone = boardTable('causes', 'Possible causes', 'One short cause per note, under the bone it belongs to.',
  { layout: 'regions', noteLabel: 'cause', noteColumn: 'cause', regionColumn: 'bone', statusColumn: 'status', statusTones: { Idea: 'neutral', 'Most likely': 'warn', 'Checked: true': 'bad', 'Ruled out': 'good' }, maxNoteChars: 120 },
  { regions: BONES, statuses: ['Idea', 'Most likely', 'Checked: true', 'Ruled out'] });
const affinity = boardTable('wall', 'Affinity wall', 'Group the notes that belong together, and name each group.',
  { layout: 'regions', noteLabel: 'idea', noteColumn: 'idea', regionColumn: 'group', freeRegions: { max: 5 }, maxNoteChars: 120 });
const grid = boardTable('fixes', 'Fixes', 'Place each fix by how much it helps and how hard it is.',
  { layout: 'grid', noteLabel: 'fix', noteColumn: 'fix', xColumn: 'effort', yColumn: 'impact', axes: { x: { label: 'Effort', low: 'easy', high: 'hard' }, y: { label: 'Impact', low: 'small', high: 'large' } },
    quadrants: [{ name: 'Quick win', xHigh: false, yHigh: true }, { name: 'Major project', xHigh: true, yHigh: true }, { name: 'Fill-in', xHigh: false, yHigh: false }, { name: 'Avoid', xHigh: true, yHigh: false }], maxNoteChars: 120 },
  { scale: { min: 1, max: 10 } });

const r = (o: Record<string, string>): Row => o;
const notes: Row[] = [
  r({ bone: 'Machine', cause: 'Shared gas regulator', status: 'Checked: true' }),
  r({ bone: 'Machine', cause: 'Worn contact tip', status: 'Idea' }),
  r({ bone: 'Method', cause: 'No utilities check on a new station' }),
  r({ bone: 'Material', cause: 'New wire lot', status: 'Ruled out' }),
];

describe('a board is a table whose rows are notes', () => {
  it('builds the columns its spec names, and is still an ordinary table', () => {
    expect(fishbone.columns.map((c) => c.key)).toEqual(['bone', 'cause', 'status']);
    expect(fishbone.columns[0].options).toEqual(BONES);
    expect(grid.columns.map((c) => c.key)).toEqual(['fix', 'effort', 'impact']);
    expect(grid.columns[1].scale).toMatchObject({ min: 1, max: 10, low: 'easy', high: 'hard' });
    expect(fishbone.minRows).toBe(0);
    expect(fishbone.board?.layout).toBe('regions');
  });
  it('rejects a spec that names a column the table does not have', () => {
    expect(() => regionList({ ...fishbone, board: { ...fishbone.board!, regionColumn: 'nope' } }, notes)).toThrow(/not one of its columns/);
    expect(() => countsByRegion({ ...fishbone, columns: [], board: fishbone.board }, notes)).toThrow();
  });
});

describe('regions boards', () => {
  it('lists the model’s own regions, or the groups the client has made (in the order first used, up to the limit)', () => {
    expect(regionList(fishbone, notes)).toEqual([...BONES]);
    const wall: Row[] = ['Tools', 'People', 'Tools', 'Timing', 'Cost', 'Space', 'Extra'].map((g, i) => r({ group: g, idea: `idea ${i}` }));
    expect(regionList(affinity, wall)).toEqual(['Tools', 'People', 'Timing', 'Cost', 'Space']);
  });
  it('counts notes by region, with a tray for a note whose region is not on the board', () => {
    expect(countsByRegion(fishbone, notes)).toEqual({ Machine: 2, Method: 1, Material: 1, Manpower: 0, Measurement: 0, Environment: 0 });
    const lost = [...notes, r({ bone: 'Weather', cause: 'Rain on the roof' })];
    expect(countsByRegion(fishbone, lost)[UNPLACED]).toBe(1);
    expect(cleanBoard(fishbone, lost)).toHaveLength(5); // never dropped
  });
  it('moves a note to another region without losing or changing any note', () => {
    const moved = placeNote(fishbone, notes, 1, { region: 'Manpower' });
    expect(moved.rows[moved.index]).toMatchObject({ cause: 'Worn contact tip', bone: 'Manpower' });
    expect(moved.rows.map((x) => x.cause).sort()).toEqual(notes.map((x) => x.cause).sort());
    expect(notes[1].bone).toBe('Machine'); // the input is untouched
    // with no position the note joins the end of its new region, after the notes already there
    const joined = placeNote(fishbone, notes, 1, { region: 'Material' });
    expect(joined.rows.map((x) => x.cause)).toEqual(['Shared gas regulator', 'No utilities check on a new station', 'New wire lot', 'Worn contact tip']);
    expect(joined.index).toBe(3);
  });
  it('puts a moved note in front of the note it is dropped on, and a drop in the same place changes nothing', () => {
    const toFront = placeNote(fishbone, notes, 3, { region: 'Machine', before: 0 });
    expect(toFront.rows.map((x) => x.cause)).toEqual(['New wire lot', 'Shared gas regulator', 'Worn contact tip', 'No utilities check on a new station']);
    expect(toFront.rows[0].bone).toBe('Machine');
    expect(toFront.index).toBe(0);
    expect(placeNote(fishbone, notes, 1, { region: 'Machine', before: 1 })).toEqual({ rows: notes, index: 1 });
    expect(placeNote(fishbone, notes, 1, { region: 'Machine', before: 2 })).toEqual({ rows: notes, index: 1 });
    expect(placeNote(fishbone, notes, 9, { region: 'Machine' })).toEqual({ rows: notes, index: -1 });
  });
  it('keyboard: left and right change the region, up and down the order, and each step is announced', () => {
    const right = nudge(fishbone, notes, 0, 'right');
    expect(right.rows[right.index]).toMatchObject({ cause: 'Shared gas regulator', bone: 'Method' });
    expect(right.announce).toBe('Shared gas regulator moved to Method.');
    expect(nudge(fishbone, notes, 0, 'left').announce).toBe('Shared gas regulator stays in Machine.');
    const down = nudge(fishbone, notes, 0, 'down');
    expect(down.rows.map((x) => x.cause).slice(0, 2)).toEqual(['Worn contact tip', 'Shared gas regulator']);
    expect(down.index).toBe(1);
    expect(down.announce).toBe('Shared gas regulator moved down in Machine, position 2 of 2.');
    expect(nudge(fishbone, notes, 0, 'up').announce).toBe('Shared gas regulator is already first in Machine.');
    expect(nudge(fishbone, notes, 7, 'up').announce).toBe('');
  });
  it('keeps a named group with no notes yet, and drops a note that has no text', () => {
    const rows = cleanBoard(affinity, [r({ group: 'Tools', idea: '' }), r({ group: '', idea: '' }), r({ group: 'People', idea: '  A trained backup  ' })]);
    expect(rows).toEqual([{ group: 'Tools' }, { group: 'People', idea: 'A trained backup' }]);
    expect(regionList(affinity, rows)).toEqual(['Tools', 'People']);
    expect(countsByRegion(affinity, rows)).toEqual({ Tools: 0, People: 1 });
  });
});

describe('grid boards (impact and effort)', () => {
  const fixes: Row[] = [
    r({ fix: 'Regulator per torch', effort: '2', impact: '9' }),
    r({ fix: 'Flow-meter alarm', effort: '1', impact: '6' }),
    r({ fix: 'Robot cell', effort: '9', impact: '9' }),
    r({ fix: 'Repaint the bay', effort: '3', impact: '1' }),
  ];
  it('reads the position and the quadrant, with the middle of the scale counting as low (1 to 10: 6 and up is high)', () => {
    expect(cellOf(grid, fixes[0])).toEqual({ x: 2, y: 9 });
    expect(fixes.map((f) => quadrantOf(grid, f))).toEqual(['Quick win', 'Quick win', 'Major project', 'Fill-in']);
    expect(quadrantOf(grid, r({ fix: 'edge', effort: '5', impact: '5' }))).toBe('Fill-in');
    expect(quadrantOf(grid, r({ fix: 'edge', effort: '6', impact: '6' }))).toBe('Major project');
    expect(quadrantOf(grid, r({ fix: 'unrated' }))).toBeNull();
  });
  it('snaps a drop to the scale, and clamps what is typed', () => {
    expect(placeNote(grid, fixes, 3, { x: 14, y: -2 }).rows[3]).toMatchObject({ effort: '10', impact: '1' });
    expect(cleanBoard(grid, [r({ fix: 'x', effort: '11.4', impact: '0' })])).toEqual([{ fix: 'x', effort: '10', impact: '1' }]);
  });
  it('keyboard: arrows change one rating by a step, inside the scale, and announce the quadrant', () => {
    const up = nudge(grid, fixes, 3, 'up');
    expect(up.rows[3].impact).toBe('2');
    expect(up.announce).toBe('Repaint the bay: Effort 3, Impact 2, Fill-in.');
    expect(nudge(grid, fixes, 2, 'right').rows[2].effort).toBe('10');
    expect(nudge(grid, fixes, 2, 'right').announce).toBe('Robot cell: Effort 10, Impact 9, Major project.');
    const edge = nudge(grid, [r({ fix: 'a', effort: '10', impact: '10' })], 0, 'up');
    expect(edge.rows[0].impact).toBe('10');
  });
});

describe('a board goes through the engine like any table', () => {
  const s: Structure = { sections: [section('s', 'Causes', 'The possible causes.', fishbone)], derived: [], outputs: [] };
  const v: ModelValues = { fields: {}, tables: { causes: notes } };
  it('is saved and read back as typed JSON rows', () => {
    const saved = fieldsFromValues(s, v);
    expect(saved).toHaveLength(1);
    expect(JSON.parse(saved[0].value)).toEqual(cleanTable(fishbone, notes));
    expect(valuesFromFields(s, saved).values.tables.causes).toEqual(cleanTable(fishbone, notes));
  });
  it('round-trips through the Excel template and sample workbook with no importer change', () => {
    const kit = strategyKit({ toolId: 'fish', name: 'Fishbone', structure: s });
    const content = kit.toContent(v);
    expect(kit.fromContent(content, []).tables.causes).toEqual(cleanTable(fishbone, notes));
  });
  it('shows the notes to the AI as a table', () => {
    const text = renderValuesForPrompt(s, v);
    expect(text).toContain('| Region | Cause | Status |');
    expect(text).toContain('| Machine | Shared gas regulator | Checked: true |');
  });
});
