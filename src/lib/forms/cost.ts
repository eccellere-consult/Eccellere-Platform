/**
 * Cost shown BEFORE a "Build with AI" run. It is an estimate from the size of what will be sent, never a promise; the real bill comes from the AI provider.
 * Rates are Anthropic's published price for the strongest model the builder asks for first (claude-opus-5-5), in US dollars per million tokens,
 * as listed on 2026-10-06. If the provider or model is changed in Admin > AI providers, the real cost differs.
 */
export const OPUS_RATES = { model: 'claude-opus-5-5', inputPerMillion: 4, outputPerMillion: 20, listedOn: '2026-10-06' } as const;

/** The builder allows up to this many answer tokens per attempt and makes at most 2 attempts (see build.ts). */
export const MAX_OUTPUT_TOKENS = 9000;
export const MAX_ATTEMPTS = 2;
/** Rough characters per token for English text with some numbers and symbols. Deliberately on the cautious side (more tokens). */
const CHARS_PER_TOKEN = 3;

export interface CostEstimate {
  model: string;
  inputTokens: number;
  /** one attempt that uses about half the allowed answer length */
  lowUsd: number;
  /** two attempts, each using the full allowed answer length */
  highUsd: number;
  basis: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function estimateCost(promptChars: number, rates = OPUS_RATES): CostEstimate {
  const inputTokens = Math.ceil(Math.max(0, promptChars) / CHARS_PER_TOKEN);
  const usd = (attempts: number, out: number) => (attempts * (inputTokens * rates.inputPerMillion + out * rates.outputPerMillion)) / 1_000_000;
  return {
    model: rates.model,
    inputTokens,
    lowUsd: round(usd(1, MAX_OUTPUT_TOKENS / 2)),
    highUsd: round(usd(MAX_ATTEMPTS, MAX_OUTPUT_TOKENS)),
    basis: `About ${inputTokens.toLocaleString('en-US')} tokens are sent. Best case one attempt with a medium-length answer; worst case two full attempts. Priced at US$${rates.inputPerMillion} (in) and US$${rates.outputPerMillion} (out) per million tokens for ${rates.model}, as listed on ${rates.listedOn}.`,
  };
}

export const costLine = (c: CostEstimate): string => `Estimated cost: about US$${c.lowUsd.toFixed(2)} to US$${c.highUsd.toFixed(2)} for this one toolkit.`;
