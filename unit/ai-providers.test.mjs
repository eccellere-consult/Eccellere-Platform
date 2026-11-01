// Run: node --test unit/ai-providers.test.mjs  (fetch is mocked; no network, no keys)
import test from "node:test";
import assert from "node:assert/strict";
import {
  PROVIDERS, defaultSettings, normalizeSettings, resolveOrder, modelFor, hasKey, callProvider, runProviders, PROVIDER_BY_ID,
} from "../src/lib/ai/providers.ts";

const allKeys = { ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o", GROQ_API_KEY: "g", XAI_API_KEY: "x" };

test("registry covers the four providers with distinct env keys", () => {
  assert.deepEqual(PROVIDERS.map((p) => p.id).sort(), ["anthropic", "groq", "openai", "xai"]);
  assert.equal(new Set(PROVIDERS.map((p) => p.envKey)).size, 4);
});

test("default keeps today's behaviour: Groq primary", () => {
  assert.equal(defaultSettings().primary, "groq");
});

test("resolveOrder: primary first, then fallbacks; skips disabled and keyless providers", () => {
  const s = normalizeSettings({ primary: "anthropic", fallbacks: ["openai", "groq"] });
  assert.deepEqual(resolveOrder(s, allKeys).map((p) => p.id), ["anthropic", "openai", "groq", "xai"]);
  s.providers.openai.enabled = false;
  assert.deepEqual(resolveOrder(s, allKeys).map((p) => p.id), ["anthropic", "groq", "xai"]);
  assert.deepEqual(resolveOrder(s, { GROQ_API_KEY: "g" }).map((p) => p.id), ["groq"]);
  assert.deepEqual(resolveOrder(s, {}), []);
  assert.equal(hasKey(PROVIDER_BY_ID.groq, { GROQ_API_KEY: "   " }), false);
});

test("normalizeSettings sanitises junk, duplicates and unknown ids", () => {
  const s = normalizeSettings({ primary: "evil", fallbacks: ["openai", "openai", "nope", "groq"], providers: { openai: { enabled: "yes", model: "gpt<script>-4" }, groq: { enabled: false, model: "x".repeat(300) } } });
  assert.equal(s.primary, "groq");
  assert.equal(new Set(s.fallbacks).size, s.fallbacks.length);
  assert.ok(!s.fallbacks.includes("groq")); // primary is never also a fallback
  assert.equal(s.providers.openai.enabled, true);          // non-boolean ignored
  assert.ok(!/[<>]/.test(s.providers.openai.model));
  assert.equal(s.providers.groq.enabled, false);
  assert.ok(s.providers.groq.model.length <= 80);
  assert.deepEqual(normalizeSettings(null), defaultSettings());
  assert.deepEqual(normalizeSettings("junk"), defaultSettings());
});

test("modelFor: admin override > env override > provider default", () => {
  const s = defaultSettings(); const p = PROVIDER_BY_ID.openai;
  assert.equal(modelFor(p, s, {}), p.defaultModel);
  assert.equal(modelFor(p, s, { OPENAI_MODEL: "env-model" }), "env-model");
  s.providers.openai.model = "admin-model";
  assert.equal(modelFor(p, s, { OPENAI_MODEL: "env-model" }), "admin-model");
});

const realFetch = globalThis.fetch;
const capture = (resp) => { const c = {}; globalThis.fetch = async (url, init) => { c.url = url; c.init = init; c.body = JSON.parse(init.body); return resp; }; return c; };
const ok = (json) => ({ ok: true, status: 200, json: async () => json });
const args = { system: "SYS", user: "USR", maxTokens: 50 };

test("Anthropic request: x-api-key header, top-level system, content blocks parsed", async () => {
  const c = capture(ok({ content: [{ type: "text", text: "Hello " }, { type: "text", text: "world" }] }));
  const t = await callProvider(PROVIDER_BY_ID.anthropic, "claude-x", args, allKeys);
  assert.equal(t, "Hello world");
  assert.equal(c.url, "https://api.anthropic.com/v1/messages");
  assert.equal(c.init.headers["x-api-key"], "a");
  assert.equal(c.init.headers["anthropic-version"], "2023-06-01");
  assert.equal(c.body.system, "SYS"); assert.equal(c.body.max_tokens, 50); assert.equal(c.body.model, "claude-x");
  assert.deepEqual(c.body.messages, [{ role: "user", content: "USR" }]);
  globalThis.fetch = realFetch;
});

test("OpenAI-compatible request: Bearer auth, system message, correct base URL per provider", async () => {
  for (const [id, url] of [["openai", "https://api.openai.com/v1/chat/completions"], ["groq", "https://api.groq.com/openai/v1/chat/completions"], ["xai", "https://api.x.ai/v1/chat/completions"]]) {
    const c = capture(ok({ choices: [{ message: { content: "OK" } }] }));
    assert.equal(await callProvider(PROVIDER_BY_ID[id], "m", args, allKeys), "OK");
    assert.equal(c.url, url);
    assert.match(c.init.headers.Authorization, /^Bearer /);
    assert.equal(c.body.messages[0].role, "system");
  }
  globalThis.fetch = realFetch;
});

test("callProvider returns null with no key, on HTTP error, and on network failure", async () => {
  capture(ok({}));
  assert.equal(await callProvider(PROVIDER_BY_ID.openai, "m", args, {}), null);
  capture({ ok: false, status: 401, json: async () => ({}) });
  assert.equal(await callProvider(PROVIDER_BY_ID.openai, "m", args, allKeys), null);
  globalThis.fetch = async () => { throw new Error("down"); };
  assert.equal(await callProvider(PROVIDER_BY_ID.openai, "m", args, allKeys), null);
  globalThis.fetch = realFetch;
});

test("runProviders falls back when the primary fails, and reports which provider answered", async () => {
  const s = normalizeSettings({ primary: "anthropic", fallbacks: ["openai"] });
  globalThis.fetch = async (url) => url.includes("anthropic")
    ? { ok: false, status: 500, json: async () => ({}) }
    : ok({ choices: [{ message: { content: "from-openai" } }] });
  const r = await runProviders(s, allKeys, args);
  assert.equal(r.provider, "openai"); assert.equal(r.text, "from-openai");
  globalThis.fetch = realFetch;
});

test("runProviders: 'only' forces one provider with no fallback; disabled provider is never called", async () => {
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(url); return { ok: false, status: 500, json: async () => ({}) }; };
  const s = normalizeSettings({ primary: "groq" });
  assert.equal(await runProviders(s, allKeys, { ...args, only: "xai" }), null);
  assert.equal(calls.length, 1); assert.match(calls[0], /x\.ai/);
  calls.length = 0;
  for (const p of PROVIDERS) s.providers[p.id].enabled = p.id === "groq";
  await runProviders(s, allKeys, args);
  assert.ok(calls.every((u) => u.includes("groq")));
  globalThis.fetch = realFetch;
});

