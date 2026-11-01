import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, asBlueprint, guard } from "@/lib/toolkit/server";
import { PROVENANCE } from "@/lib/toolkit/engine";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const MAX_PER_REQUEST = 60;
// Effectively unlimited for a single answer; we reject (never silently cut) anything beyond this.
const MAX_VALUE_CHARS = 200000;

/**
 * PUT /api/toolkits/[id]/responses
 * Autosave. Body: { responses: [{ fieldId, value, provenance?, confidence?, sourceRef? }] }
 * Only fields that exist in the kit's blueprint are accepted.
 */
async function PUT_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.status === "SUBMITTED") {
    return NextResponse.json({ error: "This kit is submitted. Reopen it to make changes." }, { status: 409 });
  }

  let body: { responses?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const list = Array.isArray(body.responses) ? body.responses.slice(0, MAX_PER_REQUEST) : [];
  if (!list.length) return NextResponse.json({ saved: 0 });

  const bp = asBlueprint(kit.blueprint);
  const valid = new Set(bp.sections.flatMap((s) => s.fields.map((f) => f.id)));
  const prov = new Set<string>(PROVENANCE);
  const ops = [];
  let skipped = 0;

  for (const r of list as Array<Record<string, unknown>>) {
    const fieldId = String(r.fieldId ?? "");
    if (!valid.has(fieldId)) {
      skipped++;
      continue;
    }
    const provenance = prov.has(String(r.provenance)) ? String(r.provenance) : "Client-entered";
    let value: unknown = r.value ?? null;
    if (typeof value !== "number" && value !== null) value = String(value);
    if (typeof value === "string" && value.length > MAX_VALUE_CHARS) {
      return NextResponse.json(
        { error: `One answer is longer than ${MAX_VALUE_CHARS.toLocaleString()} characters. Please shorten it or move the detail into an uploaded file.` },
        { status: 413 },
      );
    }
    const confidence = ["High", "Medium", "Low"].includes(String(r.confidence)) ? String(r.confidence) : null;
    const sourceRef = r.sourceRef ? String(r.sourceRef).slice(0, 255) : null;

    ops.push(
      prisma.kitResponse.upsert({
        where: { kitId_fieldId: { kitId: id, fieldId } },
        create: { kitId: id, fieldId, value: value as never, provenance, confidence, sourceRef },
        update: { value: value as never, provenance, confidence, sourceRef, version: { increment: 1 } },
      }),
    );
  }
  if (ops.length) {
    await prisma.$transaction(ops);
    await prisma.customKit.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
  }
  return NextResponse.json({ saved: ops.length, skipped });
}

export const PUT = guard(PUT_);
