---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Code Quality

> **Used by**: toute personne ou agent écrivant du code. Auto-chargé via `paths:` quand un fichier `.ts/.tsx/.js/.jsx` sous `src/` est lu ou édité (donc pas dans les contextes qui ne touchent pas au code — PO, analyse, etc.). Enforced par `structural-auditor` (17 règles), `block-bad-patterns.sh` hook, `code-dev` pendant l'implémentation, et `tu-dev` pour le code de test (mocks DRY, no-comments).

## Zero suppression comments

Never add `biome-ignore`, `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`.
Fix the underlying issue instead. If a rule is genuinely wrong for the entire project, update the Biome config.

## No comments by default

Les agents dev (`code-dev`, et plus largement tout agent qui écrit du code via la pipeline `/analyse` → `/implement`) **ne doivent pas ajouter de commentaires** dans le code produit. Aucun :

- Commentaire descriptif (`// fetch user`, `// loop over items`) — le nom de fonction/variable doit suffire
- JSDoc ou docstring multi-lignes
- Commentaire référençant le ticket, la feature, le fix (`// for ticket #42`, `// fixes the X bug`) — le contexte vit dans le commit message et la PR
- Commentaire « TODO » / « FIXME » — ouvrir une issue à la place
- Section header en commentaire (`// --- helpers ---`) — découper en fichiers/modules à la place
- Commentaire qui paraphrase le code juste en dessous

**Seule exception autorisée** : un commentaire `// ` court (une ligne) qui explique un **WHY non-évident** — contrainte cachée, invariant subtil, workaround pour un bug spécifique référencé, comportement contre-intuitif qui surprendrait un lecteur. Si retirer le commentaire ne gênerait pas un futur lecteur, il ne faut pas l'écrire.

Les commentaires legacy déjà présents dans le code et qui n'enfreignent pas cette règle ne sont **pas** à supprimer dans le cadre du ticket courant — pas de scope creep. La règle s'applique au **code nouvellement écrit ou modifié** par l'agent.

Enforced par `structural-auditor` (rule 2.17) sur les fichiers modifiés.

## DRY: 3+ repetitions = extract

If the same logic or markup appears 3 or more times, extract it into a shared function or component.

Common duplication hotspots to watch for:
- **Constants** — shared domain constants go in the module's `shared/constants.ts`. Never duplicate a constant across multiple files.
- **Validation schemas** — shared Zod schemas go in a module-level file (e.g. `phone.ts`). Never duplicate regex or validation logic.
- **Utility functions** — shared formatting functions (formatSiren, formatPhone, etc.) go in the module's barrel or a shared utils file.

> La règle DRY spécifique aux **tests** (mocks centralisés dans `src/test/setup.ts`, jamais redupliqués) vit dans `rules/testing.md` — le rule de `tu-dev`, scopé aux `__tests__/`. Pas de duplication ici : `testing.md` en est la source unique.

## No useless constants

Do not extract a value into a `const` at module scope unless it is:
- Used in multiple places, OR
- A magic number/string that benefits from a descriptive name

A constant used exactly once right below its definition adds noise, not clarity.

## No custom components in `src/app/`

`src/app/` must **only** contain Next.js route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `template.tsx`, `default.tsx`.

Any custom component (client or server) **must** live in `src/modules/{domain}/`. The `page.tsx` imports from the module barrel.

```tsx
// CORRECT — page.tsx is a thin wrapper
import { ErrorTrigger } from "~/modules/testError";
export default function Page() { return <ErrorTrigger />; }

// FORBIDDEN — custom component next to page.tsx
src/app/test-error/ErrorTrigger.tsx  // ← BLOCKED by hook
```

This rule is **enforced by the `block-bad-patterns` hook** — creating a non-route `.tsx` file in `src/app/` will be rejected.

## Domain layer (`~/modules/domain`)

All **pure business rules** (isomorphic, zero React/tRPC/Drizzle deps) live in `~/modules/domain`. Always import from the barrel:

```ts
import { getCurrentYear, extractSiren, GAP_ALERT_THRESHOLD } from "~/modules/domain";
```

Rules:
- **No inline `new Date().getFullYear()`** — use `getCurrentYear()` or `getCseYear()` from domain.
- **No inline `siret.slice(0, 9)`** — use `extractSiren(siret)` from domain.
- **No hardcoded thresholds** (5%, 50, 100) — use named constants (`GAP_ALERT_THRESHOLD`, `COMPANY_SIZE_*`).
- **New business rules** must be added to domain as pure functions with unit tests.
- **UI-specific helpers** (badge classes, DSFR labels) stay in the feature module — only pure logic goes in domain.

