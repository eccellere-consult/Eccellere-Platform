/**
 * Who may change which user, and how. Pure rules, tested without a database, so a role change (the most sensitive action in Admin)
 * can be checked by reading this one file.
 *
 *  - Only a Super admin may change a role. Roles Specialist and Client are not switched here (a specialist needs a profile).
 *  - Nobody changes their own role or blocks themselves.
 *  - The last Super admin can never be demoted or blocked.
 *  - An Admin may approve/block/unblock Clients and team logins other than Super admins; a Super admin may do it for anyone.
 */
export const TEAM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN', 'MARKETPLACE_ADMIN', 'CRM_ADMIN', 'FINANCE_ADMIN'] as const;
export const ASSIGNABLE_ROLES = [...TEAM_ROLES, 'CLIENT'] as const;
export const ACCOUNT_ACTIONS = { approve: 'APPROVED', unblock: 'APPROVED', block: 'BLOCKED' } as const;

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin', ADMIN: 'Admin', CONTENT_ADMIN: 'Content admin', MARKETPLACE_ADMIN: 'Marketplace admin',
  CRM_ADMIN: 'CRM admin', FINANCE_ADMIN: 'Finance admin', CLIENT: 'Client', SPECIALIST: 'Specialist',
};

export interface Actor { id: string; role: string }
export interface Target { id: string; role: string }
export type Change = { kind: 'role'; role: string } | { kind: 'account'; action: keyof typeof ACCOUNT_ACTIONS };
export type Verdict = { ok: true } | { ok: false; status: number; error: string };

const no = (status: number, error: string): Verdict => ({ ok: false, status, error });

export function checkUserChange(actor: Actor, target: Target, change: Change, superAdminCount: number): Verdict {
  if (actor.id === target.id) return no(403, 'You cannot change your own role or access. Ask another Super admin.');
  if (change.kind === 'role') {
    if (actor.role !== 'SUPER_ADMIN') return no(403, 'Only a Super admin can change roles.');
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(change.role)) return no(400, 'That role cannot be set from this screen.');
    if (target.role === 'SPECIALIST') return no(409, 'Specialists are managed in Admin > Specialists; their role is not switched here.');
    if (target.role === 'SUPER_ADMIN' && change.role !== 'SUPER_ADMIN' && superAdminCount <= 1) return no(409, 'This is the last Super admin, so it cannot be demoted.');
    return { ok: true };
  }
  if (!(change.action in ACCOUNT_ACTIONS)) return no(400, 'Action must be approve, block or unblock.');
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') return no(403, 'Only a Super admin can change a Super admin.');
  if (target.role === 'SUPER_ADMIN' && change.action === 'block' && superAdminCount <= 1) return no(409, 'This is the last Super admin, so it cannot be blocked.');
  return { ok: true };
}

/** The group a user belongs to on the Users screen. */
export const groupOf = (role: string): 'team' | 'client' | 'specialist' => (role === 'CLIENT' ? 'client' : role === 'SPECIALIST' ? 'specialist' : 'team');
