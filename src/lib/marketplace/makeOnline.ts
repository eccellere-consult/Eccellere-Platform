import type { BuildOutcome, BuildRequest } from '@/lib/forms/build';
import type { SourceReading } from '@/lib/forms/source';
import type { ToolInput } from '@/lib/tools/repo';

/**
 * "Make a fill-online version" for a marketplace toolkit: read the toolkit's own downloadable file, have the Form Builder draft a form from it,
 * give the draft the SAME slug as the toolkit (that is the whole link; see modes.ts) and save it for review. Nothing is published here:
 * a person reviews the draft and publishes it in Admin > Tools. Scores and results in the form come from the form builder's fixed rules, never
 * from AI at fill time. All outside work (file, reading, AI, saving) is passed in so this can be tested without any of it.
 */
export interface ToolkitAsset { slug: string; title: string; description: string }

export interface MakeOnlineDeps {
  /** the toolkit's first downloadable file, or null when none is attached or it is not on this server */
  readFile: () => Promise<{ name: string; data: Buffer } | null>;
  readSource: (name: string, data: Buffer) => Promise<SourceReading>;
  /** null when no tool has this slug; otherwise whether it is an unreviewed draft the document reader made, which a fresh build may replace */
  toolState: (slug: string) => Promise<{ replaceable: boolean } | null>;
  build: (req: BuildRequest) => Promise<BuildOutcome>;
  save: (tool: ToolInput) => Promise<{ slug: string; name: string; status: string }>;
  category: BuildRequest['category'];
  practice: BuildRequest['practice'];
}

export type MakeOnlineResult =
  | { kind: 'ok'; slug: string; name: string; status: string; notes: string[] }
  | { kind: 'exists'; slug: string }
  | { kind: 'no_file' }
  | { kind: 'unreadable'; reason: string }
  | { kind: 'ai_down'; reason: string }
  | { kind: 'failed'; reason: string };

export async function makeOnlineVersion(asset: ToolkitAsset, deps: MakeOnlineDeps): Promise<MakeOnlineResult> {
  const state = await deps.toolState(asset.slug);
  if (state && !state.replaceable) return { kind: 'exists', slug: asset.slug };
  const file = await deps.readFile();
  if (!file) return { kind: 'no_file' };
  let reading: SourceReading;
  try { reading = await deps.readSource(file.name, file.data); }
  catch (e) { return { kind: 'unreadable', reason: e instanceof Error && e.message ? e.message : 'That file could not be read.' }; }

  const out = await deps.build({
    request: `Make a fill-online version of the downloadable toolkit "${asset.title}". ${asset.description}`.slice(0, 4000),
    name: asset.title,
    category: deps.category,
    practice: deps.practice,
    assetType: 'toolkit',
    readings: [reading],
    noAi: true,
  });
  if (out.kind === 'ai_down') return { kind: 'ai_down', reason: out.reason };
  if (out.kind === 'failed') return { kind: 'failed', reason: out.reason };

  // Same slug as the toolkit is the link. Always a draft for review, whatever the builder returned.
  const saved = await deps.save({ ...out.tool, slug: asset.slug, status: 'NEEDS_REVIEW' });
  return { kind: 'ok', slug: saved.slug, name: saved.name, status: saved.status, notes: out.notes };
}
