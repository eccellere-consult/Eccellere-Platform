import { NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { MARKET_CATEGORIES } from "@/lib/tools/service";
import { PRACTICES } from "@/lib/tools/practice";
import { aiReady, readAuth, toolsGuard } from "@/lib/tools/server";
import type { Counts } from "@/lib/forms/reconcile";

export const dynamic = "force-dynamic";

/** GET /api/admin/forms - the choices for the builder, and the forms already built with it (newest first). */
export const GET = toolsGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const tools = await prismaRepo.listTools();
  const built = tools
    .map((t) => ({ t, fb: (t.provenance as { formBuilder?: { mode?: string; formType?: string | null; coverage?: { counts?: Counts } | null } } | null)?.formBuilder }))
    .filter((x) => !!x.fb)
    .sort((a, b) => b.t.updatedAt.getTime() - a.t.updatedAt.getTime())
    .slice(0, 50)
    .map(({ t, fb }) => ({
      slug: t.slug, name: t.name, status: t.status, category: t.category, mode: fb!.mode ?? null, formType: fb!.formType ?? null,
      errors: t.quality?.errors.length ?? 0, warnings: t.quality?.warnings.length ?? 0, standards: t.quality?.standards ?? null,
      coverage: fb!.coverage?.counts ?? null, updatedAt: t.updatedAt,
    }));
  return NextResponse.json({ categories: MARKET_CATEGORIES, practices: PRACTICES, aiReady: await aiReady(), built });
});
