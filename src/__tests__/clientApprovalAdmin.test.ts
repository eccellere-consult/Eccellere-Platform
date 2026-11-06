// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ user: { findUnique: vi.fn(), update: vi.fn() } }));
const session = vi.hoisted(() => ({ current: null as unknown }));
const mail = vi.hoisted(() => vi.fn(async () => ({ success: true })));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('next-auth', () => ({ getServerSession: async () => session.current }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/email-service', () => ({ sendEmail: mail }));

import { PATCH } from '@/app/api/admin/clients/[id]/route';

const call = (action: string, id = 'c1') => PATCH(new Request('http://x', { method: 'PATCH', body: JSON.stringify({ action }) }), { params: Promise.resolve({ id }) });
const client = (over: Record<string, unknown> = {}) => ({ id: 'c1', name: 'Cee', email: 'c@x.in', role: 'CLIENT', accountStatus: 'PENDING', ...over });

beforeEach(() => { vi.clearAllMocks(); session.current = { user: { id: 'admin1', role: 'ADMIN' } }; });

describe('approving clients', () => {
  it('lets only the team approve', async () => {
    session.current = { user: { id: 'u', role: 'CLIENT' } };
    expect((await call('approve')).status).toBe(401);
    session.current = null;
    expect((await call('approve')).status).toBe(401);
    expect(db.user.update).not.toHaveBeenCalled();
  });
  it('approves a pending client, records who did it, and emails them', async () => {
    db.user.findUnique.mockResolvedValue(client());
    const res = await call('approve');
    expect(res.status).toBe(200);
    expect(db.user.update.mock.calls[0][0].data).toMatchObject({ accountStatus: 'APPROVED', approvedBy: 'admin1' });
    expect(mail).toHaveBeenCalledTimes(1);
    expect((await res.json()).emailed).toBe(true);
  });
  it('still approves when the email cannot be sent, and says so', async () => {
    db.user.findUnique.mockResolvedValue(client());
    mail.mockRejectedValueOnce(new Error('smtp down'));
    const res = await call('approve');
    expect(res.status).toBe(200);
    expect((await res.json()).emailed).toBe(false);
  });
  it('blocks and unblocks without emailing, and only touches clients', async () => {
    db.user.findUnique.mockResolvedValue(client({ accountStatus: 'APPROVED' }));
    await call('block');
    expect(db.user.update.mock.calls[0][0].data).toMatchObject({ accountStatus: 'BLOCKED' });
    db.user.findUnique.mockResolvedValue(client({ accountStatus: 'BLOCKED' }));
    await call('unblock');
    expect(db.user.update.mock.calls[1][0].data).toMatchObject({ accountStatus: 'APPROVED' });
    expect(mail).not.toHaveBeenCalled();
    db.user.findUnique.mockResolvedValue(client({ role: 'SUPER_ADMIN' }));
    expect((await call('block')).status).toBe(404);
  });
  it('rejects an unknown action', async () => {
    expect((await call('delete')).status).toBe(400);
  });
});
