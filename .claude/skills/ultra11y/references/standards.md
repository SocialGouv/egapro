# Standards packs — WCAG core + pluggable country standards

ultra11y's engine is keyed on **WCAG 2.2 Level AA** — the worldwide standard. Country
accessibility standards ship as **standards packs**: small in-repo JSON files that map a
national standard's criteria onto WCAG success criteria. The WCAG verdict is canonical and
gated; a pack report is a *derived view* projected from the same audit.

## Model

- **Core = WCAG 2.2 AA.** 55 success criteria (Level A + AA), the engine's canonical key.
  SC ids/titles/levels are derived from the W3C source (https://github.com/w3c/wcag).
  **French SC/guideline/principle titles are the official W3C AUTHORIZED translation**
  (https://www.w3.org/Translations/WCAG22-fr/, vendored at `scripts/vendor/wcag-2.2-fr.json`)
  baked into the dataset — `--lang fr` output cites the normative French wording, never a
  machine translation (the build fails if a core-AA title is missing).
- **Packs = country standards.** Each pack (`src/data/standards/<key>.json`) declares its
  own localized criteria and, per criterion, the WCAG SC ids it maps to. The engine audits
  WCAG; `derivePackResults` projects that onto the pack's criteria with the same
  NC-dominates rule. A pack carries **no** engine rules or automatability — only the mapping.
- **The SC universe backs validation and scoping.** Alongside the AA core the engine ships
  the full WCAG 2.x SC universe (every real SC at every level, plus the removed ones, from
  the same vendored W3C source). A pack criterion may legitimately map to a real
  out-of-core SC (an AAA criterion, or the removed `4.1.1`): validation accepts it with a
  warning, and a criterion whose mapping is ENTIRELY out-of-core derives as **out of engine
  scope** — status `manual` with a dedicated justification (never a silent NA). Shipped
  example: **RGAA 8.1** (doctype → the removed 4.1.1). A well-formed id that never existed
  (`9.9.9`) is rejected outright. See `references/packs.md`.
- **Pack locales ≠ the CLI's `Lang`.** A pack's `LocaleString`s may carry any BCP-47-ish
  tag (`pt-BR`, `nl-BE`…) — vocabulary and locales are decoupled from the CLI's own
  `--lang fr|en` UI frame (whose `auto` default resolves conversation → repo `<html lang>`
  → the pack's `defaultLocale` → English).

## Using a pack

`--standard <pack>` re-keys the output of `report`, `prd`, `criteria`, `check` and `verify`.
The default is the WCAG core.

```
node scripts/ultra11y.mjs report   --in audits/audit-latest.json --standard rgaa   # → audits/rgaa-YYYY-MM-DD.md
node scripts/ultra11y.mjs criteria --standard rgaa --theme 1                       # a pack theme
node scripts/ultra11y.mjs criteria --standard rgaa 8.3                             # one pack criterion (shows its WCAG SCs)
node scripts/ultra11y.mjs check    --report audits/rgaa-YYYY-MM-DD.md --standard rgaa
```

An unknown `--standard` value errors out (never a silent fallback to WCAG).

## Auditor vocabulary

The `prd` **auditor block** (the default output) and the **GitHub issues** it files are
rendered with the **active standard's own vocabulary** — the nouns an auditor of that standard
reads. A pack declares them under an optional `vocabulary` object (`LocaleString`s):

| term | RGAA (fr) | WCAG core (en) | fallback |
|---|---|---|---|
| `theme` | Thématique | Principle · Guideline | Theme |
| `criterion` | Critère | Success criterion | Criterion |
| `test` | Test | Technique | Test |
| `conformant` | Conforme (C) | Pass | Conformant |
| `nonConformant` | Non conforme (NC) | Fail | Non-conformant |
| `notApplicable` | Non applicable (NA) | Not applicable | Not applicable |
| `auditorHeading` | Critère d'accessibilité | Accessibility criterion | Accessibility criterion |

Every field is optional: what a pack omits falls back to a generic default, the WCAG core keeps
its own built-in set (it is not a pack), and `--lang fr|en` picks the locale. So a new country
pack ships its terminology and the auditor output speaks its language with **no engine change** —
the modular seam that makes `prd` work for each country, not just France. Resolution lives in
`src/standards/vocabulary.ts`; the RGAA terms are set in `scripts/build-pack-rgaa.mjs`.

## Shipped packs

- **RGAA 4.1.2** (`--standard rgaa`) — France, © DINUM, Licence Ouverte / Etalab 2.0.
  13 themes, 106 criteria, French. The flagship example pack.

## International equivalence (version-accurate)

Several standards incorporate WCAG by reference, but **not all at the same version** — state
the right one rather than blanket-claiming 2.2:

- **Section 508** (US, revised 2018) incorporates **WCAG 2.0 Level AA** for web content.
- **EN 301 549** (EU): v3.2.1 references **WCAG 2.1**; v4 (2024+) references **WCAG 2.2**.
- **AODA** (Ontario, Canada) references **WCAG 2.0 AA**.

A WCAG 2.2 AA audit therefore covers the web requirements of these standards at their
respective WCAG versions; a country pack adds that standard's own numbering and wording.

## Adding your country

Two ways, depending on whether you want it shipped or just plugged locally:

- **Built-in (shipped):** drop a pack JSON under `src/data/standards/`, register it in
  `src/standards/registry.ts`, add a test, and open a PR. The full authoring contract
  (pack schema, locale rules, licence requirements, the WCAG-SC mapping, tests) is in
  **`../../CONTRIBUTING.md`**.
- **Runtime (no rebuild):** author the pack JSON, gate it with `pack check`, and load it
  with `--pack ./pack.json` (or a `.ultra11yrc.json`). An external standard or rule source
  can be **AI-ingested** into a pack + implementation guidance and validated by the same
  gate — see **`packs.md`** and **`guidance.md`**.
