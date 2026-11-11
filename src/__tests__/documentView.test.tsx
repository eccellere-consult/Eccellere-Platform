// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Workspace from '@/app/tools/[slug]/Workspace';
import { docBlocks, parseXml } from '@/lib/forms/docx';
import { documentForm } from '@/lib/forms/docForm';
import { readSource, type SourceReading } from '@/lib/forms/source';
import { coverageErrors, reconcile } from '@/lib/forms/reconcile';
import { makeFormBuilder } from '@/lib/forms/build';
import { keepDocumentLayout, normaliseDeclarative, qualityGate, validateDeclarative, type DeclarativeTool, type DeclTable } from '@/lib/strategyModels/declarative';
import { cleanDocument, documentBinds, type DocBlock, type DocPara, type DocTable } from '@/lib/strategyModels/document';
import { assess } from '@/lib/tools/standards';
import { docxOf, h1, p } from './helpers/sampleDocx';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const body = (inner: string) => `<?xml version="1.0"?><w:document ${W}><w:body>${inner}<w:sectPr/></w:body></w:document>`;
const STYLES = `<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="200" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Cambria"/><w:b/><w:color w:val="1B2A4A"/><w:sz w:val="34"/></w:rPr></w:style></w:styles>`;
const NUMBERING = `<w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;

describe('reading a Word file as a document', () => {
  it('reads XML elements, attributes and the five standard entities, and nothing else', () => {
    const root = parseXml('<?xml version="1.0"?><a x="1 &amp; 2"><!-- note --><b>Tom &lt;&#65;&gt; &unknown;</b><c/></a>');
    expect(root.kids[0]).toMatchObject({ name: 'a', attrs: { x: '1 & 2' } });
    expect(root.kids[0].kids.map((k) => k.name)).toEqual(['b', 'c']);
    expect(root.kids[0].kids[0].text).toBe('Tom <A> &unknown;');
  });

  it('keeps the look of text: bold, italic, colour, size and the heading face, joined when the look is the same', () => {
    const { blocks } = docBlocks(body(
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>MODULE A</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">Plain </w:t></w:r><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">text, </w:t></w:r><w:r><w:rPr><w:b/><w:i/><w:color w:val="B03A2E"/><w:sz w:val="18"/></w:rPr><w:t>red &amp; small</w:t></w:r></w:p>',
    ), STYLES);
    expect(blocks[0]).toEqual({ k: 'p', r: [{ t: 'MODULE A', b: 1, f: 1, c: '1B2A4A', z: 17 }], h: 1, sb: 13, sa: 8 });
    expect(blocks[1]).toEqual({ k: 'p', r: [{ t: 'Plain text, ' }, { t: 'red & small', b: 1, i: 1, c: 'B03A2E', z: 9 }], a: 'j', sa: 4 });
  });

  it('keeps bullets as bullets and numbers as numbers, counting each numbered list', () => {
    const li = (id: number, text: string) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${id}"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
    const { blocks } = docBlocks(body(li(1, 'A bullet') + li(2, 'First') + li(2, 'Second') + li(2, 'Third')), STYLES, NUMBERING);
    expect((blocks as DocPara[]).map((b) => [b.li, b.n])).toEqual([[1, undefined], [2, 1], [2, 2], [2, 3]]);
  });

  it('keeps a table as a table: widths, shading, merged cells, padding, and a thick edge on a call-out box', () => {
    const tc = (text: string, pr: string) => `<w:tc><w:tcPr>${pr}</w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
    const thin = '<w:tcBorders><w:top w:val="single" w:sz="1" w:color="CCCCCC"/><w:left w:val="single" w:sz="1" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="1" w:color="CCCCCC"/><w:right w:val="single" w:sz="1" w:color="CCCCCC"/></w:tcBorders>';
    const { blocks } = docBlocks(body(
      `<w:tbl><w:tblGrid><w:gridCol w:w="2340"/><w:gridCol w:w="7020"/></w:tblGrid>`
      + `<w:tr>${tc('A.1 The title', `<w:gridSpan w:val="2"/>${thin}<w:shd w:fill="B03A2E"/><w:tcMar><w:top w:w="200"/><w:left w:w="360"/></w:tcMar>`)}</w:tr>`
      + `<w:tr>${tc('Left', `${thin}<w:shd w:fill="F7F7F7"/>`)}${tc('Right', `${thin}<w:shd w:fill="FFFFFF"/><w:vAlign w:val="center"/>`)}</w:tr></w:tbl>`
      + `<w:tbl><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr>${tc('Call-out', '<w:tcBorders><w:top w:val="thick" w:sz="8" w:color="1B2A4A"/><w:left w:val="thick" w:sz="8" w:color="1B2A4A"/><w:bottom w:val="single" w:sz="1" w:color="CCCCCC"/><w:right w:val="single" w:sz="1" w:color="CCCCCC"/></w:tcBorders><w:shd w:fill="FDF8EC"/>')}</w:tr></w:tbl>`,
    ));
    const [t, box] = blocks as DocTable[];
    expect(t).toMatchObject({ k: 't', w: [25, 75], bd: 'CCCCCC' });
    expect(t.rows[0].c[0]).toMatchObject({ s: 2, sh: 'B03A2E', pd: [13, 24] });
    expect(t.rows[1].c[0]).toMatchObject({ sh: 'F7F7F7' });
    expect(t.rows[1].c[1]).toEqual({ p: [{ k: 'p', r: [{ t: 'Right' }] }], va: 'm' });
    expect(box.rows[0].c[0]).toMatchObject({ sh: 'FDF8EC', bt: '3 1B2A4A', bl: '3 1B2A4A' });
    expect(box.bd).toBe('CCCCCC');
  });

  it('leaves out deleted text and says when pictures are not shown', () => {
    const { blocks, notes } = docBlocks(body('<w:p><w:r><w:t>Kept</w:t></w:r><w:del><w:r><w:delText>gone</w:delText></w:r></w:del><w:r><w:drawing/></w:r></w:p>'));
    expect((blocks[0] as DocPara).r).toEqual([{ t: 'Kept' }]);
    expect(notes.join(' ')).toMatch(/1 picture in the Word file is not shown online/);
  });
});

