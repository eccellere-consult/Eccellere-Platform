/**
 * The worksheet as plain text, for the "Download" button: the person's answers section by section, then the analysis, recommendations and
 * action plan when they exist. Pure, so it can be tested without a browser.
 */
import type { ModelDefinition, ModelValues, Row } from '@/lib/strategyModels/types';
import type { StrategyActionable, StrategyAnalysis, StrategyRecommendation } from '@/lib/strategyFillinTypes';

export interface WorksheetExport {
  toolName: string;
  def: ModelDefinition;
  values: ModelValues;
  analysis?: StrategyAnalysis | null;
  recommendations?: StrategyRecommendation[];
  actionables?: StrategyActionable[];
}

const filled = (r: Row) => Object.values(r).some((v) => (v ?? '').trim() !== '');

export function worksheetText(x: WorksheetExport): string {
  const out: string[] = [x.toolName, '='.repeat(Math.max(8, x.toolName.length)), ''];
  for (const s of x.def.sections) {
    out.push(s.title.toUpperCase());
    for (const p of s.parts) {
      if (p.kind === 'field') {
        const v = (x.values.fields[p.key] ?? '').trim();
        out.push(`${p.label}: ${v || 'not known'}`);
        continue;
      }
      const rows = (x.values.tables[p.key] ?? []).filter(filled);
      out.push(`${p.label}:${rows.length ? '' : ' not known'}`);
      rows.forEach((r, i) => {
        const cells = p.columns.filter((c) => c.type !== 'computed' && (r[c.key] ?? '').trim()).map((c) => `${c.header}: ${(r[c.key] ?? '').trim()}`);
        out.push(`  ${i + 1}. ${cells.join(' | ')}`);
      });
    }
    out.push('');
  }
  const a = x.analysis;
  if (a) {
    out.push('ANALYSIS', a.summary);
    if (a.verdict) out.push(`${a.verdict.label}: ${a.verdict.rationale}`);
    a.findings.forEach((f) => out.push(`- ${f.title}. ${f.detail}`));
    if (a.watchouts.length) out.push('', 'Watch-outs', ...a.watchouts.map((w) => `- ${w}`));
    out.push('');
  }
  if (x.recommendations?.length) out.push('RECOMMENDATIONS', ...x.recommendations.map((r, i) => `${i + 1}. ${r.text}`), '');
  if (x.actionables?.length) out.push('ACTION PLAN', ...x.actionables.map((r, i) => `${i + 1}. ${r.action} (${r.owner}; ${r.timeframe}; ${r.priority})`), '');
  out.push('Guidance, not advice: apply your own judgement. Eccellere');
  return out.join('\n');
}
