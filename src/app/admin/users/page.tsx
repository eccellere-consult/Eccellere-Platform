"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, Filter, Shield, User, Mail, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSIGNABLE_ROLES, ROLE_LABEL, groupOf } from "@/lib/admin/userRules";

type UserRow = { id: string; name: string; email: string; role: string; accountStatus: "PENDING" | "APPROVED" | "BLOCKED"; isActive: boolean; createdAt: string; lastLoginAt: string | null };

const GROUP_STYLE = {
  team: "bg-eccellere-purple/10 text-eccellere-purple",
  client: "bg-eccellere-gold/10 text-eccellere-gold-deep",
  specialist: "bg-eccellere-teal/10 text-eccellere-teal",
} as const;
const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-eccellere-teal/10 text-eccellere-teal",
  BLOCKED: "bg-eccellere-error/10 text-eccellere-error",
  PENDING: "bg-eccellere-gold/10 text-eccellere-gold-deep",
};
const STATUS_WORD: Record<string, string> = { APPROVED: "active", BLOCKED: "blocked", PENDING: "waiting for approval" };
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never");

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [me, setMe] = useState("");
  const [canChangeRoles, setCanChangeRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<"all" | "team" | "client" | "specialist">("all");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/users");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Could not load the users.");
      setUsers(d.users); setMe(d.me); setCanChangeRoles(!!d.canChangeRoles); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the users."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function change(u: UserRow, body: { role?: string; action?: string }, done: string) {
    setBusy(u.id); setNote(null);
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setNote({ kind: "warn", text: d.error ?? "The change could not be saved." }); return; }
      setNote({ kind: "ok", text: `${u.name}: ${done}.` });
      await load();
    } catch { setNote({ kind: "warn", text: "Could not reach the server. Please try again." }); }
    finally { setBusy(null); }
  }

  const counts = useMemo(() => {
    const all = users ?? [];
    return { total: all.length, team: all.filter((u) => groupOf(u.role) === "team").length, client: all.filter((u) => u.role === "CLIENT").length, specialist: all.filter((u) => u.role === "SPECIALIST").length };
  }, [users]);
  const filtered = (users ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (group === "all" || groupOf(u.role) === group);
  });

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink" aria-label="Back to the dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Users</h1>
          {users && <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold-deep">{counts.total}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {error && <p className="mb-4 rounded bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {!users && !error && <p className="text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading the users…</p>}
        {users && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "All logins", value: counts.total, color: "text-eccellere-ink" },
                { label: "Eccellere team", value: counts.team, color: "text-eccellere-purple" },
                { label: "Clients", value: counts.client, color: "text-eccellere-gold-deep" },
                { label: "Specialists", value: counts.specialist, color: "text-eccellere-teal" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-ink-light">{s.label}</p>
                  <p className={cn("mt-1 text-2xl font-light", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>

            {!canChangeRoles && <p className="mb-4 text-xs text-ink-light">Only a Super admin can change a role. You can still approve, block or unblock logins.</p>}
            {note && <p role="status" className={cn("mb-4 text-sm", note.kind === "ok" ? "text-eccellere-teal" : "text-red-700")}>{note.text}</p>}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                <input type="text" aria-label="Search users" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-ink-light" />
                {([["all", "All"], ["team", "Team"], ["client", "Clients"], ["specialist", "Specialists"]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setGroup(k)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", group === k ? "bg-eccellere-gold-deep text-white" : "bg-white text-ink-mid hover:bg-eccellere-cream")}>{label}</button>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-eccellere-ink/5">
                      {["User", "Role", "Access", "Joined", "Last sign-in", "Actions"].map((h) => <th key={h} className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-eccellere-ink/5">
                    {filtered.map((u) => {
                      const g = groupOf(u.role);
                      const mine = u.id === me;
                      return (
                        <tr key={u.id} className="hover:bg-eccellere-cream/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", GROUP_STYLE[g])}>{g === "team" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}</div>
                              <div>
                                <p className="text-sm font-medium text-eccellere-ink">{u.name}{mine && <span className="ml-2 text-[10px] text-ink-light">(you)</span>}</p>
                                <p className="flex items-center gap-1 text-xs text-ink-light"><Mail className="h-3 w-3" />{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {canChangeRoles && !mine && u.role !== "SPECIALIST" ? (
                              <select aria-label={`Role of ${u.name}`} disabled={busy === u.id} value={u.role}
                                onChange={(e) => { const role = e.target.value; if (role !== u.role && window.confirm(`Change ${u.name} from ${ROLE_LABEL[u.role] ?? u.role} to ${ROLE_LABEL[role]}? This changes what they can open.`)) void change(u, { role }, `role changed to ${ROLE_LABEL[role]}`); }}
                                className="border border-eccellere-ink/15 bg-white px-2 py-1 text-xs">
                                {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                              </select>
                            ) : <span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", GROUP_STYLE[g])}>{ROLE_LABEL[u.role] ?? u.role}</span>}
                          </td>
                          <td className="px-6 py-4"><span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", STATUS_STYLE[u.accountStatus])}>{STATUS_WORD[u.accountStatus]}</span></td>
                          <td className="px-6 py-4"><span className="flex items-center gap-1 text-xs text-ink-mid"><Calendar className="h-3 w-3" />{date(u.createdAt)}</span></td>
                          <td className="px-6 py-4 text-xs text-ink-mid">{date(u.lastLoginAt)}</td>
                          <td className="px-6 py-4">
                            {mine ? <span className="text-xs text-ink-light">—</span> : (
                              <div className="flex gap-3 text-xs font-medium text-eccellere-gold-deep">
                                {u.accountStatus === "PENDING" && <button disabled={busy === u.id} className="underline" onClick={() => void change(u, { action: "approve" }, "approved")}>Approve</button>}
                                {u.accountStatus !== "BLOCKED" && <button disabled={busy === u.id} className="underline" onClick={() => { if (window.confirm(`Block ${u.name}? They will not be able to sign in.`)) void change(u, { action: "block" }, "blocked"); }}>Block</button>}
                                {u.accountStatus === "BLOCKED" && <button disabled={busy === u.id} className="underline" onClick={() => void change(u, { action: "unblock" }, "unblocked")}>Unblock</button>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && <div className="py-12 text-center text-sm text-ink-light">No users match your filters.</div>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
