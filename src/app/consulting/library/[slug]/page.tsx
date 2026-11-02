import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getLibraryTool } from "@/lib/tools/service";
import type { ToolRecord } from "@/lib/tools/repo";
import ToolPageView from "@/app/tools/ToolPageView";
import LibraryShell from "../LibraryShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consulting library", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string): Promise<ToolRecord | null> {
  try { return await getLibraryTool(prismaRepo, slug); } catch { return null; }
}

/** One tool, opened from the consulting library: the same page and worksheet clients get, plus whether clients can see it yet. */
export default async function LibraryToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await find(slug);
  return (
    <LibraryShell next={`/consulting/library/${slug}`}>
      {() => {
        if (!tool) notFound();
        return <ToolPageView tool={tool} signedIn mode="library" backHref="/consulting/library" backLabel="Consulting library" signInHref="/login" />;
      }}
    </LibraryShell>
  );
}
