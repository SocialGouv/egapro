# Pluggable standards packs — runtime loading + AI ingestion, gated

WCAG 2.2 AA is the engine's canonical key. A **standards pack** is a localized criterion
set (RGAA, Section 508, EN 301 549…) that maps each of its criteria onto WCAG success
criteria. RGAA ships built-in; you can add more **without rebuilding** the engine.

## Load an external pack at runtime

A pack is plain JSON conforming to `StandardPack` (see `references/standards.md` and
`CONTRIBUTING.md`). Point the CLI at one — no install, no rebuild:

```
node scripts/ultra11y.mjs audit "src/**/*.tsx" --graph --pack ./packs/section508.json
node scripts/ultra11y.mjs report --in audit.json --standard section508 --pack ./packs/section508.json
```

`--pack` accepts a JSON file, a directory holding `pack.json` (+ optional `glossary.json`
/ `guidance.json`), or a comma-separated list. Or declare it once in a `.ultra11yrc.json`
at the project root:

```json
{ "packs": ["./packs/section508.json"], "guidance": ["./packs/section508.guidance.json"], "standard": "section508" }
```

Every pack is validated **before** it is registered. An invalid pack is a hard error
(never a silent skip): the runtime loader, the `pack check` command, and the AI-ingestion
gate all share the one validator, so the rules below hold everywhere. A runtime pack whose
`key` collides with a **built-in or already-loaded** standard (e.g. `rgaa`) is rejected —
pass `--override` to deliberately replace it.

## `pack check` — the anti-hallucination gate

```
node scripts/ultra11y.mjs pack check ./packs/rgaa.json
node scripts/ultra11y.mjs pack check ./packs/rgaa.json --guidance ./packs/rgaa.guidance.json
node scripts/ultra11y.mjs pack scaffold > ./packs/mypack.json     # a blank, valid skeleton to fill
```

`pack check` fails (exit 1) on any error: a missing required field, a `key` that collides
with the reserved core `wcag`, an `idPattern` that won't compile, a theme `count` that
disagrees with its criteria, a criterion whose `wcag` SC is **not a recognized WCAG
success criterion**, and — with `--guidance` — a guidance entry whose `criterionId`
doesn't resolve to a real pack criterion, or whose code example won't parse. This is what
makes an AI-authored pack trustworthy: the model proposes, the deterministic gate refuses
fabrication.

**SC classification runs against the full WCAG 2.x universe** — every real 2.x success
criterion at every level (A/AA/AAA) plus the removed ones, vendored from the same W3C
source as the AA core (never invented, no id ever special-cased):

- **core** (in the WCAG 2.2 AA core) — the normal case; the engine can audit it.
- **out-of-core** (a real SC outside the AA core, e.g. an AAA criterion) or **removed**
  (the obsolete `4.1.1 Parsing`) — accepted with a *warning*. At report/derive time a pack
  criterion whose mapping is ENTIRELY out-of-core/removed is classed **out of engine
  scope**: status `manual` with a dedicated out-of-scope justification (`outOfScope: true`
  from `derivePackResults`), never a silent NA and never a fabricated verdict. RGAA 8.1
  (doctype → the removed 4.1.1) is the shipped example.
- **unknown** (a well-formed id that never existed — `9.9.9`) — **rejected** (error).

**Pack locales are free-form.** `LocaleString` keys are BCP-47-ish tags (`fr`, `en`,
`pt-BR`, `nl-BE`…) validated by shape only — a pack may be authored in any language,
independent of the CLI's own `--lang fr|en` UI frame. The pack's `defaultLocale` also
feeds the CLI's `--lang auto` fallback chain (used when it is `fr`/`en` and neither an
explicit `--lang` nor a repo `<html lang>` signal decided the output language).

## AI-assisted ingestion of any rule source (the primary path)

To turn an external rule source — the RGAA SocialGouv/etalab rule packs, or any other
national standard — into something ultra11y can use, drive this loop:

1. **Read** the source (its criteria list, and its concrete good/bad implementation
   rules). The fuzzy mapping `rule → criterion → WCAG SC` is yours to do — the model is
   far better at it than a regex.
2. **Draft** three artifacts: the `StandardPack` JSON (if the standard isn't already
   built-in), a guidance dataset (`references/guidance.md`), and a list of *proposed*
   new detectors (only the machine-checkable ones — see the honesty rule in
   `references/guidance.md`).
3. **Gate**: run `pack check <pack.json> --guidance <guidance.json>`. Fix every error.
   A bogus criterion id misses; a bogus SC is rejected; an unparseable example fails.
4. **Iterate** until green, then load it with `--pack` / `.ultra11yrc.json`.

An optional deterministic scaffolder, `scripts/import-pack.mjs`, pre-fills a *draft*
guidance dataset from a SocialGouv-style rules directory (frontmatter + before/after code
blocks + reference link), leaving any unresolved `criterionId` as `null` for you to
complete; it never finalizes — `pack check` is always the gate. See the script header for
usage.

## Pack-only detection: declarative `rules` + normativity `overrides`

A pack can go beyond re-keying WCAG findings: it can ship its **own** detection and
**re-normativize** a finding within its own projection — *without forking the engine*. Both
mechanisms are pure data (no JavaScript plugins — a `--pack`-loaded pack stays fully
validatable), and both are enforced by the same `validatePack` / `pack check` gate.

### `rules` — a bounded declarative matcher

