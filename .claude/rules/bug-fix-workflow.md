# Bug Fix Workflow

> **Used by**: `code-dev` (issue type Bug, ou label `bug`), `bug-analyst` (phase analyse). Hors pipeline : l'agent principal quand il traite un fix.

Quand un ticket est un **bug** (issue type Bug, label `bug`, ou description explicite d'un comportement incorrect), `code-dev` suit un protocole strict **reproduire → fixer → valider**, en s'appuyant sur l'analyse postée par `bug-analyst` dans le commentaire `## Analyse du bug` (root cause, fichiers à modifier, fix proposé).

Cette discipline évite deux pièges fréquents :
1. "Je crois que j'ai fixé" sans preuve → régression un mois plus tard
2. Fix accidentel qui ne cible pas la root cause → bug réapparaît sous une autre forme

---

## Protocole obligatoire

### 1. Reproduire

**Avant d'écrire le fix**, écrire un test qui reproduit le bug.

- **Bug UI / comportement utilisateur** → test E2E Playwright dans `src/e2e/<feature>.e2e.ts`
- **Bug logique métier / domain** → test unitaire Vitest dans `__tests__/` à côté du module
- **Bug API / tRPC** → test unitaire du router ou test d'intégration selon le cas

Le test **doit échouer** sur `master` (ou la branche de base). Si le test passe avant le fix, c'est qu'il ne reproduit pas réellement le bug → revoir le test.

Commit intermédiaire possible : `test(<scope>): reproduce bug #NNN` (avant le fix).

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

- Le test de reproduction **passe**
- `pnpm typecheck` + `pnpm lint:check` verts
- Tous les autres tests passent (pas de régression : `pnpm test`)
- Si le bug touche l'UI : rejouer manuellement le scénario dans le dev server avant de passer en **In review**

### 5. Commit

Commit du fix : `fix(<scope>): <description courte> (#NNN)`.

Le test de reproduction commit précédemment (ou inclus dans ce même commit) fait partie de la suite de non-régression permanente.

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
