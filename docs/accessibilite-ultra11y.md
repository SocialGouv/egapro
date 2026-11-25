# Accessibilité — le dispositif ultra11y en détail

> Complément d'`AGENTS.md` § Accessibilité (la règle courte, toujours chargée) et de `.agents/skills/review/references/a11y.md` (la revue).
> Ici : comment la chaîne CI est câblée, ce qu'elle coûte, les décisions déjà prises et
> pourquoi — pour ne pas les reprendre à zéro. Rien de ce document n'est une règle à appliquer :
> c'est de la mémoire d'exploitation.

---

### 2. L'analyse, en CI

L'Action `SocialGouv/ultra11y` n'existe plus : ultra11y **6.0.0** l'a retirée (SocialGouv/ultra11y#165),
et un audit CI passe désormais par le bot **`rgaa-audit`** (Acci) d'iterion — doc du bot :
[`bots/rgaa-audit/README.md`](https://github.com/SocialGouv/iterion/blob/main/bots/rgaa-audit/README.md),
section « Run Acci in your CI ». La bascule date de #4899.

Deux usages, deux outils, et ils ne se recouvrent pas :

- **chaque PR** passe par le skill **`review-a11y`** d'ultra11y (la devDependency), exécuté sans
  modèle par `a11y-review.yaml` : moteur statique sur le diff, puis rendu Playwright + axe des
  seules pages que le diff atteint, comparé à la base. Seul ce qui est **nouveau** bloque ;
- **l'audit complet** (la grille RGAA entière, adjugée, datée) passe par le bot iterion
  **`rgaa-audit`**, une fois par semaine ou à la demande (`a11y.yaml`).

| Job | Quand | Ce qu'il fait |
|---|---|---|
| `a11y-gate` (`a11y.yaml`) | **chaque PR** (bloquant) | `pnpm exec ultra11y audit src --jsx --graph --standard rgaa --lang fr --fail-on blocking` : la devDependency, la même commande que le pre-commit et `pnpm verify`. Tout `src`, pas le diff. Gratuit, aucun navigateur, aucun modèle. |
| `review-a11y-static` (`a11y-review.yaml`) | **chaque PR vers `alpha`** (bloquant) | `review-a11y` §1 : `pnpm exec ultra11y audit --since origin/alpha --jsx --graph --standard rgaa --lang fr --json`, puis la barrière rejouée sur ce document (`audit --in … --fail-on blocking`). Les seuls fichiers que la PR change ; rouge sur une non-conformité bloquante. Écrit sa section du commentaire de revue. Voir « La revue a11y de chaque PR ». |
| `review-a11y-rendered` (`a11y-review.yaml`) | **chaque déploiement de la préversion d'une PR** (`deployment_status` de « Review Auto », bloquant) | `review-a11y` §1b : `affected --since origin/alpha`, puis `scan --since` sur la préversion de `alpha` (la base) et sur celle de la PR avec `--baseline`. Rouge sur une non-conformité **nouvelle** ou une page atteinte qui n'a pas pu être rendue. Écrit sa section du commentaire de revue. |
| `a11y-pages` (`a11y.yaml`) | **cron hebdomadaire** (lundi 04:00 UTC, sur `alpha`) et manuel | La suite Playwright `src/e2e/a11y/` capture les pages en épinglant l'état applicatif que chaque écran exige (toutes celles que déclare `.ultra11yrc.json`, ce que tient `check --require-sample`). Le moteur de la devDependency — celui qui a écrit les instantanés — audite code et pages, **rejoue le registre sans modèle**, rend le rapport page par page et le rapport RGAA. Aucun modèle. Rouge sur une panne ou un balayage amputé, jamais sur un constat. |
| `rgaa-audit` (`a11y.yaml`) | cron, manuel | Le bot iterion, épinglé par `ITERION_VERSION` (le bot est installé depuis le même tag, et son pin du moteur voyage avec lui). Audit statique de `packages/app/src`, rejeu du registre, adjudication par des agents en lecture seule (secret `CLAUDE_CODE_OAUTH_TOKEN`), second lecteur, rapport daté et annexe technique. `rendered=off`, `--max-cost-usd 60`, `--max-tokens 5000000`. Consultatif : rouge seulement sur un refus typé du bot. |
| `a11y-bundle` (`a11y.yaml`) | cron, manuel | Fusionne les parties (`ultra11y-part-pages`, `ultra11y-part-rgaa-audit`, `ultra11y-part-playwright`) en un seul artefact `ultra11y-rgaa`. |

**Pourquoi le bot tourne `rendered=off`, et pourquoi le rendu reste à `a11y-pages`.** Le nœud
`static_audit` du bot purge `.ultra11y/pages/` avant d'auditer, et sa couche de rendu est un
`scan --sample` qui visite des URL sous un état unique. Les écrans du tunnel sont derrière
ProConnect et gardés par la machine à états : ce balayage obtiendrait une redirection et,
correctement, refuserait de l'enregistrer. Seule la suite Playwright sait les ouvrir — d'où deux
jobs, et deux rapports dans le livrable : le **jugement** (bot, statique + registre + agents) et
le **rendu** (moteur seul, page par page).

**Le bot lit le dépôt depuis `packages/app`** (`--var workspace_dir`) : `scope_globs=src/**`, le
registre (`.ultra11y/verdicts/rgaa.json`, défaut du bot) et `.ultra11yrc.json` s'y résolvent là
où ils vivent ; `undecidable_path=.ultra11y/undecidable.json` nomme le fichier du dépôt (le défaut
du bot est `undecidable-rgaa.json`).

**Trois étages, et ils ne paient pas la même chose.** `pull_request` lance deux audits statiques
(`a11y-gate`, tout `src` ; `review-a11y-static`, le diff) — gratuits, sans modèle, bloquants. Le
déploiement de la préversion lance le rendu des pages touchées (une minute de navigateur, sans
modèle, bloquant). Le cron hebdomadaire, ou un `workflow_dispatch`, lance le balayage navigateur
complet (minutes de runner) et le bot (modèle).

### Pourquoi un cron hebdomadaire, et pas un run à chaque merge

Le cron du lundi 04:00 UTC a d'abord été choisi plutôt qu'un `push: alpha` que
`claude-code-action` aurait refusé, puis retiré pour le prix (#4412), puis rétabli (#4822) :
sans lui, une régression de rendu n'était rattrapée par personne tant que personne ne lançait le
workflow — et aucun run complet n'a abouti entre le 1er septembre et le 14 octobre 2026.

**ultra11y 5.36 a rendu le contrat d'automatisation exhaustif.** Un critère n'obtient un `C` par
mesure que si son contrat de test démontre que *chaque* test numéroté a un instrument décisif.
Sur les 106 critères RGAA, **trois** remplissent cette condition : 8.3, 8.5 et 10.1. Les 103
autres exigent une adjudication. Mesuré sur ce dépôt, même commit et mêmes 37 captures :

| | run 33383329004 (action `v5.34.2`) | run 33389189227 (action `v5.40.1`) |
|---|---|---|
| Grille | `26 moteur, 32 mesure (scan), 48 agent, 0 sans verdict` | `3 moteur, 0 mesure (scan), 32 agent, 69 sans verdict` |
| Worklist modèle | 27 critères | 84 critères |

Ce n'est pas une régression, c'est un durcissement, et il se défend : avant, un dépôt sans image
marquait 100 % sur « chaque image a-t-elle une alternative pertinente ? ». Mais un run qui adjuge
84 critères ne se paie pas à chaque merge.

**Le refus de `push` a disparu entre-temps.** `adjudicate-runner: cli` fait lancer Claude par le
moteur, en processus local, sans le parseur d'événements de `claude-code-action` : l'Action
documente qu'il « works on `push` ». Un `push: alpha` filtré par `paths` a donc été envisagé
(#4855), puis écarté : le filtre aurait laissé passer **251 des 271** commits d'`alpha` entre
août et octobre 2026, soit un run payé à quasiment chaque merge, avec un registre qui n'était
plus rafraîchi.

Le run tourne donc **une fois par semaine**, sur l'état courant d'`alpha` :

- **`schedule` s'exécute sur la branche par défaut**, qui est `alpha` : le cron lit `a11y.yaml`
  depuis `alpha` et audite son dernier commit ;
- **jamais annulé** — `cancel-in-progress` reste réservé aux PR : un run complet est payé, et un
  run annulé a dépensé sans rien produire ;
- **le registre rejoué** — tant que le registre commité est à jour, un run ne paie que le
  reliquat dont l'évidence a bougé. Rien ne le commite à la place d'un humain : laissé périmé, il
  fait repayer ce qu'il ne couvre plus.

`gh workflow run a11y.yaml --ref alpha` reste là pour un livrable daté, une autre branche, ou un
contrôle après un changement d'UI significatif.

**Ce que ça donne, et ce que ça ne donne pas :** une régression du **code** que le moteur
tranche est arrêtée sur la PR, et une régression de **rendu** (contraste calculé, focus visible,
reflow) sur une page que la PR atteint aussi, dès que sa préversion est déployée. Une régression
de **jugement**, ou de rendu sur un écran que la préversion n'ouvre pas (tunnel derrière
ProConnect), est rattrapée **au plus tard le lundi suivant**, et le run hebdomadaire ne bloque
rien, il mesure et publie.

Les gates de PR ne font appel à aucun modèle : le rouge/vert reste une fonction du commit et des
deux préversions, quoi qu'un modèle ait dit.

### La revue a11y de chaque PR

`.github/workflows/a11y-review.yaml`, depuis #4899. C'est le skill **`review-a11y`** d'ultra11y
(`.agents/skills/review-a11y/SKILL.md`, symlink vers la devDependency), exécuté à la lettre par la
CI, **sans modèle** : ce qui bloque est le code de sortie du moteur. Le même skill est celui que
`/review gates` invoque côté agent ([`a11y.md`](../.agents/skills/review/references/a11y.md)) ;
l'agent y ajoute le jugement (pertinence d'un `alt`, intitulé de lien en contexte, logique
clavier), qui ne bloque pas la CI.

**Passage 1 — le code modifié** (`review-a11y-static`, sur `pull_request` vers `alpha`) :

```bash
pnpm exec ultra11y audit --since origin/alpha --jsx --graph --standard rgaa --lang fr --json > audits/review-static.json
pnpm exec ultra11y audit --in audits/review-static.json --standard rgaa --lang fr --fail-on blocking
```

Une passe de détection, puis la barrière rejouée sur le même document : son code de sortie est le
verdict, et son texte porte les messages en français (le JSON garde le message canonique
anglais). Une PR qui ne touche aucun fichier auditable audite zéro fichier et passe.

**Passage 2 — les pages rendues que la PR atteint** (`review-a11y-rendered`, sur le
`deployment_status` « success » de l'environnement `review-auto`, c'est-à-dire quand la
préversion de la branche est en ligne) :

```bash
pnpm exec ultra11y affected --since origin/alpha --base-url "$PR_URL" --json
pnpm exec ultra11y scan --since origin/alpha --base-url "$BASE_URL" --browser-path "$CHROME" --no-snapshot --json > base-scan.json
pnpm exec ultra11y scan --since origin/alpha --base-url "$PR_URL" --baseline base-scan.json --browser-path "$CHROME" --no-snapshot --json
```

- **Quelles pages** : `affected` remonte le graphe d'imports depuis chaque fichier modifié jusqu'aux
  `page.tsx` / `layout.tsx` de `src/app/` et aux `sample.pages[].sources` de `.ultra11yrc.json`.
  Un `layout` sélectionne toutes les pages en dessous de lui.
- **Les deux URL** viennent de la règle kontinuous de `lighthouse.yaml` (action
  `socialgouv/kontinuous/.github/actions/env`) : `https://<sous-domaine de la branche>.ovh.fabrique.social.gouv.fr`
  pour la PR, et celui de `alpha` (`https://egapro-alpha.ovh.fabrique.social.gouv.fr`) pour la
  base. Les deux scans rendent les **mêmes chemins** : la sélection dépend du diff, pas de l'hôte.
- **Ce qui bloque** : un constat rendu absent de la base (identité = règle axe, critère, chemin,
  sélecteur), ou une page atteinte qui n'a pas pu être rendue (erreur HTTP, redirection vers la
  connexion) **sauf** si elle ne l'était pas non plus sur la base. Les constats préexistants sont
  comptés sur une ligne, hors verdict.
