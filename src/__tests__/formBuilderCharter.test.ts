import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx-js-style';
import { readSources } from '@/lib/forms/source';
import { makeFormBuilder } from '@/lib/forms/build';

/** A project-charter workbook of the kind people upload: free text blocks, a stakeholder table, milestones, risks and a budget, over several sheets. */
function charter(): Buffer {
  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: (string | number)[][]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  add('Charter', [
    ['PROJECT CHARTER'], [],
    ['Project name', ''], ['Project sponsor', ''], ['Project manager', ''], ['Start date', ''], ['End date', ''],
    ['Business case / problem statement', ''], ['Objectives', ''], ['In scope', ''], ['Out of scope', ''], ['Success criteria', ''],
  ]);
  add('Stakeholders', [['Name', 'Role', 'Interest', 'Influence', 'Engagement approach'], ['', '', '', '', ''], ['', '', '', '', '']]);
  add('Milestones', [['Milestone', 'Owner', 'Due date', 'Status'], ['Kick-off', '', '', ''], ['Design sign-off', '', '', ''], ['Go-live', '', '', '']]);
  add('Risks', [['Risk', 'Likelihood (1-5)', 'Impact (1-5)', 'Mitigation', 'Owner'], ['', 3, 4, '', ''], ['', 2, 5, '', '']]);
  add('Budget', [['Item', 'Planned', 'Actual'], ['People', 100000, 90000], ['Technology', 50000, 55000], ['Other', 10000, 5000]]);
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

const REQUEST = 'Build a project charter form from this Excel. Keep the same sheets as pages, add a RAG status and an approval section, and make the risk score calculate automatically.';
const ai = (generate: (a: never) => Promise<unknown>) => makeFormBuilder({ generate: generate as never, explainDown: () => 'AI is off', slugTaken: async () => false });

describe('a project charter workbook with a typed prompt', () => {
  const cases: [string, (a: never) => Promise<unknown>][] = [
    ['AI is off', async () => null],
    ['AI throws', async () => { throw new Error('boom'); }],
    ['AI returns text that is not JSON', async () => ({ text: 'Sure! Here is your form.', provider: 'fake', model: 'm', finishReason: 'stop' })],
    ['AI returns an empty object', async () => ({ text: '{}', provider: 'fake', model: 'm', finishReason: 'stop' })],
    ['AI returns a form cut off halfway', async () => ({ text: '{"name":"Project charter","sections":[{"id":"a","title":"A","fields":[', provider: 'fake', model: 'm', finishReason: 'length' })],
  ];
  for (const [label, gen] of cases) {
    it(`still produces a valid form, with every sheet as a page, when ${label}`, async () => {
      const readings = await readSources([{ name: 'project-charter.xlsx', data: charter() }]);
      const out = await ai(gen)({ request: REQUEST, category: 'Others', practice: 'Strategy', readings } as never);
      expect(out.kind).toBe('ok');
      if (out.kind !== 'ok') return;
      expect(out.tool.quality?.errors ?? []).toEqual([]);
      const titles = ((out.tool.definition as { sections: { title: string }[] }).sections).map((s) => s.title.toLowerCase()).join('|');
      for (const sheet of ['stakeholders', 'milestones', 'risks', 'budget']) expect(titles).toContain(sheet);
    });
  }
});
