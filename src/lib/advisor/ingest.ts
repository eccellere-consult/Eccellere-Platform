/**
 * Turning a document into safe, searchable pieces (Lite skill, sections 5 and 10). Pure functions.
 * Every document is anonymised before it is stored. A document is PUBLISHED to clients only when it is clean AND an administrator has
 * allowed automatic publishing; otherwise it waits in QUARANTINE for a person to approve it. Pattern checks cannot be certain that no
 * name is left, so approval by a person is the default.
 */
import { personCues, redactIdentities, redactPersonCues } from "./identity";

export type FileStatus = "PUBLISHED" | "QUARANTINED" | "EXCLUDED" | "FAILED" | "REMOVED";
export interface Screened { title: string; chunks: string[]; redactions: number; cues: number; status: FileStatus; reason: string }

/** Splits on blank lines and headings into pieces of about `max` characters, never cutting a sentence in the middle if it can be avoided. */
export function chunkText(text: string, max = 1200): string[] {
  const paras = text.replace(/\r/g, "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ""; };
  for (const p of paras) {
    if (p.length > max) {
      push();
      for (const s of p.split(/(?<=[.!?])\s+/)) {
        if ((cur + " " + s).length > max) push();
        cur += (cur ? " " : "") + s.slice(0, max);
      }
      push();
    } else {
      if ((cur + "\n\n" + p).length > max) push();
      cur += (cur ? "\n\n" : "") + p;
    }
  }
  push();
  return out;
}

const GENERIC = "Eccellere knowledge document";

/** The title shown to clients: the file name without its extension, unless it names someone, in which case a generic title. */
export function safeTitle(fileName: string, protectedNames: readonly string[], n: number): string {
  const base = fileName.replace(/\.[A-Za-z0-9]{1,5}$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const r = redactIdentities(base, protectedNames);
  const cues = personCues(base);
  const looksLikeNames = /\b(for|with|from|by|-|–)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\b/.test(base) && /\b(proposal|report|case|interview|contract|notes|minutes|review)\b/i.test(base);
  return !base || r.redactions || cues || looksLikeNames ? `${GENERIC} ${n}` : base;
}

export function screenDocument(fileName: string, rawText: string, protectedNames: readonly string[], opts: { autoPublishClean: boolean; index: number }): Screened {
  const a = redactIdentities(rawText, protectedNames);
  const b = redactPersonCues(a.text);
  const cues = personCues(rawText);
  const chunks = chunkText(b.text);
  const title = safeTitle(fileName, protectedNames, opts.index);
  const redactions = a.redactions + b.redactions;
  if (!chunks.length) return { title, chunks, redactions, cues, status: "EXCLUDED", reason: "No readable text was found in this file." };
  if (redactions || cues) return { title, chunks, redactions, cues, status: "QUARANTINED", reason: `${redactions} possible name(s) or contact detail(s) were removed. Please check the preview before approving.` };
  if (!opts.autoPublishClean) return { title, chunks, redactions, cues, status: "QUARANTINED", reason: "Waiting for your approval (automatic publishing is off)." };
  return { title, chunks, redactions, cues, status: "PUBLISHED", reason: "No names or contact details found; published automatically." };
}