- **Le navigateur** est le Chrome de l'image `ubuntu-latest` (`--browser-path`) : aucun
  téléchargement, et le même pour les deux scans.
- La PR est retrouvée par le SHA déployé (`commits/<sha>/pulls`) ; une branche poussée sans PR
  ouverte vers `alpha` n'a rien à revoir, le job passe.

**Le commentaire de revue.** Les deux jobs écrivent chacun leur section d'un **seul** commentaire
de PR (repéré par `<!-- review-a11y -->`, mis à jour à chaque push), constats rangés par
sévérité puis par **critère RGAA**, le WCAG en correspondance entre parenthèses, en français.
`scripts/a11y/review-comment.mjs` le formate (testé par `review-comment.test.mjs`, dans
`a11y-gate` et `pnpm verify`) : il rattache chaque constat rendu à son critère RGAA par la table
du moteur épinglé (`ultra11y/src/data/standards/rgaa.json`), puisque `scan --json` cite le critère
WCAG. `scripts/a11y/post-review-comment.sh` l'écrit (une tentative = chercher, fusionner,
écrire ; relu après coup). Le même contenu va dans le résumé du job : une PR depuis un fork n'a
pas le droit d'écrire le commentaire, le verdict ne change pas.

**Ce que la revue ne voit pas**, à nommer en risque résiduel (règle fondamentale 3 du skill) :

