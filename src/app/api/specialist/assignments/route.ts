import { NextResponse } from "next/server";
import { specialistProfileId, loadAssignments } from "@/lib/specialist/loaders";

export const dynamic = "force-dynamic";

/** GET /api/specialist/assignments - the signed-in specialist's own figures only (read from their own profile, never from a request value). */
export async function GET() {
  try {
    const id = await specialistProfileId();
    if (!id) return NextResponse.json({ error: "Please sign in with a specialist account." }, { status: 401 });
    return NextResponse.json(await loadAssignments(id));
  } catch (e) {
    console.error("[specialist/assignments]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load this just now. Please try again." }, { status: 500 });
  }
}