describe('a stored document is cleaned before it is drawn', () => {
  it('keeps only known shapes, valid colours and bounded numbers', () => {
    const got = cleanDocument([
      { k: 'p', r: [{ t: 'ok', c: 'red', z: 900, b: 1, onclick: 'x' }, { t: 5 }], sb: -4, a: 'x', h: 9, in: { f: 'Bad Key' } },
      { k: 'script', r: [{ t: 'no' }] },
      { k: 't', bd: 'javascript', rows: [{ c: [{ p: [{ k: 'p', r: [{ t: 'cell', c: 'abcdef' }] }], sh: 'F7F7F7', bt: '3 1B2A4A', bl: 'url(x)', in: { t: 'tbl', r: 'Row', c: 'col', kind: 'rating' } }] }] },
    ]);
    expect(got).toEqual([
      { k: 'p', r: [{ t: 'ok', b: 1 }] },
      { k: 't', rows: [{ c: [{ p: [{ k: 'p', r: [{ t: 'cell', c: 'ABCDEF' }] }], sh: 'F7F7F7', bt: '3 1B2A4A', in: { t: 'tbl', r: 'Row', c: 'col', kind: 'rating' } }] }] },
    ]);
  });
});

/** A small designed playbook: a banner, reading, an advice table worded as questions, cover blanks, a rating table and an answer table. */
const cellOf = (text: string, o: { shade?: string; span?: number; colour?: string } = {}) =>
  `<w:tc><w:tcPr>${o.span ? `<w:gridSpan w:val="${o.span}"/>` : ''}${o.shade ? `<w:shd w:fill="${o.shade}"/>` : ''}</w:tcPr><w:p><w:r>${o.colour ? `<w:rPr><w:color w:val="${o.colour}"/></w:rPr>` : ''}<w:t xml:space="preserve">${text.replace(/&/g, '&amp;')}</w:t></w:r></w:p></w:tc>`;
