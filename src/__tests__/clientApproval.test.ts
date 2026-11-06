// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(async (a: string, b: string) => a === b), hash: vi.fn(async (a: string) => a) } }));
vi.mock('@/lib/notify-admin', () => ({ notifyRegistration: vi.fn(async () => undefined) }));

import { accessMessage, currentBlock, forgetAccess, loginBlock } from '@/lib/access';
import { authOptions } from '@/lib/auth';

type Authorize = (c: { email: string; password: string }) => Promise<unknown>;
const authorize = (authOptions.providers[0] as unknown as { options: { authorize: Authorize } }).options.authorize;
const row = (over: Record<string, unknown> = {}) => ({ id: 'u1', email: 'a@b.in', name: 'A', role: 'CLIENT', avatar: null, passwordHash: 'pw', accountStatus: 'APPROVED', ...over });

beforeEach(() => { vi.clearAllMocks(); forgetAccess(); });

describe('who may be signed in', () => {
  it('lets approved logins in, holds pending clients, and always refuses blocked logins', () => {
    expect(loginBlock('CLIENT', 'APPROVED')).toBeNull();
    expect(loginBlock('CLIENT', 'PENDING')).toBe('PENDING_APPROVAL');
    expect(loginBlock('CLIENT', 'BLOCKED')).toBe('ACCOUNT_BLOCKED');
    expect(loginBlock('ADMIN', 'BLOCKED')).toBe('ACCOUNT_BLOCKED');
    expect(loginBlock('SPECIALIST', 'PENDING')).toBeNull(); // specialists have their own application review
    expect(loginBlock('ADMIN', 'PENDING')).toBeNull();
    expect(loginBlock('CLIENT', undefined)).toBeNull(); // a database without the new column keeps working
  });
  it('has plain messages for the two reasons and nothing for anything else', () => {
    expect(accessMessage('PENDING_APPROVAL')).toMatch(/waiting for approval/);
    expect(accessMessage('ACCOUNT_BLOCKED')).toMatch(/blocked/);
    expect(accessMessage('CredentialsSignin')).toBeNull();
    expect(accessMessage(null)).toBeNull();
  });
  it('checks the database at most every 30 seconds per login, and lets the login continue if the check fails', async () => {
    const lookup = vi.fn(async () => ({ role: 'CLIENT', accountStatus: 'APPROVED' }));
    expect(await currentBlock('x', lookup, 1000)).toBeNull();
    expect(await currentBlock('x', lookup, 20000)).toBeNull();
    expect(lookup).toHaveBeenCalledTimes(1);
    const blocked = vi.fn(async () => ({ role: 'CLIENT', accountStatus: 'BLOCKED' }));
    expect(await currentBlock('x', blocked, 40000)).toBe('ACCOUNT_BLOCKED');
    expect(await currentBlock('y', async () => { throw new Error('db down'); })).toBeNull();
  });
});

describe('signing in', () => {
  it('lets an approved client in', async () => {
    db.user.findUnique.mockResolvedValue(row());
    expect(await authorize({ email: 'a@b.in', password: 'pw' })).toMatchObject({ id: 'u1', role: 'CLIENT' });
  });
  it('refuses a client who is waiting for approval, but only tells someone who knows the password', async () => {
    db.user.findUnique.mockResolvedValue(row({ accountStatus: 'PENDING' }));
    await expect(authorize({ email: 'a@b.in', password: 'pw' })).rejects.toThrow('PENDING_APPROVAL');
    expect(await authorize({ email: 'a@b.in', password: 'wrong' })).toBeNull();
  });
  it('refuses a blocked login', async () => {
    db.user.findUnique.mockResolvedValue(row({ accountStatus: 'BLOCKED' }));
    await expect(authorize({ email: 'a@b.in', password: 'pw' })).rejects.toThrow('ACCOUNT_BLOCKED');
  });
  it('signs a login out on its next request once it is blocked', async () => {
    db.user.findUnique.mockResolvedValue({ role: 'CLIENT', accountStatus: 'BLOCKED' });
    await expect(authOptions.callbacks!.jwt!({ token: { id: 'u9', role: 'CLIENT' } } as never)).rejects.toThrow('ACCOUNT_BLOCKED');
  });
  it('keeps an approved login signed in', async () => {
    db.user.findUnique.mockResolvedValue({ role: 'CLIENT', accountStatus: 'APPROVED' });
    expect(await authOptions.callbacks!.jwt!({ token: { id: 'u8', role: 'CLIENT' } } as never)).toMatchObject({ id: 'u8' });
  });
  it('makes a first Google sign-in a pending client and sends them to the waiting message', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const out = await authOptions.callbacks!.signIn!({ user: { email: 'g@x.in', name: 'G' }, account: { provider: 'google' } } as never);
    expect(out).toBe('/login?error=PENDING_APPROVAL');
    expect(db.user.create.mock.calls[0][0].data).toMatchObject({ role: 'CLIENT', accountStatus: 'PENDING' });
  });
  it('turns away a blocked or pending Google login and lets an approved one through', async () => {
    const go = () => authOptions.callbacks!.signIn!({ user: { email: 'g@x.in' }, account: { provider: 'google' } } as never);
    db.user.findUnique.mockResolvedValue(row({ accountStatus: 'BLOCKED' }));
    expect(await go()).toBe('/login?error=ACCOUNT_BLOCKED');
    db.user.findUnique.mockResolvedValue(row({ accountStatus: 'PENDING' }));
    expect(await go()).toBe('/login?error=PENDING_APPROVAL');
    db.user.findUnique.mockResolvedValue(row());
    expect(await go()).toBe(true);
  });
});

describe('registration', () => {
  const post = async (body: Record<string, unknown>) => {
    const { POST } = await import('@/app/api/account/register/route');
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockImplementation(async (a: { data: Record<string, unknown> }) => ({ id: 'n', email: a.data.email, name: a.data.name, role: a.data.role, createdAt: new Date() }));
    const res = await POST(new Request('http://x/api/account/register', { method: 'POST', body: JSON.stringify(body) }));
    return { res, data: db.user.create.mock.calls.at(-1)![0].data as Record<string, unknown>, json: await res.json() };
  };
  it('starts a new client as pending', async () => {
    const { res, data, json } = await post({ email: 'c@x.in', password: 'longenough', name: 'C', role: 'CLIENT' });
    expect(res.status).toBe(201);
    expect(data.accountStatus).toBe('PENDING');
    expect(json.pendingApproval).toBe(true);
  });
  it('cannot be used to register as an admin or to pick an approved status', async () => {
    const { data } = await post({ email: 'd@x.in', password: 'longenough', name: 'D', role: 'SUPER_ADMIN', accountStatus: 'APPROVED' });
    expect(data.role).toBe('CLIENT');
    expect(data.accountStatus).toBe('PENDING');
  });
});
