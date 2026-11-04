# Checklist — structure et conventions

Tu vérifies les fichiers **du diff** contre les conventions du projet. Tu ne réénonces pas les règles : elles vivent dans `../../implement/references/conventions/`. Ce fichier dit **quoi chercher et comment**.

Principe : **là où une machine décide, tu ne réénonces pas — tu rapportes.**

Base : `BASE="${VERIFY_BASE:-origin/alpha}"` (sous-ticket d'epic : `origin/epic/<N>`). Saute tout check sans rapport avec les fichiers touchés.

## 1. Greps mécaniques (filet a posteriori)

`pnpm verify` lance déjà `scripts/quality/check-patterns.sh` sur les lignes ajoutées. Ces greps attrapent ce qui est arrivé autrement (rebase, merge). Ne réexplique pas la règle : rapporte `fichier:ligne`.

```bash
cd packages/app

# [ERROR] — doivent retourner ZÉRO sur les fichiers du diff
grep -rn "from ['\"]zod['\"]" src/server/api/routers/ --include="*.ts"
grep -rn "from ['\"]zod['\"]" src/modules/ --include="*.tsx"
grep -rn "z\.object(" src/app/api/ --include="*.ts"
grep -rn "from ['\"]\.\.\/\.\.\/" src/modules/ --include="*.ts" --include="*.tsx"
grep -rn ": any\b\|as any\b" src/modules/ src/server/ --include="*.ts" --include="*.tsx" | grep -v "__tests__\|\.test\."
grep -rn "biome-ignore\|eslint-disable\|@ts-ignore\|@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"
grep -rn "process\.env" src/ --include="*.ts" --include="*.tsx" | grep -v "env.js\|instrumentation\|next.config\|trpc/react.tsx\|sentry\.\|e2e/helpers/\|playwright.config\|drizzle.*config"
grep -rn "@media[[:space:]]\+.*\((min\|max\)-width\|screen)" src/ --include="*.scss"
grep -rn "style={" src/ --include="*.tsx" | grep -v "declarationPdf/\|noSanctionAttestation/"
grep -rn "<svg[[:space:]>]\|<img[[:space:]>]" src/ --include="*.tsx" | grep -v "DsfrPictogram\|ErrorArtwork\|__tests__\|\.test\."

# [ERROR] — composant sur mesure dans src/app/ (seuls les fichiers de route Next.js y vivent)
find src/app -name "*.tsx" \
  ! -name "page.tsx" ! -name "layout.tsx" ! -name "loading.tsx" ! -name "error.tsx" \
  ! -name "not-found.tsx" ! -name "global-error.tsx" ! -name "template.tsx" ! -name "default.tsx" \
  ! -name "opengraph-image.tsx" ! -name "icon.tsx" ! -name "apple-icon.tsx" ! -path "*/__tests__/*"

# Taille de fichier : [WARN] 200+ · [ERROR] 400+ · [ERROR CRITICAL] 800+
wc -l $(git diff --name-only HEAD -- '*.ts' '*.tsx') 2>/dev/null | sort -rn | head -20
```

Les occurrences legacy hors diff ne comptent pas (une ligne max, hors verdict).

## 2. Fuites de la couche domaine — le check le plus rentable

Une règle métier recopiée hors de `~/modules/domain` est un bug le jour où la réglementation change (`conventions/code-quality.md` § Source unique).

```bash
bash packages/app/scripts/audit-domain-leaks.sh
```

Diff-scopé par défaut. Une règle métier peut fuiter dans un fichier que le ticket ne touche pas : sur un audit large, le lancer sur tout l'arbre.

- `[ERROR]` : `getFullYear()` ; extraction SIREN inline (y compris `slice(0, SIREN_LENGTH)`, un `SIREN_LENGTH = 9` local) ; `.getMonth()` / `.getDate()` ; fonction locale qui duplique le domaine ; seuil réglementaire en dur (5 %, 50, 100, 2018) ; condition qui ré-implémente un prédicat (`cancelledAt !== null`, `workforce >= 100`) ; `gap >= GAP_ALERT_THRESHOLD` au lieu de `gapLevel()` ; formule d'écart signé inline.
- `[WARN]` : décision sur une chaîne de statut (`status === "draft"`) répétée entre fichiers ; direction déterminée en comparant les valeurs genrées ; `Number(row.xxxGap) * 100` ; `toLocaleString("fr-FR")` hors du domaine. Chacun est candidat à devenir une fonction domain **nommée**.

## 3. Ce qui demande de lire le code

| Check | Verdict |
|---|---|
| **Formulaires** — `useState` pour des champs sans `useZodForm` ; `e.preventDefault()` manuel sans `form.handleSubmit` ; state qui duplique `useZodForm`. Un `useState` d'UI (modale, flag « enregistré ») est légitime | ERROR |
| **Schémas** — deux schémas pour la même forme ; un `modules/*/schemas.ts` non ré-exporté depuis le barrel | ERROR |
| **Schémas** — export mort (type ou schéma jamais importé) | WARN |
| **Transactions** — écritures multiples, ou lecture-puis-écriture conditionnelle, hors `db.transaction()` | ERROR |
| **Ownership** — mutation tRPC qui autorise depuis un identifiant client au lieu de la session | ERROR |
| **Audit** — nouvelle mutation ou query sensible sans ses 3 points de câblage (`conventions/audit-logging.md`) | ERROR |
| **Logique dans le JSX** — conditions, `.filter()`, `.reduce()` dans le `return`. `{condition && <X />}` est acceptable | WARN |
| **Duplication** — même logique ou markup 3 fois ou plus | WARN |
| **Barrel** — import depuis un fichier interne d'un autre module au lieu de son `index.ts` | WARN |
| **Nommage** — composant nommé d'après sa position dans l'arbre ; identifiant non descriptif ; identifiant en français (les textes utilisateur, eux, restent en français) | WARN |
| **Constante inutile** — `const` de module utilisée une seule fois, juste en dessous | WARN |
| **`.map()`** — callback de plus de 5 lignes de JSX | WARN |
| **`useEffect`** — pour de la donnée dérivée des props/state. Hydrater un formulaire depuis une source async est légitime | WARN |
| **`common.module.scss`** — SCSS module partagé entre composants sans lien | WARN |
| **Tests** — nouveau composant ou fonction sans test | WARN |
| **Tests** — mock local qui duplique `src/test/setup.ts` | ERROR |
| **Assets** — PNG/JPG pour une illustration ou une icône (seule une vraie photo peut être raster, en WebP) | WARN |

Conventions à ouvrir selon le fichier : `code-quality.md` (tout `.ts`/`.tsx`), `react-components.md` (`.tsx`), `styling-dsfr.md` (`.tsx`/`.scss`), `trpc-api.md` (`src/server/api/**`), `database-drizzle.md` (`src/server/**`), `audit-logging.md` (mutation, query sensible, route handler, auth), `demarche-state-machine.md` (parcours de déclaration, Mon espace, `src/server/rules/**`), `testing.md` (`__tests__/**`), `figma.md` (UI depuis un node Figma) — toutes dans `../../implement/references/conventions/`.

## 4. Affaiblissement de test

Celui qui écrit la source possède aussi les tests : un test rouge s'ajuste plus vite qu'une régression ne se corrige. Ce conflit d'intérêt est structurel, quel que soit le modèle. Ce check est donc **obligatoire** dès qu'un fichier de test est dans le diff.

```bash
BASE=$(git merge-base HEAD "${VERIFY_BASE:-origin/alpha}")
git diff "$BASE"...HEAD -- '*.test.ts' '*.test.tsx' '*.integration.test.ts' '*.e2e.ts' \
  | grep -E '^[+-].*(\.skip|\.todo|\.only|expect|assert|toBe|toEqual|toHaveBeenCalled|toThrow)'
git diff "$BASE"...HEAD --diff-filter=D --name-only -- '*.test.*' '*.e2e.ts'
git diff "$BASE"...HEAD -- '**/vitest.config.ts'
```

| Check | Verdict |
|---|---|
| Assertion **supprimée** alors que le comportement asserté existe toujours dans le code | ERROR |
| `.skip` / `.todo` / `.only` **ajouté** | ERROR |
| Attente **relâchée** — `toEqual` → `toBeDefined`, valeur exacte → `expect.any()`, comptage précis → `toHaveBeenCalled()` nu | ERROR |
| Fichier de test **supprimé** alors que son sujet existe toujours | ERROR |
| Seuil de couverture abaissé dans `vitest.config.ts` | ERROR |

Une suppression légitime existe : le comportement a réellement disparu (fonction retirée, contrat changé par le ticket). Tranche **au diff source** : si la source correspondante n'a pas bougé, c'est un affaiblissement. **En cas de doute → ERROR** : un faux positif coûte une justification, un faux négatif laisse passer une régression.

## 5. Commentaires ajoutés

Sur les lignes **ajoutées ou modifiées** uniquement :

```bash
git diff "$(git merge-base HEAD "${VERIFY_BASE:-origin/alpha}")"...HEAD --unified=0 -- '*.ts' '*.tsx' \
  | grep -E '^\+\s*(//|/\*|\*)' | grep -vE '^\+\s*//\s*$'
```

`[WARN]` : commentaire qui paraphrase le code, JSDoc, en-tête de section, référence au ticket, TODO/FIXME. Toléré : un `// ` d'une ligne qui justifie un **pourquoi** non évident.

## 6. Accessibilité — pas ici

Ne rapporte **rien** sur l'accessibilité dans cette checklist : c'est `a11y.md` (moteur ultra11y). Deux jeux de règles sur un même sujet divergent, et celui sans moteur invente des non-conformités.

## Sortie

```
[ERROR|WARN] {check} fichier:ligne — description → correctif
```

Verdict : `PASS` (rien) · `NEEDS WORK` (au moins un ERROR) · `MINOR` (que des WARN).