const tableOf = (rows: string[][], firstRowSpan = 0) =>
  `<w:tbl><w:tblGrid>${rows[rows.length - 1].map(() => '<w:gridCol w:w="2000"/>').join('')}</w:tblGrid>${rows.map((r, i) => `<w:tr>${r.map((c) => cellOf(c, i === 0 && firstRowSpan ? { span: firstRowSpan, shade: 'B03A2E', colour: 'FFFFFF' } : i === (firstRowSpan ? 1 : 0) ? { shade: '1B2A4A', colour: 'FFFFFF' } : {})).join('')}</w:tr>`).join('')}</w:tbl>`;
const PLAYBOOK = [
  tableOf([['Founder / CEO Name', '______________________'], ['Company', '______________________']]),
  h1('HOW TO USE THIS PLAYBOOK'),
  p('This playbook is reading. Is that clear? It should stay reading.'),
  tableOf([['SECTION A MODULE A — FIRST PRINCIPLES']]),
  tableOf([['A.2 | The Hierarchy of Failure [VALUE IMPACT: CRITICAL]'], ['Failure Mode', 'Root Cause', 'Prevention'], ['BUILT SOMETHING NOBODY WANTS', 'Too little discovery', 'Talk to 100 customers. Is the pain real?'], ['RAN OUT OF MONEY', 'Raised too little', 'Always know your runway.']], 3),
  tableOf([['#', 'Diagnostic Question', 'Rating (1–5)', 'Evidence / Notes'], ['A1.1', 'Have all co-founders signed an agreement?', '1  2  3  4  5', ''], ['A1.2', 'Is there a vesting schedule?', '1  2  3  4  5', '']]),
  h1('ANNEXURE B — SELF-ASSESSMENT'),
  tableOf([['#', 'Question', 'Your Answer', 'RAG'], ['1', 'Can you state the problem in one sentence?', '', ''], ['2', 'Have you spoken with 50 customers?', '', '']]),
];
const playbook = async (): Promise<SourceReading> => readSource('Founder Playbook.docx', await docxOf(PLAYBOOK));
const formOf = async (): Promise<DeclarativeTool> => normaliseDeclarative(documentForm([await playbook()], { name: 'Founder Playbook', category: 'strategy' as never })!.form).tool!;

