// Computes SHA1 hashes of every file in local .next/standalone and .next/static,
// then asks server for its hashes, prints the diff. NO uploads.
import { createHash } from 'crypto';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SOURCES = [
  { local: '.next/standalone', remote: '.' },
  { local: '.next/static',     remote: '.next/static' },
];

function walk(dir, out=[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function sha1(file) {
  const h = createHash('sha1');
  h.update(readFileSync(file));
  return h.digest('hex');
}

const localMap = {};
for (const src of SOURCES) {
  const base = join(ROOT, src.local);
  if (!statSync(base, { throwIfNoEntry: false })) continue;
  for (const f of walk(base)) {
    const rel = relative(base, f).replaceAll('\\', '/');
    // skip standalone's own node_modules (server pulls these from a different path)
    if (rel.startsWith('node_modules/')) continue;
    const remoteRel = src.remote === '.' ? rel : `${src.remote}/${rel}`;
    localMap[remoteRel] = sha1(f);
  }
}

console.log(JSON.stringify(localMap));
