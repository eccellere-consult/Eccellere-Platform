/**
 * Eccellere+ side of the AI Control Tower: turns "one AI call finished" into a report for the Control Tower.
 *
 * Safe by default: with AIOPS_ENDPOINT or AIOPS_KEY missing, nothing happens at all (no network, no error, no log).
 * Reports are fire-and-forget (nobody waits for them) and can never throw into the app.
 * Privacy: only technical fields are sent (provider, model, token counts, time, status, a task code). Never a prompt,
 * an answer, a name, an e-mail or a phone number. The cost is worked out by the Control Tower, never sent from here.
 *
 * This file has no imports except types, so the unit tests can run it directly. The wiring lives in ./index.ts.
 */
import type { AIRequestRecord, ControlTowerConfig, createControlTower } from "./client";

/** The app code this site is registered under in the Control Tower. */
export const APP_CODE = "eccellere_co";

/** Used when a call site has not said what kind of task it is. */
export const DEFAULT_CAPABILITY = "ai_text_generation";
export const DEFAULT_MODULE = "platform";

type Tower = ReturnType<typeof createControlTower>;

export interface AiCallEvent {
  provider: string;
  model: string;
  /** "anthropic" counts cached tokens separately; "openai-compatible" (OpenAI, Groq, xAI) counts them inside the input */
  kind: "anthropic" | "openai-compatible";
  capability?: string;
  module?: string;
  status: "success" | "failed" | "timeout";
  errorCode?: string;
  latencyMs: number;
  retryCount?: number;
  /** the provider's own "usage" object, exactly as returned (numbers only are read from it) */
  usage?: unknown;
}

const count = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;

/** Reads token counts exactly as the provider returns them. Cached tokens: Anthropic = in addition to input; OpenAI style = part of input. */
export function tokensFromUsage(kind: AiCallEvent["kind"], usage: unknown): { inputTokens?: number; outputTokens?: number; cachedTokens?: number } {
  if (!usage || typeof usage !== "object") return {};
  const u = usage as Record<string, unknown>;
  if (kind === "anthropic") {
    return { inputTokens: count(u.input_tokens), outputTokens: count(u.output_tokens), cachedTokens: count(u.cache_read_input_tokens) };
  }
  const details = u.prompt_tokens_details && typeof u.prompt_tokens_details === "object" ? (u.prompt_tokens_details as Record<string, unknown>) : {};
  return { inputTokens: count(u.prompt_tokens), outputTokens: count(u.completion_tokens), cachedTokens: count(details.cached_tokens) };
}

/** Only short technical codes are allowed through as the error code (never free text from a provider). */
const safeCode = (v: string | undefined) => (v && /^[a-z0-9_]{1,40}$/.test(v) ? v : undefined);

export function eventToRecord(e: AiCallEvent): AIRequestRecord {
  return {
    capabilityCode: e.capability || DEFAULT_CAPABILITY,
    moduleCode: e.module || DEFAULT_MODULE,
    provider: e.provider,
    model: e.model,
    ...tokensFromUsage(e.kind, e.usage),
    latencyMs: Math.max(0, Math.round(e.latencyMs)),
    retryCount: e.retryCount ?? 0,
    status: e.status,
    errorCode: safeCode(e.errorCode),
  };
}

export interface TrackMeta {
  provider: string;
  model: string;
  kind?: AiCallEvent["kind"];
  capability: string;
  module: string;
}

export function makeAiopsReporter(opts: {
  env: Record<string, string | undefined>;
  create: (config: ControlTowerConfig) => Tower;
  onError?: (error: unknown) => void;
}) {
  let tower: Tower | null | undefined;
  const getTower = (): Tower | null => {
    if (tower !== undefined) return tower;
    try {
      const endpoint = (opts.env.AIOPS_ENDPOINT ?? "").trim();
      const apiKey = (opts.env.AIOPS_KEY ?? "").trim();
      tower = endpoint && apiKey ? opts.create({ endpoint, apiKey, appCode: APP_CODE, timeoutMs: 2000, onError: opts.onError }) : null;
    } catch {
      tower = null;
    }
    return tower;
  };

  /** Report one finished AI call. Returns at once; never throws. */
  function record(event: AiCallEvent): void {
    try {
      const t = getTower();
      if (!t) return;
      void Promise.resolve(t.recordAIRequest(eventToRecord(event))).catch(() => undefined);
    } catch {
      /* telemetry must never break a page */
    }
  }

  /**
   * A drop-in for fetch() for an AI call made outside the provider layer. Returns the very same response; the token
   * counts are read from a COPY of the answer after the caller already has it, so nobody waits.
   */
  async function trackedFetch(meta: TrackMeta, url: string, init: RequestInit): Promise<Response> {
    if (!getTower()) return fetch(url, init);
    const kind = meta.kind ?? "openai-compatible";
    const started = Date.now();
    const base = { provider: meta.provider, model: meta.model, kind, capability: meta.capability, module: meta.module };
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      const timedOut = name === "AbortError" || name === "TimeoutError";
      record({ ...base, status: timedOut ? "timeout" : "failed", errorCode: timedOut ? "timeout" : "network", latencyMs: Date.now() - started });
      throw error;
    }
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      record({ ...base, status: "failed", errorCode: `http_${res.status}`, latencyMs });
      return res;
    }
    try {
      void res
        .clone()
        .json()
        .then((data: { usage?: unknown }) => record({ ...base, status: "success", latencyMs, usage: data?.usage }))
        .catch(() => record({ ...base, status: "success", latencyMs }));
    } catch {
      record({ ...base, status: "success", latencyMs });
    }
    return res;
  }

  return { record, observer: record, trackedFetch, isOn: () => getTower() !== null };
}
