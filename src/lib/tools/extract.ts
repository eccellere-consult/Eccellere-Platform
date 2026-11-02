/**
 * Reading text out of an uploaded document (PDF, Word, PowerPoint, Excel, or plain text) so an administrator can use it as the content a
 * tool is built from. The text is reference material for the AI: it is data, never instructions, and it is not stored with the file.
 * Server code only.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Most text kept from one document. */
export const MAX_EXTRACTED_CHARS = 60_000;

const OFFICE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const TEXT_EXT = new Set(['txt', 'md', 'csv', 'tsv']);

export type DocKind = 'pdf' | 'word' | 'powerpoint' | 'excel' | 'text';
export const EXTRACT_ACCEPT = '.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.tsv';

/** What kind of document this is, from its name (browsers often send a vague type), or null if it is not supported. */
export function docKindOf(fileName: string): DocKind | null {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'word';
  if (ext === 'pptx') return 'powerpoint';
  if (ext === 'xlsx') return 'excel';
  if (TEXT_EXT.has(ext)) return 'text';
  return null;
}

/** Old binary Office formats cannot be read; say so plainly instead of failing. */
export const legacyOfficeHint = (fileName: string): string | null =>
  /\.(doc|ppt|xls)$/i.test(fileName) ? 'Older Office files (.doc, .ppt, .xls) cannot be read. Save it as .docx, .pptx or .xlsx (or as a PDF) and upload again.' : null;

type Parser = (buffer: Buffer) => Promise<string>;

/** officeparser is an external package; require keeps the bundler from trying to include it (same approach as the kit evidence upload). */
const officeParser: Parser = async (buffer) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const op = require('officeparser');
  const ast = await op.parseOffice(buffer);
  return ast.toText();
};

export interface Extracted { text: string; chars: number; truncated: boolean; kind: DocKind }

/** Tidy text from a document: no control characters, no runs of blank lines, trimmed and capped. */
export function tidy(text: string): { text: string; truncated: boolean } {
  const t = text.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > MAX_EXTRACTED_CHARS ? { text: t.slice(0, MAX_EXTRACTED_CHARS), truncated: true } : { text: t, truncated: false };
}

export class ExtractError extends Error {
  constructor(public code: 'UNSUPPORTED' | 'TOO_LARGE' | 'UNREADABLE', message: string) { super(message); this.name = 'ExtractError'; }
}

export async function extractDocumentText(fileName: string, buffer: Buffer, parse: Parser = officeParser): Promise<Extracted> {
  const legacy = legacyOfficeHint(fileName);
  if (legacy) throw new ExtractError('UNSUPPORTED', legacy);
  const kind = docKindOf(fileName);
  if (!kind) throw new ExtractError('UNSUPPORTED', 'Supported files: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), CSV, TXT and MD.');
  if (buffer.length > MAX_UPLOAD_BYTES) throw new ExtractError('TOO_LARGE', 'That file is larger than 10 MB. Use a smaller file, or split it.');
  let raw: string;
  try {
    raw = kind === 'text' ? buffer.toString('utf8') : await parse(buffer);
  } catch {
    throw new ExtractError('UNREADABLE', 'That file could not be read. It may be damaged or password-protected.');
  }
  const { text, truncated } = tidy(raw);
  if (text.length < 20) {
    throw new ExtractError('UNREADABLE', kind === 'pdf' ? 'No text could be read from that PDF. A scanned (picture-only) PDF needs OCR, which is not supported yet.' : 'No readable text was found in that file.');
  }
  return { text, chars: text.length, truncated, kind };
}

export const OFFICE_MIME = OFFICE_TYPES;
