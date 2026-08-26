# Process de release

> Comment une version part en production, et comment le changelog est généré.

## En bref

Sur EGAPRO, **la branche `alpha` est la branche par défaut et le canal de livraison**. `master` est dormant (on n'y touche pas). Une release **alpha** n'est plus automatique : c'est un **geste manuel intentionnel**.

## Livrer une version (prod)

1. Les PR sont mergées sur `alpha` au fil de l'eau — **rien ne part en prod tout seul**.
2. Quand on décide de livrer, lancer le workflow **🔖 Prerelease (alpha)** (`release-alpha.yaml`) → onglet **Actions** → **Run workflow** (branche `alpha`).
3. `semantic-release` calcule le prochain tag `-alpha.N` et publie une prerelease GitHub. Le résumé du run indique la version publiée (ou « aucune release » s'il n'y a pas de commit `feat`/`fix` depuis le dernier tag).
4. Le tag déclenche automatiquement :
   - **`production.yaml`** (push tag `v*`) → déploiement en **production** ;
   - **`release-changelog.yaml`** (`release: published`) → **changelog IA** ajouté au corps de la release.

> ⚠️ Invariant : `release-alpha.yaml` crée la release avec le **token GitHub App** (token-bureau), pas `GITHUB_TOKEN`. Une release créée par `GITHUB_TOKEN` ne déclenche aucun workflow downstream → le déploiement prod **et** le changelog s'arrêteraient silencieusement.

## Changelog IA

`release-changelog.yaml` résume, en français et côté métier, ce qui a été livré :

- `collect_release_issues.sh` — issues/PR du tag, avec **rollup epic** (une PR `feat(epic): #N` = une ligne Feature, sans exploser ses sous-tickets) et **pré-filtre technique à deux niveaux** : au niveau PR (le préfixe conventional-commit `chore|ci|build|perf|test|refactor|style|docs` ne figure que sur le titre de PR — un titre d'issue est en français et ne matche jamais), puis au niveau issue (label technique). Un scope technique (`fix(release): …`) n'est pas un type technique et passe le filtre.
- étape IA — applique un **contrat de couverture** (une puce par entrée par défaut, fusion uniquement si même fonctionnalité) en traitant titres/labels comme donnée non maîtrisée (anti-injection). Claude Code est appelé via son **CLI** (`claude -p`), pas via `anthropics/claude-code-action` : cette action rejette l'événement `release` (`Unsupported event type`), et ce job n'a de toute façon besoin d'aucun contexte GitHub. Le CLI tourne dans un répertoire temporaire (ni `CLAUDE.md`, ni hooks, ni MCP chargés) et ne voit que `issues.json`. Version épinglée dans `env.CLAUDE_CODE_VERSION`.
- **vérification de couverture** — compare le nombre d'entrées collectées au nombre de puces du résumé ; fait échouer le job si le résumé est vide alors que des entrées ont été collectées (couverture abandonnée par l'IA), et émet un avertissement quand il y a moins de puces que d'entrées — la fusion de plusieurs entrées d'une même fonctionnalité est légitime, mais mérite un coup d'œil.
- `publish_release_summary.sh` — injecte/remplace la section idempotente `<!-- ai-changelog -->` dans le corps de la release.

Le workflow est **découplé** : un échec du changelog ne bloque jamais la release. Il peut être rejoué à la main (`workflow_dispatch` avec un tag) pour un backfill.

## Env de test

`promote-test-env.yaml` (manuel) déploie une release **existante** sur un env de test persistant. Il ne crée pas de release.

Le workflow prend un tag (`release`) et une cible (`target` : `rgaa` ou `perf`), vérifie que le tag correspond bien à une release GitHub publiée, construit l'image `app:<tag>` **depuis le tag**, puis la déploie avec `deploy-via-github`. `KS_GIT_BRANCH=<target>-persist` pilote le nommage kontinuous — namespace `egapro-<target>-persist`, labels `kontinuous/ref` et exemption janitor (convention `*-persist`) — et `inlineSet: global.imageTag` force les pods sur le tag promu plutôt que sur le `persist-<sha>` calculé par défaut.

**Aucune branche git n'intervient** : `rgaa` et `perf` ne sont que des refs de nommage pour les préreleases. Le job `deploy` déclare l'URL de l'environnement, ce qui la propage dans `deployment_status.environment_url` — sans quoi l'audit Lighthouse, déclenché sur cet événement, ciblerait l'env de la branche du workflow (`alpha`) au lieu de l'env promu.

## Canal beta / master

`release.yml` (manuel, `workflow_dispatch`) gère le canal **beta** (préprod). `master` n'est ni dans son trigger ni dans son gate : aucune release stable n'est produite dans le flux courant.

### Preset conventional-commits

`.releaserc.cjs` utilise le preset `conventionalcommits` avec un `presetConfig.types` qui rend visibles, dans les notes générées par semantic-release, les types autrement cachés par le preset angular par défaut (`refactor`, `docs`, `perf`, `revert`), sous des sections françaises. Les types purement techniques (`chore`, `ci`, `build`, `style`, `test`) restent masqués. Le **déclenchement** des releases est inchangé : `@semantic-release/commit-analyzer` dérive le niveau de bump de ses `default-release-rules` (breaking→major, feat→minor, fix|perf|revert→patch), indépendantes du preset.

## Tests

Les scripts `scripts/release/*.sh` sont couverts par `scripts/release/release-scripts.test.sh` (job CI **Release · Scripts test**) : rollup epic, filtre technique, fallback PR, dédup, idempotence de la publication.
