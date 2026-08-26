---
description: Hooks, quality gates et vérifications avant push — toujours chargée
---

# Garde-fous automatiques

> **Toutes sessions.** Ce qui tourne tout seul, et ce qui est dû avant de déclarer une tâche terminée. La mécanique propre à la pipeline `/analyse` → `/implement` vit dans `.claude/pipeline/orchestration.md`, qui n'est pas chargé ici.

## Hooks (`.claude/settings.json`)

Trois hooks, exécutés par le harnais, pas par toi.

**`UserPromptSubmit` → `check-pr-reviews.sh`** — au premier message d'une session. Si la branche courante a une PR ouverte avec des commentaires non résolus, il le signale et suggère `/review`. Silencieux sur `alpha`.

**`PreToolUse` → `block-bad-patterns.sh`** (matcher `Edit|Write`) — **22 patterns bloqués avant l'écriture**. C'est la couche machine : ce qu'elle attrape n'a pas besoin d'être re-vérifié à la main, et ce qu'elle bloque ne se contourne pas.

| Bloqué | Fichiers | À la place |
|---|---|---|
| `biome-ignore`, `eslint-disable`, `@ts-ignore`, `@ts-expect-error` | `.ts/.tsx/.js/.jsx` | corriger la cause |
| `: any`, `as any` | `.ts/.tsx` (hors tests) | `unknown` + narrowing |
| `process.env` | `.ts/.tsx` (hors `env.js`, configs, e2e) | `import { env } from "~/env.js"` |
| `../../` ou plus profond | `.ts/.tsx` | alias `~/` |
| `dangerouslySetInnerHTML` | `.tsx/.jsx` | rendu sûr, ou DOMPurify |
| `style={`, `<svg>`, `<img>` | `.tsx/.jsx` | classes DSFR ou SCSS module · `DsfrPictogram` / `public/assets/*.svg` + `<Image>` / `fr-icon-*` · `next/image` |
| `#hex`, `rgb()`, `rgba()`, `@media` | `.scss` | custom properties DSFR · `@include respond-from(md)` / `respond-to(sm)` |
| `from "zod"` | `routers/*.ts`, `.tsx` | importer depuis `~/modules/{domain}/schemas.ts` |
| `getFullYear()`, `slice/substring/substr(0, 9)`, `SIREN_LENGTH = 9`, `.getMonth()`, `.getDate()` | `.ts/.tsx` (hors `domain/`, tests) | helpers de `~/modules/domain` |
| `>= GAP_ALERT_THRESHOLD`, `(men - women)`, `cancelledAt !== null` | `.ts/.tsx` (hors `domain/`, tests) | `gapLevel()`, `computeGap()`, `isCancelled()` |
| `.tsx` non-route dans `src/app/` | `src/app/**` | déplacer dans `src/modules/` et importer depuis le barrel |

Nouvelle règle mécanique → ajouter un `check_pattern` dans le script. **Si un hook bloque ton édition, ne cherche pas à le contourner** : repense l'approche.

**`PostToolUse` → `auto-lint.sh`** (matcher `Edit|Write|Bash`) — lance `pnpm biome check --write` sur le fichier édité, et sur tous les fichiers modifiés après un `pnpm test|build|typecheck|lint|format|check`.

---

## Les 4 gates, avant de déclarer une tâche terminée

Obligatoires sur toute tâche, hors pipeline comme dans la pipeline. Chacun décide lui-même s'il a du travail selon les fichiers modifiés — coût nul quand ce n'est pas pertinent.

| Agent | Périmètre | Sortie |
|---|---|---|
| `validator` | typecheck + test + lint + format, en parallèle | PASS / FAIL |
| `structural-auditor` | tous les fichiers modifiés, **plus les fichiers de test du diff** (aucune assertion supprimée, aucun `.skip` ajouté, aucune attente relâchée) | PASS / NEEDS WORK / MINOR |
| `rgaa-auditor` | les `.tsx` modifiés (lance le skill ultra11y `review-a11y`) — sinon `PASS — no UI files` | PASS / NEEDS WORK / MINOR |
| `security-auditor` | les `.ts/.tsx` modifiés sous `server/`, `routers/`, tRPC — sinon `SECURE — no server files` | SECURE / VULNERABLE / HARDENING NEEDED |

Les quatre sont **read-only** : ils rapportent, tu corriges, tu relances. Ne déclarer terminé que quand les quatre passent.

Les tests unitaires et d'intégration s'écrivent **pendant** l'implémentation, pas dans une passe séparée : `validator` les rejoue, il ne les remplace pas. Et c'est `structural-auditor` — read-only, indépendant de qui a écrit le code — qui vérifie qu'un test rouge a été corrigé à la source plutôt qu'affaibli dans son assertion.

Pour un changement **UI** (`.tsx`/`.scss` modifiés) et si un dev server est disponible, ajouter le gate `design-validator` — rendu + mesure DOM + overlay onion-skin contre la référence Figma (`rules/visual-quality-validation.md`).

Les tests **E2E** ne s'écrivent jamais ici : ils appartiennent à `e2e-dev` (`rules/e2e.md`).

## Avant chaque push

`pnpm check:write` depuis `packages/app`. Le hook auto-lint traite chaque édition isolément mais ne garantit pas l'état final du diff ; cette passe évite l'échec CI de format. Si le dev server tourne, `nextjs_call(get_errors)` attrape en plus les erreurs runtime que `pnpm typecheck` ne voit pas.

## Pendant que tu écris

Les règles de code vivent dans `.claude/rules/` et arrivent toutes seules selon le fichier ouvert : `code-quality.md`, `react-components.md`, `styling-dsfr.md`, `testing.md`, `trpc-api.md`, `database-drizzle.md`, `audit-logging.md`, `demarche-state-machine.md`. Elles ne sont pas recopiées ici — une quatrième copie d'une règle est la première à vieillir.
