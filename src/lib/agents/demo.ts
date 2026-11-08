import { interpret, sampleOf, type DeclarativeTool } from '@/lib/strategyModels/declarative';

/**
 * The standard sample and one-click demo for an agent, in one fixed format so every agent looks alike:
 * a scenario sentence, the sample inputs (fields, then tables), the results, and the working figures beside them.
 * Everything comes from the tool's own `sample` block and its own formulas, so the demo can never disagree with the tool.
 * Fictional, never saved, never sent to AI.
 */
export interface DemoField { label: string; value: string; unit?: string }
export interface DemoTable { title: string; columns: { header: string; unit?: string; computed: boolean }[]; rows: string[][] }
export interface DemoResult { label: string; value: string }
export interface Demo { scenario: string; fields: DemoField[]; tables: DemoTable[]; results: DemoResult[]; working: DemoResult[] }

type Col = { key: string; compute?: (row: Record<string, string>, v: never) => string };

export function demoOf(tool: DeclarativeTool): Demo | null {
  const sample = sampleOf(tool);
  if (!sample) return null;
  const def = interpret(tool);
  const values = { fields: sample.values, tables: sample.tables } as never;
  const parts = tool.sections.flatMap((s) => s.parts);
  const model = def.sections.flatMap((s) => s.parts) as unknown as { kind: string; key: string; columns: Col[] }[];

  const fields: DemoField[] = [];
  const tables: DemoTable[] = [];
  for (const p of parts) {
    if (p.kind === 'field') {
      const value = (sample.values[p.key] ?? '').trim();
      if (value) fields.push({ label: p.label, value, unit: p.unit });
      continue;
    }
    const rows = (sample.tables[p.key] ?? []) as Record<string, string>[];
    if (!rows.length) continue;
    const mcols = model.find((m) => m.kind === 'table' && m.key === p.key)?.columns ?? [];
    tables.push({
      title: p.label,
      columns: p.columns.map((c) => ({ header: c.header, unit: c.unit, computed: c.type === 'computed' })),
      rows: rows.map((r) => p.columns.map((c) => {
        if (c.type !== 'computed') return String(r[c.key] ?? '');
        const compute = mcols.find((m) => m.key === c.key)?.compute;
        return compute ? String(compute(r, values) ?? '') : '';
      })),
    });
  }

  const show = (x: { label: string; compute: (v: never) => unknown }): DemoResult => ({ label: x.label, value: String(x.compute(values) ?? '') });
  const results = (def.outputs ?? []).map((o) => show(o as never)).filter((r) => r.value !== '' && r.value !== 'null');
  const working = (def.derived ?? []).map((d) => show(d as never)).filter((r) => r.value !== '' && r.value !== 'null');
  return { scenario: sample.scenario, fields, tables, results, working };
}

/** The same five tour steps for every agent, so the tour is one component everywhere. `live` is whether the working tool is open to clients. */
export function tourSteps(live: boolean): { title: string; text: string; href: string }[] {
  return [
    { title: 'See what it needs', text: 'Read the input data the agent asks for and where each figure usually comes from.', href: '#inputs' },
    { title: 'Run the demo', text: 'Press the demo button to see a full run on a fictional company. Nothing is saved.', href: '#demo' },
    { title: 'Get the template', text: live ? 'Open the tool and download the blank Excel template (or the sample).' : 'The tool opens once it is approved; the template downloads from there.', href: '#your-data' },
    { title: 'Add your data', text: 'Fill the template and upload it, or type straight into the tool. Your work saves as you go.', href: '#your-data' },
    { title: 'Read and share the result', text: 'Read the headline results, then print or save the PDF report.', href: '#outputs' },
  ];
}
