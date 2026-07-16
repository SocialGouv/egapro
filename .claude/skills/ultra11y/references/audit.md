# Audit existing code → WCAG report

Goal: produce a dated, reliable WCAG 2.2 AA compliance report. The engine decides the
automatable subset; the **AI agent** adjudicates the judgment criteria (`verify --manual`,
gated) and routes the rendering criteria to `scan`; the gates stop any hallucinated
non-conformity.

## The loop

1. **Scope it.** Which files / components? HTML, JSX/TSX and Vue/Svelte/Astro components
   (`.vue`/`.svelte`/`.astro`) are walked by default; add server templates (Twig, ERB,
   Handlebars…) with `--ext .twig,.erb`. **Test/spec/story markup** (`*.test.*`,
   `*.spec.*`, `*.stories.*`, `__tests__/`) is excluded by default — it is bad-by-design
   and never shipped; pass `--no-default-excludes` (or name the file) to audit it anyway.
   **`.vue`/`.svelte`/`.astro` are audited as SOURCE templates**: slots, snippets and
   dynamic bindings are invisible, so their findings are flagged `preliminary` and the run
   carries a `scope.sourceTemplate` caveat — audit the rendered output to confirm (step 3,
   and `references/rendered.md`).
2. **Run the engine:**
   ```
   node scripts/ultra11y.mjs audit "src/**/*.html" --json > audit.json
   ```
   or on a snippet: `node scripts/ultra11y.mjs audit - < page.html --json`.
   The `AuditResult` classes each success criterion as `C` / `NC` / `NA` (static) or
   `manual` (rendering / judgment, listed in `residualRisks`). It also records the repo's
   declared language(s) as `scope.langs` (the primary `<html lang>` subtags seen, most
   frequent first, e.g. `["fr"]`) — the repo signal `--lang auto` resolves from downstream.
3. **Triage the results:**
   - engine `NC` = confirmed candidates (each finding cites `file:line`);
   - `manual` *needs-rendering* criteria (contrast 1.4.3, focus visible 2.4.7, reflow
     1.4.10…) → route to `scan`, **never** silently `C`. Note: contrast on
     **inline literal colours** is now decided statically (1.4.3 turns `NC` for that
     subset); contrast via external CSS or variables stays residual (→ dynamic tier);
   - `manual` *judgment* criteria (alt relevance under 1.1.1, link purpose 2.4.4, reading
     / tab order…) → the AI agent adjudicates them from context via `verify --manual` (gated).
4. **Decide each applicable criterion**: `C`, `NC` or `NA` (with a justification). For a
   criterion's detail and grounding: `node scripts/ultra11y.mjs criteria 1.1.1`.
5. **Render the report:**
   ```
   node scripts/ultra11y.mjs report --in audit.json --out audits
   ```
   → `audits/wcag-YYYY-MM-DD.md` (5 sections, see `references/methodology.md`); section 2
   renders one **auditor conformance block** per NC criterion (theme, criterion + official
   wording, test(s), WCAG mapping + level, finding, expected state, verification,
   `file:line` occurrences), grouped by severity — the SAME block `prd` and `--gh-issues`
   emit (see `references/prd.md`), so report and backlog never drift. For a country
   standard, add `--standard rgaa` (see `references/standards.md`). Pass `--lang` to match
   your conversation; without it, `auto` resolves the audit's `scope.langs` → the
   standard's default locale → English. Add `--json` to `report` for a machine summary
   (`{path, conformancePct, date, standard}`) instead of just the path.
6. **Check integrity:**
   ```
   node scripts/ultra11y.mjs check --report audits/wcag-YYYY-MM-DD.md
   ```
   Fails if a section is missing, a cited criterion does not exist, or an `NA` is unjustified.
7. **High assurance (optional)**: `references/verify.md` — prove every non-conformity is
   real before you ship.

## The normative page sample (échantillon) — country-standard audits

A file-tree audit answers "is this markup conformant?"; a **country-standard** audit (RGAA,
Section 508…) is normatively defined over a **representative page sample**, not the whole
repo. Declare that sample once in `.ultra11yrc.json`:

```json
{ "standard": "rgaa",
  "sample": {
    "pages": [
      { "id": "accueil", "name": "Page d'accueil", "url": "http://localhost:3000/" },
      { "id": "contact", "name": "Contact", "url": "http://localhost:3000/contact" },
      { "id": "compte", "name": "Mon compte", "url": "http://localhost:3000/compte", "auth": true, "storageState": ".auth/user.json", "notes": "connecté" }
    ],
    "transverse": ["header", "navigation principale", "pied de page"]
  } }
```

- `sample.pages[]` are the audited URLs (each may sit behind `auth` with a per-page
  `storageState`); `transverse` names the elements audited on **every** page (header, nav,
  footer, modals…). The `storageState` **path** is used but its content is never read into
  any output.
- **Lint the coverage**: `node scripts/ultra11y.mjs sample check` reports which **required
  page kinds** the active standard's `sampleMethodology` expects but the sample lacks (RGAA:
  accueil, contact, mentions légales, déclaration d'accessibilité, plan du site, aide,
  authentification…). Advisory (exit 0) unless the `sample` block is malformed (exit 2).
- **Scan the sample**: `scan --sample --merge audits/audit-latest.json` iterates every page,
  keeps each finding's page name + auth flag as provenance, and merges the rendered verdicts
  in (see `references/dynamic.md`).
- **Partial-audit honesty**: a `--standard rgaa` report produced **without** a merged sample
  scan is flagged **partial** — a CLI warning + a report banner naming the needs-rendering
  criteria that were not tested. Say the audit is partial rather than implying full coverage.

## Golden rules

- **Never invent a non-conformity**: every `NC` must cite a real, resolvable element
  (`check` verifies it).
- **Residual is explicit, never silently `C`**: an unproven *needs-rendering* criterion goes to
  `scan`; a *judgment* criterion the AI agent adjudicates via `verify --manual` (gated). Any
  criterion still undecided stays in the "to assess manually" section with a recorded reason.
- The report's **automatic static-check pass rate** covers only the machine-decidable
  subset; full WCAG conformance requires your manual review (it is not a conformance rate).
