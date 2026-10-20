#!/usr/bin/env node
/**
 * apply-standard-links.mjs — add reviewed topic→standard links to topics.json.
 *
 * Reads every adaptation/us/links/*.json file:
 *   { "framework": "ccss-math", "links": [ { "topicId", "standards": [ { "key", "alignment" } ], "note"? } ] }
 * and appends each standard key to that topic's `standards` array (no duplicates).
 * Alignment ("full" / "partial") and notes stay in the links files as the record
 * of why each link exists. Then widens gradeStart/gradeEnd, as americanize.mjs
 * does, so each topic's grades include the grade of every linked Common Core or
 * NGSS K-5 standard (ranges are only widened, never narrowed). Safe to re-run.
 * Refreshes manifest checksums.
 *
 *   node scripts/apply-standard-links.mjs
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data');
const LINKS = resolve(ROOT, 'adaptation', 'us', 'links');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

const topicsFile = resolve(DATA, 'topics.json');
const topics = load(topicsFile);
const byId = new Map(topics.topics.map((t) => [t.id, t]));
const curricula = load(resolve(DATA, 'curriculum-standards.json')).curricula;
const known = new Set(curricula.flatMap((c) => c.topics.map((s) => s.key)));

// US standard key → grade index (same rule as americanize.mjs).
const GRADES = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const stdGrade = new Map();
for (const c of curricula) {
  for (const s of c.topics) {
    let gl = null;
    if (c.slug.startsWith('ccss')) gl = s.data?.gradeLevel ?? null;
    if (c.slug === 'ngss-k5') gl = s.code.split('-')[0];
    if (gl == null) continue;
    gl = String(gl).replace(/^Grade /, '').replace(/^Kindergarten$/, 'K');
    const i = GRADES.indexOf(gl);
    if (i >= 0) stdGrade.set(s.key, i);
  }
}

let added = 0;
for (const file of readdirSync(LINKS).filter((f) => f.endsWith('.json')).sort()) {
  const { links } = load(resolve(LINKS, file));
  for (const link of links) {
    const t = byId.get(link.topicId);
    if (!t) throw new Error(`${file}: unknown topic ${link.topicId}`);
    for (const { key } of link.standards) {
      if (!known.has(key)) throw new Error(`${file}: unknown standard ${key}`);
      if (!t.standards.includes(key)) { t.standards.push(key); added++; }
    }
  }
}

let widened = 0;
for (const t of topics.topics) {
  if (t.gradeStart === undefined) continue;
  let lo = GRADES.indexOf(t.gradeStart);
  let hi = GRADES.indexOf(t.gradeEnd);
  for (const key of t.standards) {
    const g = stdGrade.get(key);
    if (g != null) { lo = Math.min(lo, g); hi = Math.max(hi, g); }
  }
  if (GRADES[lo] !== t.gradeStart || GRADES[hi] !== t.gradeEnd) {
    t.gradeStart = GRADES[lo];
    t.gradeEnd = GRADES[hi];
    widened++;
  }
}
save(topicsFile, topics);

const manifestFile = resolve(DATA, 'manifest.json');
const manifest = load(manifestFile);
manifest.counts.topicStandardLinks = topics.topics.reduce((n, t) => n + t.standards.length, 0);
for (const name of Object.keys(manifest.files)) {
  const buf = readFileSync(resolve(DATA, name));
  manifest.files[name] = { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}
save(manifestFile, manifest);
console.log(`added ${added} topic→standard links; total ${manifest.counts.topicStandardLinks}; widened grades on ${widened} topics`);
