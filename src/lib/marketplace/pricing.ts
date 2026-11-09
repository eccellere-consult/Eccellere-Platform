/**
 * Marketplace pricing by classification. Every asset can be tagged on two dimensions and its price is the SUM of the two prices:
 *   scope    : how wide the asset reaches    (one function, or an industry / the whole enterprise)
 *   recency  : how current its content is    (traditional, or on-demand such as AI)
 * Prices are whole rupees. An asset that is not yet tagged on BOTH dimensions keeps its current price; nothing is ever guessed.
 * Pure functions only: saving and reading live in pricingServer.ts.
 */
export const SCOPES = ['function', 'enterprise'] as const;
export const RECENCIES = ['traditional', 'ondemand'] as const;
export type Scope = (typeof SCOPES)[number];
export type Recency = (typeof RECENCIES)[number];

export const SCOPE_LABEL: Record<Scope, string> = { function: 'One function', enterprise: 'One industry / enterprise' };
export const RECENCY_LABEL: Record<Recency, string> = { traditional: 'Traditional', ondemand: 'On-demand (such as AI)' };

export interface PriceRules { scope: Record<Scope, number>; recency: Record<Recency, number> }
export interface Classes { scope?: Scope; recency?: Recency }

/** Starting values, as the owner gave them. Editable in Admin > Pricing. */
export const DEFAULT_RULES: PriceRules = { scope: { function: 299, enterprise: 599 }, recency: { traditional: 599, ondemand: 999 } };

export const MAX_PRICE = 1_000_000;
const isPrice = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= MAX_PRICE;

/** Reads rules from anything (a saved value or a request body); returns an error in plain words instead of guessing. */
export function parseRules(raw: unknown): { ok: true; rules: PriceRules } | { ok: false; error: string } {
  const o = (raw ?? {}) as { scope?: Record<string, unknown>; recency?: Record<string, unknown> };
  const rules = {
    scope: { function: o.scope?.function, enterprise: o.scope?.enterprise },
    recency: { traditional: o.recency?.traditional, ondemand: o.recency?.ondemand },
  };
  const all = [...Object.values(rules.scope), ...Object.values(rules.recency)];
  if (!all.every(isPrice)) return { ok: false, error: `Every price must be a whole number of rupees from 0 to ${MAX_PRICE.toLocaleString('en-IN')}.` };
  return { ok: true, rules: rules as PriceRules };
}

export const isClassified = (c: Classes | undefined): c is Required<Classes> => !!c && !!c.scope && !!c.recency;

/** The price for a classified asset: scope price + recency price. */
export const priceFor = (rules: PriceRules, c: Required<Classes>): number => rules.scope[c.scope] + rules.recency[c.recency];

export interface PriceRow { id: string; title: string; old: number; next: number | null; changed: boolean; reason: 'change' | 'same' | 'unclassified' }

/** What applying the rules would do to each asset. Unclassified assets are listed and left alone. */
export function planPrices(assets: { id: string; title: string; price: number }[], classes: Record<string, Classes>, rules: PriceRules): PriceRow[] {
  return assets.map((a) => {
    const c = classes[a.id];
    if (!isClassified(c)) return { id: a.id, title: a.title, old: a.price, next: null, changed: false, reason: 'unclassified' };
    const next = priceFor(rules, c);
    return { id: a.id, title: a.title, old: a.price, next, changed: next !== a.price, reason: next === a.price ? 'same' : 'change' };
  });
}

/** Sets scope and/or recency for the chosen assets; anything not named is kept. Unknown values are ignored. */
export function applyClasses(current: Record<string, Classes>, ids: readonly string[], set: Classes): Record<string, Classes> {
  const next = { ...current };
  const scope = SCOPES.find((s) => s === set.scope);
  const recency = RECENCIES.find((r) => r === set.recency);
  if (!scope && !recency) return next;
  for (const id of ids) next[id] = { ...next[id], ...(scope ? { scope } : {}), ...(recency ? { recency } : {}) };
  return next;
}

/** Cleans a saved classification map (drops unknown values). */
export function cleanClasses(raw: unknown): Record<string, Classes> {
  const out: Record<string, Classes> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, { scope?: unknown; recency?: unknown }>)) {
    const scope = SCOPES.find((s) => s === v?.scope);
    const recency = RECENCIES.find((r) => r === v?.recency);
    if (scope || recency) out[id] = { ...(scope ? { scope } : {}), ...(recency ? { recency } : {}) };
  }
  return out;
}