test("no usable provider -> null and no network call", async () => {
  let called = false; globalThis.fetch = async () => { called = true; };
  assert.equal(await runProviders(defaultSettings(), {}, args), null);
  assert.equal(called, false); globalThis.fetch = realFetch;
});

test("diag records the HTTP status and provider message, and never the key", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => '{"error":{"message":"Invalid API Key: secret-g"}}', json: async () => ({}) });
  const diag = [];
  const keys = { GROQ_API_KEY: "secret-g" };
  assert.equal(await callProvider(PROVIDER_BY_ID.groq, "m", { ...args, diag }, keys), null);
  assert.equal(diag.length, 1);
  assert.match(diag[0], /HTTP 401/);
  assert.ok(!diag[0].includes("secret-g"), "key must be redacted");
  globalThis.fetch = realFetch;
});

test("diag records a missing key and a timeout", async () => {
  const d1 = [];
  await callProvider(PROVIDER_BY_ID.openai, "m", { ...args, diag: d1 }, {});
  assert.match(d1[0], /key not set/);
  globalThis.fetch = async () => { const e = new Error("x"); e.name = "AbortError"; throw e; };
  const d2 = [];
  await callProvider(PROVIDER_BY_ID.openai, "m", { ...args, diag: d2 }, allKeys);
  assert.match(d2[0], /timed out/);
  globalThis.fetch = realFetch;
});