Each rule matches source elements and emits a namespaced `pack:<key>:<id>` finding that
projects onto the pack criterion it reports under (via the same `appliesTo`/`ruleMatches`
machinery as engine findings). Rules run **after** the core engine rules and **never**
affect the WCAG core verdict — they surface only in the pack's own report.

```json
{
  "rules": [{
    "id": "download-link-format",
    "criterion": "6.1",
    "wcag": ["2.4.4"],
    "severity": "mineur",
    "advisory": true,
    "match": {
      "tag": "a",
      "attrs": [{ "name": "href", "op": "matches", "value": "\\.(pdf|docx?|zip)(\\?|#|$)" }],
      "text": { "op": "lacks", "value": "(pdf|docx?|zip|\\d+\\s*(ko|mo|go))" }
    },
    "message": { "en": "…", "fr": "…" },
    "remediation": { "en": "…", "fr": "…" }
  }]
}
```

The shipped RGAA pack uses exactly this rule (built by `scripts/build-pack-rgaa.mjs`, never
hand-edited): an **advisory** flag on download links whose visible text omits the file
format/weight — the DSFR auditor recommendation under criterion 6.1. Advisory ⇒ it renders
as a recommendation and **never** makes 6.1 non-conformant. Its `message`/`remediation` pair
is **localized**: the finding carries both `en` and `fr`, so a `--lang fr` RGAA report renders
the French recommendation text (not the English bake).

**The matcher vocabulary is deliberately CAPPED** at what RGAA needs today:

| Field | Meaning |
|---|---|
| `tag` | intrinsic tag (case-insensitive) |
| `attrs[]` | `{ name, op, value? }` — `op` ∈ `present` \| `absent` \| `equals` \| `matches` (regex, ReDoS-guarded, case-insensitive) |
| `text` | `{ op, value }` — `op` ∈ `matches` \| `lacks` over the element's visible text (regex, case-insensitive) |
| `has[]` / `lacks[]` | descendant conditions (each a match node); **nesting ≤ 3 levels** |
| `scope` | `page` (full document only) \| `fragment` (default) |

Anything more expressive — sibling/positional combinators, arbitrary CSS selectors,
cross-file resolution — is **out of scope on purpose**: it belongs in a core WCAG-keyed
engine rule instead, where every standard benefits. `pack check` rejects a rule whose
criterion doesn't exist, whose SC isn't a real WCAG criterion, whose regex is unsafe/won't
compile, whose has/lacks nest too deep, or whose `message`/`remediation` is missing `en`
or `fr`. It also rejects a **match node with no condition** (`{}` — it would fire on every
element) and a match node carrying an **unknown key** (a typo like `{ tgo: "a" }` is a hard
error, never silently ignored): every node must carry ≥1 of `tag`/`attrs`/`text`/`has`/`lacks`.
The **ReDoS guard** on every regex rejects the classic single-quantified-atom shape
(`(a+)+`), an overlapping alternation under a quantifier (`(a|a)*`), and a nested quantifier
over a group (`(ab+)+`) — while still accepting an anchored criterion grammar like `(\.\d+)*`
and a non-quantified extension alternation like `(pdf|docx?|zip)`.

### `overrides` — re-normativize within a projection

```json
{ "overrides": { "pack:rgaa:some-rule": { "advisory": false, "severity": "majeur" } } }
```

`overrides` is a map keyed by a finding's `ruleId` (a core engine rule, or a pack rule).
Applied **only** in `derivePackResults`, it flips a finding's normativity
(advisory↔normative) and/or re-grades its severity **inside that pack's projection** — the
core WCAG result is never mutated. This is the precise *"WCAG can differ from RGAA"*
mechanism: a standard can treat as normative something WCAG leaves advisory (or vice
versa) without changing the canonical engine verdict.

### `sampleMethodology` — the standard's required page kinds

A country standard defines its audit over a **normative page sample** (see
`references/audit.md`). A pack declares the page KINDS a real audit of it must cover; the
mechanics (a project's actual `sample.pages`) live in `.ultra11yrc.json`, never in the pack.

```json
{ "sampleMethodology": {
    "requiredKinds": [
      { "id": "accueil", "label": { "fr": "Page d'accueil" }, "keywords": ["accueil", "home"] },
      { "id": "mentions-legales", "label": { "fr": "Mentions légales" }, "keywords": ["mentions", "legal"] },
      { "id": "declaration-accessibilite", "label": { "fr": "Déclaration d'accessibilité" }, "keywords": ["declaration", "accessibilite"] }
    ] } }
```

`sample check` fuzzy-matches (accent-insensitive) each required kind's `keywords` against the
configured pages' name/notes/url and reports the missing kinds. It is purely **advisory**
(the sample is opt-in, the missing kinds are guidance not a gate), so a malformed
`sampleMethodology` is a validator **warning** and the field is ignored — never a hard
failure that blocks the pack from deriving reports. RGAA ships the reference list (accueil,
contact, mentions légales, déclaration d'accessibilité, plan du site, aide, authentification,
pages représentatives + éléments transverses).

## Gate-compatibility note (id grammar)

`check` and `verify` recognize a pack's criterion ids in a rendered report by building
their citation regex FROM the pack's own `idPattern` (already validated compilable by
`pack check`) — not a single fixed shape. RGAA's 2-segment `<n>.<n>` (`8.3`) and a
hypothetical Section 508 `E<n>.<n>` (`E205.4`) are both fully gate-compatible out of the
box; any `idPattern` a pack declares works, with zero engine changes.
