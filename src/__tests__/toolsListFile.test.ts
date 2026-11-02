import { describe, expect, it } from 'vitest';
import { delimitedToText, rowsToText, splitDelimited } from '@/lib/tools/listFile';
import { parseToolList } from '@/lib/tools/service';

describe('list files', () => {
  it('splits quoted CSV cells', () => {
    expect(splitDelimited('"Plan, Do, Check, Act",Process improvement', ',')).toEqual(['Plan, Do, Check, Act', 'Process improvement']);
    expect(splitDelimited('He said ""hi"" ,x'.replace('He said ', '"He said ').replace(' ,x', '",x'), ',')).toEqual(['He said "hi"', 'x']);
  });
  it('drops a header row and empty rows, and keeps column B as the group', () => {
    expect(rowsToText([['Tool name', 'Group'], ['5 Why Analysis', 'Root cause'], ['', ''], ['Kano Model']])).toBe('5 Why Analysis | Root cause\nKano Model');
  });
  it('does not drop a first row that is a real tool', () => {
    expect(rowsToText([['Kaizen', 'Process improvement']])).toBe('Kaizen | Process improvement');
  });
  it('turns a CSV and a TSV into text the list parser reads', () => {
    const csv = 'Name,Category\nPugh Matrix,Decision Models\n"Plan, Do, Check, Act",Strategy\n';
    const r = parseToolList(delimitedToText(csv, ','), 'Auto');
    expect(r.entries.map((e) => [e.name, e.category])).toEqual([['Pugh Matrix', 'Decision Models'], ['Plan, Do, Check, Act', 'Strategy']]);
    expect(delimitedToText('Kanban\tProcess improvement\nSWOT Analysis', '\t')).toBe('Kanban | Process improvement\nSWOT Analysis');
  });
});
