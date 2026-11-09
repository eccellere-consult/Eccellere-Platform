import fs from "fs";
import path from "path";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { suggestCategory } from "@/lib/tools/service";
import { suggestPractice } from "@/lib/tools/practice";
import { loadSkills, realFormBuilder } from "@/lib/forms/server";
import { readSource } from "@/lib/forms/source";
import { resolveUploadPath } from "@/lib/uploads";
import { estimateOnline, makeOnlineVersion, type EstimateResult, type MakeOnlineResult, type ToolkitAsset } from "@/lib/marketplace/makeOnline";
import { promptSize } from "@/lib/forms/build";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function depsFor(asset: ToolkitAsset & { fileUrls: unknown }) {
  const text = `${asset.title} ${asset.description}`;
  return {
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
    // Only an unreviewed draft made by the document reader may be rebuilt; reviewed, published, archived or hand-made tools are never touched.
    toolState: async (slug: string) => {
      const t = await prismaRepo.getToolBySlug(slug);
      if (!t) return null;
      const by = (t.provenance as { draftedBy?: string } | null)?.draftedBy;
      return { replaceable: (t.status === "DRAFT" || t.status === "NEEDS_REVIEW") && by === "rules" };
    },
    category: suggestCategory(text),
    practice: suggestPractice(text),
  };
}

/** Server glue for "make online": reads the toolkit's first file from the uploads folder, builds the draft and saves it for review. No AI unless asked (it costs money). */
export async function makeOnlineForAsset(asset: ToolkitAsset & { fileUrls: unknown }, opts: { useAi?: boolean } = {}): Promise<MakeOnlineResult> {
  const skills = await loadSkills();
  const builder = realFormBuilder();
  return makeOnlineVersion(asset, {
    ...depsFor(asset),
    build: (req) => builder({ ...req, ...skills }),
    save: (t) => prismaRepo.saveTool(t),
    useAi: opts.useAi,
  });
}

/** How much text an AI build would send for this toolkit (nothing is built, no AI is called, nothing costs money). */
export async function estimateForAsset(asset: ToolkitAsset & { fileUrls: unknown }): Promise<EstimateResult> {
  return estimateOnline(asset, { ...depsFor(asset), promptSize });
}
