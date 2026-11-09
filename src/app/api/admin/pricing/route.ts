import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, readAuth, toolsGuard, writeAuth } from "@/lib/tools/server";
import { DEFAULT_RULES, applyClasses, cleanClasses, parseRules, planPrices, type Classes, type PriceRules } from "@/lib/marketplace/pricing";

export const dynamic = "force-dynamic";

// Rules and tags are kept in the existing key/value settings table, so no database change is needed.
const RULES_KEY = "marketplace.pricing.rules";
const CLASSES_KEY = "marketplace.pricing.classes";

async function loadRules(): Promise<PriceRules> {
  const row = await prisma.aiSetting.findUnique({ where: { key: RULES_KEY } }).catch(() => null);
  const p = parseRules(row?.value);
  return p.ok ? p.rules : DEFAULT_RULES;
}
async function loadClasses(): Promise<Record<string, Classes>> {
  const row = await prisma.aiSetting.findUnique({ where: { key: CLASSES_KEY } }).catch(() => null);
  return cleanClasses(row?.value);
}
const save = (key: string, value: unknown, userId: string) =>
  prisma.aiSetting.upsert({ where: { key }, create: { key, value: value as never, updatedBy: userId }, update: { value: value as never, updatedBy: userId } });

const listAssets = () => prisma.asset.findMany({
  where: { status: { in: ["PUBLISHED", "APPROVED"] } }, orderBy: { title: "asc" }, take: 1000,
  select: { id: true, title: true, price: true, serviceDomain: true },
});

/** GET: the rules, every live asset with its tags, and what applying would do (nothing is changed). */
export const GET = toolsGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const [rules, classes, assets] = await Promise.all([loadRules(), loadClasses(), listAssets()]);
  const plan = planPrices(assets, classes, rules);
  const byId = new Map(plan.map((r) => [r.id, r]));
  return NextResponse.json({
    rules,
    assets: assets.map((a) => ({ ...a, scope: classes[a.id]?.scope ?? null, recency: classes[a.id]?.recency ?? null, next: byId.get(a.id)?.next ?? null, reason: byId.get(a.id)?.reason })),
  });
});

/**
 * PUT { rules }                       save the four prices
 * PUT { ids, scope?, recency? }       tag many assets at once
 * PUT { apply: true }                 write the computed price to every fully tagged asset whose price differs
 */
export const PUT = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => ({}))) as { rules?: unknown; ids?: unknown; scope?: unknown; recency?: unknown; apply?: unknown };

  if (body.rules !== undefined) {
    const p = parseRules(body.rules);
    if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
    await save(RULES_KEY, p.rules, auth.user.id);
    await audit(auth.user.id, "pricing_rules_saved", "marketplace", { rules: p.rules });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 1000);
    const next = applyClasses(await loadClasses(), ids, { scope: body.scope as never, recency: body.recency as never });
    await save(CLASSES_KEY, next, auth.user.id);
    await audit(auth.user.id, "pricing_classes_saved", "marketplace", { count: ids.length, scope: body.scope ?? null, recency: body.recency ?? null });
    return NextResponse.json({ ok: true, tagged: ids.length });
  }

  if (body.apply === true) {
    const [rules, classes, assets] = await Promise.all([loadRules(), loadClasses(), listAssets()]);
    const changes = planPrices(assets, classes, rules).filter((r) => r.changed && r.next !== null);
    for (const c of changes) await prisma.asset.update({ where: { id: c.id }, data: { price: c.next as number } });
    await audit(auth.user.id, "pricing_applied", "marketplace", { changed: changes.length, before: changes.slice(0, 200).map((c) => ({ id: c.id, old: c.old, next: c.next })) });
    return NextResponse.json({ ok: true, changed: changes.length });
  }

  return NextResponse.json({ error: "Nothing to do." }, { status: 400 });
});
