/**
 * Who may be signed in. One rule, used by the login, the Google sign-in, the session check and the admin screen:
 *
 *  - A BLOCKED login (any role) never gets in.
 *  - A PENDING client login never gets in until an admin approves it. (Specialists have their own application review; the team's own logins
 *    are never pending.)
 *  - Everything else gets in.
 *
 * Paid access to a catalog item is a second, separate rule that the download routes keep: an approved login that has a PAID order for it.
 */

export type AccountStatus = "PENDING" | "APPROVED" | "BLOCKED";
export type AccessCode = "PENDING_APPROVAL" | "ACCOUNT_BLOCKED";

export function loginBlock(role: string | null | undefined, status: string | null | undefined): AccessCode | null {
  if (status === "BLOCKED") return "ACCOUNT_BLOCKED";
  if (status === "PENDING" && role === "CLIENT") return "PENDING_APPROVAL";
  return null;
}

const MESSAGES: Record<AccessCode, string> = {
  PENDING_APPROVAL: "Your account is waiting for approval from the Eccellere team. We will email you as soon as it is approved.",
  ACCOUNT_BLOCKED: "This account has been blocked. Please contact the Eccellere team if you think this is a mistake.",
};

/** Plain-language message for an error code coming back from sign-in; null for anything else. */
export function accessMessage(code: string | null | undefined): string | null {
  return code && code in MESSAGES ? MESSAGES[code as AccessCode] : null;
}

/** The status read from the database is looked up at most once every 30 seconds per login, so a block takes effect within that time. */
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; role: string; status: string }>();

export function forgetAccess(userId?: string) {
  if (userId) cache.delete(userId); else cache.clear();
}

type Lookup = (id: string) => Promise<{ role: string; accountStatus: string } | null>;

/**
 * The reason this login must be refused right now, or null when it may continue. A lookup that fails (database down) lets the login
 * continue: refusing would sign everybody out on a short database hiccup.
 */
export async function currentBlock(userId: string, lookup: Lookup, now: number = Date.now()): Promise<AccessCode | null> {
  const hit = cache.get(userId);
  if (hit && now - hit.at < TTL_MS) return loginBlock(hit.role, hit.status);
  try {
    const u = await lookup(userId);
    if (!u) return null;
    cache.set(userId, { at: now, role: u.role, status: u.accountStatus });
    return loginBlock(u.role, u.accountStatus);
  } catch {
    return null;
  }
}
