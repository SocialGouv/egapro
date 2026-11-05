# Checklist — structure et conventions

Tu vérifies les fichiers **du diff** contre les conventions du projet. Tu ne réénonces pas les règles : elles vivent dans `../../implement/references/conventions/`. Ce fichier dit **quoi chercher et comment**.

Principe : **là où une machine décide, tu ne réénonces pas — tu rapportes.**

Base : `BASE="${VERIFY_BASE:-origin/alpha}"` (sous-ticket d'epic : `origin/epic/<N>`). Saute tout check sans rapport avec les fichiers touchés.

## 1. Ce que la machine a déjà tranché

Les interdits mécaniques (`any`, `process.env`, `../../`, `zod` dans un routeur ou un composant, suppressions de lint, `style={}`, `<svg>` / `<img>`, `@media`, composant hors route dans `src/app/`…) sont dans `scripts/quality/check-patterns.sh`, lancé par `pnpm verify` sur tout le diff (working tree compris) : `verify` vert = rien à rapporter de ce côté. Ne réénonce pas ces règles. Deux checks restent à faire à la main, sur les fichiers du diff :

```bash
cd packages/app
grep -rn "z\.object(" src/app/api/ --include="*.ts"                          # [ERROR] schéma inline dans un route handler : il vit dans modules/*/schemas.ts
wc -l $(git diff --name-only HEAD -- '*.ts' '*.tsx') 2>/dev/null | sort -rn | head -20   # [WARN] 200+ · [ERROR] 400+ · [ERROR CRITICAL] 800+
```

Les occurrences legacy hors diff ne comptent pas (une ligne max, hors verdict).

## 2. Fuites de la couche domaine — le check le plus rentable

Une règle métier recopiée hors de `~/modules/domain` est un bug le jour où la réglementation change (`conventions/code-quality.md` § Source unique).

```bash
bash packages/app/scripts/audit-domain-leaks.sh
```

Le script balaie **tout l'arbre** et imprime chaque fuite avec son niveau (`[ERROR]` / `[WARN]`) et la fonction domaine à utiliser. Retiens ses constats sur les fichiers du diff ; le reste = une ligne hors verdict. Il ne voit que ses signatures. Se trouvent en lisant le code, `[ERROR]` : une fonction locale qui recalcule ce que fait déjà `~/modules/domain` ; un seuil réglementaire en dur (5 %, 50, 100) ; une condition qui ré-implémente un prédicat (`workforce >= 100`). Chaque `[WARN]` est candidat à devenir une fonction domaine **nommée**.

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

Conventions à ouvrir selon le fichier : la table « Règles de code : où les lire » d'`AGENTS.md`.

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
