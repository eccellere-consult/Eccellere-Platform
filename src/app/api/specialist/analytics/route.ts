import { NextResponse } from "next/server";
import { specialistProfileId, loadAnalytics } from "@/lib/specialist/loaders";

export const dynamic = "force-dynamic";

/** GET /api/specialist/analytics - the signed-in specialist's own figures only (read from their own profile, never from a request value). */
export async function GET() {
  try {
    const id = await specialistProfileId();
    if (!id) return NextResponse.json({ error: "Please sign in with a specialist account." }, { status: 401 });
    return NextResponse.json(await loadAnalytics(id));
  } catch (e) {
    console.error("[specialist/analytics]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load this just now. Please try again." }, { status: 500 });
  }
}
