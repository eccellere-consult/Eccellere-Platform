/**
 * Provider-agnostic text generation using the admin-selected settings.
 * Never throws: returns null if nothing worked, so callers degrade gracefully.
 * Secrets are read from env only and never logged.
 */
import { prisma } from "@/lib/prisma";
import {
  PROVIDERS, defaultSettings, hasKey, normalizeSettings, resolveOrder, runProviders,
  type AiSettings, type GenerateArgs, type GenerateResult,
} from "./providers";

export type { GenerateArgs, GenerateResult };

export const SETTINGS_KEY = "ai.providers";
let cache: { at: number; value: AiSettings } | null = null;
const TTL_MS = 30_000;

export function clearAiSettingsCache() {
  cache = null;
}

export async function loadAiSettings(): Promise<AiSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = defaultSettings();
  try {
    const row = await prisma.aiSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (row) value = normalizeSettings(row.value);
  } catch {
    // DB unavailable or table not created yet: use defaults so AI keeps working
  }
  cache = { at: Date.now(), value };
  return value;
}

/** True if at least one enabled provider has a key. */
export async function aiAvailable(): Promise<boolean> {
  return resolveOrder(await loadAiSettings(), process.env).length > 0;
}

export async function generateText(a: GenerateArgs): Promise<GenerateResult | null> {
  return runProviders(await loadAiSettings(), process.env, a);
}

/** Status for the admin screen: whether each key is configured (never the key itself). */
export function providerStatus() {
  return PROVIDERS.map((p) => ({ id: p.id, envKey: p.envKey, keyConfigured: hasKey(p, process.env) }));
}
