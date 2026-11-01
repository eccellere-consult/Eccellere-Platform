/**
 * AI provider registry and selection logic (pure: no I/O, unit-testable).
 *
 * API keys live ONLY in environment variables. Admin settings (stored in the
 * database) hold toggles, model names and ordering, never secrets.
 */

export type ProviderId = "anthropic" | "openai" | "groq" | "xai";
export type ProviderKind = "anthropic" | "openai-compatible";

export interface ProviderDef {
  id: ProviderId;
  label: string;
  kind: ProviderKind;
  /** environment variable holding the API key */
  envKey: string;
  /** environment variable that can override the default model */
  envModel: string;
  defaultModel: string;
  baseUrl: string;
  note: string;
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "anthropic", label: "Anthropic (Claude)", kind: "anthropic",
    envKey: "ANTHROPIC_API_KEY", envModel: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-5-5", baseUrl: "https://api.anthropic.com/v1/messages",
    note: "Strong at structured output and careful, non-fabricated answers.",
  },
  {
    id: "openai", label: "OpenAI", kind: "openai-compatible",
    envKey: "OPENAI_API_KEY", envModel: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1/chat/completions",
    note: "General purpose. Edit the model name if you prefer another model.",
  },
  {
    id: "groq", label: "Groq (Llama)", kind: "openai-compatible",
    envKey: "GROQ_API_KEY", envModel: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    note: "Fast and low cost. Currently used by existing AI features.",
  },
  {
    id: "xai", label: "xAI (Grok)", kind: "openai-compatible",
    envKey: "XAI_API_KEY", envModel: "XAI_MODEL",
    defaultModel: "grok-3-mini", baseUrl: "https://api.x.ai/v1/chat/completions",
    note: "Grok models from xAI. Edit the model name to match your account.",
  },
];

export const PROVIDER_BY_ID: Record<ProviderId, ProviderDef> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, ProviderDef>;

export interface ProviderSetting {
  enabled: boolean;
  /** empty string = use the env/default model */
  model: string;
}

export interface AiSettings {
  /** provider tried first */
  primary: ProviderId;
  /** tried in order if the primary fails or is unavailable */
  fallbacks: ProviderId[];
  providers: Record<ProviderId, ProviderSetting>;
}

/** Default: keep today's behaviour (Groq) so nothing changes until an admin chooses otherwise. */
export function defaultSettings(): AiSettings {
  return {
    primary: "groq",
    fallbacks: ["anthropic", "openai", "xai"],
    providers: {
      anthropic: { enabled: true, model: "" },
      openai: { enabled: true, model: "" },
      groq: { enabled: true, model: "" },
      xai: { enabled: true, model: "" },
    },
  };
}

const isId = (v: unknown): v is ProviderId => typeof v === "string" && v in PROVIDER_BY_ID;
const cleanModel = (v: unknown) => String(v ?? "").replace(/[^\w.:\-/]/g, "").slice(0, 80);

/** Accepts untrusted/partial input (DB row or admin form) and returns a safe, complete settings object. */
export function normalizeSettings(input: unknown): AiSettings {
  const d = defaultSettings();
  if (!input || typeof input !== "object") return d;
  const o = input as Record<string, unknown>;
  const primary = isId(o.primary) ? o.primary : d.primary;

  const fallbacks: ProviderId[] = [];
  for (const f of Array.isArray(o.fallbacks) ? o.fallbacks : []) {
    if (isId(f) && f !== primary && !fallbacks.includes(f)) fallbacks.push(f);
  }
  // any provider not mentioned stays available as a last-resort fallback in registry order
  for (const p of PROVIDERS) if (p.id !== primary && !fallbacks.includes(p.id)) fallbacks.push(p.id);

  const providers = { ...d.providers };
  const raw = (o.providers && typeof o.providers === "object" ? o.providers : {}) as Record<string, unknown>;
  for (const p of PROVIDERS) {
    const r = raw[p.id] as Record<string, unknown> | undefined;
    if (r && typeof r === "object") {
      providers[p.id] = {
        enabled: typeof r.enabled === "boolean" ? r.enabled : true,
        model: cleanModel(r.model),
      };
    }
  }
  return { primary, fallbacks, providers };
}

export const hasKey = (p: ProviderDef, env: Record<string, string | undefined>) =>
  Boolean((env[p.envKey] ?? "").trim());

export const modelFor = (p: ProviderDef, s: AiSettings, env: Record<string, string | undefined>) =>
  s.providers[p.id].model || (env[p.envModel] ?? "").trim() || p.defaultModel;

/**
 * The ordered list of providers to try: primary first, then fallbacks.
 * A provider is usable only if it is enabled by an admin AND its key is configured.
 */
export function resolveOrder(s: AiSettings, env: Record<string, string | undefined>): ProviderDef[] {
  const order = [s.primary, ...s.fallbacks.filter((f) => f !== s.primary)];
  return order
    .map((id) => PROVIDER_BY_ID[id])
    .filter((p) => s.providers[p.id].enabled && hasKey(p, env));
}

// ─── Calling a provider (single HTTP call; pure apart from fetch) ───────────

export interface GenerateArgs {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs?: number;
  /** force one provider (admin "Test" button); skips fallbacks */
  only?: ProviderId;
}
export interface GenerateResult {
  text: string;
  provider: ProviderId;
  model: string;
}

export async function callProvider(
  p: ProviderDef, model: string, a: GenerateArgs, env: Record<string, string | undefined>,
): Promise<string | null> {
  const key = (env[p.envKey] ?? "").trim();
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), a.timeoutMs ?? 25000);
  try {
    if (p.kind === "anthropic") {
      const res = await fetch(p.baseUrl, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model, max_tokens: a.maxTokens, temperature: 0.3, system: a.system,
          messages: [{ role: "user", content: a.user }],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = (data.content ?? [])
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("");
      return text || null;
    }
    const res = await fetch(p.baseUrl, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, temperature: 0.3, max_tokens: a.maxTokens,
        messages: [{ role: "system", content: a.system }, { role: "user", content: a.user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Try providers in order; first non-empty answer wins. Never throws. */
export async function runProviders(
  s: AiSettings, env: Record<string, string | undefined>, a: GenerateArgs,
): Promise<GenerateResult | null> {
  const order = a.only
    ? [PROVIDER_BY_ID[a.only]].filter((p) => p && hasKey(p, env))
    : resolveOrder(s, env);
  for (const p of order) {
    const model = modelFor(p, s, env);
    const text = await callProvider(p, model, a, env);
    if (text) return { text, provider: p.id, model };
  }
  return null;
}
