/**
 * Completing a tool page. Every tool must have a diagram and a worked example, and should carry a suggested originator for the reviewer to
 * confirm. A first draft sometimes misses one of them (or its example had errors and was removed). Rather than leave a gap, one focused
 * follow-up call asks the AI for only the missing pieces, using the exact field and column keys of the page it is completing, and each piece
 * is checked before it is attached. Whatever still fails is reported, never papered over.
 */
import { validateDeclarative, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { diagramIssues, type DiagramSpec } from '@/lib/strategyModels/diagrams/templates';
import type { GenerateArgs, GenerateResult } from '@/lib/ai/providers';

type Generate = (a: GenerateArgs) => Promise<GenerateResult | null>;
export interface Need { diagram: boolean; sample: boolean; originator: boolean }
export interface OriginatorSuggestion { name: string; year: string; confidence: 'high' | 'medium' | 'low'; status: 'unverified' }

const DIAGRAM_FORMS = `"diagram" is ONE of:
  { "template": "matrix2x2", "title", "xAxis": {"label","low","high"}, "yAxis": {...}, "quadrants": [4 x {"name","hint","tone": good|warn|bad|neutral}] (top-left, top-right, bottom-left, bottom-right) }
  { "template": "matrix3x3", "title", "xAxis", "yAxis", "cells": [9 strings, top row first] }
  { "template": "steps" | "cycle", "title", "steps": [3 to 8 x {"name","hint"}] }
  { "template": "canvasGrid", "title", "cols", "rows", "boxes": [{"name","hint","col","row","colSpan","rowSpan"}] }
  { "template": "scale", "title", "levels": [3 to 7 x {"name","hint"}] }
Always choose one. If no template fits the method exactly, use "steps" for a sequence, "cycle" for a loop, or "canvasGrid" to lay the method's elements out as labelled boxes. Fill every label so the picture teaches the method on its own.`;

/** The page's inputs, listed by key so the example the AI writes lines up with them exactly. */
export function describeKeys(tool: DeclarativeTool): string {
  const lines: string[] = [];
  for (const s of tool.sections) {
    for (const p of s.parts) {
      if (p.kind === 'field') {
        lines.push(`- field "${p.key}" (${p.type}${p.options?.length ? `: ${p.options.join(' | ')}` : ''}${p.type === 'rating' ? `: whole number ${p.scale?.min ?? 1} to ${p.scale?.max ?? 5}` : ''}${p.unit ? `, unit ${p.unit}` : ''}): ${p.label}`);
      } else if (!p.board) {
        lines.push(`- table "${p.key}" (${p.label}); columns: ${p.columns.filter((c) => c.type !== 'computed').map((c) => `"${c.key}" (${c.type}${c.options?.length ? `: ${c.options.join(' | ')}` : ''}${c.type === 'rating' ? `: whole number ${c.scale?.min ?? 1} to ${c.scale?.max ?? 5}` : ''})`).join(', ')}${p.fixedRows ? `; rows are exactly: ${p.fixedRows.join(' | ')}` : ''}`);
      }
    }
  }
  return lines.join('\n');
}

export function buildCompleteMessages(tool: DeclarativeTool, need: Need): { system: string; user: string } {
  const wants: string[] = [];
  if (need.diagram) wants.push(`"diagram": the picture of the method.\n${DIAGRAM_FORMS}`);
  if (need.sample) wants.push(`"sample": a short FICTIONAL worked example that fills in this page, as {"scenario": "<2 or 3 sentences describing the invented situation>", "values": {<field key>: "<text>"}, "tables": {<table key>: [ {<column key>: "<text>"} ]}, "why": {}}. Use ONLY the keys listed below. Cover every field and table. Make the numbers consistent with each other and with the situation; ratings must be whole numbers in range; selects must use one of the listed options. Write it so a first-time user can see what good looks like. No placeholders such as TBD or N/A.`);
  if (need.originator) wants.push('"originatorSuggestion": {"name": "who is commonly credited with this method, or an empty string if you are not sure", "year": "four digits, or empty", "confidence": "high" | "medium" | "low"}. A reviewer will check it against a source before it is shown to anyone, so give your honest best knowledge and leave it empty rather than guess.');
  const system = [
    `You are completing a finished tool page for "${tool.name}" by adding ONLY the missing parts. The page already exists; do not change it.`,
    'Return ONE JSON object containing exactly these keys and nothing else:',
    wants.join('\n\n'),
    'Plain business English. No hype, no emojis.',
  ].filter(Boolean).join('\n\n');
  const user = [`TOOL: ${tool.name}`, `WHAT IT DOES: ${tool.does}`, `HOW TO READ THE DIAGRAM: ${tool.reference.howToRead.join(' ')}`, '', 'THE PAGE\'S INPUTS (keys):', describeKeys(tool)].join('\n');
  return { system, user };
}

export interface Completion { tool: DeclarativeTool; added: string[]; notes: string[]; suggestion: OriginatorSuggestion | null }

const clean = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

export function readSuggestion(raw: unknown): OriginatorSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = clean(o.name).slice(0, 120);
  if (!name) return null;
  const year = /^\d{4}$/.test(clean(o.year)) ? clean(o.year) : '';
  const c = clean(o.confidence).toLowerCase();
  return { name, year, confidence: c === 'high' || c === 'medium' ? c : 'low', status: 'unverified' };
}

