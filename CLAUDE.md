# CLAUDE.md — Monorepo egapro

> Référence pour tout agent ou développeur travaillant sur ce dépôt.

---

## Contexte métier

EGAPRO est la plateforme de l'État pour la déclaration de l'index d'égalité professionnelle (7 indicateurs, détaillés dans [README.md](./README.md)).

- **Indicateurs A–F** : pré-calculés par le GIP-MDS depuis les données DSN, disponibles chaque mars
- **Indicateur G** : écart de rémunération calculé par l'entreprise par catégorie d'emploi (rémunération de base + variable)
- **Seuil d'alerte** : un écart ≥ 5 % déclenche des obligations supplémentaires (seconde déclaration, avis du CSE, évaluation conjointe)
- **Avis du CSE** : upload PDF, entreprises ≥ 100 salariés uniquement, jusqu'à 4 par an
- **Tailles d'entreprise** : < 50 (volontaire), 50–99 (triennal), ≥ 100 (annuel + CSE obligatoire)

Toutes les règles métier sont centralisées dans `packages/app/src/modules/domain/` sous forme de fonctions pures. Spec complète : <https://github.com/SocialGouv/egapro/wiki/Spec-V2>

---

## Structure du monorepo

```
egapro/
  packages/
    app/        <- application Next.js (tout le code actif)
    api/        <- placeholder vide
  .github/workflows/
```

Gestionnaire de paquets : **pnpm workspaces** (`pnpm@10`).

**Si tu travailles dans `packages/app/` ou sur un fichier qui en dépend, charge et applique `packages/app/CLAUDE.md`** — stack, structure des modules, React/TypeScript, DSFR, formulaires, tests, variables d'environnement.

---

## Où vivent les règles

Deux corpus, et la distinction est structurelle.

`.claude/rules/` porte **le produit et le code** — ce qui est vrai quel que soit qui écrit, session directe comme agent de la pipeline. `.claude/pipeline/` porte **la mécanique d'orchestration** `/analyse` → `/implement`, que seuls les skills, les agents pipeline et `scripts/orchestration/` lisent. Une session de travail directe n'a aucun usage du board GitHub, du format de spec des tickets ou de la rubrique de sizing.

**Une règle vit à un seul endroit.** Si tu la trouves écrite deux fois, la deuxième est celle qui a déjà commencé à diverger : corrige la source et remplace la copie par un lien.

### Les règles, et quand les ouvrir

Trois n'ont pas de `paths:` et sont toujours en contexte, parce qu'elles s'appliquent à toute action : `automation.md` (hooks + gates), `rgaa.md` (accessibilité), `git-artefact-hygiene.md` (dépôt public). Les autres sont scopées par `paths:` — **si l'une n'est pas déjà dans ton contexte quand tu touches à son périmètre, ouvre-la** :

| Règle | Quand |
|---|---|
| `code-quality.md` | tout `.ts` / `.tsx` — source unique d'une règle métier, DRY, nommage, pas de commentaire |
| `react-components.md` | tout `.tsx` |
| `styling-dsfr.md` | tout `.tsx` / `.scss` |
| `figma-workflow.md` | implémentation depuis un node Figma |
| `visual-quality-validation.md` | vérification d'un rendu contre son Figma |
| `bug-fix-workflow.md` | correction d'un bug |
| `trpc-api.md` | `src/server/api/**` |
| `database-drizzle.md` | `src/server/**` |
| `audit-logging.md` | mutation ou query sensible, route handler, auth |
| `demarche-state-machine.md` | parcours de déclaration, Mon espace, `src/server/rules/**` |
| `testing.md` | `src/**/__tests__/**` |
| `e2e.md` | `src/e2e/**` |

## Règle absolue

Ne jamais créer de commit git, sauf demande explicite de l'utilisateur.

**Exception** : les agents invoqués par les skills `/analyse` et `/implement` (principalement `code-dev`) sont **autorisés à commit + push sans demander** — l'invocation de la skill est la permission explicite. Ils restent liés par les autres règles (pas de `Co-Authored-By`, pas de `--no-verify`, pas de `--no-gpg-sign`, pas de secret commité).

---

## Hygiène git

