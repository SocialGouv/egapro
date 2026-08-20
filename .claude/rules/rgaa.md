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
| `a11y-gate` | manuel | Audit statique JSX/TSX du package. SARIF + annotations. Ne commente pas et ne produit aucun artefact : il fait rougir ou verdir, c'est tout. |
| `a11y-pages` | manuel | La suite Playwright `src/e2e/a11y/` enregistre **35 pages** en épinglant l'état applicatif que chaque écran de tunnel exige ; l'Action réingère les instantanés et décide les critères **au rendu** depuis eux (contraste calculé, information par la couleur, contraste des composants, visibilité du focus, verrou d'orientation), puis fait adjuger TOUS les critères de jugement par une passe Claude Code (secret `CLAUDE_CODE_OAUTH_TOKEN`). Produit LE rapport page par page dans le livrable : une ligne par page avec sa base et ses compteurs, puis les critères non conformes de chaque page en échec. Pas de pourcentage — un taux sur les seuls critères décidés se lit comme une note de page ; il reste dans la fiche de l'artefact, avec sa couverture. Les constats ne bloquent pas — on mesure. Une panne, si ; une grille incomplète (`require-decided: pages`) ou un balayage amputé (`require-sample`) aussi. |
| `a11y-bundle` | manuel | Fusionne les parties en un seul artefact `ultra11y-rgaa`. |

**Le workflow ne tourne que sur `workflow_dispatch`** — ni `push`, ni `pull_request`, ni cron.
Conséquence à connaître avant d'y toucher : **il n'y a aucune gate d'accessibilité sur une PR**.
Une régression RGAA peut être mergée sans rien allumer. C'est un arbitrage assumé, dont la
contrepartie est que l'adjudication IA, elle, peut tourner à chaque run (`claude-code-action`
refuse `push`).

`gate-adjudicated` reste à `false` : la gate ré-audite la **source**, donc le rouge/vert reste une fonction pure du commit, quoi qu'un modèle ait dit.

### Il n'y a plus de registre de verdicts

`packages/app/.ultra11y/verdicts/rgaa.json` a existé, et il a été **supprimé**. Il portait un
verdict par critère de jugement déjà tranché — statut, justification, citations, et une empreinte
de l'évidence contre laquelle il avait été rendu — et les jobs le **rejouaient** avant toute
adjudication, ce qui rendait la grille complète sans invoquer de modèle.

Sa raison d'être était l'événement `push`, sur lequel `claude-code-action` refuse de tourner : là,
seul le rejeu pouvait fermer les critères de jugement. Le workflow ne tourne plus que sur
`workflow_dispatch`, où le modèle tourne toujours. Le registre n'avait plus rien à couvrir.

**Ce que ça coûte, et il faut le savoir avant de lancer un run.** Le rejeu passait avant
l'adjudication et ne laissait payer que le reliquat ; sur un registre à jour, un run ne coûtait
rien. Il n'y a plus de reliquat, il n'y a que le total : **16 à 21 $ par run** (mesuré sur ce
dépôt, voir le tableau plus bas), et **deux runs sur le même commit peuvent rendre deux grilles
différentes**. Un run manuel est un acte, pas un réflexe.

Il n'y a plus d'`undecidable.json` non plus. `require-decided: pages` reste actif : un critère que
l'adjudication ne tranche pas fait rougir le job, et la seule issue est de le faire trancher.

En local, la même chose sans CI, depuis `packages/app` :

```bash
pnpm exec ultra11y audit src --jsx --graph --standard rgaa --out audits
pnpm exec ultra11y verify --manual --in audits/audit-latest.json --out audits --standard rgaa
# … trancher chaque critère (le skill `ultra11y` le pilote) …
pnpm exec ultra11y verify --apply audits/ADJUDICATE.todo.json --in audits/audit-latest.json \
  --out audits --standard rgaa
```

### Le fold est fail-closed PAR VERDICT (5.4.0)

Un verdict refusé coûte **son seul critère** — qui reste « à évaluer » en portant le motif du
refus — et laisse tous les autres passer. Aucun contrôle n'a été assoupli ; c'est le rayon
d'explosion qui change. Le défaut mesuré : un run avait rempli 95 verdicts sur 96 correctement,
un seul revenait `null`, et le fold au niveau du FICHIER a jeté les 96 — donc 16,16 $ pour
publier « à évaluer » sur toute la grille, dans un job qui se déclarait vert. `--strict` restaure
l'ancien comportement pour qui veut le tout-ou-rien.

### L'adjudication : ce qu'elle coûte, et le défaut corrigé en 5.3.4

Trois runs successifs du même job, sur cette branche :

| run | coût de la passe agent | résultat |
|---|---:|---|
| `32023486480` | **19,81 $** | appliquée (41 critères tranchés, 56 laissés « à évaluer ») |
| `32033274059` | **21,20 $** | **rejetée** (2 verdicts invalides) |
| `32061739065` | **16,16 $** | **rejetée** (96 verdicts `null` — l'agent n'avait rien écrit) |

