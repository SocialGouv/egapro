# Tests E2E (Playwright)

> S'applique à `packages/app/src/e2e/**` et à l'étape E2E de `/implement` — **en fin de flux**, une fois le code du ticket (ou de l'epic) complet, revu et vert. Pour les TU et l'intégration → [`conventions/testing.md`](conventions/testing.md).

## Périmètre

- **Tu écris ici** : `src/e2e/**/*.e2e.ts`, `auth.setup.ts`, `global-setup.ts`, les helpers `src/e2e/helpers/**` (quand un flow réutilisable doit être extrait), la grille de recette `src/e2e/grille/**` (`coordinates.ts`, `scenarios.ts`, `grille.grille.ts`).
- **Pendant cette étape, tu ne corriges pas la source.** Un E2E qui révèle une vraie régression fait revenir au code (si c'est ton ticket) ou part en rework (si c'est un epic intégré) — voir « Régression » plus bas. Ne jamais tordre un test pour qu'il accepte une régression.

## Philosophie : peu de scénarios, mais riches

Là où les TU visent 100 % de couverture avec beaucoup de tests ciblés, l'E2E suit la logique inverse :

- **Peu de scénarios globaux** qui rejouent un **parcours utilisateur complet** (`test.describe` + `test.step`, souvent `mode: "serial"`). Une nouvelle fonctionnalité se **greffe** dans le scénario existant qui couvre déjà ce parcours.
- **Toute fonctionnalité ne mérite pas d'E2E.** Une pure règle métier déjà couverte par un TU, ou un ajustement visuel, n'en justifie en général pas.
- **Un nouveau fichier `*.e2e.ts`** est réservé à un parcours ou une page **réellement nouveaux**.

### Couverture des pages

Chaque route de `src/app/**/page.tsx` a une couverture E2E : la page rend sans erreur, contenu et titres clés visibles, pages d'erreur (404, 500, 503) avec le bon statut et le bon message. Le mandat porte sur la **couverture d'un parcours**, pas sur chaque édition d'une page : une route **nouvelle**, ou dont le **parcours** change (URL, étapes, redirections, conditions d'accès), doit être couverte ; une route dont seul le **rendu** change (SCSS, `className`, libellé, espacement) ne déclenche rien. Le mandat ne prime **jamais** sur le critère de criticité.

### Bug : la criticité est une gate d'entrée

- Bug sur un parcours critique (déclaration, login, conformité, upload) à fort risque de régression → assertion de non-régression E2E. Bug mineur (cosmétique, edge case rare, écart Figma) → aucune, tu le justifies en une phrase.
- **Défaut explicite** : si le diff **source** ne touche que du CSS / SCSS / des attributs `className` (aucune logique, route, appel réseau ni état), le défaut est **`none`**. Pour le surcharger, nomme la **casse fonctionnelle concrète** que le test préviendrait (contrôle devenu inatteignable, contenu masqué, parcours interrompu). « Ça pourrait régresser » ne suffit pas.
- **Un bug ne crée jamais de nouveau fichier `*.e2e.ts`** : ses seuls modes sont `nested` (une ou deux assertions greffées dans le scénario existant) et `none`.
- **`none` ≠ non vérifié** : tu ne statues que sur la couverture **permanente**. La vérification one-shot du fix a déjà eu lieu ([`bug-fix.md`](bug-fix.md)).
- **Proportionnalité** : s'il te faut plus de lignes de test que le fix n'en change, ou des fast-forwards SQL sur plusieurs écrans, tu sur-testes → une assertion unique, ou `none`.
- Une recommandation de test dans l'analyse **propose**, elle ne lie pas : tu décides sur le **diff réel**, et si tu conclus `none` contre elle, dis-le dans le body de PR.

## Contrats de fidélité Figma

La suite porte aussi les contrats de fidélité visuelle — la couche de régression **permanente** que la revue `design-fidelity`, ponctuelle, ne fournit pas. Pas de moteur générique ni de fixtures : un contrat est un `*.e2e.ts` dédié qui porte ses valeurs attendues en constantes de module et les asserte via `getComputedStyle` / `getBoundingClientRect`. Quatre existent (`breadcrumb-spacing`, `stepper-spacing`, `declaration-header-alignment`, `second-declaration-info-styling`) — **les copier** plutôt qu'en inventer la forme. L'assertion s'imbrique dans le scénario qui atteint déjà l'écran dans le bon état, jamais un tunnel rejoué pour une mesure. Discipline de mesure → [`design-fidelity.md`](../../review/references/design-fidelity.md).

## Le déroulé

1. **Lire le diff** — `git diff <base>...HEAD` (ticket : `origin/alpha` ou `origin/epic/<N>` ; epic : `origin/alpha`). Identifier les fichiers source et les **routes / parcours** touchés. Relire le spec (`## Scénarios de test`).
2. **Décider le mode — avant toute autre action** : `nested` / `new` / `none`, écrit explicitement (body de PR, section « E2E »).
3. **Trancher la grille** — `bash scripts/orchestration/grille_scope.sh <base>` (base complète : `origin/alpha`, `origin/epic/<N>`). Le script est la **seule** source de la règle : `play` si le diff touche le parcours que rejouent les 185 coordonnées (fichiers décisifs sur stderr), `skip` sinon. Ne juge pas toi-même, ne recopie pas sa liste de chemins. Écris dans la section « E2E » du body la réponse (`play` / `skip`) et les fichiers qui l'ont décidée — y compris sur `none`.
   - **`none` + `skip`** → arrête-toi : ne démarre ni serveur ni suite. La CI (`e2e.yaml`) rejoue suite et grille sur la PR. Écris la justification du `none` dans le body.
     Exception : `e2e.yaml` ne se déclenche que sur les PR vers `alpha`. Pour un sous-ticket (base `epic/<N>`), **aucune** CI E2E ne tourne avant la PR finale : `none` + `skip` reste valable, mais la couverture est différée à l'E2E de fin d'epic ([`epic.md`](epic.md) étape 7) et à la CI de la PR finale `epic/<N> → alpha`.
   - **`none` + `play`** → joue la grille seule (étapes 4–5 pour la grille), pas de couverture à écrire.
