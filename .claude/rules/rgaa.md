# Accessibilité — RGAA 4.1.2 / WCAG 2.2 AA

> **Toutes sessions.** egapro est une plateforme de l'État : le niveau visé est **RGAA 4.1.2** (13 thématiques, 106 critères), socle technique **WCAG 2.2 AA**. Exigence first-class, au même titre que la sécurité.

## Un seul dispositif : ultra11y

L'outil est **ultra11y** (`github.com/maxgfr/ultra11y`, MIT). Il n'y a **pas** de second système d'accessibilité dans ce dépôt, et c'est délibéré : deux jeux de règles sur un même sujet divergent, et celui qui n'a pas de moteur derrière lui est celui qui invente des non-conformités.

Deux surfaces, et deux seulement.

**La revue** — l'agent `rgaa-auditor` lance le skill **`review-a11y`** sur le code sous changement et rend son verdict. C'est tout ce qu'il fait : le skill cadre l'audit sur le diff, lance le moteur, réfute les faux positifs, tranche les critères de jugement depuis la source et nomme les critères de rendu comme risques résiduels. Le skill vient du plugin déclaré dans `.claude/settings.json` ; il s'installe une fois avec `claude plugin install ultra11y@ultra11y`. Le plugin apporte aussi un hook `PreToolUse` qui arrête un `git commit` / `git push` / `gh pr create` porteur de non-conformités — coupe-circuits `SKIP_A11Y=1` (une commande), `ULTRA11Y_HOOK=off` (une session), `"hook": { "failOn": "off" }` dans `.ultra11yrc.json` (le dépôt).

**L'analyse** — `.github/workflows/a11y.yaml`, trois jobs portés par la même Action Ultra11y,
épinglée au SHA du commit de release (`uses: maxgfr/ultra11y@<sha> # vX.Y.Z` ; upstream n'a
actuellement aucun tag) :

| Job | Quand | Ce qu'il fait |
|---|---|---|
| `a11y-gate` | **chaque PR** (bloquant) | audit statique JSX/TSX de tout `src` — gratuit, quelques secondes, aucun navigateur et aucun modèle. **La seule gate du dispositif qui arrête un merge sur un constat** (`fail-on: blocking`) : SARIF, annotations, commentaire sticky |
| `a11y-pages` | **manuel uniquement** (`gh workflow run a11y.yaml`) | balayage Playwright, critères décidés **au rendu**, rejeu du registre, puis adjudication Sonnet 5 / effort `high` du reliquat par Claude CLI en lots de huit, sans plafond par lot. **Ne bloque ni sur les constats, ni sur un critère « à évaluer »** — on mesure et on publie. Bloque sur une panne, un rendu absent ou un balayage amputé |
| `a11y-bundle` | manuel | fusionne le tout dans l'artefact `ultra11y-rgaa` |

Ce que ça ne donne pas, et il faut le savoir : **une régression RGAA de rendu ne sera rattrapée par personne tant que personne ne lance le workflow.** Le cron hebdomadaire a été retiré parce que, depuis ultra11y 5.42, 104 des 106 critères RGAA exigent une adjudication par le modèle — un run n'est plus une dépense de fond. Ce qui rattrape une régression sur une PR est l'audit statique, qui ne voit pas la page rendue. C'est l'arbitrage, et c'est celui du coût.

> Câblage complet, coûts mesurés, registre de verdicts, `undecidable.json`, runner CLI par lots, choix du cron plutôt que `push: alpha`, commandes locales et procédure de bump → **[`docs/accessibilite-ultra11y.md`](../../docs/accessibilite-ultra11y.md)**. À lire avant de toucher à `a11y.yaml` ou à la version d'ultra11y — plusieurs de ces choix ont déjà été faits, défaits, puis refaits.

## La version, et pourquoi elle vit à quatre endroits

Le moteur ultra11y est **embarqué** dans chaque surface, donc « la version » n'est pas un
numéro unique mais quatre copies qui doivent s'accorder :

| Où | Quoi | Tenu par |
|---|---|---|
| `a11y.yaml`, `uses:` ×2 | le moteur de la CI (gate PR + `a11y-pages`) | `a11y-version-coherence` (ci.yaml) |
| `packages/app/package.json` | le binaire et le plugin Playwright qui **écrivent** les instantanés | idem |
| le plugin Claude Code | le skill `review-a11y`, donc l'agent `rgaa-auditor` | hook `check-ultra11y-plugin.sh` |

Les deux premières doivent être identiques pour une raison mécanique : la suite Playwright écrit
les instantanés avec la **devDependency**, et l'Action les réingère avec **son** moteur. Deux
versions, deux formats — et la divergence ne lève aucune erreur, elle se lit comme des critères
« à évaluer » dans un rapport qui a l'air complet. `scripts/a11y/check-ultra11y-version.sh`
refuse une demi-montée de version, et tourne dans la CI sur chaque push.

Dependabot propose les montées : `github-actions` et `npm` sont sur la **même cadence** (lundi
01:00) précisément pour que les deux PR arrivent ensemble — il ne sait pas grouper à travers
deux écosystèmes, donc c'est la CI qui tranche.

**Le plugin est le seul que rien dans le dépôt ne pin.** `.claude/settings.json` déclare
`"ultra11y@ultra11y": true` sans version : l'install prend ce que la marketplace avait ce
jour-là et n'en bouge plus. Mesuré le 31/08/2026 : plugin en **4.5.1**, dépôt en **5.40.1** —
l'agent `rgaa-auditor` auditait avec un moteur d'une trentaine de versions mineures en arrière.
Le hook `UserPromptSubmit` compare hors ligne la version installée au pin d'`a11y.yaml`, et ne
touche au réseau qu'en cas d'écart. Il **relit** la version après coup plutôt que d'annoncer un
succès sur un code de retour : `claude plugin update` monte vers le dernier tag de la
marketplace, pas forcément vers celui que le dépôt épingle.

## Ce qui n'est PAS le dispositif

- **Lighthouse** rapporte un score d'accessibilité en `warn`. Sa notion d'accessibilité n'est pas celle des 106 critères ; deux seuils concurrents donnent deux verdicts à réconcilier à la main.
- **`block-bad-patterns.sh`** interdit `<img>` brut, `<svg>` inline, `style={}` et les couleurs en dur : ce sont des règles **DSFR et Next** qui servent aussi l'accessibilité, pas un tier d'accessibilité.
- **`structural-auditor`** ne rapporte plus rien sur l'accessibilité, délibérément.

## Écrire accessible

Les règles ne sont pas recopiées ici : elles vivent dans les données de standards d'ultra11y, et le skill `ultra11y` les sert par critère (`criteria --standard rgaa 8.3`, `guidance`, `glossary`). Demande-lui plutôt que de te fier à une liste de mémoire.

Le seul principe qui mérite d'être répété, parce qu'il décide de tout le reste : **HTML natif d'abord, ARIA en dernier**. Un `<button>` est accessible ; un `<div role="button">` demande d'écrire à la main le focus, le clavier et l'état, et de ne jamais se tromper. Ne double jamais une sémantique implicite — `role="navigation"` sur `<nav>` est faux, pas redondant.

**Ne retire pas la devDependency `ultra11y`** de `packages/app/package.json` parce qu'aucun `import` ne la cite : c'est le binaire (`pnpm exec ultra11y`) et le plugin Playwright (`ultra11y/playwright`, utilisé par `src/e2e/a11y/`). Et ne remets pas `@axe-core/playwright`, retirée volontairement — deux copies de Playwright dans un même process se rendent des `Page` que les fixtures de l'autre ne reconnaissent pas.
