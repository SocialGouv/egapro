# Visual Quality Validation

> **Used by**: `design-validator` (exclusif). Invoqué par `code-dev` step 9a après PR draft.

Protocole de comparaison du rendu de l'app avec les mockups HTML DSFR produits par l'agent `designer`.

La validation visuelle est faite **par Claude** (capacité vision native), pas par un outil externe.

---

## Entrées

- **Screenshots de référence** : `/tmp/egapro-mocks/epic-<NNN>/screenshots/*.png` produits par le `designer` lors de la phase `/ticket`. Chemins exacts référencés dans le commentaire `## Designer: proposition d'écrans` sur l'epic. **Jamais committés**, hors du repo.
- **Rendu de l'app** : page rendue par le dev server sur `http://localhost:<port>` (port assigné par `/epic` au worktree courant)
- **Route cible** : indiquée dans le ticket (section "Fichiers impactés" → route `src/app/<path>/page.tsx`)

Si les fichiers `/tmp/egapro-mocks/...` ont disparu (ex : `/tmp` purgé au reboot), renvoyer **REFACTO** avec recommandation de re-jouer la phase designer. Ne jamais « deviner » sans référence visuelle.

---

## Protocole

### 1. Capturer le rendu réel

Avec `mcp__playwright__browser_navigate` puis `browser_take_screenshot`, sur **deux viewports** :

- Desktop : **1280×800**
- Mobile : **375×667**

Fichiers écrits dans `/tmp/playwright-mcp/` (jamais dans le projet).

### 2. Charger les screenshots de référence

Lire directement les PNG déjà présents dans `/tmp/egapro-mocks/epic-<NNN>/screenshots/` (desktop + mobile), produits par le `designer` lors de `/ticket`. **Pas besoin de re-rendre le mockup HTML** — les screenshots sont la source de vérité.

### 3. Comparer (Claude vision)

Pour chaque viewport, répondre point par point :

- **Structure** : ordre des éléments, hiérarchie visuelle, sections présentes dans les deux ?
- **Tokens DSFR** : couleurs (background, text, borders), typographies (`fr-h1`, `fr-text--sm`…), espacements (`fr-mb-Xw`, `fr-mt-Xw`) — identiques ?
- **États** : hover/focus/error/disabled présents sur les éléments interactifs ?
- **Responsive** : le mobile dégrade-t-il proprement (menu hamburger, stacking vertical, pas de scroll horizontal) ?
- **A11y basique** : contrastes lisibles, focus visible, landmarks (`<main>`, `<nav>`, headings h1→h2→h3 sans saut) ?

Pour l'a11y approfondie, déléguer à l'agent `rgaa-auditor` (lui, applique les 13 thèmes RGAA).

### 4. Verdict

Dans un commentaire GitHub sur le ticket, avec préfixe identifiable `design-validator:` :

- **PASS** — tout conforme. `code-dev` peut passer le ticket en **In review** (= prêt pour validation humaine)
- **RETRY** — écart mineur corrigeable (couleur, espacement, bold manquant) → description précise de l'écart → `code-dev` corrige, ticket reste en **In progress**
- **REFACTO** — écart structurel (mauvais composant DSFR, layout cassé, composants manquants) → le ticket retourne en **To Do** avec recommandation

Joindre **les 4 screenshots** (2 rendus app + 2 références designer) dans le commentaire via upload GitHub. **Obligatoire** même en cas de PASS : ça permet à l'utilisateur de valider d'un coup d'œil.

---

## Seuils

- **PASS** : écarts inexistants ou purement techniques (ex: police système vs police web qui charge tardivement)
- **RETRY** : jusqu'à 2 retries consécutifs. Au 3ᵉ RETRY, escalade automatique en REFACTO.
- **REFACTO** : ticket retourné en **To Do** avec commentaire détaillé pour l'architect (qui peut re-découper le ticket si nécessaire).

## Exclusions

Le `design-validator` ne vérifie **pas** :

- les comportements (clic, submit, navigation) → c'est `functional-validator`
- la performance / Core Web Vitals → pas de validator dédié dans ce pipeline
- la sécurité → c'est `security-auditor` (déclenché par `code-dev` avant PR)
