import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getPublishedTool } from "@/lib/tools/service";
import type { ToolRecord } from "@/lib/tools/repo";
import ToolPageView, { PRINT_CSS } from "../ToolPageView";

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

/** A tool exposed to clients. Anyone can read about it; the worksheet needs a sign-in. */
export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await find(slug);
  if (!tool) notFound();
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user?.email;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <Header />
      <main id="main-content" className="bg-eccellere-cream pt-[72px]">
        <ToolPageView tool={tool} signedIn={signedIn} mode="client" backHref="/tools" backLabel="All tools" signInHref={`/login?next=/tools/${slug}`} />
      </main>
      <Footer />
    </>
  );
}
