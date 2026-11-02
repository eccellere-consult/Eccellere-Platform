/** Server-only glue for the Tools marketplace routes: permission, error wrapper, the real AI drafter, audit trail. */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { aiAvailable, generateText } from '@/lib/ai/gateway';
import { makeDrafter } from './draft';
import { ToolsError } from './service';

export const readAuth = () => requirePermission('admin:content:read');
export const writeAuth = () => requirePermission('admin:content:write');

const STATUS_FOR: Record<string, number> = {
  NOT_FOUND: 404, JOB_NOT_FOUND: 404, NOTHING_TO_DRAFT: 400, WRONG_STATE: 409, VERSION_CONFLICT: 409,
  NOT_CHECKED: 409, QUALITY_ERRORS: 422, NOT_REVIEWED: 409,
};

/** Turns any failure into readable JSON (the browser must never get an empty 500) and recognises the "tables not created yet" case. */
export function toolsGuard<A extends unknown[]>(handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ToolsError) return NextResponse.json({ error: e.message, code: e.code }, { status: STATUS_FOR[e.code] ?? 400 });
      const code = (e as { code?: string })?.code;
      console.error('[tools] request failed:', code ?? '', e instanceof Error ? e.message : e);
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'The Tools database tables are not set up on the server yet. Run tools_tables.sql in phpMyAdmin, then try again.', code },
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
