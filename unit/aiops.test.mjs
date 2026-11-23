// Run: node --test unit/aiops.test.mjs  (fetch is faked; no network, no keys, no database)
// Covers the AI Control Tower hook: silent without settings, never breaks a call, sends technical fields only.
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createControlTower } from "../src/lib/aiops/client.ts";
import { makeAiopsReporter, eventToRecord, tokensFromUsage, APP_CODE } from "../src/lib/aiops/hook.ts";
import { callProvider, runProviders, setAiCallObserver, PROVIDER_BY_ID, normalizeSettings } from "../src/lib/ai/providers.ts";

const realFetch = globalThis.fetch;
const ENDPOINT = "https://tower.example/api/v1";
const ON = { AIOPS_ENDPOINT: ENDPOINT, AIOPS_KEY: "test-key" };
const providerKeys = { ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o", GROQ_API_KEY: "g", XAI_API_KEY: "x" };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const flush = () => new Promise((r) => setTimeout(r, 20));

/** A fake network: provider calls get `providerAnswer`, Control Tower calls are written to `sent`. */
function fakeNetwork({ providerAnswer, tower = () => json({ ok: true }) }) {
  const sent = [];
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    if (String(url).startsWith(ENDPOINT)) {
      sent.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
      return tower();
    }
    return typeof providerAnswer === "function" ? providerAnswer(url, init) : providerAnswer;
  };
  return { sent, calls };
}

afterEach(() => { globalThis.fetch = realFetch; setAiCallObserver(null); });

const SECRET_PROMPT = "SECRET-PROMPT client Asha Rao asha@example.com +91 98765 43210";
const SECRET_ANSWER = "SECRET-ANSWER confidential advice";
const args = { system: "SECRET-SYSTEM text", user: SECRET_PROMPT, maxTokens: 50 };
const reporter = (env) => makeAiopsReporter({ env, create: createControlTower });

test("without AIOPS_ENDPOINT and AIOPS_KEY it does nothing: no network call at all", async () => {
  for (const env of [{}, { AIOPS_ENDPOINT: ENDPOINT }, { AIOPS_KEY: "k" }, { AIOPS_ENDPOINT: "  ", AIOPS_KEY: "  " }]) {
    const r = reporter(env);
    const net = fakeNetwork({ providerAnswer: json({ content: [{ type: "text", text: SECRET_ANSWER }], usage: { input_tokens: 5, output_tokens: 6 } }) });
    setAiCallObserver(r.observer);
    assert.equal(r.isOn(), false);
    assert.equal(await callProvider(PROVIDER_BY_ID.anthropic, "m", args, providerKeys), SECRET_ANSWER);
    await flush();
    assert.deepEqual(net.calls.filter((u) => u.startsWith(ENDPOINT)), []);
    assert.equal(net.calls.length, 1); // only the provider call itself
  }
});

test("trackedFetch without settings is a plain fetch: same response, one call, nothing else", async () => {
  const r = reporter({});
  const net = fakeNetwork({ providerAnswer: json({ choices: [{ message: { content: "hi" } }], usage: { prompt_tokens: 1 } }) });
  const res = await r.trackedFetch({ provider: "groq", model: "m", capability: "c", module: "x" }, "https://api.groq.com/x", { method: "POST" });
  assert.equal((await res.json()).choices[0].message.content, "hi");
  await flush();
  assert.equal(net.calls.length, 1);
});

test("an Anthropic call is reported with exact token fields, labels and no prompt or answer text", async () => {
  const net = fakeNetwork({ providerAnswer: json({ content: [{ type: "text", text: SECRET_ANSWER }], usage: { input_tokens: 1200, output_tokens: 800, cache_read_input_tokens: 300 } }) });
  setAiCallObserver(reporter(ON).observer);
  const out = await callProvider(PROVIDER_BY_ID.anthropic, "claude-sonnet-5-5", { ...args, capability: "form_build", module: "form_builder" }, providerKeys);
  assert.equal(out, SECRET_ANSWER);
  await flush();
  assert.equal(net.sent.length, 1);
  const { url, headers, body } = net.sent[0];
  assert.equal(url, `${ENDPOINT}/requests`);
  assert.equal(headers["x-aiops-key"], "test-key");
  assert.equal(body.app_code, APP_CODE);
  assert.equal(body.app_code, "eccellere_co");
  assert.equal(body.provider, "anthropic");
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.equal(body.capability_code, "form_build");
  assert.equal(body.module_code, "form_builder");
  assert.equal(body.input_tokens, 1200);
  assert.equal(body.output_tokens, 800);
  assert.equal(body.cached_tokens, 300);
  assert.equal(body.status, "success");
  assert.equal(body.retry_count, 0);
  assert.equal(typeof body.latency_ms, "number");
  assert.equal(body.token_usage_estimated, false);
  assert.equal(body.user_hash, undefined);
  const text = JSON.stringify(body);
  for (const secret of ["SECRET", "Asha", "asha@example.com", "98765"]) assert.ok(!text.includes(secret), `payload must not contain ${secret}`);
  for (const key of Object.keys(body)) assert.ok(!/cost|price|prompt$|answer|content|text/i.test(key) || key === "prompt_code" || key === "prompt_version", `unexpected field ${key}`);
});

