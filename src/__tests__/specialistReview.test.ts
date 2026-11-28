// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  specialistProfile: { findUnique: vi.fn(), update: vi.fn() },
  auditLog: { findMany: vi.fn(), create: vi.fn() },
  user: { findMany: vi.fn() },
}));
const session = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('next-auth', () => ({ getServerSession: async () => session.current }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { GET, POST } from '@/app/api/admin/specialists/[id]/route';
import {
  buildChecklist, checklistCounts, latestValidations, listStatus, parseMark, planDecision, rateText, readableList,
  sampleProfile, toReviewProfile, type ProfileRow,
} from '@/lib/admin/specialistReview';

const row = (over: Partial<ProfileRow> = {}): ProfileRow => ({
  id: 'sp1', headline: 'Ops lead', bio: 'Bio', linkedinUrl: 'https://linkedin.com/in/x', currentRole: 'Ops lead', organisation: 'Acme',
  experienceYears: '12', education: [], certifications: ['Six Sigma Black Belt'], serviceDomains: ['Operations', 'Quality'],
  sectorExpertise: ['Manufacturing'], challengesAddressed: [], languages: ['English'], engagementTypes: ['Assignments'],
  hourlyRateMin: 3000, hourlyRateMax: 6000, availability: 'Part-time', monthlyHoursAvail: null, portfolioFiles: [], videoIntroUrl: null,
  status: 'APPLIED', approvedAt: null, approvedBy: null, rejectionReason: null,
  bankAccountNumber: '123456789012', panNumber: 'ABCDE1234F', gstNumber: null,
  createdAt: new Date('2026-11-01T00:00:00Z'), updatedAt: new Date('2026-11-01T00:00:00Z'),
  user: { name: 'Asha', email: 'a@x.in', phone: '+91 9', emailVerified: true, createdAt: new Date('2026-11-01T00:00:00Z'), lastLoginAt: null },
  ...over,
});

const ctx = (id = 'sp1') => ({ params: Promise.resolve({ id }) });
const post = (body: unknown, id = 'sp1') => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }), ctx(id));

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { user: { id: 'admin1', role: 'ADMIN' } };
  db.specialistProfile.findUnique.mockResolvedValue(row());
  db.auditLog.findMany.mockResolvedValue([]);
  db.user.findMany.mockResolvedValue([{ id: 'admin1', name: 'Owner', email: 'o@x.in' }]);
});

describe('review rules', () => {
  it('reads stored lists whether they hold text or small objects', () => {
    expect(readableList(['A', ' ', { degree: 'B.E.', institution: 'IIT', year: 2009 }, 7, null])).toEqual(['A', 'B.E. · IIT · 2009', '7']);
    expect(readableList('not a list')).toEqual([]);
  });
  it('shows rates in rupees in plain words', () => {
    expect(rateText(3000, 6000)).toBe('₹3,000 to ₹6,000 per hour');
    expect(rateText(null, null)).toBeNull();
  });
  it('maps statuses so a sent-back application no longer looks pending', () => {
    expect(listStatus('APPLIED')).toBe('pending');
    expect(listStatus('REVISIONS_REQUESTED')).toBe('needs info');
    expect(listStatus('APPROVED')).toBe('active');
    expect(listStatus('SUSPENDED')).toBe('inactive');
  });
  it('never sends bank or PAN numbers to the screen, only whether they are on file', () => {
    const p = toReviewProfile(row());
    expect(JSON.stringify(p)).not.toContain('123456789012');
    expect(JSON.stringify(p)).not.toContain('ABCDE1234F');
    expect(p.payoutDetailsOnFile).toEqual({ bank: true, pan: true, gst: false });
  });
  it('builds one checklist line per claim', () => {
    const keys = buildChecklist(toReviewProfile(row())).map((i) => i.key);
    expect(keys).toEqual(['identity', 'linkedin', 'role', 'experience', 'domain:Operations', 'domain:Quality', 'sector:Manufacturing', 'certification:0']);
  });
  it('keeps the latest mark for each line and counts plainly', () => {
    const items = buildChecklist(toReviewProfile(row()));
    const marks = latestValidations([
      { details: { key: 'linkedin', status: 'needs_info', note: 'old' }, userId: 'a', createdAt: new Date('2026-11-02T00:00:00Z') },
      { details: { key: 'linkedin', status: 'verified', note: 'matches' }, userId: 'a', createdAt: new Date('2026-11-03T00:00:00Z') },
      { details: { key: 'experience', status: 'not_verified', note: '' }, userId: 'a', createdAt: new Date('2026-11-02T00:00:00Z') },
      { details: { key: 'role', status: 'bogus' }, userId: 'a', createdAt: new Date('2026-11-02T00:00:00Z') },
    ]);
    expect(marks.linkedin.status).toBe('verified');
    expect(marks.role).toBeUndefined();
    expect(checklistCounts(items, marks)).toEqual({ total: 8, checked: 2, verified: 1, notVerified: 1, needsInfo: 0 });
  });
  it('accepts only marks for lines on this checklist', () => {
    const items = buildChecklist(toReviewProfile(row()));
    expect(parseMark({ key: 'domain:Operations', status: 'verified', note: ' ok ' }, items)).toMatchObject({ ok: true, note: 'ok' });
    expect(parseMark({ key: 'domain:Hacking', status: 'verified' }, items)).toMatchObject({ ok: false });
    expect(parseMark({ key: 'linkedin', status: 'maybe' }, items)).toMatchObject({ ok: false });
  });
  it('plans decisions and needs a reason to send back or reject', () => {
    const now = new Date('2026-11-28T00:00:00Z');
    expect(planDecision('approve', '', 'a1', now)).toMatchObject({ ok: true, data: { status: 'APPROVED', approvedAt: now, approvedBy: 'a1' } });
    expect(planDecision('reject', 'no', 'a1')).toMatchObject({ ok: false });
    expect(planDecision('more_info', 'Add certificate number', 'a1')).toMatchObject({ ok: true, data: { status: 'REVISIONS_REQUESTED', rejectionReason: 'Add certificate number' } });
    expect(planDecision('reject', 'Credentials could not be confirmed', 'a1')).toMatchObject({ ok: true, data: { status: 'SUSPENDED' } });
    expect(planDecision('delete', 'whatever', 'a1')).toMatchObject({ ok: false });
  });
  it('has a fictional sample with a full checklist for the demo', () => {
    const s = sampleProfile();
    expect(s.isSample).toBe(true);
    expect(s.name).toContain('sample');
    expect(buildChecklist(s).length).toBeGreaterThan(8);
  });
});

