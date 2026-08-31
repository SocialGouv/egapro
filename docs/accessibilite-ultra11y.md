# Accessibilité — le dispositif ultra11y en détail

> Complément de `.claude/rules/rgaa.md`, qui porte la règle courte toujours chargée en session.
> Ici : comment la chaîne CI est câblée, ce qu'elle coûte, les décisions déjà prises et
> pourquoi — pour ne pas les reprendre à zéro. Rien de ce document n'est une règle à appliquer :
> c'est de la mémoire d'exploitation.

---

### 2. L'analyse, par la GitHub Action

`.github/workflows/a11y.yaml`, trois jobs portés par la même Action Ultra11y, épinglée à un
commit immuable :

| Job | Quand | Ce qu'il fait |
|---|---|---|
| `a11y-gate` | **chaque PR** (bloquant) | Audit statique JSX/TSX de tout `src`. Gratuit, quelques secondes, aucun navigateur et aucun modèle. **C'est la seule gate du dispositif qui arrête un merge sur un constat** (`fail-on: blocking`) : SARIF, annotations, commentaire sticky `digest` et rapport `ultra11y-pr-static`. |
| `a11y-pages` | **cron hebdo (lundi 04:00 UTC) + manuel** | La suite Playwright `src/e2e/a11y/` enregistre **39 pages** en épinglant l'état applicatif que chaque écran de tunnel exige — dont **37 sont effectivement capturées**, les 2 restantes étant gardées par un `test.skip` faute de données ; **24** seulement sont déclarées dans `.ultra11yrc.json`, et c'est ce sous-ensemble que `require-sample` tient. L'Action réaudite tout `src`, réingère les instantanés, rejoue le registre puis soumet seulement le reliquat à Claude CLI par lots de huit (`opus`, effort `high`). Produit LE rapport page par page. Les constats ne bloquent pas — on mesure. Une panne, une grille incomplète (`require-decided: pages`), un rendu requis mais absent (`require-rendered`) ou un balayage amputé (`require-sample`) bloquent. |
| `a11y-bundle` | cron + manuel | Fusionne les parties en un seul artefact `ultra11y-rgaa`. |

**Deux déclenchements, et ils ne paient pas la même chose.** `pull_request` ne lance que la gate
statique — gratuite, sans modèle, bloquante. `schedule` (hebdo) et `workflow_dispatch` lancent la
chaîne complète : balayage navigateur, critères de rendu, rejeu du registre puis adjudication IA
du reliquat, livrable.

**Pourquoi un cron et non `push: alpha`**, alors que le runner CLI sait désormais traiter un
`push`. Le run complet construit la stack, parcourt les pages et paie le reliquat au modèle ; le
lancer à chaque merge multiplierait le coût sans améliorer le feedback immédiat, déjà fourni par
la gate statique. La branche par défaut étant `alpha`, le `schedule` lit et exécute son workflow :
le même périmètre exhaustif, une fois par semaine, plus le `workflow_dispatch` à la demande.

Ce que ça ne donne pas, et il faut le savoir : **une régression RGAA de rendu peut vivre jusqu'au
prochain tick.** Ce qui la rattrape sur une PR est l'audit statique, qui ne voit pas la page
rendue. C'est l'arbitrage, et c'est celui du coût.

`gate-adjudicated` reste à `false` : la gate ré-audite la **source**, donc le rouge/vert reste une fonction pure du commit, quoi qu'un modèle ait dit.

### Le registre de verdicts, et pourquoi il est revenu

`packages/app/.ultra11y/verdicts/rgaa.json` est **versionné** (exception explicite dans
`packages/app/.gitignore`). Il enregistre les verdicts que la porte a ACCEPTÉS, et un run
ultérieur les **rejoue avant d'appeler le moindre modèle**.

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
câblé par `undecidable-file` dans `a11y.yaml`. **Deux entrées : 13.3 et 13.4**, le critère sans
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

En amont, `maxgfr/ultra11y#36` traite la cause, et c'est livré en **5.34.1** : le refus nomme
désormais la moisson du critère au lieu de ne montrer que le symptôme, et `ABSENCE_RULE` dit de
citer la région inspectée.

### `require-decided: pages`, et pourquoi la barre a pu remonter

