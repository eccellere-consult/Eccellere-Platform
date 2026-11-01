// Run: node --test unit/toolkit-client-bundle.test.mjs
//
// Guards against a build failure that unit tests and the type check cannot see: a browser-side
// ("use client") file that, through any chain of imports, reaches server-only code such as the
// database driver. Next.js then fails the production build with "Can't resolve 'fs' / 'net' / 'tls'".
//
// It follows static imports AND dynamic import("...") calls, because the bundler follows both.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");

const SERVER_ONLY_FILES = [
  "src/lib/prisma.ts", "src/lib/ai/gateway.ts", "src/lib/toolkit/server.ts", "src/lib/auth.ts", "src/lib/rate-limit.ts",
  "src/lib/toolkit/narrative.ts", "src/lib/toolkit/narrative-digest.ts", "src/lib/toolkit/ai.ts",
];
const SERVER_ONLY_PACKAGES = [
  "@prisma/client", "@prisma/adapter-mariadb", "mariadb", "next-auth", "nodemailer", "bcryptjs", "officeparser",
  "@aws-sdk/client-s3", "fs", "net", "tls", "child_process", "path",
];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "generated") out.push(...walk(p)); }
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function resolveLocal(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const c of [base, base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function importsOf(file) {
  const text = fs.readFileSync(file, "utf8");
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const specs = [];
  for (const m of stripped.matchAll(IMPORT_RE)) {
    // "import type" statements are erased by the compiler and never reach the bundle
    if (/^\s*(?:import|export)\s+type\s/.test(m[0])) continue;
    specs.push(m[1] ?? m[2]);
  }
  return specs;
}

const files = walk(src);
const clientFiles = files.filter((f) => /^\s*["']use client["']/.test(fs.readFileSync(f, "utf8").replace(/^﻿/, "").trimStart()));

test("there are browser-side files to check", () => {
  assert.ok(clientFiles.length > 10, `found ${clientFiles.length}`);
});

test("no browser-side file can reach server-only code through its imports", () => {
  const problems = [];
  for (const entry of clientFiles) {
    const seen = new Set();
    const queue = [[entry, [path.relative(root, entry)]]];
    while (queue.length) {
      const [file, trail] = queue.shift();
      if (seen.has(file)) continue;
      seen.add(file);
      for (const spec of importsOf(file)) {
        const bare = spec.startsWith("@/") || spec.startsWith(".") ? null : spec;
        if (bare && SERVER_ONLY_PACKAGES.some((p) => bare === p || bare.startsWith(p + "/")) && bare !== "next-auth/react") {
          problems.push(`${trail.join(" -> ")} -> ${bare}`);
          continue;
        }
        const next = resolveLocal(spec, file);
        if (!next) continue;
        const rel = path.relative(root, next).replace(/\\/g, "/");
        if (SERVER_ONLY_FILES.includes(rel)) { problems.push(`${trail.join(" -> ")} -> ${rel}`); continue; }
        queue.push([next, [...trail, rel]]);
      }
    }
  }
  assert.deepEqual(problems, [], "browser-side code must not import server-only modules:\n" + problems.join("\n"));
});

test("the browser-safe narrative module stays free of server imports", () => {
  const plan = path.join(src, "lib/toolkit/narrative-plan.ts");
  const specs = importsOf(plan);
  assert.deepEqual(specs, [], "narrative-plan.ts may only use type imports");
});

test("the checker really would catch the original mistake (self-test)", () => {
  // Simulate: a client file importing narrative.ts, which dynamically imports the AI gateway.
  const narrative = path.join(src, "lib/toolkit/narrative.ts");
  const specs = importsOf(narrative);
  assert.ok(specs.some((s) => s === "@/lib/ai/gateway"), "narrative.ts reaches the AI gateway via dynamic import, which is why it is server-only");
  assert.ok(SERVER_ONLY_FILES.includes("src/lib/toolkit/narrative.ts"));
});