/** One follow-up call for the missing pieces. Never throws; a failure becomes a note and the tool is returned as it was. */
export async function completePage(generate: Generate, input: DeclarativeTool, need: Need): Promise<Completion> {
  const tool: DeclarativeTool = JSON.parse(JSON.stringify(input));
  const notes: string[] = [];
  const added: string[] = [];
  let suggestion: OriginatorSuggestion | null = null;
  if (!need.diagram && !need.sample && !need.originator) return { tool, added, notes, suggestion };

  const { system, user } = buildCompleteMessages(tool, need);
  const res = await generate({ system, user, maxTokens: 4500, timeoutMs: 90_000, json: true }).catch(() => null);
  if (!res) {
    if (need.diagram) notes.push('The diagram could not be added because the AI did not answer. Use "Complete the page" to try again.');
    if (need.sample) notes.push('The worked example could not be added because the AI did not answer. Use "Complete the page" to try again.');
    return { tool, added, notes, suggestion };
  }
  let raw: Record<string, unknown> | null = null;
  try { raw = JSON.parse(res.text.replace(/```(?:json)?/gi, '').trim()) as Record<string, unknown>; } catch { raw = null; }
  if (!raw || res.finishReason === 'length') {
    if (need.diagram) notes.push('The diagram was not added: the AI answer was cut off or unreadable. Use "Complete the page" to try again.');
    if (need.sample) notes.push('The worked example was not added: the AI answer was cut off or unreadable. Use "Complete the page" to try again.');
    return { tool, added, notes, suggestion };
  }

  if (need.diagram) {
    const d = raw.diagram as DiagramSpec | undefined;
    const problems = d && typeof d === 'object' ? diagramIssues(d) : ['No diagram was returned'];
    if (problems.length === 0) { tool.diagram = d; added.push('diagram'); } else notes.push(`The diagram the AI wrote was not used: ${problems.join('; ')}. Use "Complete the page" to try again.`);
  }
  if (need.sample) {
    const s = raw.sample as DeclarativeTool['sample'] | undefined;
    if (s && typeof s === 'object') {
      const trial: DeclarativeTool = { ...tool, sample: { scenario: clean(s.scenario), values: Object.fromEntries(Object.entries(s.values ?? {}).map(([k, v]) => [k, clean(v)])), tables: (s.tables ?? {}) as NonNullable<DeclarativeTool['sample']>['tables'], why: s.why ?? {} } };
      const bad = validateDeclarative(trial).filter((i) => i.level === 'error' && i.path.startsWith('sample'));
      if (bad.length === 0 && trial.sample!.scenario.length >= 20 && Object.keys(trial.sample!.values).length + Object.keys(trial.sample!.tables).length >= 2) { tool.sample = trial.sample; added.push('sample'); }
      else notes.push(`The worked example the AI wrote was not used: ${bad.map((b) => b.message).join('; ') || 'it was too thin'}. Use "Complete the page" to try again.`);
    } else notes.push('No worked example was returned. Use "Complete the page" to try again.');
  }
  if (need.originator) suggestion = readSuggestion(raw.originatorSuggestion);
  return { tool, added, notes, suggestion };
}
