# Implementation guidance — concrete before/after rules attached to criteria

A standards pack says *what* a criterion requires; **guidance** says *how to implement
it*. It is the layer of concrete, how-to-implement rules — the RGAA SocialGouv/etalab
good/bad code patterns — keyed to a pack criterion and the WCAG success criteria it maps
onto. It enriches output without ever changing the verdict.

## Where it shows up

Guidance is looked up at **render time** by criterion / WCAG SC, so the canonical
`audit` JSON stays untouched (no schema change, no new finding). It surfaces in:

- **`prd`** — each backlog item gains a before/after example and an effort estimate; the
  `--format doc` PRD weaves it into the user stories and acceptance criteria.
- **`criteria`** lookups for a pack criterion.

Because attachment is presentation-only, guidance never marks anything conforming and
never invents a non-conformity — it is illustration, not detection.

## Dataset shape

A guidance dataset is JSON: `{ pack, source, license, attribution, entries[] }`, where
each entry is `{ id, criterionId, wcag[], title, summary, impact?, examples[], reference }`
and an example is `{ lang: "html"|"jsx"|"css", bad?, good?, note? }`. The built-in RGAA
guidance ships at `src/data/guidance/rgaa.json` (its entry ids mirror the SocialGouv rule
files). Load external guidance with `--pack <dir>` (a `guidance.json` beside `pack.json`)
or a `.ultra11yrc.json` `guidance` list. `pack check --guidance` validates that every
entry resolves to a real criterion, maps to recognized WCAG SCs, and that every example
parses.

## Honesty rule — guidance is NOT a free detector

A pattern earns a **WCAG-core detector** only when it is both statically decidable **and**
maps to a success criterion present in the WCAG 2.2 **AA** core. Everything else lives
here as guidance (and, where the country standard covers it, in the pack), never as a
silent "conforming".

The headline example: **opening a new window** (`target="_blank"` without warning). Its
only clean WCAG home is **3.2.5 Change on Request — which is AAA, absent from the AA
core** (the dataset jumps 3.2.4 → 3.2.6). So ultra11y does **not** ship a WCAG-core
detector for it — no static rule flags `target="_blank"` under any standard. It ships as
RGAA guidance (criterion 13.2 → WCAG 3.2.1): look it up with `criteria --standard rgaa 13.2`,
and it attaches to the relevant `prd`/`report` entry — it is never raised as an audit
non-conformity, and never force-mapped onto a wrong AA criterion. (`--standard` is a
`report`/`prd`/`criteria` flag, not an `audit` one.) Judgment- and
rendering-dependent rules (alt relevance, computed contrast, reading order) stay guidance
+ residual risk for the same reason.

## Attribution

RGAA 4.1.2 © DINUM — Licence Ouverte / Etalab 2.0. The before/after implementation
patterns are adapted from SocialGouv/skills (`rgaa-html-css`) and the official RGAA
méthode; the dataset stores short derived summaries + minimal examples, not verbatim prose
(see `NOTICE`). When ingesting another source, record its license and attribution in the
dataset header and `NOTICE` before redistributing any text.
