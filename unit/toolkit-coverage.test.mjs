// Run: node --test unit/toolkit-coverage.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { scoreCatalogue, tokens } from "../src/lib/toolkit/coverage.ts";

const item = (o) => ({ slug: "s", title: "", description: "", category: "OPERATIONS_TEMPLATE", serviceDomain: "", targetSectors: [], tags: [], price: 999, memberPrice: null, ...o });
const catalogue = [
  item({ slug: "wc", title: "Manufacturing Working Capital Kit", description: "Receivables, payables and inventory cash release", tags: ["working capital", "cash"] }),
  item({ slug: "d2c", title: "D2C Launch Playbook", description: "Launch a direct to consumer brand", tags: ["d2c", "ecommerce"] }),
  item({ slug: "ker", title: "Kirana Winning Strategy Toolkit", description: "Neighbourhood stores", tags: ["retail", "kirana"] }),
];

test("tokens drops filler words and keeps meaningful ones", () => {
  assert.deepEqual(tokens("Improve our working capital for the business"), ["working", "capital"]);
});
test("matches the relevant published kit first and explains why", () => {
  const m = scoreCatalogue("manufacturing working capital cash squeeze", catalogue);
  assert.equal(m[0].slug, "wc");
  assert.ok(m[0].matched.includes("working"));
});
test("unrelated topics return nothing (no noise)", () => {
  assert.deepEqual(scoreCatalogue("aircraft maintenance scheduling", catalogue), []);
});
test("a single weak body-only word is not enough", () => {
  assert.deepEqual(scoreCatalogue("neighbourhood", [item({ slug: "x", title: "Other", description: "neighbourhood" })]), []);
});
test("empty or filler-only query returns nothing; result list is capped", () => {
  assert.deepEqual(scoreCatalogue("the and for", catalogue), []);
  const many = Array.from({ length: 10 }, (_, i) => item({ slug: "k" + i, title: "Working capital kit " + i }));
  assert.equal(scoreCatalogue("working capital", many).length, 3);
});
