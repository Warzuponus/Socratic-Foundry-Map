#!/usr/bin/env node
/**
 * apply-evidence-rewrites.mjs — replace research citations in topic evidence.
 *
 * Reads adaptation/us/evidence-rewrites.json:
 *   { "rewrites": [ { "topicId", "name", "before": [...], "after": [...] } ] }
 * and, in each topic's `evidence`, swaps the `before` lines (citations) for the
 * `after` lines (observable criteria), placed where the first `before` line was.
 * A topic that already has every `after` line and no `before` line is left
 * alone, so the script is safe to re-run. Refreshes manifest checksums.
 *
 *   node scripts/apply-evidence-rewrites.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

const topicsFile = resolve(DATA, 'topics.json');
const topics = load(topicsFile);
const byId = new Map(topics.topics.map((t) => [t.id, t]));
const { rewrites } = load(resolve(ROOT, 'adaptation', 'us', 'evidence-rewrites.json'));

let changed = 0;
for (const { topicId, before, after } of rewrites) {
  const t = byId.get(topicId);
  if (!t) throw new Error(`evidence-rewrites: unknown topic ${topicId}`);
  const hasBefore = before.filter((line) => t.evidence.includes(line));
  if (hasBefore.length === 0) {
    if (after.every((line) => t.evidence.includes(line))) continue; // already applied
    throw new Error(`evidence-rewrites: ${topicId} has neither the before nor the after lines`);
  }
  if (hasBefore.length !== before.length) throw new Error(`evidence-rewrites: ${topicId} has only some of the before lines`);
  const at = t.evidence.findIndex((line) => before.includes(line));
  const kept = t.evidence.filter((line) => !before.includes(line) && !after.includes(line));
  const keptBefore = t.evidence.slice(0, at).filter((line) => kept.includes(line)).length;
  t.evidence = [...kept.slice(0, keptBefore), ...after, ...kept.slice(keptBefore)];
  changed++;
}
save(topicsFile, topics);

const manifestFile = resolve(DATA, 'manifest.json');
const manifest = load(manifestFile);
for (const name of Object.keys(manifest.files)) {
  const buf = readFileSync(resolve(DATA, name));
  manifest.files[name] = { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}
save(manifestFile, manifest);
console.log(`rewrote evidence on ${changed} topics (${rewrites.length} in file)`);
