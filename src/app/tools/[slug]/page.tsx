import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getPublishedTool } from "@/lib/tools/service";
import type { ToolRecord } from "@/lib/tools/repo";
import ToolPageView, { PRINT_CSS } from "../ToolPageView";
import ToolFrame, { type MenuGroup } from "@/components/standard/ToolFrame";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string): Promise<ToolRecord | null> {
  try { return await getPublishedTool(prismaRepo, slug); } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await find(slug);
  if (!tool) return { title: "Tool not found" };
  return { title: `${tool.name}: guided worksheet`, description: tool.does ?? undefined };
}

/** The side menu: every published tool, grouped by category, in the order the catalogue gives them. */
async function menu(): Promise<MenuGroup[]> {
  try {
    const rows = await prismaRepo.listTools({ status: "PUBLISHED" });
    const by = new Map<string, MenuGroup>();
    for (const t of rows) {
      const g = by.get(t.category) ?? { category: t.category, tools: [] };
      g.tools.push({ slug: t.slug, name: t.name });
      by.set(t.category, g);
    }
    return [...by.values()];
  } catch { return []; }
}

/** A tool exposed to clients. Anyone can read about it; the worksheet needs a sign-in. */
export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await find(slug);
  if (!tool) notFound();
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user?.email;
  const view = <ToolPageView tool={tool} signedIn={signedIn} mode="client" backHref="/tools" backLabel="All tools" signInHref={`/login?next=/tools/${slug}`} />;
  // Every visitor sees the tool in the standard frame: side menu on the left, the tool on its right, top bar and Stage strip.
  // (Signing in is still needed to use the worksheet; the page says so.)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <ToolFrame groups={await menu()} slug={slug} name={tool.name} category={tool.category}>{view}</ToolFrame>
    </>
  );
}
