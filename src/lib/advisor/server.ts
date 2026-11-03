/** Server-side wiring for the Advisor: the on/off switch, the protected-name list, the content it can search, and the AI gateway. */
import { prisma } from "@/lib/prisma";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { generateText } from "@/lib/ai/gateway";
import { buildCorpus, type Passage } from "./knowledge";
import type { Deps } from "./respond";

export const SWITCH_KEY = "advisor.switch";
export const PROTECTED_KEY = "advisor.protected";

async function setting<T>(key: string, pick: (v: unknown) => T, fallback: T): Promise<T> {
  try {
    const row = await prisma.aiSetting.findUnique({ where: { key } });
    return row ? pick(row.value) : fallback;
  } catch {
    return fallback; // table missing or database unreachable: keep the safe default
  }
}

/** Off if the environment says so or an administrator switched it off (the kill switch). */
export async function advisorEnabled(): Promise<boolean> {
  if (process.env.ADVISOR_DISABLED === "1") return false;
  return setting(SWITCH_KEY, (v) => (v as { enabled?: unknown })?.enabled !== false, true);
}

export async function protectedNames(): Promise<string[]> {
  return setting(PROTECTED_KEY, (v) => ((v as { names?: unknown })?.names as unknown[] ?? []).filter((n): n is string => typeof n === "string"), []);
}

let corpus: { at: number; value: Passage[] } | null = null;
async function loadCorpus(): Promise<Passage[]> {
  if (corpus && Date.now() - corpus.at < 5 * 60_000) return corpus.value;
  let tools: Parameters<typeof buildCorpus>[0] = [];
  try {
    tools = (await prismaRepo.listTools({ status: "PUBLISHED" })).map((t) => ({ slug: t.slug, name: t.name, category: t.category, does: t.does, whenToUse: t.whenToUse }));
  } catch { /* tools tables may not exist yet: the Advisor still has services and resources */ }
  corpus = { at: Date.now(), value: buildCorpus(tools) };
  return corpus.value;
}

export async function loadDeps(): Promise<Deps> {
  const [enabled, names, passages] = await Promise.all([advisorEnabled(), protectedNames(), loadCorpus()]);
  return { enabled, protectedNames: names, corpus: passages, generate: (a) => generateText(a) };
}
