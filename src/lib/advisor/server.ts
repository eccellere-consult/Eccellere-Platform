/** Server-side wiring for the Advisor: the on/off switch, the protected-name list, the content it can search, and the AI gateway. */
import { prisma } from "@/lib/prisma";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { generateText } from "@/lib/ai/gateway";
import { buildCorpus, type LibraryChunk, type Passage } from "./knowledge";
import type { Deps } from "./respond";

export const SWITCH_KEY = "advisor.switch";
export const PROTECTED_KEY = "advisor.protected";
export const DRIVE_KEY = "advisor.drive";

export interface DriveConfig { folderIds: string[]; autoPublishClean: boolean; lastSync?: { at: string; summary: string } }

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

export async function driveConfig(): Promise<DriveConfig> {
  return setting<DriveConfig>(DRIVE_KEY, (v) => {
    const o = (v ?? {}) as Partial<DriveConfig>;
    return { folderIds: Array.isArray(o.folderIds) ? o.folderIds.filter((x): x is string => typeof x === "string") : [], autoPublishClean: o.autoPublishClean === true, lastSync: o.lastSync };
  }, { folderIds: [], autoPublishClean: false });
}

let corpus: { at: number; value: Passage[] } | null = null;
/** Called after any change to the library so the next question sees it at once. */
export function resetCorpus() { corpus = null; }

/** Only pieces of PUBLISHED files are ever searchable; a file that is withdrawn or removed disappears with its pieces. */
async function libraryChunks(): Promise<LibraryChunk[]> {
  try {
    const rows = await prisma.advChunk.findMany({ where: { file: { status: "PUBLISHED" } }, select: { id: true, seq: true, text: true, file: { select: { title: true } } }, take: 20000 });
    return rows.map((r) => ({ id: r.id, seq: r.seq, text: r.text, title: r.file.title }));
  } catch { return []; } // tables not created yet: the Advisor still works without the Drive library
}
async function loadCorpus(): Promise<Passage[]> {
  if (corpus && Date.now() - corpus.at < 5 * 60_000) return corpus.value;
  let tools: Parameters<typeof buildCorpus>[0] = [];
  try {
    tools = (await prismaRepo.listTools({ status: "PUBLISHED" })).map((t) => ({ slug: t.slug, name: t.name, category: t.category, does: t.does, whenToUse: t.whenToUse }));
  } catch { /* tools tables may not exist yet: the Advisor still has services and resources */ }
  corpus = { at: Date.now(), value: buildCorpus(tools, await libraryChunks()) };
  return corpus.value;
}

export async function loadDeps(): Promise<Deps> {
  const [enabled, names, passages] = await Promise.all([advisorEnabled(), protectedNames(), loadCorpus()]);
  return { enabled, protectedNames: names, corpus: passages, generate: (a) => generateText(a) };
}
