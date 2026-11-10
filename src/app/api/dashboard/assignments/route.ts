import { NextResponse } from "next/server";
import { signedInUser, loadClientAssignments } from "@/lib/client/loaders";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/assignments - the signed-in person's own assignments only. */
export async function GET() {
  try {
    const u = await signedInUser();
    if (!u) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ assignments: await loadClientAssignments(u.id) });
  } catch (e) {
    console.error("[dashboard/assignments]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load this just now. Please try again." }, { status: 500 });
  }
}
