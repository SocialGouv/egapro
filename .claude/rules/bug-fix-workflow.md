---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/e2e/**"
---

# Bug Fix Workflow

> **Used by**: `code-dev` (issue type Bug, ou label `bug` — écrit **uniquement le fix source**, plus aucun test), `tu-dev` (écrit le test de reproduction **unitaire / intégration** par revert-verify), `e2e-dev` (écrit le test de reproduction **E2E** en fin de pipeline, s'il juge le bug assez critique), `bug-analyst` (phase analyse). Hors pipeline : l'agent principal quand il traite un fix. Auto-chargé via `paths:` (`.ts/.tsx`, `src/e2e/**`).

Quand un ticket est un **bug** (issue type Bug, label `bug`, ou description explicite d'un comportement incorrect), `code-dev` suit un protocole strict **reproduire → fixer → valider**, en s'appuyant sur l'analyse postée par `bug-analyst` dans le commentaire `## Analyse du bug` (root cause, fichiers à modifier, fix proposé).

> **Répartition tests** (dans la pipeline `/implement`) : `code-dev` écrit **uniquement le fix source** — il n'écrit plus aucun test, ni unitaire/intégration, ni E2E. Les tests de reproduction **unitaire / intégration** sont écrits par `tu-dev` (étape 5.5 de `code-dev`), **après** le fix, et prouvés par **revert-verify** (revert du fix → RED → restore → GREEN). Le test de reproduction **E2E** (pour un bug UI/parcours **assez critique**) est écrit par `e2e-dev` en fin de pipeline, également prouvé par revert-verify. `code-dev` ne touche jamais aux tests.

Cette discipline évite deux pièges fréquents :
1. "Je crois que j'ai fixé" sans preuve → régression un mois plus tard
2. Fix accidentel qui ne cible pas la root cause → bug réapparaît sous une autre forme

---

## Protocole obligatoire

### 1. Reproduire

Un test doit reproduire le bug. **Qui l'écrit et quand dépend du type de test** — et ce n'est jamais `code-dev` :

- **Bug UI / comportement utilisateur** → test E2E Playwright dans `src/e2e/<feature>.e2e.ts`, écrit par **`e2e-dev`** en fin de pipeline, **uniquement s'il juge le bug assez critique** (parcours critique, fort risque de régression). De préférence imbriqué dans le scénario E2E existant qui couvre le parcours. Un bug mineur / cosmétique / visual-mismatch ne reçoit en général pas d'E2E.
- **Bug logique métier / domain** → test unitaire Vitest dans `__tests__/` à côté du module, écrit par **`tu-dev`** (étape 5.5).
- **Bug API / tRPC** → test unitaire du router (ou test d'intégration si le bug est au DB-layer), écrit par **`tu-dev`** (étape 5.5).

La preuve de reproduction se fait **après** le fix par **revert-verify**, par l'agent qui écrit le test (`tu-dev` pour TU/intégration, `e2e-dev` pour l'E2E) : reverse-appliquer le diff source de `code-dev` → le test doit être **RED** → ré-appliquer le fix → **GREEN**. Si le test passe sans le fix, il ne reproduit pas le bug → le retravailler.

### 2. Identifier la root cause

Ne pas se contenter du symptôme. Lire le code en amont (stack trace, appelants, schémas Zod, migrations DB). Si la root cause n'est pas claire :
- `nextjs_call(get_errors)` pour les erreurs compile/runtime
- `kubectl logs` si le bug vient d'un env de review (voir mémoire utilisateur)
- Lire les PRs récentes qui touchent le fichier incriminé (`git log -p <file>`)

### 3. Fixer

Modifier le code pour faire passer le test. Le fix doit cibler la **root cause**, pas masquer le symptôme :
- ❌ `if (value == null) return "default";` pour masquer un `undefined` qui ne devrait jamais arriver
- ✅ Fixer la fonction en amont qui propage le `undefined`

### 4. Valider

- `pnpm typecheck` + `pnpm lint:check` verts (côté `code-dev`)
- La suite **TU + intégration** verte (pas de régression) est garantie par `tu-dev` à l'étape 5.5 — `code-dev` ne lance pas `pnpm test` lui-même. Si `tu-dev` détecte une vraie régression, il rend la main à `code-dev` pour corriger la source.
- La suite **E2E** verte (pas de régression de parcours) et l'éventuel test de reproduction E2E sont garantis par `e2e-dev` en fin de pipeline.
- Si le bug touche l'UI : rejouer manuellement le scénario dans le dev server avant de passer en **In review**

### 5. Commit

Commit du fix (par `code-dev`) : `fix(<scope>): <description courte> (#NNN)`.

Le test de reproduction (E2E écrit par `e2e-dev`, ou TU / intégration écrit par `tu-dev`) fait partie de la suite de non-régression permanente, committé séparément par son agent (`test(<scope>): …`).

---

## Cas particulier : bug de pipeline / déploiement

Les bugs touchant CI/CD, Docker, Kubernetes n'ont pas forcément de test automatisable. Dans ce cas :

1. Documenter la reproduction manuelle dans le commentaire du ticket (commandes exactes, logs)
2. Tester le fix dans un environnement de review (voir mémoire utilisateur : namespace K8s, URL, mail test)
3. Joindre les logs **avant** et **après** fix en commentaire du ticket
4. Si possible, ajouter un monitoring/assertion pour détecter la régression (health check, alerte)

---

## Cas particulier : visual mismatch (Figma ↔ app)

Quand le bug est un **écart visuel** entre le rendu de l'app et le design Figma de référence (couleur fausse, espacement décalé, typo wrong weight, élément manquant), le protocole « test qui échoue avant fix » ne s'applique pas tel quel : il n'y a pas de test unitaire / E2E qui asserte du pixel-perfect.

`bug-analyst` aura déjà identifié le delta dans son commentaire `## Analyse du bug` (sous-stratégie `visual mismatch`) — pour chaque divergence, il liste la propriété Figma concernée (`fontWeight`, `fill`, `itemSpacing`, …) et le fichier/composant à corriger.

Protocole côté `code-dev` :

1. **Lire l'analyse** posté par `bug-analyst` → savoir exactement quelles propriétés sont en écart
2. **Implémenter le fix** en suivant `rules/figma-workflow.md` Phase 3 (mapping Figma → DSFR : couleur → token, fontSize → `fr-text--*`, fontWeight ≥ 600 → `<strong>`, itemSpacing → `fr-m{b,t,r,l}-Xw`)
3. **Vérifier le rendu** :
   - Démarrer le dev server, naviguer via Playwright sur la page concernée
   - Re-lire le node Figma via `mcp__figma-dev__get_figma_data` et confirmer que chaque propriété est maintenant alignée
   - `mcp__figma-dev__download_figma_images` uniquement pour les cas ambigus (typiquement bold cell-by-cell sur tableaux où l'API ne révèle que le style dominant)
4. **Inclure des screenshots dev server** (desktop + mobile) dans le body de la PR — c'est le signal visuel pour la review humaine
5. **Pas de test E2E de record** sur le pixel-perfect : Lighthouse couvre l'a11y, la fidélité visuelle reste en revue humaine + check structurel agent
