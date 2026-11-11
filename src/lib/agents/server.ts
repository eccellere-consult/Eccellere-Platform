import { NextResponse } from 'next/server';
import { everyArea } from './catalogue';
import { pilotByAgent } from './pilots';
import { loadEdits, type AgentEdit, type AgentEditRepo } from './overrides';

/** Turns any failure into readable JSON, and names the SQL file to run when the Agent Control tables are not there yet. */
export function agentGuard<A extends unknown[]>(handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      console.error('[agents] request failed:', code ?? '', e instanceof Error ? e.message : e);
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json({ error: 'The Agent Control tables are not set up on the server. Run agent_control_tables.sql in phpMyAdmin, then try again.', code }, { status: 503 });
      }
      return NextResponse.json({ error: 'Something went wrong on the server. Please try again.', code: code ?? 'ERR' }, { status: 500 });
    }
  };
}

export interface AgentRow {
  slug: string;
  name: string;
  area: string;
  status: 'pilot' | 'soon';
  /** the wording in code; an edit overrides it */
  defaults: { does: string; suppliers: string[]; process: string[]; customers: string[]; refresh: string } | null;
  edit: (AgentEdit & { version: number; updatedBy: string | null; updatedAt: string }) | null;
  /** SIPOC lines can be edited only for pilots, because only they have one */
  sipocEditable: boolean;
}

export async function listAgents(repo: AgentEditRepo): Promise<AgentRow[]> {
  const edits = await loadEdits(repo);
  return everyArea().flatMap((area) => area.agents.map((a): AgentRow => {
    const p = pilotByAgent(a.slug);
    const e = edits[a.slug];
    return {
      slug: a.slug, name: a.name, area: area.name, status: a.status, sipocEditable: !!p,
      defaults: { does: a.does, suppliers: p?.sipoc.suppliers ?? [], process: p?.sipoc.process ?? [], customers: p?.sipoc.customers ?? [], refresh: p?.sipoc.refresh ?? '' },
      edit: e ? { slug: e.slug, does: e.does, suppliers: e.suppliers, process: e.process, customers: e.customers, refresh: e.refresh, version: e.version, updatedBy: e.updatedBy, updatedAt: e.updatedAt.toISOString() } : null,
    };
  }));
}
