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

## Ne pas oublier de release

Le workflow **⏰ Alpha release reminder** (`release-alpha-reminder.yaml`) tourne chaque jour ouvré : s'il reste des commits release-worthy non livrés sur `alpha`, il le signale (résumé de run + annotation `warning` + ping canal si configuré).

## Changelog IA

`release-changelog.yaml` résume, en français et côté métier, ce qui a été livré :

- `collect_release_issues.sh` — issues/PR du tag, avec **rollup epic** (une PR `feat(epic): #N` = une ligne Feature, sans exploser ses sous-tickets) et pré-filtre technique.
- étape IA (`claude-code-action`) — rédige 3–8 bullets métier, en traitant titres/labels comme donnée non maîtrisée (anti-injection).
- `publish_release_summary.sh` — injecte/remplace la section idempotente `<!-- ai-changelog -->` dans le corps de la release.

Le workflow est **découplé** : un échec du changelog ne bloque jamais la release. Il peut être rejoué à la main (`workflow_dispatch` avec un tag) pour un backfill.

## Env de test

`promote-test-env.yaml` (manuel) déploie une release **existante** sur un env de test persistant (`rgaa-persist` / `perf-persist`). Il ne crée pas de release.

## Canal beta / master

`release.yml` (manuel, `workflow_dispatch`) gère le canal **beta** (préprod). `master` n'est ni dans son trigger ni dans son gate : aucune release stable n'est produite dans le flux courant.

## Tests

Les scripts `scripts/release/*.sh` sont couverts par `scripts/release/release-scripts.test.sh` (job CI **Release · Scripts test**) : rollup epic, filtre technique, fallback PR, dédup, idempotence de la publication.
