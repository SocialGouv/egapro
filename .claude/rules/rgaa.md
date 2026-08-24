# Accessibilité — RGAA 4.1.2 / WCAG 2.2 AA

> **Used by**: `rgaa-auditor`, `code-dev`, `review-fixer`, et toute session qui touche du `.tsx`.

egapro est une plateforme de l'État : le niveau visé est **RGAA 4.1.2** (13 thématiques, 106 critères), socle technique **WCAG 2.2 niveau AA**. Exigence first-class, au même titre que la sécurité — pas une amélioration optionnelle.

## Un seul dispositif : ultra11y

L'outil est **ultra11y** (`github.com/maxgfr/ultra11y`, MIT). Il n'y a **pas** de second système d'accessibilité dans ce dépôt, et c'est délibéré : deux jeux de règles sur un même sujet divergent, et celui qui n'a pas de moteur derrière lui est celui qui invente des non-conformités.

Il se décline en **deux surfaces**, et deux seulement.

### 1. La revue, par un sous-agent

L'agent **`rgaa-auditor`** lance le skill **`review-a11y`** sur le code sous changement, et rend son verdict. C'est tout ce qu'il fait — il ne recopie ni grille de critères ni liste de règles. Le skill cadre l'audit sur le diff, lance le moteur, réfute les faux positifs, tranche les critères de jugement depuis la source et nomme les critères de rendu comme risques résiduels.

Le skill vient du **plugin**, déclaré dans `.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`) : la marketplace s'enregistre dès qu'un dev fait confiance au dossier, puis une commande, une fois — `claude plugin install ultra11y@ultra11y`. Le plugin apporte aussi le skill **`ultra11y`** (audits complets, rapports de conformité) et un hook `PreToolUse` qui arrête un `git commit` / `git push` / `gh pr create` porteur de non-conformités.

Coupe-circuits du hook : `SKIP_A11Y=1` (une commande), `ULTRA11Y_HOOK=off` (une session), `"hook": { "failOn": "off" }` dans `.ultra11yrc.json` (le dépôt).

### 2. L'analyse, par la GitHub Action

`.github/workflows/a11y.yaml`, trois jobs, tous portés par `maxgfr/ultra11y@v5.x` :

| Job | Quand | Ce qu'il fait |
|---|---|---|
| `a11y-gate` | **chaque PR** (bloquant), + cron/manuel (muet) | Audit statique JSX/TSX de tout `src`. Gratuit, quelques secondes, aucun modèle. **C'est la seule gate de tout le dispositif qui arrête un merge** (`fail-on: blocking`). Sur une PR il parle : SARIF, annotations en ligne, commentaire sticky `digest` nommant les défauts distincts, et son propre rapport (`ultra11y-pr-static`). Sur le run complet il se tait — le livrable est celui d'`a11y-pages`. |
| `a11y-pages` | **cron hebdo (lundi 04:00 UTC) + manuel** | La suite Playwright `src/e2e/a11y/` enregistre **39 pages** en épinglant l'état applicatif que chaque écran de tunnel exige — dont **37 sont effectivement capturées**, les 2 restantes étant gardées par un `test.skip` faute de données ; **24** seulement sont déclarées dans `.ultra11yrc.json`, et c'est ce sous-ensemble que `require-sample` tient ; l'Action réingère les instantanés et décide les critères **au rendu** depuis eux (contraste calculé, information par la couleur, contraste des composants, visibilité du focus, verrou d'orientation), **rejoue le registre de verdicts** puis fait adjuger le reliquat par le runner CLI du moteur (`adjudicate-runner: cli`, `adjudicate-grain: criterion`, `adjudicate-model: claude-sonnet-5`, secret `CLAUDE_CODE_OAUTH_TOKEN`). Produit LE rapport page par page du livrable. Les constats ne bloquent pas — on mesure. Une panne, si ; une grille incomplète (`require-decided: pages`) ou un balayage amputé (`require-sample`) aussi. |
| `a11y-bundle` | cron + manuel | Fusionne les parties en un seul artefact `ultra11y-rgaa`. |

**Deux déclenchements, et ils ne paient pas la même chose.** `pull_request` ne lance que la gate
statique — gratuite, sans modèle, bloquante. `schedule` (hebdo) et `workflow_dispatch` lancent la
chaîne complète : balayage navigateur, critères de rendu, rejeu du registre puis adjudication IA
du reliquat, livrable.

**Pourquoi un cron et non `push: alpha`**, alors que c'est bien sur alpha qu'on veut le run
complet. `adjudicate: agent` passe par `claude-code-action`, **qui refuse l'événement `push`** —
l'Action y dégrade en avertissement et la grille repart « à évaluer » sans que rien ne rougisse.
Les événements qu'il accepte sont `pull_request`, `workflow_dispatch`, `schedule`, `workflow_run`
et `repository_dispatch`. Or **la branche par défaut de ce dépôt est `alpha`** : un `schedule` lit
le fichier depuis alpha et s'exécute sur alpha. Le cron donne donc ce qu'un `push: alpha` aurait
donné, avec le modèle en plus, et une facture bornée à un run par semaine au lieu d'un par merge.

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

`undecidable.json` ne revient pas : le workflow n'a plus d'`undecidable-file`. Une exemption est
le constat qu'un critère n'a pas reçu d'évidence — le correctif appartient au moteur, pas à une
liste de dispenses versionnée à côté de lui.

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

