import type { ReactNode } from "react";

/**
 * Renders the small Markdown subset the narrative uses (headings, bullets, numbered lists, pipe
 * tables, paragraphs, **bold**) as React elements. Text is always a React text node, so nothing
 * the model or the client types can inject HTML or script.
 */
export type MdBlock =
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "p"; text: string };

const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const splitRow = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function parseMarkdownLite(text: string): MdBlock[] {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: MdBlock[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { out.push({ kind: "p", text: para.join(" ") }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flush(); continue; }
    const h = line.match(/^\s*#{1,4}\s+(.*)$/);
    if (h) { flush(); out.push({ kind: "h", text: h[1].trim() }); continue; }
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flush();
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      i--;
      out.push({ kind: "table", header, rows });
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*•]\s+/, "").trim()); i++; }
      i--;
      out.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "").trim()); i++; }
      i--;
      out.push({ kind: "ol", items });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>,
  );
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = parseMarkdownLite(text);
  return (
    <div className="md">
      {blocks.map((b, i) => {
        if (b.kind === "h") return <h3 key={i}>{inline(b.text)}</h3>;
        if (b.kind === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>;
        if (b.kind === "ol") return <ol key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>;
        if (b.kind === "table") {
          return (
            <table key={i}>
              <thead><tr>{b.header.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
            </table>
          );
        }
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}