4. **Démarrer le dev server sur le port du worktree** (jamais :3000 si un autre serveur l'occupe) : `pnpm dev:app` en arrière-plan, attendre qu'il réponde, puis `export PLAYWRIGHT_BASE_URL=http://localhost:<port>`. `PORT`, `NEXTAUTH_URL` (écrits dans `packages/app/.env.local` par `setup-worktree.sh`) et `PLAYWRIGHT_BASE_URL` doivent porter **le même port**.
5. **Jouer** — `pnpm --filter app test:e2e` (sauf `none` + `play`), et si `play` : `pnpm --filter app test:e2e:grille` (20–30 min). Relever les tests rouges — détail dans `packages/app/test-results/` (trace conservée sur échec, `trace: "retain-on-failure"`) ; pour la grille, l'identifiant est le premier crochet du titre, `[année-tranche-CASnn]`.
6. **Trier chaque échec** :
   - **Régression non souhaitée** — le code casse un parcours qui devait rester inchangé.
   - **Évolution légitime** — le test assertait l'ancien comportement que le spec change **volontairement** (URL, libellé, étape, redirection). Pour la grille : seulement si le spec change volontairement la règle métier rejouée (seuil, cas, écran d'arrivée) — correction dans `src/e2e/grille/coordinates.ts` (résultat attendu) ou `scenarios.ts` (parcours).
   - **Dans le doute → régression.**
7. **Régression** → **STOP** sur l'E2E. Ticket en cours : retourne au code (étape 4 du SKILL), corrige la source, repasse `pnpm verify` + revue. Epic intégré (`epic/<N>`) : commente l'epic (`implement: régression E2E` — `fichier:ligne` ou `[année-tranche-CASnn]`, attendu vs obtenu, fichier source suspecté, assez précis pour spécifier le fix sans re-deviner) puis `/analyze <epic#> rework` ([`rework.md`](../../analyze/references/rework.md)). La PR finale n'est **pas** ouverte tant que c'est rouge.
8. **Évolutions légitimes** → mets à jour sélecteurs / `waitForURL` / assertions. **Jamais affaiblir** : ni `.skip` / `.fixme` / `.only`, ni assertion retirée, ni timeout gonflé pour masquer une lenteur anormale.
9. **Nouvelle couverture** (si `nested` / `new`) : inventorie `ls packages/app/src/e2e/*.e2e.ts` et les scénarios du parcours concerné (`compliance.e2e.ts`, `declaration.e2e.ts`, `login.e2e.ts`…) ; greffe de préférence ; réutilise `src/e2e/helpers/*.ts` (`login`, `declaration-flows`, `compliance-flows`, `db`…) — un flow réutilisable nouveau s'extrait en helper (DRY). Aucun commentaire, sauf un `//` court pour un WHY non évident.
10. **Bug critique couvert en E2E** → revert-verify du test E2E (RED sans le fix, GREEN avec), comme pour un TU.
11. **Rejouer ce qui a été joué** → tout vert ; `pnpm typecheck` et `pnpm lint:check` sur tes fichiers. **Arrêter le dev server.**
12. **Commit** : `test(e2e): <scope> — <résumé>`, push sur la branche de la PR (re-déclenche la CI). Rien à committer si `none` sans correction.

Données de test : uniquement la donnée seedée fictive (`TEST_SIREN`, le compte ProConnect de test) — jamais de vraie donnée dans une fixture ou un commentaire.

## Ports, Charon, shards

`pnpm test:e2e` utilise `PLAYWRIGHT_BASE_URL`, sinon `SITE_URL`, sinon `http://localhost:3000`. La connexion ProConnect passe par le proxy OAuth **Charon**, dont la config egapro (`SocialGouv/infra-apps`) autorise les callbacks locaux sur **:3000–:3010**. Un worktree d'index `i` (`scripts/setup-worktree.sh <i>`) sert l'app sur `3001 + i` : utilise les indices **0 à 9** seulement, et jamais un index (ni ses ports Docker) déjà pris par une autre exécution. Contexte complet → README, § Connexion ProConnect.

En CI, `e2e.yaml` rejoue sur toute PR vers `alpha` la suite **et** les 185 coordonnées de la grille (`pnpm test:e2e:grille`), en shards parallèles — 2 pour la suite, 3 pour la grille — sous un job agrégateur qui porte le check requis « Test e2e ». Le second shard de la suite tourne sur :3006 et vérifie un vrai callback ProConnect hors :3000. Une coordonnée rouge bloque la PR comme un spec rouge. `e2e-grille.yaml` est le run nocturne qui produit le rapport de recette.

Pour qui touche au graphe de projets Playwright : seuls les projets de **premier niveau** sont shardés, et un projet de dépendance est rejoué en entier dans chaque shard — mettre un projet en aval d'un autre renvoie toute sa collection dans le premier shard. `test.describe.configure({ mode: "serial" })` au niveau d'un fichier ne rend insécable que **ce fichier** ; le problème n'apparaît que si un seul bloc `serial` concentre l'essentiel de la collection (la grille avant #4132). Le workflow refuse un shard vide, pour que cette annulation silencieuse de la parallélisation se voie.
