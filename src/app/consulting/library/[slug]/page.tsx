import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getLibraryTool } from "@/lib/tools/service";
import type { ToolRecord } from "@/lib/tools/repo";
import ToolPageView from "@/app/tools/ToolPageView";
import ToolFrame, { type FrameBase, type MenuGroup } from "@/components/standard/ToolFrame";
import { PRINT_CSS } from "@/app/tools/ToolPageView";
import { isConsultingTeam, whoIsSignedIn } from "@/lib/tools/server";
import LibraryShell from "../LibraryShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consulting library", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string): Promise<ToolRecord | null> {
  try { return await getLibraryTool(prismaRepo, slug); } catch { return null; }
}

const WHERE: FrameBase = { base: "/consulting/library", rootLabel: "Consulting library", homeHref: "/consulting/library", homeLabel: "Library home" };

/** The side menu: every tool in the library (reviewed or live), grouped by category. */
async function menu(): Promise<MenuGroup[]> {
  try {
    const by = new Map<string, MenuGroup>();
    for (const t of await prismaRepo.listTools()) {
      if (t.status !== "REVIEWED" && t.status !== "PUBLISHED") continue;
      const g = by.get(t.category) ?? { category: t.category, tools: [] };
      g.tools.push({ slug: t.slug, name: t.name });
      by.set(t.category, g);
    }
    return [...by.values()];
  } catch { return []; }
}

/** One tool, opened from the consulting library: the same page and worksheet clients get, plus whether clients can see it yet. */
export default async function LibraryToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await find(slug);
  let who: Awaited<ReturnType<typeof whoIsSignedIn>> = null;
  try { who = await whoIsSignedIn(); } catch { who = null; }
  if (tool && who && isConsultingTeam(who.role)) {
    // The team opens a tool in the standard frame; anyone else gets the door below.
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
        <ToolFrame groups={await menu()} slug={slug} name={tool.name} category={tool.category} where={WHERE}>
          <ToolPageView tool={tool} signedIn mode="library" backHref="/consulting/library" backLabel="Consulting library" signInHref="/login" />
        </ToolFrame>
      </>
    );
  }
  return (
    <LibraryShell next={`/consulting/library/${slug}`}>
      {() => {
        if (!tool) notFound();
        return <ToolPageView tool={tool} signedIn mode="library" backHref="/consulting/library" backLabel="Consulting library" signInHref="/login" />;
      }}
    </LibraryShell>
  );
}
