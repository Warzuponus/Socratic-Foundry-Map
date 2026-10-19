# Changelog

All notable changes to the Marble Skill Taxonomy dataset are documented here.
Dataset releases are versioned independently of the taxonomy `version` field
(the underlying taxonomy is `v1`).

## [us-0.1.0] — 2026-10-19 (Socratic Foundry Map)

US adaptation of Marble Skill Taxonomy v1.

### Changed
- US spelling and vocabulary across topic names, descriptions, evidence, assessment prompts, dependency reasons and cluster summaries (1,745 text fields; see `adaptation/us/changes.csv`).
- Money in dollars and cents; UK coin topics rewritten for US coins and bills.
- UK school years and key stages replaced with US grades.
- Evidence on 29 topics listed research citations (paper titles, journals, author names) instead of mastery criteria; each is replaced with three observable, child-level criteria (`adaptation/us/evidence-rewrites.json`, applied by `scripts/apply-evidence-rewrites.mjs`, which keeps the original citations as `before`).

### Added
- 130 Common Core ELA links for K–6 English topics (`adaptation/us/links/ccss-ela.json`). Every K–6 CCSS ELA standard in the RF, RL, RI, W, SL and L strands now links to at least one topic except W.5.10; six standards or sub-standards (SL.6.1b, L.6.1a–c, L.6.5b, W.5.10) have no honest match and are listed with reasons. `scripts/apply-standard-links.mjs` now widens `gradeStart`/`gradeEnd` to cover linked standards, which changed the grades of 12 topics.
- 262 Common Core math links for K–6 topics (`adaptation/us/links/ccss-math.json`, applied by `scripts/apply-standard-links.mjs`). All K–5 CCSS-M standards now link to at least one topic; grade 6 is at 31 of 47.
- `gradeStart` / `gradeEnd` on topics and `gradeStart` on clusters, with schema and validator support.
- `scripts/americanize.mjs` and `adaptation/us/` (rules, spelling map, change log, review list).

## [1.0.0] — 2026-07-08

Initial public release.

### Included
- **1,590 micro-topics** across 8 subjects (`data/topics.json`).
- **3,221 prerequisite dependencies** with `hard`/`soft` strength + reasons (`data/dependencies.json`).
- **7 curricula / 3,261 standards** with 1,859 topic↔standard links (`data/curriculum-standards.json`).
- **183 domain clusters** (`data/clusters.json`).
- JSON Schemas + a dependency-free validator.

### Curriculum text shipped
- **Full text:** UK National Curriculum (OGL v3.0), Common Core ELA + Math (CCSS Public License).
- **Codes only** (verbatim text omitted pending rights clearance): NGSS K-5 + Middle School, C3 Framework, IB PYP PSPE. See [PROVENANCE.md](PROVENANCE.md).

### Excluded
- Semantic embeddings (derived / recomputable).
- All per-child and user data (never published).
