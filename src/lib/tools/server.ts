/** Server-only glue for the Tools marketplace routes: permission, error wrapper, the real AI drafter, audit trail. */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { aiAvailable, generateText } from '@/lib/ai/gateway';
import { makeDrafter } from './draft';
import { requireUserId, unauthorized } from '@/lib/toolkit/server';
import { prismaRepo } from './prismaRepo';
import { getPublishedTool } from './service';
import type { ToolRecord } from './repo';
import type { DeclarativeTool } from '@/lib/strategyModels/declarative';
import type { AiDeps } from './ai';
import { ToolsError } from './service';

export const readAuth = () => requirePermission('admin:content:read');
export const writeAuth = () => requirePermission('admin:content:write');

const STATUS_FOR: Record<string, number> = {
  NOT_FOUND: 404, JOB_NOT_FOUND: 404, NOTHING_TO_DRAFT: 400, WRONG_STATE: 409, VERSION_CONFLICT: 409,
  NOT_CHECKED: 409, QUALITY_ERRORS: 422, NOT_REVIEWED: 409,
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
          { error: audience === 'admin' ? 'The Tools database tables are not set up on the server yet. Run tools_tables.sql in phpMyAdmin, then try again.' : 'This tool is not available yet. Please try again later.', code },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Something went wrong on the server. Please try again.', code: code ?? 'ERR' }, { status: 500 });
    }
  };
}

/** The drafter that talks to the real AI providers set in the admin AI settings. */
export function realDrafter() {
  return makeDrafter({
    generate: (a) => generateText(a),
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

/** A signed-in person opening a PUBLISHED tool. Anything else is a plain 401 or 404 (a draft is never revealed). */
export async function userTool(slug: string): Promise<{ error: NextResponse } | { userId: string; tool: ToolRecord; def: DeclarativeTool }> {
  const userId = await requireUserId();
  if (!userId) return { error: unauthorized() };
  const tool = await getPublishedTool(prismaRepo, slug);
  if (!tool) return { error: NextResponse.json({ error: 'That tool was not found.' }, { status: 404 }) };
  return { userId, tool, def: tool.definition as DeclarativeTool };
}

/** The AI helpers wired to the providers chosen in the admin AI settings. */
export const realAiDeps: AiDeps = {
  generate: (a) => generateText(a),
  explainDown: (diag) => diag.length
    ? 'The AI helper could not answer just now. Please try again in a few minutes.'
    : 'AI help is not switched on right now. You can still fill in the worksheet yourself.',
};