describe('review API', () => {
  it('lets only admins see or change an applicant', async () => {
    session.current = { user: { id: 'u', role: 'SPECIALIST' } };
    expect((await GET(new Request('http://x'), ctx())).status).toBe(401);
    expect((await post({ kind: 'decide', action: 'approve' })).status).toBe(401);
    session.current = null;
    expect((await GET(new Request('http://x'), ctx())).status).toBe(401);
    expect(db.specialistProfile.findUnique).not.toHaveBeenCalled();
    expect(db.specialistProfile.update).not.toHaveBeenCalled();
  });
  it('returns the full profile without bank or PAN numbers', async () => {
    const res = await GET(new Request('http://x'), ctx());
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('123456789012');
    expect(text).not.toContain('ABCDE1234F');
    const j = JSON.parse(text);
    expect(j.profile.linkedinUrl).toBe('https://linkedin.com/in/x');
    expect(j.profile.certifications).toEqual(['Six Sigma Black Belt']);
    expect(j.counts.total).toBe(8);
  });
  it('says not found for an unknown applicant', async () => {
    db.specialistProfile.findUnique.mockResolvedValue(null);
    expect((await GET(new Request('http://x'), ctx('nope'))).status).toBe(404);
  });
  it('serves the sample without touching the database and refuses to save it', async () => {
    const res = await GET(new Request('http://x'), ctx('SAMPLE'));
    expect(res.status).toBe(200);
    expect(db.specialistProfile.findUnique).not.toHaveBeenCalled();
    expect((await post({ kind: 'decide', action: 'approve' }, 'SAMPLE')).status).toBe(400);
  });
  it('records a checklist mark in the audit log with who made it', async () => {
    const res = await post({ kind: 'mark', key: 'certification:0', status: 'verified', note: 'Checked certificate ID' });
    expect(res.status).toBe(200);
    expect(db.auditLog.create.mock.calls[0][0].data).toMatchObject({
      userId: 'admin1', action: 'specialist_credential_checked', entityType: 'SpecialistProfile', entityId: 'sp1',
      details: { key: 'certification:0', status: 'verified', note: 'Checked certificate ID' },
    });
    expect((await post({ kind: 'mark', key: 'made-up', status: 'verified' })).status).toBe(400);
  });
  it('approves, records who and when, and writes an audit row', async () => {
    const res = await post({ kind: 'decide', action: 'approve' });
    expect(res.status).toBe(200);
    expect(db.specialistProfile.update.mock.calls[0][0]).toMatchObject({ where: { id: 'sp1' }, data: { status: 'APPROVED', approvedBy: 'admin1' } });
    expect(db.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: 'specialist_approved', details: { previousStatus: 'APPLIED' } });
  });
  it('will not reject without a reason', async () => {
    expect((await post({ kind: 'decide', action: 'reject', reason: '' })).status).toBe(400);
    expect(db.specialistProfile.update).not.toHaveBeenCalled();
  });
});