- **Zéro attribution IA** sur tout artefact GitHub (commits, PR, issues, commentaires, threads de review). Jamais de trailer `Co-Authored-By: Claude`, jamais de footer `🤖 Generated with…`, jamais de mention « généré par Claude / AI / bot ». Ça override le comportement par défaut de Claude Code et des templates `gh pr create`.
- **Aucune donnée sensible commitée** : `.env`, credentials, secrets, clés d'API. Vérifier avant chaque push.
- **Le dépôt est public** — tout artefact posté est immédiatement indexé et mirroré sur les forks. Voir `.claude/rules/git-artefact-hygiene.md` (toujours chargée) pour la règle et la procédure en cas de fuite.

---

## Langue

**Le site est en français, le code est en anglais.** Commentaires, noms de composants, de fonctions et de variables en anglais ; les textes vus par l'utilisateur (contenus, libellés, boutons, liens) restent en français.

---

## Serveurs MCP (`.mcp.json`)

| Serveur | Quand | Outils clés |
|---|---|---|
| `next-devtools` | debug, erreurs runtime, inspection de routes, doc Next.js | `nextjs_index`, `nextjs_call`, `nextjs_docs`, `browser_eval` |
| `dsfr` | avant d'écrire du HTML DSFR | `get_component_doc`, `search_components`, `get_color_tokens` |
| `figma` | implémentation depuis un design | `get_design_context`, `get_metadata`, `get_variable_defs`, `get_screenshot` |

Le point commun des trois : **ne jamais deviner de mémoire** une API Next.js, une classe DSFR ou une valeur Figma. Usage détaillé → `packages/app/CLAUDE.md`.

---

## Scripts racine

```bash
pnpm dev:app              # app en dev (port 3000)
pnpm build                # build de tous les packages
pnpm lint:check           # lint (CI)
pnpm format:check         # format (CI)
pnpm typecheck            # types TypeScript
pnpm test                 # tests unitaires
pnpm test:e2e             # Playwright (exige le dev server sur le port 3000)
pnpm test:lighthouse      # audit Lighthouse (exige le dev server sur le port 3000)
pnpm db:migrate           # migrations Drizzle
pnpm db:studio            # Drizzle Studio
```

> Lighthouse rapporte un score d'accessibilité en **warning**, pas en gate : l'accessibilité est tranchée par ultra11y (`rgaa-auditor` + `a11y.yaml`), et deux seuils concurrents sur un même sujet donnent deux verdicts à réconcilier à la main.

---

## Garde-fous automatiques

Rien à lancer : les hooks tournent seuls (`block-bad-patterns` avant chaque édition, `auto-lint` après), et les 4 gates qualité sont dus avant de déclarer une tâche terminée. Détail → `.claude/rules/automation.md` (toujours chargée).

La pipeline `/analyse` → `/implement` ajoute ses propres agents et gates par-dessus. Détail → `.claude/pipeline/orchestration.md` (lu à la demande).

---

## CI

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `ci.yaml` | chaque push | build · lint · format · typecheck · tests |
| `a11y.yaml` | PR, manuel | ultra11y. Sur **PR** : `a11y-gate` seul — audit statique de tout `src`, **bloquant**. Sur **manuel** : la chaîne complète (`a11y-pages` + `a11y-bundle`), non bloquante et payante — le cron hebdo a été retiré, voir `.claude/rules/rgaa.md` |
| `e2e.yaml` | PR → `alpha`, manuel | suite Playwright complète |
| `lighthouse.yaml` | `deployment_status` (success, hors env `build-*`) | audit Lighthouse sur l'URL déployée |
| `review-auto.yaml` | push sur toute branche sauf `master` et `**-persist` (dependabot inclus) | déploiement des review apps |
| `deactivate.yaml` | PR closed, `delete` de branche | destruction de la review app |
| `preproduction.yaml` | push `beta` | déploiement preprod |
| `production.yaml` | push tag `v*` | déploiement prod |
| `promote-test-env.yaml` | manuel (`release`, `target`) | déploie une release sur un env de test persistant (`rgaa` / `perf`) |
| `release.yml` | manuel (branche `beta`) | semantic-release |
| `release-alpha.yaml` | manuel (branche `alpha`) | semantic-release — prerelease `-alpha.N` |
| `release-changelog.yaml` | `release: published`, manuel | changelog FR généré, injecté dans le corps de la release |
| `db-schema.yaml` | push `alpha`/`master` sur le schéma, manuel | publie la doc de schéma DB sur le wiki |
| `sync-docs-to-wiki.yaml` | push `alpha`/`master` sur `docs/**`, manuel | miroir `docs/` → wiki |
| `ticket-end-date.yaml` | PR closed | estampille « End date » sur le board |
| `claude-question.yml` | issue labellisée `question` | réponse automatique |