`pages` tient CHAQUE grille de page à la barre, pas seulement celle du run. La distinction compte :
un critère non conforme quelque part est tranché POUR LE RUN, et sur les pages où le défaut
n'apparaît pas il peut n'être le verdict de personne — mesuré ici, 104/106 décidés pour le run et
8 à 11 ouverts sur chacune des 37 pages, soit une porte verte au-dessus d'un livrable rempli à 90 %.

Elle avait dû être abandonnée, non par excès d'ambition mais parce qu'elle était **cassée** : sur
5.16.0 une conformité obtenue faute de sujet perdait son drapeau en fusionnant les instantanés, et
`--require-decided=pages` ne pouvait passer sur aucune entrée. Corrigé en 5.17.0, puis 5.20.0 (le
balayage mesurait puis jetait la mesure). Mesuré en amont sur la fixture RGAA balayée : 37 critères
« à évaluer » pour le run, et exactement les mêmes 37 sur chacune des pages — `pages` n'est donc
plus une barre plus haute que `true`, c'est la même, vérifiée là où on la lit.

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

Sans registre à rejouer, l'ancien runner Sonnet a coûté **9,59 $**, mesuré sur le run du
24/08/2026 (3 passes — 5,91 + 2,43 + 1,25). Le registre **est** commité depuis
(`packages/app/.ultra11y/verdicts/rgaa.json`, 47 verdicts) : les runs suivants rejouent ce qui
tient et ne paient que le reliquat. Le runner actuel utilise Opus high.
`adjudicate-budget-usd` borne **chaque lot CLI**, et non une passe entière : avec des lots de
huit, les 106 critères RGAA représentent au plus 14 appels. La valeur `0.70` borne donc une passe
complète à **9,80 $** hors rares retries de transport, et trois passes à **29,40 $** dans le pire
cas nominal. Chaque passe suivante ne reçoit que le reliquat ; une grille complète arrête les
passes restantes.

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

Le coût de chaque lot est borné par `adjudicate-budget-usd: "0.70"`, avec au plus 14 lots par
passe et trois passes. Le tier et l'effort sont configurés sur `opus` et `high` ; `opus` est
l'alias du Claude CLI, donc le tier reste Opus mais sa version précise peut évoluer avec le CLI.

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
ce n'est pas une régression : depuis 5.13.0 la suite embarque axe via ultra11y, et depuis 5.21.0
l'Action fournit elle-même le tier navigateur dont un `scan` a besoin. Ne pas la remettre — deux
copies de Playwright dans un même process se rendent des `Page` que les fixtures de l'autre ne
reconnaissent pas.

Ce qui décide encore le tier local (contraste calculé, focus visible, zoom, reflow, régions live)
se vérifie en une commande, depuis `packages/app` :

```bash
pnpm exec ultra11y scan <une-page.html> --runtime local --json | head -3
# doit afficher  "engine": "axe-core@playwright (local)"  — pas "(docker)"
```

## Bump de version

Trois surfaces à bouger ensemble — deux dans le dépôt, une hors dépôt :

```bash
pnpm --filter app add -D ultra11y@<version>   # version EXACTE, pas de ^
# puis aligner les DEUX `maxgfr/ultra11y@<tag-ou-sha>` de .github/workflows/a11y.yaml
claude plugin update ultra11y@ultra11y        # hors dépôt, à lancer à la main
```

La devDependency est sur **5.40.0**. L'Action est temporairement épinglée au commit
`76a48723330461b2ee358858d759ae182f0a1381`, qui ajoute les correctifs de complétude des worklists
et de performance trouvés pendant la validation réelle ; remplacer ce SHA par le prochain tag de
release avant merge. Le **plugin Claude Code** est une troisième surface, hors dépôt : il se met à
jour à la main et peut donc rester très en retard sans que rien ne le signale — vérifier son cache
si le skill `review-a11y` se comporte autrement que la CI.

À noter si un bump échoue : la publication npm de la 5.3.0 est
tombée sur la signature de provenance (`CA_CREATE_SIGNING_CERTIFICATE_ERROR`, 403 du CA) alors
que l'échange OIDC avait réussi, et semantic-release ne republie pas un tag existant — le tag
`v5.3.0` existe donc sans version npm correspondante. C'était transitoire : le commit suivant
a publié normalement. Si ça se reproduit, le contournement est un nouveau commit releasable,
pas une republication.
