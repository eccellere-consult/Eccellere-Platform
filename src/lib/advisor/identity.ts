/**
 * Identity protection for the Eccellere Advisor (Lite skill, section 10): no company or individual name may reach a client.
 * Pure functions, no I/O. It is one layer of several: the prompt asks the model not to name anyone, the knowledge fed to the model
 * contains no authors or client names, and this scan runs on the whole answer before anything is returned (nothing is streamed).
 * When a request or an answer is doubtful, it fails closed.
 */

export const IDENTITY_REFUSAL =
  "I can share the relevant business context, methodology and findings, but company and individual identities are protected. I can provide an anonymised version.";

/** A question that asks who a client, company or person is, or asks to confirm a guessed name. */
const ASKS_FOR_IDENTITY = [
  /\bwho (is|was|are|were)\b[^?.]{0,40}\b(client|customer|company|firm|business|supplier|vendor|author|interviewee|consultant|ceo|founder|owner)\b/i,
  /\b(name|names|identity|identities)\b[^?.]{0,30}\b(of|for)\b[^?.]{0,30}\b(client|customer|company|firm|business|supplier|vendor|author|interviewee|consultant|ceo|founder|owner)\b/i,
  /\b(which|what)\b[^?.]{0,20}\b(company|firm|client|customer|business|supplier)\b[^?.]{0,40}\b(was|is|were|did|had|used)\b/i,
  /\b(reveal|disclose|tell me|give me|share|confirm|expose|identify)\b[^?.]{0,40}\b(the )?(name|identity|client|company|customer)\b/i,
  /\b[Ii]s (the )?(client|company|customer|firm|supplier|vendor)\b[^?.]{0,10}\b[A-Z][A-Za-z&.-]{2,}/,
  /\b(initials?|first letter|starts? with)\b[^?.]{0,30}\b(company|client|name)\b/i,
];

export function asksForIdentity(text: string): boolean {
  return ASKS_FOR_IDENTITY.some((re) => re.test(text));
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?<![\w])(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}(?![\w])/g;
const URL_ = /\bhttps?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi;
/** A run of capitalised words ending in a company suffix, e.g. "Acme Tools Pvt Ltd", "Orion Industries GmbH". */
const COMPANY_SUFFIX = /\b(?:[A-Z][\w&.'-]*\s+){1,4}(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|Ltd\.?|LLP|LLC|Inc\.?|Corp\.?|Corporation|GmbH|PLC|Co\.)(?=[\s.,;:)]|$)/g;
const OWN_HOSTS = /(^|\.)eccellere\.(in|co\.in)$/i;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface ScanResult { text: string; redactions: number }

/**
 * Removes e-mail addresses, phone numbers, links that are not Eccellere's own, company names with a legal suffix, and every name in
 * `protectedNames` (the dictionary the security administrator maintains). Eccellere's own name is never removed.
 */
export function redactIdentities(input: string, protectedNames: readonly string[] = []): ScanResult {
  let n = 0;
  const count = (replacement: string) => () => { n++; return replacement; };
  let t = input;
  for (const name of protectedNames.map((s) => s.trim()).filter((s) => s.length >= 2).sort((a, b) => b.length - a.length)) {
    t = t.replace(new RegExp(`(?<![\\w])${escapeRe(name).replace(/\s+/g, "\\s+")}(?![\\w])`, "gi"), count("a company"));
  }
  t = t.replace(URL_, (m) => {
    try { if (OWN_HOSTS.test(new URL(m.startsWith("http") ? m : `https://${m}`).hostname)) return m; } catch { /* fall through */ }
    n++; return "[link removed]";
  });
  t = t.replace(EMAIL, (m) => (/@eccellere\.(in|co\.in)$/i.test(m) ? m : (n++, "[email removed]")));
  t = t.replace(COMPANY_SUFFIX, (m) => (/^eccellere\b/i.test(m) ? m : (n++, "a company")));
  // Phone numbers: only strings of 8+ digits, so prices, years and percentages are left alone. Eccellere's own number is public.
  t = t.replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 8 && !m.replace(/\D/g, "").endsWith("9964694566") ? (n++, "[number removed]") : m));
  return { text: t, redactions: n };
}

/** Cues that a person is named next to them: "Prepared by Asha Rao", "Dear Mr Shah", "Contact: Ravi". Matched without regard to case; the name itself must start with a capital. */
const PERSON_CUE = /\b(prepared by|authored by|author|written by|interviewee|interviewed|contact(?: person)?|attn|attention|signed|regards|dear|mr|mrs|ms|dr|prof|sri|shri|smt)\b\.?[:\s,-]+(\p{L}[\p{L}'-]*(?:\s+\p{L}[\p{L}'-]*){0,3})/giu;
const CAPITAL = /^\p{Lu}/u;

/** How many places in a document seem to name a person. Used at ingestion: a document with any is held for review. */
export function personCues(text: string): number {
  return [...text.matchAll(PERSON_CUE)].filter((m) => CAPITAL.test(m[2])).length;
}

/** Replaces the name after each person cue with "an individual". Used at ingestion only, never on answers. */
export function redactPersonCues(text: string): ScanResult {
  let n = 0;
  const t = text.replace(PERSON_CUE, (m, cue: string, name: string) => (CAPITAL.test(name) ? (n++, `${cue} an individual`) : m));
  return { text: t, redactions: n };
}
