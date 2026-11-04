import { NextRequest, NextResponse } from "next/server";
import { SKILL_TITLES, type SkillKind } from "@/lib/tools/skill";
import { audit, loadSkillInfo, readAuth, resetSkill, saveSkill, toolsGuard, writeAuth } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

const KINDS: SkillKind[] = ["draft", "assist", "form"];

/** GET /api/admin/tools/skill - both skill files: the text in use, whether it has been edited, and the built-in default. */
export const GET = toolsGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const skills = await Promise.all(KINDS.map(async (k) => ({ ...(await loadSkillInfo(k)), title: SKILL_TITLES[k] })));
  return NextResponse.json({ skills });
});

/** PUT /api/admin/tools/skill  { kind, text } to save an edit, or { kind, reset: true } to go back to the built-in text. Applies to the next draft or AI help. */
export const PUT = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  let body: { kind?: unknown; text?: unknown; reset?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const kind = KINDS.find((k) => k === body.kind);
  if (!kind) return NextResponse.json({ error: "Unknown skill file." }, { status: 400 });
  if (body.reset === true) await resetSkill(kind);
  else await saveSkill(kind, typeof body.text === "string" ? body.text : "", auth.user.id);
  await audit(auth.user.id, body.reset === true ? "tools_skill_reset" : "tools_skill_saved", kind);
  return NextResponse.json({ skill: { ...(await loadSkillInfo(kind)), title: SKILL_TITLES[kind] } });
});
