#!/usr/bin/env node
/**
 * americanize.mjs — convert the taxonomy's UK English to US English and add
 * US grade levels. Rewrites data/*.json in place, then refreshes the manifest.
 *
 * Safe to re-run: rules only match UK forms, so a second run changes nothing.
 *
 *   node scripts/americanize.mjs
 *
 * Writes for review:
 *   adaptation/us/changes.csv      every text field changed (before/after)
 *   adaptation/us/review-needed.md topics a person should rewrite
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skipText, exactRewrites, phraseRules, yearRules, reviewFlags } from '../adaptation/us/rules.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data');
const US = resolve(ROOT, 'adaptation', 'us');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

const spelling = load(resolve(US, 'spelling.json'));

const matchCase = (src, out) => {
  if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
  if (src[0] === src[0].toUpperCase()) return out[0].toUpperCase() + out.slice(1);
  return out;
};

const skipped = new Set();

function convert(text) {
  if (typeof text !== 'string' || !text) return text;
  if (skipText.some((rx) => rx.test(text))) {
    skipped.add(text);
    return text;
  }
  let out = text;
  for (const [from, to] of exactRewrites) out = out.split(from).join(to);
  for (const [rx, to] of phraseRules) out = out.replace(rx, to);
  for (const [rx, to] of yearRules) out = out.replace(rx, to);
  out = out.replace(/[A-Za-z]+/g, (w) => {
    const hit = spelling[w.toLowerCase()];
    return hit ? matchCase(w, hit) : w;
  });
  // A sentence that now starts with a lowercase "grades"/"grade" gets a capital.
  out = out.replace(/^(grades?|kindergarten)\b/, (w) => w[0].toUpperCase() + w.slice(1));
  return out;
}

// --- change log --------------------------------------------------------------
const changes = [['file', 'id', 'field', 'before', 'after']];
const track = (file, id, field, before, after) => {
  if (before !== after) changes.push([file, id, field, before, after]);
  return after;
};

// --- grades ------------------------------------------------------------------
const GRADES = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const gradeIndex = (age) => Math.min(Math.max(age - 4, 0), GRADES.length - 1); // age 4 → PK, 5 → K

const standards = load(resolve(DATA, 'curriculum-standards.json'));
const stdGrade = new Map(); // US standard key → grade index
for (const c of standards.curricula) {
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

// --- topics ------------------------------------------------------------------
const topicsFile = resolve(DATA, 'topics.json');
const topics = load(topicsFile);
const reviews = [];
topics.topics = topics.topics.map((t) => {
  const f = (field) => track('topics.json', t.id, field, t[field], convert(t[field]));
  const next = { ...t };
  next.domain = f('domain');
  next.name = f('name');
  next.description = f('description');
  next.assessmentPrompt = f('assessmentPrompt');
  next.evidence = t.evidence.map((e, i) => track('topics.json', t.id, `evidence[${i}]`, e, convert(e)));

  // US grade band: from the age range, widened to cover any linked US standard.
  if (t.ageRangeStart != null) {
    let lo = gradeIndex(t.ageRangeStart);
    // ageRangeEnd behaves like an exclusive upper bound (ages 5–6 is a K topic).
    let hi = Math.max(lo, gradeIndex((t.ageRangeEnd ?? t.ageRangeStart + 1) - 1));
    for (const key of t.standards) {
      const sg = stdGrade.get(key);
      if (sg != null) { lo = Math.min(lo, sg); hi = Math.max(hi, sg); }
    }
    next.gradeStart = GRADES[lo];
    next.gradeEnd = GRADES[hi];
  }

  const text = [next.name, next.description, next.assessmentPrompt, ...next.evidence].join(' \n ');
  const hits = reviewFlags
    .filter(([rx, , subject, unless]) => (!subject || subject === t.subject) && rx.test(text) && !(unless && unless.test(text)))
    .map(([, reason]) => reason);
  if (hits.length) reviews.push({ t: next, hits });

  // Keep field order stable: grades sit next to the age range.
  const { gradeStart, gradeEnd, ...rest } = next;
  const ordered = {};
  for (const [k, v] of Object.entries(rest)) {
    ordered[k] = v;
    if (k === 'ageRangeEnd' && gradeStart) { ordered.gradeStart = gradeStart; ordered.gradeEnd = gradeEnd; }
  }
  return ordered;
});
save(topicsFile, topics);

// --- dependencies -------------------------------------------------------------
const depsFile = resolve(DATA, 'dependencies.json');
const deps = load(depsFile);
for (const d of deps.dependencies) {
  d.reason = track('dependencies.json', `${d.topicId}>${d.prerequisiteId}`, 'reason', d.reason, convert(d.reason));
}
save(depsFile, deps);

// --- clusters -------------------------------------------------------------------
const clustersFile = resolve(DATA, 'clusters.json');
const clusters = load(clustersFile);
clusters.clusters = clusters.clusters.map((c, i) => {
  const id = `${c.subject}/${c.domain}/${c.ageRangeStart}`;
  const out = {
    subject: c.subject,
    domain: track('clusters.json', id, 'domain', c.domain, convert(c.domain)),
    ageRangeStart: c.ageRangeStart,
    gradeStart: GRADES[gradeIndex(c.ageRangeStart)],
    summary: track('clusters.json', id, 'summary', c.summary, convert(c.summary)),
  };
  return out;
});
save(clustersFile, clusters);

// --- manifest -------------------------------------------------------------------
const manifestFile = resolve(DATA, 'manifest.json');
const manifest = load(manifestFile);
manifest.adaptation = {
  name: 'Socratic Foundry Map — US adaptation',
  basedOn: 'Marble Skill Taxonomy v1 (withmarbleapp/os-taxonomy @ 96a7933)',
  changes: 'US spelling and vocabulary, dollars and cents, UK school years converted to US grades, gradeStart/gradeEnd added. See adaptation/us/.',
};
for (const name of Object.keys(manifest.files)) {
  const buf = readFileSync(resolve(DATA, name));
  manifest.files[name] = { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}
save(manifestFile, manifest);

// --- review outputs ---------------------------------------------------------------
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
if (changes.length > 1) writeFileSync(resolve(US, 'changes.csv'), changes.map((r) => r.map(csv).join(',')).join('\n') + '\n');

const inK6 = (t) => t.gradeStart && GRADES.indexOf(t.gradeStart) <= GRADES.indexOf('6');
const byReason = new Map();
for (const { t, hits } of reviews) for (const h of hits) {
  if (!byReason.has(h)) byReason.set(h, []);
  byReason.get(h).push(t);
}
let md = '# Topics needing a human rewrite\n\n';
md += 'Generated by `scripts/americanize.mjs`. The script converts spelling, vocabulary, money and school years; ';
md += 'these topics carry UK content that a find-and-replace cannot fix. K–6 topics are listed first.\n\n';
for (const [reason, list] of byReason) {
  list.sort((a, b) => (inK6(b) - inK6(a)) || GRADES.indexOf(a.gradeStart) - GRADES.indexOf(b.gradeStart) || a.name.localeCompare(b.name));
  md += `## ${reason} (${list.length})\n\n| Topic | Id | Subject | Grades |\n| --- | --- | --- | --- |\n`;
  for (const t of list) md += `| ${t.name} | \`${t.id}\` | ${t.subject} | ${t.gradeStart === t.gradeEnd ? t.gradeStart : `${t.gradeStart}–${t.gradeEnd}`} |\n`;
  md += '\n';
}
writeFileSync(resolve(US, 'review-needed.md'), md);

console.log(`changed ${changes.length - 1} text fields; skipped ${skipped.size} UK spelling-rule texts; ${reviews.length} topics flagged for review`);