### Single source of truth — keep business rules synchronized

A business rule must exist in **exactly one place**: `~/modules/domain`. Callers **consume** it — they never re-derive it inline. Two parallel implementations of the same rule inevitably drift out of sync: one gets updated when the regulation changes, the other silently keeps the old behaviour.

This is not only DRY — it is **correctness under change**. When a regulatory rule moves (a sign convention, a threshold, a classification), you must be able to edit **one** domain function and have every screen, export, PDF, and router follow. Any copy living outside domain is a latent bug the day the rule changes.

> Real example: the signed-gap convention (`((men − women)/men)×100`, negative = women earn more) lives in `computeGap`/`computeGapBetween`. If a component instead re-derives direction with `parseFloat(w) < parseFloat(m)`, or re-inlines `gap >= GAP_ALERT_THRESHOLD` instead of calling `gapLevel`, that copy will not follow the next convention change — and the screen silently disagrees with the export.

Business rule → single home (never re-inline the right-hand column):

| Business rule | Domain function to call | Never re-inline as |
|---|---|---|
| Signed pay gap `((men − women)/men)×100` | `computeGap` / `computeGapBetween` | `((m - w) / m) * 100` in a component/router/export |
| Gap crosses the 5% alert threshold (positive-only) | `gapLevel(gap) === "high"` | `gap >= GAP_ALERT_THRESHOLD` scattered inline |
| Which sex a set of gaps disfavours | a named `gap.ts` function | `parseFloat(w) < parseFloat(m)` counting in a component |
| Stored ratio (0..1) → percentage | a named domain helper | `Number(row.gap) * 100` in the export layer |
| Cancelled declaration | `isCancelled()` | `cancelledAt !== null` |
| CSE required (≥100) | `isCseRequired()` | `workforce >= 100` |

Before adding any calculation or classification to a component, router, PDF, or export: ask *is this a business rule?* If yes, it goes in domain (pure function + unit test) and the caller imports it. If the domain function is missing, **add it** — do not re-implement. When two call sites need *different* intents from the same raw inputs (e.g. "gap above threshold in either direction" for a callout vs. "positive-only" for a compliance badge), express **each intent as its own named domain function** — never as look-alike inline code whose divergence reads as an accident.

## Imports

- Use the `~/` path alias (mapped to `src/`). Never use relative paths that go up more than one level (`../../`).
- Import from module barrels (`~/modules/layout`), not internal files.

## File size

Keep files under 200 lines. Split at 400. Files over 800 lines are forbidden.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`
- No explicit `any` — use `unknown` + narrowing
- Shared object types in `types.ts` at module level
- Component props: `type Props = { ... }` (never `any`)

## Naming conventions

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `HeaderBrand.tsx` |
| Hook | camelCase + `use` | `useNavigation.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type / Interface | PascalCase | `type UserProfile = ...` |
| Constant | SCREAMING_SNAKE | `const MAX_RETRY = 3` |
| Module folder | camelCase | `modules/layout/` |

## General rules

- **Immutability**: never mutate objects/arrays — always spread (`{ ...obj, key: val }`)
- **Error handling**: always `try/catch` with explicit user-facing error message
- **Input validation**: Zod at system boundaries (forms, route params, API body)

## Form conventions

- **No manual form state**: never use multiple `useState` for form fields. Use `useZodForm` from `~/modules/shared`.
- **No inline validation**: never write manual `if (!field) { setError(...) }` in handleSubmit. Use Zod schemas via `zodResolver`.
- **No router-level schemas**: never define Zod schemas in `src/server/api/routers/`. Define them in `src/modules/{domain}/schemas.ts` and import from there.
- **Shared schemas**: the same Zod schema must be used by both the form (`useZodForm`) and the tRPC procedure (`.input()`).

## Environment variables

Declared and validated in `src/env.js` via `@t3-oss/env-nextjs` + Zod. **Never read `process.env` directly** — always `import { env } from "~/env.js"`.

To add a variable: declare in `src/env.js` (`server` or `client` section) + add to `runtimeEnv` + add to `.env` local. Pass `SKIP_ENV_VALIDATION=1` to bypass validation (Docker build, CI without secrets).
