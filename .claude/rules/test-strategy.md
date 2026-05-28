# Test Strategy

> **Used by**: `architect` (lors du découpage des sub-tasks et de la rédaction des spécifications), `bug-analyst` (lors de la recommandation des tests de reproduction/non-régression), `code-dev` (lors du choix du type de test à écrire pendant l'implémentation). Référencé par `comment-formats.md`.

Ce fichier fixe la **hiérarchie** des types de test que la pipeline doit favoriser, et la **règle dure** sur la création de nouveaux tests E2E.

---

## Pourquoi cette règle existe

Les tests E2E (Playwright sur dev server) sont **coûteux** :
- Temps d'exécution : plusieurs secondes à plusieurs minutes par test, vs. quelques ms pour un unit test
- Ressources : dev server + browser + données seedées + isolation worktree port
- Fragilité : sensibles aux timings, aux états résiduels, aux changements de DOM apparemment cosmétiques
- Coverage limité : couvrent un parcours mais ne disent rien des branches métier

Les tests unitaires (vitest + testing-library) sont **complémentaires** : couvrent les branches métier finement, échouent vite, restent isolés des effets de bord.

**Conséquence** : la pipeline doit produire **beaucoup d'unit tests et peu d'E2E**. Les E2E couvrent les **chemins critiques** (golden path login → déclaration → confirmation), pas les variations de validation d'un champ.

---

## Hiérarchie des tests (priorité descendante)

### 1. Unit test (vitest, pur)

**Quand** : logique pure isomorphe (domain, helpers, mappers, formatters, schemas Zod, calculs métier).

**Où** : `__tests__/` à côté du module concerné, ou `*.test.ts` colocaté avec le code testé.

**Exemples** :
- `~/modules/domain/getCurrentYear.test.ts`
- `~/modules/domain/extractSiren.test.ts`
- `~/modules/declaration/computeGap.test.ts`
- Validation Zod : `schemas.test.ts` qui asserte qu'un input valide passe, un invalide échoue avec le message exact

### 2. Component test (vitest + @testing-library/react)

**Quand** : comportement d'un composant React isolé — rendu conditionnel, validation de formulaire (input → erreur affichée), états (loading, error, success), accessibilité statique (presence of labels, roles).

**Où** : `__tests__/<Component>.test.tsx` à côté du composant.

**Exemples** :
- Form X reçoit un champ vide, `screen.getByText('Le champ Y est requis')` doit apparaître après submit
- Composant `<RemunerationTable>` reçoit des données mock, asserte les classes DSFR et l'ordre des cellules
- Bouton désactivé tant qu'un champ requis est vide

**À favoriser fortement** : la grande majorité des tests UI doivent vivre ici, **pas** en E2E.

### 3. Integration test (vitest + DB réelle ou fetch mock)

**Quand** : interaction de plusieurs modules sans browser — routes tRPC contre une vraie DB de test, mappers DB → schéma de retour, audit logging end-to-end côté serveur.

**Où** : `*.integration.test.ts` ; run via `pnpm test:integration`.

**Exemple** : `audit-cleanup.integration.test.ts` qui exécute le script contre une vraie postgres de test pour valider le SQL non-trivial.

### 4. E2E test (Playwright sur dev server)

**Quand** — **toutes** les conditions doivent être réunies :

1. **Parcours critique entier** — login → action → side-effect mesurable. Pas une validation isolée.
2. **Aucun E2E existant ne couvre déjà ce parcours** (voir inventaire ci-dessous). Si un E2E similaire existe → **adapter cet E2E existant** pour intégrer le nouveau cas, ne pas en créer un nouveau.
3. **Pas testable correctement par unit/component/integration** — la valeur ajoutée vient de la composition end-to-end (auth + middleware + DB + UI + side-effects).

Si **au moins une** condition n'est pas remplie → **ne pas créer d'E2E**.

**Où** : `packages/app/src/e2e/<feature>.e2e.ts`.

**Rôle** : non-régression des chemins critiques, pas couverture exhaustive.

---

## Règles dures pour `architect`

### A. Pas de ticket "ajout E2E" autonome

**`architect` ne crée plus de sub-task dont le seul objectif est d'ajouter un test E2E**, sauf si le ticket explicite la demande utilisateur de "couvrir le parcours X non testé en E2E aujourd'hui".

Les tests qui accompagnent une feature sont **inclus dans le ticket de la feature elle-même** (section "Tests recommandés" + critère d'acceptation "tests verts").

### B. Recommandation de test dans le spec

Dans la section `### Tests recommandés` du commentaire `## Analyse architecte` (mode task) ou du body de la sub-issue (mode epic-*), `architect` **précise le type de test attendu** selon la hiérarchie ci-dessus :

- "Tests unitaires sur le schéma Zod modifié + tests component sur l'affichage des erreurs" (préféré)
- "Adapter l'E2E `declaration.e2e.ts` pour couvrir la nouvelle étape" (si parcours déjà couvert)
- "Pas de nouvel E2E — la validation est couverte par les component tests" (explicite)

### C. Si demande d'E2E identifiée

Avant de créer un ticket E2E dédié, **vérifier l'inventaire** des 25 E2E existants. Si un fichier proche existe → recommander l'adaptation plutôt que la création.

---

## Règles dures pour `bug-analyst`

Voir `rules/bug-fix-workflow.md` : le test de reproduction **doit échouer** avant le fix, mais son **type** suit la même hiérarchie :

- Bug logique métier / domain → unit test (vitest)
- Bug component / validation form → component test (testing-library)
- Bug API / tRPC → integration test
- Bug parcours complet (login → action → side-effect) → adapter un E2E existant si possible, en créer un nouveau seulement si aucun couvre le parcours
- Bug visual mismatch Figma ↔ app → pas de test automatisé (relecture structurelle)

---

## Règles dures pour `code-dev`

Pendant l'implémentation :

1. **Privilégier unit + component tests** — vitest + testing-library — pour couvrir les branches du code modifié à 100%.
2. **Adapter un E2E existant** si le ticket touche un parcours déjà couvert (cf. inventaire). `git grep` sur les routes/labels modifiés permet de localiser l'E2E concerné.
3. **Créer un nouvel E2E** uniquement si :
   - Le ticket le précise explicitement, OU
   - Le ticket ouvre un nouveau parcours critique non couvert par les E2E existants
4. **Coverage 100% strict** sur le code modifié (statements, branches, functions, lines) reste obligatoire — atteint par unit + component tests en priorité, complété par E2E uniquement quand nécessaire.

---

## Inventaire des E2E existants (mai 2026)

Source : `packages/app/src/e2e/` — 25 fichiers actifs. Avant de créer un nouvel E2E, vérifier qu'aucun ne couvre déjà le parcours :

| Fichier | Couverture |
|---|---|
| `admin-declarations.e2e.ts` | Panel admin déclarations |
| `admin-impersonation-read-only.e2e.ts` | Mode impersonation admin (read-only) |
| `admin-referents.e2e.ts` | CRUD admin référents |
| `admin-stats-campagne.e2e.ts` | Stats campagne admin |
| `admin-stats-plateforme.e2e.ts` | Stats plateforme admin |
| `admin.e2e.ts` | Home / settings admin |
| `campaign-deadlines-gating.e2e.ts` | Validation deadlines de campagne |
| `compliance-path-change.e2e.ts` | Switch de parcours conformité |
| `compliance.e2e.ts` | Flow déclaration conformité |
| `declaration-cancellation.e2e.ts` | Annulation + ré-ouverture de déclaration |
| `declaration-process-panel.e2e.ts` | États du panel formulaire déclaration |
| `declaration.e2e.ts` | Flow déclaration end-to-end principal |
| `declarationDraft.e2e.ts` | Draft & save de déclaration |
| `error-pages.e2e.ts` | Pages 404 / 500 |
| `fileUpload.e2e.ts` | Upload fichiers (CSE, déclaration) |
| `home.e2e.ts` | Page d'accueil / redirection login |
| `login.e2e.ts` | Login ProConnect OAuth |
| `logout.e2e.ts` | Flow logout |
| `missing-info-modal.e2e.ts` | Modal champs requis manquants |
| `notifications-email-flow.e2e.ts` | Trigger notifications email |
| `previous-year-categories.e2e.ts` | Données historiques par année |
| `public-referents.e2e.ts` | Page publique référents |
| `public-stats.e2e.ts` | Page publique stats plateforme |
| `recapitulatif.e2e.ts` | Page récapitulatif déclaration |
| `step1-workforce-validation.e2e.ts` | Validation step 1 (effectifs) |

Procédure de recherche avant création :
1. `ls packages/app/src/e2e/` → scan rapide
2. `git grep -l "<route ou label clé>" packages/app/src/e2e/` → fichier candidat
3. Si match → lire le fichier, identifier le test à étendre
4. Si pas de match évident → vérifier par parcours fonctionnel (login → … → action)

---

## Quand l'utilisateur demande explicitement un E2E

Si la demande utilisateur ou le commentaire architect dit « ajoute un test E2E pour X », c'est OK — la règle se résume à : pas de **création silencieuse** par un agent qui pense "bien faire". L'intention E2E doit être explicite dans le spec.