**Le défaut, trouvé et corrigé en amont (ultra11y 5.3.4).** L'Action donne à l'agent
`Read,Grep,Glob,Edit,Write` et **pas de shell**, puis le renvoyait au RUNBOOK, qui dit de
remplir les verdicts *dans* `ADJUDICATE.todo.json` et de lancer `verify --apply`. Sous RGAA ce
fichier fait **536 Ko** (96 critères, 1590 ancres d'évidence) : la consigne était donc 96
éditions exactes dans un demi-mégaoctet, et chaque commande prescrite était refusée — 17 refus
de permission, 75 tours sur 424, fichier intact. Le fold étant fail-closed, il a correctement
tout jeté. `verify --manual` écrit désormais aussi un fichier **verdicts seuls** (37 Ko) et une
fiche par critère (quelques Ko) ; `verify --apply` accepte les deux et **ré-dérive l'évidence
depuis l'audit**, donc le gate est identique — mêmes contrôles de couverture, mêmes citations à
prouver, mêmes refus.

**Ce que 5.4.0 change, et ce qui reste vrai :**

1. **Le coût de 16 à 21 $ par run ne se paie plus sur une PR.** C'était l'arbitrage à trancher ;
   le registre le supprime plutôt que de l'arbitrer — la PR rejoue, seuls les runs hebdo et
   manuel adjugent, et seulement ce que le registre ne couvre pas.
2. **Un seul verdict invalide ne jette plus l'adjudication entière** (fold par verdict). Le
   critère refusé reste « à évaluer » **en portant le motif du refus**, ce qui est aussi ce qui
   rend le rapport lisible : plus une case vide, mais une raison.
3. **Un job vert ne veut toujours pas dire « tout a été évalué ».** Lire `applied:` / `rejected:`
   dans le log, les avertissements « périmé » et « absent du registre », ou la colonne
   « À évaluer » du commentaire.

## Ce qui n'est PAS le dispositif

- **Lighthouse** mesure un score d'accessibilité et le rapporte en `warn`. Ce n'est pas une gate RGAA : sa notion d'accessibilité n'est pas celle des 106 critères, et deux seuils concurrents sur un même sujet donnent deux verdicts qu'il faut ensuite réconcilier à la main.
- **`block-bad-patterns.sh`** interdit `<img>` brut, `<svg>` inline, `style={}` et les couleurs en dur. Ce sont des règles **DSFR et Next**, qui servent aussi l'accessibilité — pas un tier d'accessibilité. Elles restent, sous ce titre-là.
- **`structural-auditor`** ne rapporte plus rien sur l'accessibilité.

## Écrire accessible

Les règles ne sont pas recopiées ici : elles vivent dans les données de standards d'ultra11y, et le skill `ultra11y` les sert par critère (`criteria --standard rgaa 8.3`, `guidance`, `glossary`). Demande-lui plutôt que de te fier à une liste de mémoire.

Le seul principe qui mérite d'être répété, parce qu'il décide de tout le reste : **HTML natif d'abord, ARIA en dernier**. Un `<button>` est accessible ; un `<div role="button">` demande d'écrire à la main le focus, le clavier et l'état, et de ne jamais se tromper. Ne double jamais une sémantique implicite (`role="navigation"` sur `<nav>` est faux, pas redondant).

## Les deux dépendances, et pourquoi elles ne sont pas mortes

`packages/app/package.json` porte deux devDependencies qu'aucun `import` du dépôt ne cite. Les deux sont chargées, et j'ai déjà supprimé la seconde en la croyant morte :

- **`ultra11y`** — le binaire (`pnpm exec ultra11y`) et le plugin Playwright (`ultra11y/playwright`, utilisé par `src/e2e/a11y/snapshot.ts`).
- **`@axe-core/playwright`** — **aucun import, et pourtant indispensable**. Le moteur ne l'importe pas non plus : il teste s'il se *résout* (`localAvailable`). Si `@playwright/test` **et** `@axe-core/playwright` se résolvent, `scan` utilise le tier navigateur **local** ; sinon il bascule sur Docker, qui ne sait pas porter de session et refuse alors un balayage authentifié. C'est ce qui décide le contraste calculé, le focus visible, le zoom, le reflow et les régions live. Le retirer ne casse aucun `import` — ça dégrade silencieusement l'audit.

Vérifier en une commande, depuis `packages/app` :

```bash
pnpm exec ultra11y scan <une-page.html> --runtime local --json | head -3
# doit afficher  "engine": "axe-core@playwright (local)"  — pas "(docker)"
```

## Bump de version

Deux pins délibérés, à bouger ensemble :

```bash
pnpm --filter app add -D ultra11y@<version>   # version EXACTE, pas de ^
# puis aligner `maxgfr/ultra11y@v<version>` dans .github/workflows/a11y.yaml
# le plugin se met à jour tout seul depuis sa marketplace
```

Les deux sont sur **5.4.0**. À noter si un bump échoue : la publication npm de la 5.3.0 est
tombée sur la signature de provenance (`CA_CREATE_SIGNING_CERTIFICATE_ERROR`, 403 du CA) alors
que l'échange OIDC avait réussi, et semantic-release ne republie pas un tag existant — le tag
`v5.3.0` existe donc sans version npm correspondante. C'était transitoire : le commit suivant
a publié normalement. Si ça se reproduit, le contournement est un nouveau commit releasable,
pas une republication.
