/** Server-only glue for the Form Builder routes: the real AI, the saved skill files, and the catalogue as template candidates. */
import { generateText } from '@/lib/ai/gateway';
import { prismaRepo } from '@/lib/tools/prismaRepo';
import { loadSkillInfo } from '@/lib/tools/server';
import { isCodeDefinition } from '@/lib/tools/runtime';
import { validateDeclarative, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { makeFormBuilder } from './build';
import type { Candidate } from './templateSearch';

export const realFormBuilder = () =>
  makeFormBuilder({
    generate: (a) => generateText({ quality: true, ...a }),
    slugTaken: async (slug) => !!(await prismaRepo.getToolBySlug(slug)),
    sameSource: async (hash) => {
      const all = await prismaRepo.listTools();
      return all.find((t) => t.status !== 'ARCHIVED' && (t.definition as { source?: { hash?: string } } | null)?.source?.hash === hash)?.name ?? null;
    },
    explainDown: (diag) => (diag.length ? `The AI did not answer. ${diag.slice(0, 4).join(' | ')}` : 'No AI provider is switched on with a key. Open "AI providers" in the admin menu to set one up.'),
  });

/** The edited skill texts, or undefined when the built-in text is in use (the builder then uses its default). */
export async function loadSkills(): Promise<{ formSkill?: string; draftSkill?: string }> {
  const [form, draft] = await Promise.all([loadSkillInfo('form'), loadSkillInfo('draft')]);
  return { formSkill: form.isCustom ? form.text : undefined, draftSkill: draft.isCustom ? draft.text : undefined };
}

/** Everything in the catalogue a form could start from (any state except archived). */
export async function templateCandidates(): Promise<Candidate[]> {
  const all = await prismaRepo.listTools();
  return all.filter((t) => t.status !== 'ARCHIVED').map((t) => ({
    slug: t.slug, name: t.name, category: t.category, groupName: t.groupName, practice: t.practice, status: t.status, does: t.does, whenToUse: t.whenToUse,
  }));
}

/** A template as a form definition, or null when it is a hand-built tool (code) or its stored definition is not usable. */
export async function loadBase(slug: string): Promise<{ slug: string; name: string; tool: DeclarativeTool } | null> {
  const t = await prismaRepo.getToolBySlug(slug);
  if (!t || t.status === 'ARCHIVED' || isCodeDefinition(t.definition)) return null;
  if (validateDeclarative(t.definition).some((i) => i.level === 'error')) return null;
  return { slug: t.slug, name: t.name, tool: t.definition as DeclarativeTool };
}
