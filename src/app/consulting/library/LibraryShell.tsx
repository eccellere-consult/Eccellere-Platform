import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { isConsultingTeam, whoIsSignedIn } from "@/lib/tools/server";
import { PRINT_CSS } from "@/app/tools/ToolPageView";

/**
 * The frame for every consulting-library page: the site header and footer, and the door. Only the Eccellere team (Admin, Super Admin and
 * Content Admin logins) gets through; anyone else sees a plain message, never a hint of what is inside.
 */
export default async function LibraryShell({ next, children }: { next: string; children: (who: { id: string }) => React.ReactNode | Promise<React.ReactNode> }) {
  let who: Awaited<ReturnType<typeof whoIsSignedIn>> = null;
  try { who = await whoIsSignedIn(); } catch { who = null; }
  const allowed = !!who && isConsultingTeam(who.role);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <Header />
      <main id="main-content" className="min-h-[60vh] bg-eccellere-cream pt-[72px]">
        {allowed ? (
          await children({ id: who!.id })
        ) : (
          <div className="mx-auto max-w-xl px-6 py-24 text-center">
            <h1 className="font-display text-3xl font-light text-eccellere-ink">Consulting library</h1>
            <p className="mt-3 text-sm text-ink-mid">
              {who ? "This area is for the Eccellere consulting team. Your login does not have access." : "This area is for the Eccellere consulting team. Please sign in with your Eccellere login."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {!who && <Link href={`/login?next=${next}`} className="bg-eccellere-ink px-5 py-2.5 text-sm text-white hover:opacity-90">Sign in</Link>}
              <Link href="/tools" className="border border-eccellere-ink/30 px-5 py-2.5 text-sm text-eccellere-ink hover:bg-white">Browse the public tools</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
