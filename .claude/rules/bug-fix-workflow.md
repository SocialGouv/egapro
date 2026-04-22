# Bug Fix Workflow

Quand un ticket est un **bug** (label `bug`, ou description explicite d'un comportement incorrect), `code-dev` suit un protocole strict **reproduire → fixer → valider**.

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