test("an OpenAI-style call (Groq, OpenAI, xAI) reports prompt/completion tokens and cached tokens as returned", async () => {
  const net = fakeNetwork({ providerAnswer: () => json({ choices: [{ message: { content: SECRET_ANSWER } }], usage: { prompt_tokens: 900, completion_tokens: 100, prompt_tokens_details: { cached_tokens: 400 } } }) });
  setAiCallObserver(reporter(ON).observer);
  for (const id of ["openai", "groq", "xai"]) await callProvider(PROVIDER_BY_ID[id], "m-" + id, args, providerKeys);
  await flush();
  assert.deepEqual(net.sent.map((s) => s.body.provider), ["openai", "groq", "xai"]);
  for (const s of net.sent) {
    assert.equal(s.body.input_tokens, 900);
    assert.equal(s.body.output_tokens, 100);
    assert.equal(s.body.cached_tokens, 400);
    assert.equal(s.body.capability_code, "ai_text_generation"); // unlabelled calls still get a stable default
    assert.equal(s.body.module_code, "platform");
  }
});

test("failures are reported with the right status: HTTP error, network error, timeout", async () => {
  setAiCallObserver(reporter(ON).observer);
  let net = fakeNetwork({ providerAnswer: json({ error: { message: "SECRET-ERROR-TEXT overloaded" } }, 529) });
  assert.equal(await callProvider(PROVIDER_BY_ID.anthropic, "m", args, providerKeys), null);
  await flush();
  assert.equal(net.sent[0].body.status, "failed");
  assert.equal(net.sent[0].body.error_code, "http_529");
  assert.ok(!JSON.stringify(net.sent[0].body).includes("SECRET"));

  net = fakeNetwork({ providerAnswer: () => { throw new Error("socket hang up SECRET"); } });
  assert.equal(await callProvider(PROVIDER_BY_ID.openai, "m", args, providerKeys), null);
  await flush();
  assert.equal(net.sent[0].body.status, "failed");
  assert.equal(net.sent[0].body.error_code, "network");

  net = fakeNetwork({ providerAnswer: (url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))) });
  assert.equal(await callProvider(PROVIDER_BY_ID.groq, "m", { ...args, timeoutMs: 15 }, providerKeys), null);
  await flush();
  assert.equal(net.sent[0].body.status, "timeout");
  assert.equal(net.sent[0].body.error_code, "timeout");
  assert.equal(net.sent[0].body.input_tokens, undefined);
});

test("an answer with no text is reported as failed but keeps its token counts", async () => {
  const net = fakeNetwork({ providerAnswer: json({ content: [], usage: { input_tokens: 10, output_tokens: 0 } }) });
  setAiCallObserver(reporter(ON).observer);
  assert.equal(await callProvider(PROVIDER_BY_ID.anthropic, "m", args, providerKeys), null);
  await flush();
  assert.equal(net.sent[0].body.status, "failed");
  assert.equal(net.sent[0].body.error_code, "empty_answer");
  assert.equal(net.sent[0].body.input_tokens, 10);
});

test("a fallback is reported per provider call, and the second try on one provider carries retry_count 1", async () => {
  const net = fakeNetwork({ providerAnswer: (url) => String(url).includes("anthropic") ? json({}, 500) : json({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 3, completion_tokens: 4 } }) });
  setAiCallObserver(reporter(ON).observer);
  const s = normalizeSettings({ primary: "anthropic", fallbacks: ["openai"] });
  const r = await runProviders(s, providerKeys, { ...args, capability: "advisor_answer", module: "advisor" });
  assert.equal(r.provider, "openai");
  await flush();
  assert.deepEqual(net.sent.map((x) => [x.body.provider, x.body.status, x.body.capability_code]), [["anthropic", "failed", "advisor_answer"], ["openai", "success", "advisor_answer"]]);
  net.sent.length = 0;
  await callProvider(PROVIDER_BY_ID.anthropic, "m", { ...args, retry: 1 }, providerKeys);
  await flush();
  assert.equal(net.sent[0].body.retry_count, 1);
});