describe('the online version of a designed Word document', () => {
  it('keeps the whole document, in order, and binds only its real blanks', async () => {
    const tool = await formOf();
    expect(tool.layout).toBe('document');
    const parts = tool.sections.flatMap((s) => s.parts);
    expect(parts.map((x) => `${x.kind}:${x.label}`)).toEqual([
      'field:Founder / CEO Name', 'field:Company',
      'table:SECTION A MODULE A — FIRST PRINCIPLES: Rating (1–5), Evidence / Notes',
      'table:ANNEXURE B — SELF-ASSESSMENT: Your Answer, RAG',
    ]);
    // 2 cover blanks + 2 rows x (rating + notes) + 2 rows x (answer + RAG)
    expect(documentBinds(tool.document!)).toHaveLength(10);
    const text = JSON.stringify(tool.document);
    for (const s of ['HOW TO USE THIS PLAYBOOK', 'Is that clear? It should stay reading.', 'The Hierarchy of Failure', 'Talk to 100 customers. Is the pain real?', 'Always know your runway.']) expect(text).toContain(s);
  });

  it('never turns advice into answer boxes, however question-like its wording or merged its title row', async () => {
    const tool = await formOf();
    const labels = tool.sections.flatMap((s) => s.parts).map((x) => x.label).join(' | ');
    expect(labels).not.toMatch(/Prevention|Talk to 100|Hierarchy of Failure|Is that clear/);
    const advice = (tool.document as DocBlock[]).find((b): b is DocTable => b.k === 't' && JSON.stringify(b).includes('Root Cause'))!;
    expect(advice.rows.flatMap((r) => r.c).every((c) => !c.in)).toBe(true);
    expect(advice.rows[0].c[0]).toMatchObject({ s: 3, sh: 'B03A2E' });
  });

  it('makes "1 2 3 4 5" a rating, an empty column a box for each row, and RAG a choice of Red, Amber or Green', async () => {
    const tool = await formOf();
    const [rating, answers] = tool.sections.flatMap((s) => s.parts).filter((x): x is DeclTable => x.kind === 'table');
    expect(rating.fixedRows).toEqual(['A1.1 Have all co-founders signed an agreement?', 'A1.2 Is there a vesting schedule?']);
    expect(rating.columns.map((c) => c.type)).toEqual(['text', 'rating', 'longtext']);
    expect(rating.columns[1].scale).toMatchObject({ min: 1, max: 5 });
    expect(answers.fixedRows).toEqual(['1 Can you state the problem in one sentence?', '2 Have you spoken with 50 customers?']);
    expect(answers.columns[1]).toMatchObject({ header: 'Your Answer', type: 'longtext' });
    expect(answers.columns[2]).toMatchObject({ header: 'RAG', type: 'select', options: ['Red', 'Amber', 'Green'] });
  });

  it('passes the quality check, is ready for review and accounts for every item of the document', async () => {
    const reading = await playbook();
    const built = documentForm([reading], { name: 'Founder Playbook', category: 'strategy' as never })!;
    const tool = normaliseDeclarative(built.form).tool!;
    expect(qualityGate(tool).blockers).toEqual([]);
    expect(assess(tool).errors).toEqual([]);
    const cov = reconcile(reading.elements, built.form as never, tool);
    expect(coverageErrors(cov)).toBeNull();
    expect(cov.counts.closedPct).toBe(100);
  });

  it('refuses a document whose blank is bound to a part that is not there', async () => {
    const tool = await formOf();
    tool.sections[0].parts.shift();
    expect(validateDeclarative(tool).some((i) => i.level === 'error' && /document: a blank is bound to an unknown field founder_ceo_name/.test(`${i.path}: ${i.message}`))).toBe(true);
  });

  it('gives a document with nothing to fill in one box for the reader’s own notes, and says so', async () => {
    const reading = await readSource('Guide.docx', await docxOf([h1('A guide'), p('Only reading here, across two lines of the page.'), p('And a second paragraph of reading.')]));
    const built = documentForm([reading], { name: 'Guide', category: 'strategy' as never })!;
    const tool = normaliseDeclarative(built.form).tool!;
    expect(tool.sections.flatMap((s) => s.parts).map((x) => x.label)).toEqual(['Your notes and actions from this document']);
    expect(built.approximations.join(' ')).toMatch(/no blanks to fill in, so one box for your own notes was added/);
    expect(assess(tool).errors.filter((e) => !/^Standards:/.test(e))).toEqual([]);
  });

  it('is what "Make online" builds for a Word file with no AI, and survives an AI correction of the form', async () => {
    const generate = vi.fn(async () => null);
    const build = makeFormBuilder({ generate, explainDown: () => 'down', slugTaken: async () => false });
    const out = await build({ request: 'Make it', name: 'Founder Playbook', category: 'Strategy' as never, practice: 'Strategy' as never, readings: [await playbook()], noAi: true });
    expect(generate).not.toHaveBeenCalled();
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') return;
    const def = out.tool.definition as DeclarativeTool;
    expect(def.document!.length).toBeGreaterThan(5);
    expect(out.tool.quality!.errors).toEqual([]);
    // an AI reply never carries the document; it is put back when every blank still has its part, and not otherwise
    const ai = normaliseDeclarative({ ...JSON.parse(JSON.stringify(def)), document: undefined }).tool!;
    keepDocumentLayout(ai, def);
    expect(ai.document).toEqual(def.document);
    const broken = normaliseDeclarative({ ...JSON.parse(JSON.stringify(def)), document: undefined }).tool!;
    broken.sections[0].parts.shift();
    keepDocumentLayout(broken, def);
    expect(broken.document).toBeUndefined();
  });

  it('falls back to the step-by-step reader when there is no kept document (text, PDF, or a list sent back from the browser)', async () => {
    const reading = await playbook();
    expect(documentForm([{ ...reading, doc: undefined }], { category: 'strategy' as never })).toBeNull();
    expect(documentForm([reading, reading], { category: 'strategy' as never })).toBeNull();
  });
});