- les écrans **derrière ProConnect** ou gardés par la machine à états du tunnel : la préversion
  redirige vers la connexion, sur la base comme sur la PR, donc la page est « non mesurée » des
  deux côtés et ne bloque pas. Ces écrans ne sont rendus qu'au run hebdomadaire (`a11y-pages`) ;
- une route dynamique (`[id]`) qu'aucune URL connue ne résout, et un fichier modifié qui n'atteint
  aucune page : le commentaire les liste comme **non rendus**, jamais comme propres ;
- tant que la préversion n'est pas déployée (ou si elle échoue), la section « pages rendues »
  reste « en attente » : seul le passage 1 a tranché ;
- les **routes nouvelles** : une page ajoutée n'est capturée par `a11y-pages` que si elle est
  déclarée dans `sample.pages` (ou exemptée dans `sample.exempt`). `affected` la rend sur la PR,
  mais déclarer chaque nouvelle page dans `.ultra11yrc.json` reste à la revue.

**Ce qu'il a remplacé.** Le mode lite d'ultra11y 5.58.1 (#5083) puis, brièvement, `a11y-lite.yaml`
(audit statique du diff à la version du bot) : ultra11y 7.0.0 avait retiré `affected` et
`--baseline`, et 9.2.0 les a rendus au skill `review-a11y` (`scan --since --baseline`,
SocialGouv/ultra11y#216). `a11y-lite.yaml` est retiré : la revue couvre les PR.

### Le registre de verdicts, et pourquoi il est revenu

`packages/app/.ultra11y/verdicts/rgaa.json` est **versionné** (exception explicite dans
`packages/app/.gitignore`). Il enregistre les verdicts que la porte a ACCEPTÉS, et un run
ultérieur les **rejoue avant d'appeler le moindre modèle** — le bot (`ledger_replay`), et
`a11y-pages` sans modèle du tout (`verify --apply`). Le bot sort le registre mis à jour dans son
rapport (`rgaa-report/`, partie `ultra11y-part-rgaa-audit` du livrable).

Il avait été supprimé parce qu'il « ratait » des critères et rendait la grille irreproductible —
diagnostic exact sur un symptôme dont la cause n'était pas lui : sur 5.16.0,
`verify --apply … --ledger --lang fr` écrivait le registre dans un fichier nommé `--lang`, un flag
à valeur optionnelle avalant le suivant. Le registre n'était donc jamais écrit là où le run
suivant le cherchait. Corrigé en amont (5.17.0).

**Ce n'est pas un cache.** Chaque entrée repasse par la même porte, sur l'évidence re-dérivée de
l'audit du moment, et celle dont l'empreinte d'évidence a bougé est abandonnée comme **périmée**
en le disant. Ce qui n'est pas rejoué est ce qui est payé.

**Rien ne le commite automatiquement, et c'est délibéré.** Le workflow tourne en `contents: read`
et le registre sort dans l'artefact. Le rendre effectif est un geste humain — relire le diff des
verdicts, le commiter. Un registre qu'une CI s'écrit à elle-même n'est plus une décision revue par
quiconque. Conséquence pratique : **un run dont personne ne commite le registre fait repayer le
total au run suivant.**

**Quand le rejeu rougit**, la réponse n'est jamais de régénérer le registre jusqu'à ce qu'il
passe. Lire quels critères sont périmés : leur verdict porte sur du code qui n'existe plus.
Ré-adjuger ceux-là, et commiter le résultat.

### `undecidable.json` est revenu, et pourquoi son retrait ne tenait plus

Il avait été supprimé sur ce raisonnement : « une exemption est le constat qu'un critère n'a pas
reçu d'évidence — le correctif appartient au moteur, pas à une liste de dispenses versionnée à
côté de lui. » C'était juste **pour le cas visé**, et ce cas a bien été corrigé en amont.

**13.3 et 13.4 sont l'autre cas.** Le sujet existe — le classeur `referents-egapro-dreets.xlsx`
en téléchargement — et leurs tests exigent de l'**ouvrir** : structure interne et en-têtes de
colonnes pour 13.3, parité d'information avec `/referents` pour 13.4. Aucun tier du dispositif ne
le peut : le moteur ne voit que l'URL, le balayage ne capture que la page qui la porte, et
l'adjudicateur n'a ni shell ni lecteur xlsx. **Ce n'est pas un critère sans évidence, c'est un
critère sans instrument** — et aucun correctif moteur ne l'atteindra tant que personne n'ouvrira
le fichier. C'est l'adjudicateur lui-même qui l'a établi, en les rendant `manual / undecidable`
avec sa justification, sur le run 32782282651.

Ce que la liste n'est pas : une tolérance. Un pourcentage passe ce qu'il faut pour rester vert et
cache exactement les critères que personne n'a pu décider. Ici chaque entrée porte sa **raison**,
la porte refuse une entrée sans raison **et** une entrée dont le critère a depuis été tranché — une
dispense ne survit pas à ce qu'elle excusait — et chacune est imprimée dans le log du job. C'est un
renvoi nommé vers l'auditeur humain.

Fichier : `packages/app/.ultra11y/undecidable.json`, versionné (exception dans `.gitignore`),
passé au bot par `--var undecidable_path=.ultra11y/undecidable.json` dans `a11y.yaml`. **Deux entrées : 13.3 et 13.4**, le critère sans
instrument décrit ci-dessus — il faut ouvrir le `.xlsx`, et personne ici ne le peut.

### 12.5, et la démonstration que la liste se nettoie toute seule

12.5 y a figuré, une journée. Ça vaut d'être raconté, parce que c'est la preuve que cette liste
n'est pas une tolérance.

Le critère demande si le moteur de recherche est atteignable de manière identique sur un ensemble
de pages. Le glossaire RGAA définit le *moteur de recherche interne* comme donnant accès à une
recherche sur **l'ensemble des contenus du site**, et exclut « tout autre moteur de recherche
permettant par exemple de faire des recherches sur une partie restreinte du site ». egapro n'en a
aucun : header, nav et pied de page ne portent aucune fonctionnalité de recherche sur les 37 pages
capturées. Les deux seuls champs du périmètre sont des outils métier confinés à leur page — la
recherche d'entreprise de l'accueil (`action="/index-egapro/recherche"`, qui interroge l'index des
déclarantes) et la recherche de référent de `/referents`. **Le verdict est `NA`.**

Il a d'abord été refusé trois passes de suite, et la porte avait raison. L'adjudicateur citait le
**formulaire de recherche** — l'élément même qu'il argumentait être hors sujet — alors que les
ancres moissonnées pour 12.5 sont `header.fr-header`, `footer#footer.fr-footer`, `nav.fr-breadcrumb`
et `nav.fr-container`. Une citation qui tombe sur une ancre moissonnée est acceptée sans
re-vérifier la transcription ; une citation **hors moisson** garde la vérification stricte du
snippet, délibérément — c'est là qu'une localisation inventée se cacherait. Le snippet retapé y a
échoué.

**La leçon générale, et elle dépasse 12.5 :** un critère dont le sujet est une *absence* pousse le
modèle à citer ce qui n'est PAS le sujet, et cet élément-là n'est par définition pas dans la
moisson. La bonne citation était le `header` ou le `nav` — « voici la zone de navigation, identique
sur les 37 pages, elle ne porte aucune recherche ».

Une fois le registre commité, l'adjudicateur n'a plus eu que le reliquat à traiter, et il a rendu
ce `NA` en citant cette fois `Header/index.tsx` et `Footer/index.tsx`. **Et le job a rougi
là-dessus** — `Critère 12.5 déclaré indécidable, mais il porte désormais un verdict — retirez-le de
la liste`. C'est le comportement recherché : une dispense ne survit pas à ce qu'elle excusait, et
la porte l'exige elle-même plutôt que d'attendre qu'on y pense.

En amont, `SocialGouv/ultra11y#36` traite la cause, et c'est livré en **5.34.1** : le refus nomme
désormais la moisson du critère au lieu de ne montrer que le symptôme, et `ABSENCE_RULE` dit de
citer la région inspectée.

## Historique — l'Action ultra11y (jusqu'à 5.58.1)

> Les sections qui suivent, jusqu'à « En local », décrivent le réglage de l'Action retirée :
> ses inputs (`adjudicate-*`, `require-decided`, `require-rendered`, `gate-adjudicated`…)
> n'existent plus. Elles restent pour les mesures et les raisons qu'elles portent. Le bot
> iterion a ses propres réglages : variables `--var` et cadrans `ITERION_RGAA_MODEL_*`,
> `ITERION_RGAA_EFFORT_*` (voir sa doc).

### `require-decided`, et pourquoi la barre est redescendue à `false`

La barre a longtemps été : zéro critère « à évaluer », sur le run **et** sur chaque page
(`require-decided: pages`). Elle a été atteinte une fois, sous ultra11y 5.34.2, quand le moteur
et la mesure tranchaient 58 critères gratuitement.

Elle ne l'est plus, et pas par régression. Depuis 5.36, **trois** critères sur 106 peuvent
obtenir un `C` par mesure (8.3, 8.5, 10.1) ; tout le reste passe par le modèle. Et le modèle
refuse certains critères — correctement. Mesuré sur le run 33416093626, une fois tout le reste
réparé : **102 critères sur 106 tranchés**, et quatre rendus `manual / undecidable` sur trois
passes.

| | ce qu'il faut juger | volume transmis |
|---|---|---|
| 3.1 | l'information donnée par la couleur seule | 137 classes / 947 occurrences |
| 8.2 | la validité du code source | 67 / 1718 |
| 10.3 | le contenu compréhensible sans CSS (ordre de lecture) | 560 / 2700 |
| 11.9 | la pertinence de chaque intitulé de bouton en contexte | 141 / 454 |

Ce ne sont pas des critères que le volume écrase — 8.9 a été tranché avec 516 classes et 1180
occurrences. Ce sont des critères où il faut **regarder**. Un modèle qui les déclarerait
conformes mentirait ; il dit qu'il ne sait pas.

**Un job rouge sur ce motif n'apprend rien.** Il ne dit pas « le code a régressé », il dit
« quatre critères RGAA demandent un œil humain » — vrai avant le run, vrai après. Un rouge
permanent qu'on apprend à ignorer use la seule couleur dont on dispose pour signaler une vraie
panne, et ce fichier en a de vraies à signaler.

Ce qui ne change pas : **le résidu reste nommé**. Le log imprime toujours
`✗ N/106 critère(s) encore « à évaluer » : …`, la fiche par page le porte, le livrable aussi. On
mesure et on publie ; on n'arrête plus la chaîne dessus. C'est `fail-on: ""` appliqué au même
sujet.

Ce qui rougit encore : une panne, un balayage amputé (`require-sample`), un rendu réclamé mais
absent (`require-rendered`) — des faits sur la qualité du run, jamais sur le verdict.

### La ligne de provenance, et pourquoi c'est elle qu'on lit

Depuis 5.33.0, `check --require-decided` ne dit plus seulement *combien* de critères portent un
verdict : il dit **qui l'a rendu**.

```
106 criteria — N engine, M measured (scan), P agent, Q declared undecidable, R with no verdict
```

C'est l'instrument qui répond à « est-ce que tous les critères sont traités ? », et il répond
autrement qu'un comptage à la main. Compter les entrées du registre contre la worklist répond à la
mauvaise question : un critère que le MOTEUR a tranché n'apparaît dans ni l'un ni l'autre, si bien
qu'un run où le moteur en décide 55 se lisait « 51 audités » alors que 106 l'étaient.

`R with no verdict` est le seul nombre qui doit valoir zéro. Les autres sont à surveiller entre deux
runs pour une raison d'argent : **chaque critère qui passe de `agent` à `engine` ou `scan` est un
critère que plus personne ne paie à un modèle.**

Ce qui rendait ce compte non démontrable avant 5.33.0 : `derivePackResults` et le prédicat
`outOfCore` de `coverage.ts` divergeaient — un critère dont tout le mapping WCAG sort du cœur 2.2 AA
reste décidable quand une règle DÉCLARATIVE du pack s'y applique, et seul le premier le savait. RGAA
8.1 est le cas d'école : le plan le classait hors périmètre pendant que la projection le tranchait
depuis `pack:rgaa:doctype-missing`.

### Le référentiel porté jusqu'au bout, et pas seulement à la fin

Jusqu'à 5.32.0, `audit` et `scan --merge` réécrivaient tous deux `audits/audit-latest.json` **sans
`--standard`**. Le document publié dans l'artefact était donc estampillé `wcag` pendant que tout ce
qui se rendait à côté — SARIF, annotations, rapport, fiches par page — parlait RGAA, et la porte de
sévérité comptait les constats du cœur au lieu de ceux du référentiel, qui sous un pack porte aussi
ses propres règles déclaratives. Deux nombres pour un seul run.

Vérifiable en une commande sur l'artefact d'un run :

```bash
jq '.standard' audits/audit-latest.json    # doit dire "rgaa", jamais "wcag"
```

### Ce que coûte l'adjudication

Le chiffre historique — **9,59 $** sur le run du 24/08/2026, 3 passes — a été mesuré quand la
worklist faisait ~27 critères. Depuis 5.36 elle en fait ~84 (voir « Pourquoi un cron
hebdomadaire, et pas un run à chaque merge »), donc ce chiffre n'est plus la référence : **un run à froid coûte plusieurs fois cela.**

**`adjudicate-budget-usd` borne CHAQUE INVOCATION du CLI** — pas une passe, pas le run. Ce
document a longtemps affirmé le contraire (« 0,70 $ borne une passe complète à 9,80 $ ») et
c'était faux dans les deux sens :

- le plafond était **sous le coût d'un lot** : mesuré, un lot de huit coûte 0,88 à 2,00 $ en
  Opus / effort `high` ;
- le pire cas n'était pas 9,80 $ mais `lots × passes × plafond`, un retry de transport repartant
  avec un plafond neuf.

Et un plafond trop bas ne produit pas une économie, il produit une **perte sèche** : le CLI
abandonne le lot ENTIER sur `error_max_budget_usd`, après l'avoir payé. Mesuré sur le run
33389189227 : **30 invocations, 38,90 $ dépensés, 12 verdicts gardés**, 69 critères sur 106
laissés « à évaluer », job rouge sur `require-decided`.

D'où la configuration actuelle : **`adjudicate-budget-usd: ""`** (aucun plafond par lot) et
**`adjudicate-model: claude-sonnet-5`**. Ce qui borne la dépense est le mur horaire du CLI (10
min par invocation), le `timeout-minutes` du job, les trois passes qui ne reçoivent que le
reliquat, et le registre rejoué avant tout appel. Sonnet 5 est le seul modèle qui ait fermé la
grille de ce dépôt (run 33383329004, `0 sans verdict`) ; Opus n'y est jamais parvenu.

**Le registre est devenu la pièce maîtresse**, et il n'amortit qu'à moitié.
`packages/app/.ultra11y/verdicts/rgaa.json` (48 verdicts) est rejoué avant le moindre appel, mais
au dernier run **27 entrées sur 48 étaient périmées** (« l'évidence a changé ») : l'empreinte
bouge d'un balayage à l'autre. Rien dans la CI ne commite ce fichier — c'est un geste humain,
délibéré. Après un run vert : récupérer `verdicts-rgaa.json` dans l'artefact `ultra11y-rgaa`,
relire le diff, commiter.

**L'effort est le second levier, et il n'est pas le modèle.** `adjudicate-effort: high` (5.34.0).
Ce qui arrive à ce tier est ce qu'aucun moteur n'a pu décider, donc la difficulté n'est pas de
choisir entre deux réponses — c'est de LIRE l'évidence sans se tromper. Mesuré sur le run
32782282651 (5.33.1, effort par défaut) : la porte a refusé **13 verdicts à la première passe, 12
à la deuxième, 2 à la troisième**, et aucun refus n'était un désaccord de fond. C'étaient des
citations fabriquées, des snippets retapés au lieu d'être copiés, et des chemins préfixés
`packages/app/` alors que le `working-directory` **est** `packages/app`. Trois critères en sont
morts et le job est sorti rouge à 103/106. Monter le modèle ne répare pas ça ; monter le soin de
lecture, si.

### Le runner CLI, retenu depuis 5.40.0

Le runner `cli` est désormais le chemin de production. L'Action traduit son grain public
`worklist` en lots moteur de huit critères, lance Claude en lecture seule, checkpoint chaque lot
et reprend seulement le reliquat aux passes suivantes. Les problèmes qui avaient motivé son rejet
dans ce dépôt sont corrigés : le grain par défaut est valide, l'indisponibilité fournisseur coupe
les retries extérieurs et une passe entièrement inopérante fait échouer la porte finale au lieu de
laisser une grille vide paraître exploitable.

Depuis **5.40.2**, un lot que le plafond fait abandonner est **coupé en deux et remis en file**,
chaque moitié repartant avec son propre plafond — une perte de huit critères devient au pire une
perte d'un. Ce dépôt ne pose plus de plafond du tout (voir « Ce que coûte l'adjudication ») ;
ce découpage est le filet, pas la ceinture.

### Ce que 5.42 corrige, et ce que ça coûte

**5.42.0 / 5.42.1 ferment une classe de défaut, pas un bug.** Un faux positif est bruyant et se
discute en revue ; un **faux conforme est invisible**, et c'est lui qu'une déclaration
d'accessibilité recopie. Trois chemins en produisaient :

- `focusObscured` (2.4.11) et `keyboardTrap` (2.1.2) étaient mesurés par les sondes, écrits dans
  `probes.json` — et ni le format d'instantané ni le repli des constats ne connaissaient ces
  clés, pendant que `probed` créditait les critères. Une obstruction de focus ou un piège
  clavier RÉELS ressortaient `C` de la réingestion hors ligne. **C'est exactement le chemin
  d'egapro**, qui capture ses 37 pages hors de l'Action ;
- les parcours de l'anneau de tabulation, de survol et d'interaction rendaient un résultat
  PARTIEL dans la forme d'un résultat fini — plafond de marquage, budget d'horloge, plafonds
  d'enregistrement — et `probed` était écrit quand même ;
- `probes.json` porte maintenant un numéro de contrat (`v: 2`). Un fichier écrit avant n'est
  plus cru pour les cinq critères dont la prétention dépend d'une marche achevée. **Nos captures
  actuelles sont donc pré-v2** : le premier run en 5.42.1 les réécrit, et c'est voulu.

Ce que ça coûte : RGAA 10.1 quitte l'allowlist `completeBySilence` (sa règle tolère `<u>`,
tolère `width`/`height` sur neuf balises là où le glossaire en nomme cinq, et couvre la
présentation par espaces avec deux heuristiques — chacune une sous-détection assumée, bonne
direction pour un constat, mauvaise pour une conformité). On passe de 103 à **104 critères sur
106 exigeant une adjudication**. Et les critères dont la marche est tronquée restent ouverts au
lieu de se fermer à tort, ce qui peut faire monter la facture d'adjudication.

En face, le **registre de verdicts amortit enfin** : un `C` survit à une évidence qui a RÉTRÉCI
(blanchir un ensemble couvre ses parties) et ne périme que sur une évidence NOUVELLE, à deux
gardes près — une moisson incomplète et un rétrécissement qu'aucune suppression n'explique.
Mesuré en rejouant notre registre de 48 entrées contre le run du 31/08 : 27 périmées, dont 13
pour un simple rétrécissement.

**Le rapport, enfin, ne se contredit plus.** Il mène avec le taux officiel du RGAA — critères
validés ÷ critères **applicables**, les NA exclus des deux moitiés — annoncé provisoire tant
qu'un critère est ouvert, formule nommée et opérandes publiés. Sur le run 33416093626 :
**80 % (59 ÷ 74)** au lieu de « 17 % » en tête d'une grille lisant 91 C / 10 NC. Et les trois
bandeaux d'en-tête regardent enfin ce que le run a fait : plus d'« audit préliminaire » sur un
run qui a audité 37 pages rendues, plus d'« auditez la sortie de build » quand elle l'a été,
plus d'« audit partiel » au-dessus d'une grille qui tranche le critère qu'il nomme.

### RGAA 10.7 et les contrôles DSFR — ce que 5.41.0 corrige

La sonde `dyn-focus-visible` proxifiait bien un radio/checkbox visuellement masqué vers son
label — c'est la forme DSFR, et c'était le bon réflexe. Mais elle lisait ensuite le style
**propre** du label, c'est-à-dire la seule boîte qu'un design system ne peint pas : DSFR dessine
la case, la coche et l'anneau de focus dans `label::before`.

Mesuré sur le run 33389189227 : **12 constats 10.7**, tous des `<label class="fr-label">`, tous
faux — 9 sur les cases « années » de `admin-stats`, 2 sur les radios de l'avis du CSE, 1 sur le
choix de parcours de conformité.

Et le dégât dépassait le bruit. **10.7 n'est pas sur l'allowlist `completeBySilence`**, donc un
NC fabriqué sur 3 pages laissait le critère « à évaluer » sur les **34 autres** — hors d'atteinte
de toute adjudication, puisqu'un critère déjà tranché pour le run n'entre jamais dans la
worklist. C'était, à lui seul, ce qui rendait la barre par page inatteignable — même après ce correctif, quatre critères de jugement restent hors de portée d'un modèle, d'où `require-decided: false`.

La règle générale, qui vaut au-delà de ce cas : **un critère jugé NC quelque part et absent de
l'allowlist reste « à évaluer » sur chaque page où le défaut ne tire pas.** Un `C` d'agent, lui,
ferme les 37 pages — mesuré, 31 verdicts sur 31.

### En local, la même chose sans CI

Depuis `packages/app` :

```bash
pnpm exec ultra11y audit src --jsx --graph --standard rgaa --out audits
pnpm exec ultra11y verify --manual --in audits/audit-latest.json --out audits --standard rgaa
# … trancher chaque critère (le skill `ultra11y` le pilote) …
pnpm exec ultra11y verify --apply audits/ADJUDICATE.todo.json --in audits/audit-latest.json \
  --out audits --standard rgaa
```

`verify --manual` écrit aussi un fichier **verdicts seuls** (~37 Ko) et une fiche par critère, en
plus de l'`ADJUDICATE.todo.json` complet (536 Ko sous RGAA — 96 critères, 1590 ancres). `verify
--apply` accepte les trois et **ré-dérive l'évidence depuis l'audit** : la porte est identique
quelle que soit la forme donnée en entrée.

## La dépendance qu'aucun `import` ne cite

`packages/app/package.json` porte **`ultra11y`** en devDependency alors qu'aucun `import` du dépôt
ne la nomme. Elle est chargée : c'est le binaire (`pnpm exec ultra11y`) et le plugin Playwright
(`ultra11y/playwright`, utilisé par `src/e2e/a11y/`). Ne pas la croire morte.

**`@axe-core/playwright` a été retirée** (commit `b123b1ce6`, « prendre axe depuis ultra11y ») et
ce n'est pas une régression : depuis 5.13.0 la suite embarque axe via ultra11y. Ne pas la remettre — deux
copies de Playwright dans un même process se rendent des `Page` que les fixtures de l'autre ne
reconnaissent pas.

Ce qui décide encore le tier local (contraste calculé, focus visible, zoom, reflow, régions live)
se vérifie en une commande, depuis `packages/app` :

```bash
pnpm exec ultra11y status --browser        # « navigateur disponible »
pnpm exec ultra11y scan <une-page.html> --json | head -3
# doit afficher  "engine": "axe-core@playwright (local)"  — pas "(docker)"
```

## Bump de version

Deux versions, deux surfaces, et elles ne bougent pas ensemble :

| Version | Où | Ce qu'elle porte |
|---|---|---|
| devDependency `ultra11y` (**9.6.5**) | `packages/app/package.json` | pre-commit, `pnpm verify`, `a11y-gate`, la revue de PR `a11y-review.yaml` (les deux passages), le plugin Playwright qui écrit les instantanés **et** le moteur d'`a11y-pages` qui les relit — un seul format par construction ; les skills, le hook et le plugin des agents |
| `ITERION_VERSION` (**v7.38.1**) | `a11y.yaml`, job `rgaa-audit` | la release d'iterion et le bot, installé depuis le même tag, avec son pin du moteur |

```bash
# devDependency — version EXACTE, pas de ^
pnpm --filter app add -D ultra11y@<version>
# bot : la version du moteur qu'une release d'iterion épingle
gh api "repos/SocialGouv/iterion/contents/bots/rgaa-audit/ultra11y.pin?ref=<tag>" --jq .content | base64 -d
```

Dependabot ne voit ni l'une ni l'autre. Viser un `ITERION_VERSION` dont le pin du moteur est égal
à la devDependency : le registre de verdicts est écrit et rejoué par les deux.

**À faire.** La dernière release d'iterion (**v7.38.1**) épingle encore le moteur **7.2.0** ;
SocialGouv/iterion#3708 le passe en **9.6.5**. Monter `ITERION_VERSION` à la première release
qui l'inclut. D'ici là, le bot rejoue un registre écrit en 9.6.5 avec un moteur 7.2.0 : les
entrées dont l'évidence diffère sont abandonnées comme périmées, donc ré-adjugées et repayées.

**La montée 5.58.1 → 9.6.5 (#4899).** Ce qui a disparu en route, et ce qui le remplace :

- `mcp` et `dev` (7.0.0) : le MCP `ultra11y` est retiré de `.mcp.json` (et donc d'`opencode.json`
  et `.codex/config.toml`, générés par `scripts/ai/sync-agent-config.mjs`), le script
  `pnpm a11y:dev` aussi. Les critères RGAA se lisent dans le skill `ultra11y` et ses références ;
- `audit --lite`, `--format sarif|github`, l'Action (6.0.0, 7.0.0) : la revue de PR est
  `review-a11y` (ci-dessus) ;
- `--standard wcag`, `pack`, `--pack` (9.0.0) : egapro n'utilisait que `--standard rgaa` ;
- les exports `ultra11y/vitest` et `ultra11y/jest` (8.0.0) : egapro n'utilise que
  `ultra11y/playwright`, toujours là.

Le premier rejeu du registre en 9.6.5 abandonne une partie des entrées comme périmées
(l'évidence d'un critère a changé de forme entre les versions) : le run hebdomadaire suivant les
ré-adjuge, et le registre qu'il écrit est à commiter après relecture.

L'ancien contrôle de cohérence (`scripts/a11y/check-ultra11y-version.sh`, job
`a11y-version-coherence` de `ci.yaml`) tenait les `uses:` de l'Action égaux à la devDependency ;
sans Action, il n'avait plus rien à comparer et a été retiré avec elle.

Les **outils IA** n'ont plus de copie à eux : les skills `review-a11y` et `ultra11y` sont des
symlinks de `.agents/skills/` vers la devDependency (lus par Claude Code, OpenCode et Codex), le
gate commit / push / PR de Claude Code est un hook de `.claude/settings.json` qui lance le
`pre-tool-use.mjs` de la devDependency, et le plugin OpenCode (`opencode.json`) se charge depuis
elle. La version des agents est donc celle de la devDependency, tenue par la CI. C'est la raison
de l'abandon du plugin marketplace Claude Code, que rien ne pouvait épingler : le 31/08/2026, il
était en **4.5.1** pendant que le dépôt tournait en 5.40.1. Seul Codex garde une copie en portée
utilisateur (`ultra11y install --codex`, à relancer après un bump) — le gating, lui, n'en dépend
pas : pre-commit, `pnpm verify` et la CI tournent sur la devDependency.

À noter si un bump échoue : la publication npm de la 5.3.0 est
tombée sur la signature de provenance (`CA_CREATE_SIGNING_CERTIFICATE_ERROR`, 403 du CA) alors
que l'échange OIDC avait réussi, et semantic-release ne republie pas un tag existant — le tag
`v5.3.0` existe donc sans version npm correspondante. C'était transitoire : le commit suivant
a publié normalement. Si ça se reproduit, le contournement est un nouveau commit releasable,
pas une republication.
