/** Server-only glue for the Tools routes: permission, error wrapper, the real AI, saved skill files, audit trail, who may open which tool. */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, requirePermission, type UserRole } from '@/lib/rbac';
import { aiAvailable, generateText } from '@/lib/ai/gateway';
import { makeDrafter } from './draft';
import { prismaRepo } from './prismaRepo';
import { ToolsError, getLibraryTool, getPublishedTool } from './service';
import { toAiTool } from './runtime';
import { SKILL_KEYS, checkSkillText, defaultSkill, skillOrDefault, type SkillKind } from './skill';
import type { ToolRecord } from './repo';
import type { AiDeps, AiTool } from './ai';

// Marketplace admins build and review the online versions of their own toolkits, so they may use these routes too.
export const readAuth = () => requirePermission('admin:content:read', 'admin:assets:read');
export const writeAuth = () => requirePermission('admin:content:write', 'admin:assets:write');

const STATUS_FOR: Record<string, number> = {
  NOT_FOUND: 404, JOB_NOT_FOUND: 404, NOTHING_TO_DRAFT: 400, WRONG_STATE: 409, VERSION_CONFLICT: 409,
  NOT_CHECKED: 409, QUALITY_ERRORS: 422, NOT_REVIEWED: 409, BAD_CATEGORY: 400, BAD_PRACTICE: 400, BAD_SKILL: 400,
};

/** Turns any failure into readable JSON (the browser must never get an empty 500) and recognises the "tables not created yet" case. */
export function toolsGuard<A extends unknown[]>(handler: (...args: A) => Promise<Response>, audience: 'admin' | 'user' = 'admin'): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ToolsError) return NextResponse.json({ error: e.message, code: e.code }, { status: STATUS_FOR[e.code] ?? 400 });
      const code = (e as { code?: string })?.code;
      console.error('[tools] request failed:', code ?? '', e instanceof Error ? e.message : e);
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: audience === 'admin' ? 'The Tools database tables are not set up (or not up to date) on the server. Run tools_tables.sql and tools_tables_update_1.sql in phpMyAdmin, then try again.' : 'This tool is not available yet. Please try again later.', code },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Something went wrong on the server. Please try again.', code: code ?? 'ERR' }, { status: 500 });
    }
  };
}

// ── skill files (editable by an administrator, stored in the existing AiSetting table) ────────────────────────────

export interface SkillInfo { kind: SkillKind; text: string; isCustom: boolean; updatedAt: string | null; updatedBy: string | null; defaultText: string }

export async function loadSkillInfo(kind: SkillKind): Promise<SkillInfo> {
  let row: { value: unknown; updatedAt: Date; updatedBy: string | null } | null = null;
  try { row = await prisma.aiSetting.findUnique({ where: { key: SKILL_KEYS[kind] } }); } catch { /* table missing: use the default */ }
  const text = skillOrDefault(kind, row?.value);
  const isCustom = !!row && text !== defaultSkill(kind);
  return { kind, text, isCustom, updatedAt: isCustom && row ? row.updatedAt.toISOString() : null, updatedBy: isCustom ? row?.updatedBy ?? null : null, defaultText: defaultSkill(kind) };
}

export const loadSkillText = async (kind: SkillKind): Promise<string> => (await loadSkillInfo(kind)).text;

export async function saveSkill(kind: SkillKind, text: string, userId: string): Promise<void> {
  const problem = checkSkillText(text);
  if (problem) throw new ToolsError('BAD_SKILL', problem);
  const key = SKILL_KEYS[kind];
  const before = await prisma.aiSetting.findUnique({ where: { key } }).catch(() => null);
  if (before) await prisma.aiSetting.upsert({ where: { key: `${key}.previous` }, create: { key: `${key}.previous`, value: before.value as never, updatedBy: before.updatedBy }, update: { value: before.value as never, updatedBy: before.updatedBy } });
  await prisma.aiSetting.upsert({ where: { key }, create: { key, value: { text: text.trim() } as never, updatedBy: userId }, update: { value: { text: text.trim() } as never, updatedBy: userId } });
}

export async function resetSkill(kind: SkillKind): Promise<void> {
  await prisma.aiSetting.deleteMany({ where: { key: SKILL_KEYS[kind] } });
}

/** The drafter that talks to the real AI providers set in the admin AI settings, using the saved drafting skill. */
export function realDrafter() {
  return makeDrafter({
    // drafting a tool page is important work: strongest models first
    generate: (a) => generateText({ ...a, quality: true }),
    getSkill: async () => {
      const info = await loadSkillInfo('draft');
      return info.isCustom ? info.text : undefined;
    },
    explainDown: (diag) => diag.length
      ? `The AI did not answer. ${diag.slice(0, 4).join(' | ')}`
      : 'No AI provider is switched on with a key. Open "AI providers" in the admin menu to set one up.',
  });
}

export const aiReady = aiAvailable;

export async function audit(userId: string, action: string, slug: string, details: Record<string, unknown> = {}) {
  await prisma.auditLog
    .create({ data: { userId, action, entityType: 'WsTool', entityId: slug, details: details as never } })
    .catch(() => {});
}

// ── who may open which tool ───────────────────────────────────────────────────────────────────────────────────────

/** The signed-in person (id and role from the database, not from the token). */
export async function whoIsSignedIn(): Promise<{ id: string; role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, isActive: true } });
  return u && u.isActive ? { id: u.id, role: u.role as UserRole } : null;
}

/** The Eccellere team: logins that can read content in the admin area (Admin, Super Admin, Content Admin). */
export const isConsultingTeam = (role: UserRole | undefined): boolean => !!role && hasPermission(role, 'admin:content:read');

/**
 * Opening a tool to use it. Clients get tools that are exposed to clients (published). The Eccellere team also gets every reviewed tool,
 * which is the Consulting library. A draft, or a retired tool, is "not found" for everyone: its existence is not revealed.
 */
export async function userTool(slug: string): Promise<{ error: NextResponse } | { userId: string; role: UserRole; tool: ToolRecord; ai: AiTool }> {
  const who = await whoIsSignedIn();
  if (!who) return { error: NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 }) };
  let tool = await getPublishedTool(prismaRepo, slug);
  if (!tool && isConsultingTeam(who.role)) tool = await getLibraryTool(prismaRepo, slug);
  const ai = tool ? toAiTool(tool) : null;
  if (!tool || !ai) return { error: NextResponse.json({ error: 'That tool was not found.' }, { status: 404 }) };
  return { userId: who.id, role: who.role, tool, ai };
}

/** The AI helpers wired to the providers chosen in the admin AI settings and the saved assist skill. */
export const realAiDeps: AiDeps = {
  generate: (a) => generateText(a),
  getSkill: async () => {
    const info = await loadSkillInfo('assist');
    return info.isCustom ? info.text : undefined;
  },
  explainDown: (diag) => diag.length
    ? 'The AI helper could not answer just now. Please try again in a few minutes.'
    : 'AI help is not switched on right now. You can still fill in the worksheet yourself.',
};