describe('the document on the page', () => {
  let saved: { label: string; value: string }[] = [];
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    saved = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: RequestInit) => {
      if (init?.method === 'PUT') saved = JSON.parse(String(init.body)).fields;
      const record = init?.method === 'PUT' ? { fields: saved, recommendations: [], actionables: [], analysis: null, analysisFingerprint: null, analysisAt: null, previousFields: null, version: 1, updatedAt: null } : null;
      return { ok: true, status: 200, text: async () => JSON.stringify({ record }) } as Response;
    }));
    vi.stubGlobal('print', vi.fn());
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  const settle = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(1300); }); };
  const open = async () => {
    const tool = await formOf();
    const view = render(<Workspace slug="founder-playbook" definition={tool} toolName="Founder Playbook" />);
    await screen.findByText(/parts answered/);
    return { tool, paper: view.container.querySelector('.ws-paper') as HTMLElement };
  };

  it('draws the document itself: its text in order, its shading and colours, and no rebuilt form', async () => {
    const { paper } = await open();
    const text = paper.textContent ?? '';
    const order = ['Founder / CEO Name', 'HOW TO USE THIS PLAYBOOK', 'Is that clear? It should stay reading.', 'MODULE A — FIRST PRINCIPLES', 'The Hierarchy of Failure', 'Always know your runway.', 'Diagnostic Question', 'ANNEXURE B — SELF-ASSESSMENT'].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const banner = within(paper).getByText('SECTION A MODULE A — FIRST PRINCIPLES').closest('td')!;
    expect(banner.style.background).toBe('rgb(27, 42, 74)');
    expect((within(paper).getByText('SECTION A MODULE A — FIRST PRINCIPLES') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    expect(within(paper).getByRole('heading', { name: 'HOW TO USE THIS PLAYBOOK' })).toBeTruthy();
    // only the real blanks are inputs: 2 cover lines + 2 notes + 2 answers
    expect(within(paper).getAllByRole('textbox')).toHaveLength(6);
    expect(within(paper).getAllByRole('radiogroup')).toHaveLength(4);
  });

  it('saves what is typed in a blank, a rating that is clicked, and a Red, Amber or Green choice', async () => {
    const { paper } = await open();
    fireEvent.change(within(paper).getByLabelText('Founder / CEO Name'), { target: { value: 'Asha Rao' } });
    const scale = within(paper).getByRole('radiogroup', { name: /Rating \(1–5\): A1\.2/ });
    fireEvent.click(within(scale).getByRole('radio', { name: '4' }));
    fireEvent.change(within(paper).getByLabelText(/Evidence \/ Notes: A1\.2/), { target: { value: 'Signed in March' } });
    fireEvent.click(within(within(paper).getByRole('radiogroup', { name: /RAG: 2 Have you spoken/ })).getByRole('radio', { name: 'Amber' }));
    await settle();
    const get = (start: string) => saved.find((f) => f.label.startsWith(start))!.value;
    expect(get('Founder / CEO Name')).toBe('Asha Rao');
    expect(JSON.parse(get('SECTION A MODULE A'))).toEqual([{ diagnostic_question: 'A1.2 Is there a vesting schedule?', rating_1_5: '4', evidence_notes: 'Signed in March' }]);
    expect(JSON.parse(get('ANNEXURE B'))).toEqual([{ question: '2 Have you spoken with 50 customers?', rag: 'Amber' }]);
    // (4) / 1 row rated = 4
    expect(screen.getByText(/^Average rating/).parentElement!.textContent).toContain('4');
    // clicking the chosen rating again clears it
    fireEvent.click(within(scale).getByRole('radio', { name: '4' }));
    expect(within(scale).getByRole('radio', { name: '4' }).getAttribute('aria-checked')).toBe('false');
  });

  it('keeps AI help: one "Draft this part with AI" for each part of the form, and every other worksheet feature', async () => {
    const { paper } = await open();
    expect(within(paper).getAllByRole('button', { name: /^Draft with AI: / })).toHaveLength(3);
    for (const name of ['Draft the empty parts', 'Upload a filled template', 'Download blank template', 'Print', 'Print a blank copy', 'Download', 'Analyse & recommend']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByText('Results at a glance')).toBeTruthy();
  });
});
