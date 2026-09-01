# Accessibilité — le dispositif ultra11y en détail

> Complément de `.claude/rules/rgaa.md`, qui porte la règle courte toujours chargée en session.
> Ici : comment la chaîne CI est câblée, ce qu'elle coûte, les décisions déjà prises et
> pourquoi — pour ne pas les reprendre à zéro. Rien de ce document n'est une règle à appliquer :
> c'est de la mémoire d'exploitation.

---

### 2. L'analyse, par la GitHub Action

`.github/workflows/a11y.yaml`, trois jobs portés par la même Action Ultra11y, épinglée à un
tag de version explicite :

| Job | Quand | Ce qu'il fait |
|---|---|---|
| `a11y-gate` | **chaque PR** (bloquant) | Audit statique JSX/TSX de tout `src`. Gratuit, quelques secondes, aucun navigateur et aucun modèle. **C'est la seule gate du dispositif qui arrête un merge sur un constat** (`fail-on: blocking`) : SARIF, annotations, commentaire sticky `digest` et rapport `ultra11y-pr-static`. |
| `a11y-pages` | **manuel uniquement** (`workflow_dispatch`) | La suite Playwright `src/e2e/a11y/` enregistre **39 pages** en épinglant l'état applicatif que chaque écran de tunnel exige — dont **37 sont effectivement capturées**, les 2 restantes étant gardées par un `test.skip` faute de données ; **24** seulement sont déclarées dans `.ultra11yrc.json`, et c'est ce sous-ensemble que `require-sample` tient. L'Action réaudite tout `src`, réingère les instantanés, rejoue le registre puis soumet seulement le reliquat à Claude CLI par lots de huit (`claude-sonnet-5`, effort `high`, sans plafond par lot). Produit LE rapport page par page. Les constats ne bloquent pas — on mesure —, et un critère « à évaluer » non plus (`require-decided: false`). Bloquent : une panne, un rendu requis mais absent (`require-rendered`), un balayage amputé (`require-sample`). |
| `a11y-bundle` | manuel | Fusionne les parties en un seul artefact `ultra11y-rgaa`. |

**Deux déclenchements, et ils ne paient pas la même chose.** `pull_request` ne lance que la gate
statique — gratuite, sans modèle, bloquante. `workflow_dispatch` lance la chaîne complète :
balayage navigateur, critères de rendu, rejeu du registre puis adjudication IA du reliquat,
livrable.

### Pourquoi il n'y a plus de cron

Il y en a eu un — lundi 04:00 UTC — et on avait pris soin de le choisir plutôt qu'un
`push: alpha` que `claude-code-action` aurait refusé. Il est retiré, et la raison est le prix.

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
84 critères n'est plus une dépense de fond qu'on laisse tourner toutes les semaines — il est
lancé quand on en veut le résultat : `gh workflow run a11y.yaml --ref alpha`.

**Ce que ça coûte, dit franchement :** une régression RGAA de rendu ne sera rattrapée par
personne tant que personne ne lance ce workflow. La gate statique reste bloquante sur chaque PR,
mais elle ne voit pas la page rendue.

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

### `require-decided`, et pourquoi la barre est redescendue à `false`

La barre a longtemps été : zéro critère « à évaluer », sur le run **et** sur chaque page
(`require-decided: pages`). Elle a été atteinte une fois, sous ultra11y 5.34.2, quand le moteur
et la mesure tranchaient 58 critères gratuitement.

Elle ne l'est plus, et pas par régression. Depuis 5.36, **trois** critères sur 106 peuvent
obtenir un `C` par mesure (8.3, 8.5, 10.1) ; tout le reste passe par le modèle. Et le modèle
refuse certains critères — correctement. Mesuré sur le run 33416093626, une fois tout le reste
réparé : **102 critères sur 106 tranchés**, et quatre rendus `manual / undecidable` sur trois
passes.

| | ce qu'il faut juger | volume soumis |
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
worklist faisait ~27 critères. Depuis 5.36 elle en fait ~84 (voir « Pourquoi il n'y a plus de
cron »), donc ce chiffre n'est plus la référence : **un run à froid coûte plusieurs fois cela.**

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
# puis aligner les DEUX `maxgfr/ultra11y@v<version>` de .github/workflows/a11y.yaml
./scripts/a11y/check-ultra11y-version.sh      # le job CI qui refuse une demi-montée
```

La devDependency et les deux usages de l'Action sont alignés sur **5.42.1**, et ce n'est plus une
consigne : `scripts/a11y/check-ultra11y-version.sh` tourne dans `ci.yaml` sur chaque push et
refuse un désalignement. Ce n'est pas de l'hygiène — la suite Playwright ÉCRIT les instantanés
avec la devDependency et l'Action les RÉINGÈRE avec son moteur embarqué ; deux versions, deux
formats, et rien ne lève d'erreur.

Le **plugin Claude Code** est la quatrième surface, hors dépôt, et la seule que rien ici ne peut
pinner. Le hook `check-ultra11y-plugin.sh` compare hors ligne la version installée au tag
d'`a11y.yaml` au premier prompt de chaque session, et ne touche au réseau qu'en cas d'écart. Il a
été écrit pour une raison mesurée : le 31/08/2026, le plugin était en **4.5.1** pendant que le
dépôt tournait en 5.40.1.

À noter si un bump échoue : la publication npm de la 5.3.0 est
tombée sur la signature de provenance (`CA_CREATE_SIGNING_CERTIFICATE_ERROR`, 403 du CA) alors
que l'échange OIDC avait réussi, et semantic-release ne republie pas un tag existant — le tag
`v5.3.0` existe donc sans version npm correspondante. C'était transitoire : le commit suivant
a publié normalement. Si ça se reproduit, le contournement est un nouveau commit releasable,
pas une republication.
