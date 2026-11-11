/**
 * A small Word file built in memory for the tests: headings, instructions, a list, labelled blanks, a rating table, a table of blank
 * rows, a reference table, tick boxes (typed characters and Word's own tick-box control) and questions with options.
 * Fictional content; it stands in for a downloadable toolkit.
 */
import JSZip from 'jszip';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const p = (text: string, o: { style?: string; bold?: boolean; list?: boolean } = {}) =>
  `<w:p>${o.style || o.list ? `<w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.list ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''}</w:pPr>` : ''}<w:r>${o.bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
export const h1 = (t: string) => p(t, { style: 'Heading1' });
export const h2 = (t: string) => p(t, { style: 'Heading2' });
export const h3 = (t: string) => p(t, { style: 'Heading3' });
/** Word's own tick-box control followed by its label, as Word saves it. */
export const tickControl = (label: string) =>
  `<w:p><w:sdt><w:sdtPr><w14:checkbox><w14:checked w14:val="0"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r><w:t>☐</w:t></w:r></w:sdtContent></w:sdt><w:r><w:t xml:space="preserve"> ${esc(label)}</w:t></w:r></w:p>`;
export const tbl = (rows: string[][]) =>
  `<w:tbl>${rows.map((r) => `<w:tr>${r.map((c) => `<w:tc>${p(c)}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;

export async function docxOf(body: string[]): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>');
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${[1, 2, 3].map((n) => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/></w:style>`).join('')}</w:styles>`);
  zip.file('word/numbering.xml', '<?xml version="1.0" encoding="UTF-8"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"><w:body>${body.join('')}</w:body></w:document>`);
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

/** A fictional supplier-review toolkit, laid out the way the downloadable toolkits are. */
export const SAMPLE_TOOLKIT: string[] = [
  h1('Supplier Review Toolkit'),
  p('This toolkit helps you review one supplier at a time. Work through the parts in order.'),
  p('How to use this toolkit', { bold: true }),
  p('Read each instruction before you fill in the table under it.', { list: true }),
  p('Rate honestly: a low score with evidence is more useful than a high one without.', { list: true }),
  tbl([['Rating', 'Meaning'], ['1', 'Not in place'], ['3', 'Partly in place'], ['5', 'Fully in place and evidenced']]),
  h2('Part 1: Supplier details'),
  p('Fill in the details of the supplier you are reviewing.'),
  tbl([['Supplier name', ''], ['Category', ''], ['Reviewed by', '']]),
  p('Review date: ____________'),
  h2('Part 2: Performance assessment'),
  p('Rate each question from 1 to 5 and note your evidence.'),
  h3('Delivery and quality'),
  tbl([
    ['#', 'Diagnostic Question', 'Rating (1-5)', 'Evidence / Notes'],
    ['2.1', 'Does the supplier deliver on the agreed date?', '', ''],
    ['2.2', 'Are quality rejections below the agreed limit?', '', ''],
    ['2.3', 'Does the supplier tell you early about delays?', '', ''],
  ]),
  p('How would you describe the relationship overall?'),
  p('○ Transactional'), p('○ Cooperative'), p('○ Strategic partner'),
  p('Which risks apply to this supplier? (tick all that apply)'),
  p('☐ Single source'), p('☐ Financial weakness'), p('☐ Long lead time'), p('☐ Quality drift'),
  h2('Part 3: Readiness checklist'),
  p('Tick each item once it is done.'),
  tickControl('Contract is signed and filed'),
  tickControl('Service levels are agreed in writing'),
  p('☐ Escalation contacts are named'),
  h2('Part 4: Action plan'),
  p('List the actions you agree with the supplier.'),
  tbl([['Action', 'Owner', 'Due date', 'Done'], ['', '', '', '☐'], ['', '', '', '☐'], ['', '', '', '☐'], ['', '', '', '☐']]),
  h2('Appendix: Benchmarks'),
  p('Typical ranges seen in practice. Use them as a guide only.'),
  tbl([['Measure', 'Typical range'], ['On-time delivery', '90 to 98 percent'], ['Rejection rate', 'Under 2 percent']]),
];
