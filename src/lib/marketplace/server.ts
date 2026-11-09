import fs from "fs";
import path from "path";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { suggestCategory } from "@/lib/tools/service";
import { suggestPractice } from "@/lib/tools/practice";
import { loadSkills, realFormBuilder } from "@/lib/forms/server";
import { readSource } from "@/lib/forms/source";
import { resolveUploadPath } from "@/lib/uploads";
import { makeOnlineVersion, type MakeOnlineResult, type ToolkitAsset } from "@/lib/marketplace/makeOnline";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Server glue for "make online": reads the toolkit's first file from the uploads folder, builds the draft (no AI) and saves it for review. */
export async function makeOnlineForAsset(asset: ToolkitAsset & { fileUrls: unknown }): Promise<MakeOnlineResult> {
  const skills = await loadSkills();
  const builder = realFormBuilder();
  const text = `${asset.title} ${asset.description}`;
  return makeOnlineVersion(asset, {
    readFile: async () => {
      const url = (Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [])[0];
      if (!url || !url.startsWith("/uploads/")) return null;
      try {
        const abs = resolveUploadPath(url);
        if (!fs.existsSync(abs) || fs.statSync(abs).size > MAX_FILE_BYTES) return null;
        return { name: path.basename(abs), data: fs.readFileSync(abs) };
      } catch { return null; }
    },
    readSource,
    toolExists: async (slug) => !!(await prismaRepo.getToolBySlug(slug)),
    build: (req) => builder({ ...req, ...skills }),
    save: (t) => prismaRepo.saveTool(t),
    category: suggestCategory(text),
    practice: suggestPractice(text),
  });
}
