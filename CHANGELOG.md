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

### Added
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
