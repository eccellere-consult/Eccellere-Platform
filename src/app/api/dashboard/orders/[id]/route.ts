import { NextResponse } from "next/server";
import { signedInUser, loadOrder } from "@/lib/client/loaders";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/orders/:id - one of the signed-in person's own orders (anyone else's is "not found"). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await signedInUser();
    if (!u) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const { id } = await params;
    const order = await loadOrder(u.id, id);
    if (!order) return NextResponse.json({ error: "We could not find that order." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    console.error("[dashboard/order]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load this order just now." }, { status: 500 });
  }
}