test("a missing provider key makes no AI call, so nothing is reported", async () => {
  const net = fakeNetwork({ providerAnswer: json({}) });
  setAiCallObserver(reporter(ON).observer);
  assert.equal(await callProvider(PROVIDER_BY_ID.openai, "m", args, {}), null);
  await flush();
  assert.equal(net.calls.length, 0);
});

test("it never throws and never changes the answer when the Control Tower is down, slow or answers 500", async () => {
  const answer = json({ content: [{ type: "text", text: "fine" }], usage: { input_tokens: 1, output_tokens: 1 } });
  const cases = {
    down: () => { throw new Error("ECONNREFUSED"); },
    error500: () => json({ error: "boom" }, 500),
    neverAnswers: () => new Promise(() => {}),
  };
  for (const [name, tower] of Object.entries(cases)) {
    fakeNetwork({ providerAnswer: () => answer.clone(), tower });
    setAiCallObserver(reporter(ON).observer);
    const started = Date.now();
    assert.equal(await callProvider(PROVIDER_BY_ID.anthropic, "m", args, providerKeys), "fine", name);
    assert.ok(Date.now() - started < 500, `${name}: the caller must not wait for the Control Tower`);
  }
});

test("the client gives up on a slow Control Tower after its time limit and swallows the error", async () => {
  globalThis.fetch = (url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const errors = [];
  const tower = createControlTower({ endpoint: ENDPOINT, apiKey: "k", appCode: "eccellere_co", timeoutMs: 30, onError: (e) => errors.push(e) });
  assert.equal(await tower.recordAIRequest({ status: "success" }), false);
  assert.equal(errors.length, 1);
});

test("a broken listener cannot break an AI call", async () => {
  fakeNetwork({ providerAnswer: json({ content: [{ type: "text", text: "fine" }] }) });
  setAiCallObserver(() => { throw new Error("listener bug"); });
  assert.equal(await callProvider(PROVIDER_BY_ID.anthropic, "m", args, providerKeys), "fine");
});

test("trackedFetch (calls made outside the provider layer): same response back, tokens read from a copy, failures reported", async () => {
  const r = reporter(ON);
  let net = fakeNetwork({ providerAnswer: json({ choices: [{ message: { content: SECRET_ANSWER } }], usage: { prompt_tokens: 50, completion_tokens: 20 } }) });
  const res = await r.trackedFetch({ provider: "groq", model: "llama-3.3-70b-versatile", capability: "asset_listing_generate", module: "marketplace" }, "https://api.groq.com/openai/v1/chat/completions", { method: "POST", body: SECRET_PROMPT });
  assert.equal((await res.json()).choices[0].message.content, SECRET_ANSWER); // the caller can still read the whole answer
  await flush();
  assert.equal(net.sent.length, 1);
  assert.deepEqual([net.sent[0].body.provider, net.sent[0].body.capability_code, net.sent[0].body.input_tokens, net.sent[0].body.output_tokens, net.sent[0].body.status], ["groq", "asset_listing_generate", 50, 20, "success"]);
  assert.ok(!JSON.stringify(net.sent[0].body).includes("SECRET"));

  net = fakeNetwork({ providerAnswer: json({}, 429) });
  const bad = await r.trackedFetch({ provider: "groq", model: "m", capability: "c", module: "x" }, "https://api.groq.com/x", {});
  assert.equal(bad.status, 429); // the app sees the real 429
  await flush();
  assert.deepEqual([net.sent[0].body.status, net.sent[0].body.error_code], ["failed", "http_429"]);

  net = fakeNetwork({ providerAnswer: () => { throw Object.assign(new Error("t"), { name: "TimeoutError" }); } });
  await assert.rejects(() => r.trackedFetch({ provider: "groq", model: "m", capability: "c", module: "x" }, "https://api.groq.com/x", {}), /t/); // the original error still reaches the app
  await flush();
  assert.equal(net.sent[0].body.status, "timeout");
});

test("record details: unsafe error codes and junk token values are dropped; no cost is ever sent", () => {
  const rec = eventToRecord({ provider: "p", model: "m", kind: "anthropic", status: "failed", errorCode: "Bad text with SPACES and secrets", latencyMs: 12.7, usage: { input_tokens: -5, output_tokens: "7", cache_read_input_tokens: NaN } });
  assert.equal(rec.errorCode, undefined);
  assert.equal(rec.inputTokens, undefined);
  assert.equal(rec.outputTokens, undefined);
  assert.equal(rec.cachedTokens, undefined);
  assert.equal(rec.latencyMs, 13);
  assert.ok(!("cost" in rec) && !("costUsd" in rec));
  assert.deepEqual(tokensFromUsage("openai-compatible", null), {});
});