Sans registre à rejouer : **9,59 $**, mesuré sur le run du 24/08/2026 (3 passes — 5,91 + 2,43 +
1,25). Avec le registre commité, le premier run paie le total et les suivants ne paient que le
reliquat.

Le plafond est **en dollars et par APPEL DE MODÈLE** (`adjudicate-budget-usd: "0.40"`), pas en
tours et pas par run. Deux choses à ne pas confondre :

- `adjudicate-max-turns` est le knob du chemin `claude-code-action`. Sous `adjudicate-runner: cli`
  le CLI avale `--max-turns` sans un mot — un budget de tours y ressemblerait à un plafond et ne
  serait rien du tout. Il n'est donc plus passé.
- `--max-budget-usd` est poussé sur l'argv de **chaque `claude -p`** (`src/agent-cli.ts:170`), et
  `runCli` réessaie jusqu'à `MAX_ATTEMPTS = 4`. Au grain `criterion`, un appel = un critère : le
  pire cas est `critères × passes × tentatives × plafond`. **Le seul plafond de run reste
  `timeout-minutes`.**

Calibrage : la première passe du 24/08 a tranché 48 critères pour 5,91 $, soit ~0,12 $ par critère
en lots de huit ; un appel par critère perd le contexte partagé du lot, donc 0,40 $ ≈ 3× l'attendu.

⚠️ **`adjudicate-grain: criterion` est obligatoire dès qu'on met `adjudicate-runner: cli`** : le
défaut de l'Action est `worklist`, passé tel quel à `judge --grain`, et le moteur n'accepte que
`batch` ou `criterion` (`src/cli.ts:3560`). Le couple `cli` + défaut sort en 2 sans appeler de
modèle, et le job rougit sur `require-decided` avec toute la grille « à évaluer ».

Le modèle est **nommé explicitement** (`adjudicate-model: claude-sonnet-5`) : le tier est facturé
AU CRITÈRE, une worklist RGAA en compte plusieurs dizaines, et le défaut de `claude-code-action`
n'est pas une constante de ce dépôt — le laisser implicite ferait bouger la facture sans que rien
ne change ici. Sonnet 5, et pas plus gros : l'amont a mesuré que ce qu'un adjudicateur bon marché
ratait n'était jamais un manque de modèle mais un défaut d'outil (fiche par critère rendue sans son
contrat de verdict, critères sans instrument, critères sans sujet moissonné) — tous corrigés.

Deux garde-fous à connaître avant de lire un log :

- **Le fold est fail-closed PAR VERDICT.** Un verdict refusé coûte **son seul critère** — qui reste
  « à évaluer » en portant le motif du refus — et laisse les autres passer. Le défaut d'origine :
  95 verdicts sur 96 corrects, un seul `null`, et un fold au niveau du FICHIER jetait les 96 —
  16,16 $ pour publier « à évaluer » sur toute la grille, dans un job qui se déclarait vert.
- **Un job vert ne veut pas dire « tout a été évalué ».** Lire `applied:` / `rejected:` dans le
  log, les avertissements « périmé » et « absent du registre », ou la colonne « À évaluer ».

`gate-adjudicated` reste à `false` : la gate ré-audite la **source**, donc le rouge/vert reste une
fonction pure du commit, quoi qu'un modèle ait dit.

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

## Ce qui n'est PAS le dispositif

- **Lighthouse** mesure un score d'accessibilité et le rapporte en `warn`. Ce n'est pas une gate RGAA : sa notion d'accessibilité n'est pas celle des 106 critères, et deux seuils concurrents sur un même sujet donnent deux verdicts qu'il faut ensuite réconcilier à la main.
- **`block-bad-patterns.sh`** interdit `<img>` brut, `<svg>` inline, `style={}` et les couleurs en dur. Ce sont des règles **DSFR et Next**, qui servent aussi l'accessibilité — pas un tier d'accessibilité. Elles restent, sous ce titre-là.
- **`structural-auditor`** ne rapporte plus rien sur l'accessibilité.

## Écrire accessible

Les règles ne sont pas recopiées ici : elles vivent dans les données de standards d'ultra11y, et le skill `ultra11y` les sert par critère (`criteria --standard rgaa 8.3`, `guidance`, `glossary`). Demande-lui plutôt que de te fier à une liste de mémoire.

Le seul principe qui mérite d'être répété, parce qu'il décide de tout le reste : **HTML natif d'abord, ARIA en dernier**. Un `<button>` est accessible ; un `<div role="button">` demande d'écrire à la main le focus, le clavier et l'état, et de ne jamais se tromper. Ne double jamais une sémantique implicite (`role="navigation"` sur `<nav>` est faux, pas redondant).

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
claude plugin update ultra11y@ultra11y        # hors dépôt, à lancer à la main
```

Les deux sont sur **5.33.1**. Le **plugin Claude Code** est une troisième surface, hors dépôt : il
se met à jour à la main et peut donc rester très en retard sans que rien ne le signale — vérifier
son cache si le skill `review-a11y` se comporte autrement que la CI.

À noter si un bump échoue : la publication npm de la 5.3.0 est
tombée sur la signature de provenance (`CA_CREATE_SIGNING_CERTIFICATE_ERROR`, 403 du CA) alors
que l'échange OIDC avait réussi, et semantic-release ne republie pas un tag existant — le tag
`v5.3.0` existe donc sans version npm correspondante. C'était transitoire : le commit suivant
a publié normalement. Si ça se reproduit, le contournement est un nouveau commit releasable,
pas une republication.
