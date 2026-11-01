// Run: node --test unit/toolkit-http.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../src/lib/toolkit/http.ts";

const res = (status, body) => new Response(body, { status });

test("empty 500 body no longer throws and gives a readable error", async () => {
  const d = await readJson(res(500, ""));
  assert.match(d.error, /code 500/);
});
test("HTML error page (proxy) is handled", async () => {
  const d = await readJson(res(502, "<html>Bad gateway</html>"));
  assert.match(d.error, /too long/);
});
test("server-provided message is preserved", async () => {
  const d = await readJson(res(503, JSON.stringify({ error: "tables missing" })));
  assert.equal(d.error, "tables missing");
});
test("success body passes through untouched", async () => {
  const d = await readJson(res(200, JSON.stringify({ id: "k1" })));
  assert.deepEqual(d, { id: "k1" });
});
test("401 with empty body asks to sign in", async () => {
  assert.match((await readJson(res(401, ""))).error, /sign in/i);
});
