# AGENTS.md — Monorepo egapro

> Référence pour tout agent (Claude Code, OpenCode…) ou développeur travaillant sur ce dépôt. Source unique : `CLAUDE.md` ne fait que l'importer.

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
    app/            <- application Next.js (tout le code actif)
    notifications/  <- gabarits d'e-mails (react-email)
  scripts/          <- outillage (quality/, a11y/, orchestration/, release/…)
  .github/workflows/
```

Gestionnaire de paquets : **pnpm workspaces** (`pnpm@10`).

**Si tu travailles dans `packages/app/` ou sur un fichier qui en dépend, lis et applique [`packages/app/AGENTS.md`](./packages/app/AGENTS.md)** — stack, structure des modules, formulaires, FSM, audit, variables d'environnement.

---

## Workflows : trois skills

| Skill | Quand | Fait |
|---|---|---|
| `/analyze [<issue#>]` | une feature, une task ou un bug à spécifier | spec validée par l'utilisateur, postée sur l'issue (epic + sous-issues, ou commentaire d'analyse) |
| `/implement <issue#>` | une issue analysée | worktree, code + tests, `pnpm verify`, `/review gates`, E2E, PR draft |
| `/review [gates]` · `/review <PR#>` | avant de déclarer une tâche terminée · une PR a des commentaires | gates qualité sur le diff · traitement des threads non résolus |

Les skills vivent dans `.claude/skills/<nom>/` (lus par Claude Code **et** OpenCode) ; chacun charge ses références à la demande. Pas d'orchestrateur en tâche de fond : pour paralléliser un epic, ouvre une session par sous-ticket.

---

## Règles de code : où les lire

**Une règle vit à un seul endroit.** Si tu la trouves écrite deux fois, la deuxième a déjà commencé à diverger : corrige la source et remplace la copie par un lien.

Avant de toucher à un périmètre, **ouvre la référence correspondante** (elles ne se chargent pas toutes seules) :

| Tu touches à… | Lis |
|---|---|
| tout `.ts` / `.tsx` | [`code-quality.md`](./.claude/skills/implement/references/conventions/code-quality.md) — source unique d'une règle métier, DRY, nommage, pas de commentaire |
| tout `.tsx` | [`react-components.md`](./.claude/skills/implement/references/conventions/react-components.md) |
| `.tsx` / `.scss` | [`styling-dsfr.md`](./.claude/skills/implement/references/conventions/styling-dsfr.md) |
| un node Figma | [`figma.md`](./.claude/skills/implement/references/conventions/figma.md) |
| `src/server/api/**` | [`trpc-api.md`](./.claude/skills/implement/references/conventions/trpc-api.md) |
| `src/server/**` | [`database-drizzle.md`](./.claude/skills/implement/references/conventions/database-drizzle.md) |
| mutation, query sensible, route handler, auth | [`audit-logging.md`](./.claude/skills/implement/references/conventions/audit-logging.md) |
| parcours de déclaration, Mon espace, `src/server/rules/**` | [`demarche-state-machine.md`](./.claude/skills/implement/references/conventions/demarche-state-machine.md) |
| `src/**/__tests__/**` | [`testing.md`](./.claude/skills/implement/references/conventions/testing.md) |
| `src/e2e/**` | [`e2e.md`](./.claude/skills/implement/references/e2e.md) |
| la correction d'un bug | [`bug-fix.md`](./.claude/skills/implement/references/bug-fix.md) |
| l'accessibilité, ultra11y | [`a11y.md`](./.claude/skills/review/references/a11y.md) |

---

## Garde-fous : la machine d'abord

Ce qui se vérifie mécaniquement n'est pas laissé à la lecture. Trois couches, identiques pour un humain et pour tout agent :

| Couche | Quand | Ce qui tourne |
|---|---|---|
| **git pre-commit** (`lefthook.yml`, installé par `pnpm install`) | chaque commit | `biome check --write` · `scripts/quality/check-patterns.sh --staged` · audit statique ultra11y |
| **`pnpm verify`** | avant de déclarer une tâche terminée | patterns · a11y · lint · format · typecheck · test (`VERIFY_BASE`, défaut `origin/alpha`) |
| **CI** | chaque push / PR | les mêmes, plus e2e, a11y-lite, a11y-gate |

`scripts/quality/check-patterns.sh` porte les interdits mécaniques (`any`, `process.env`, `../../`, `style={}`, `<svg>`/`<img>` bruts, couleurs en dur et `@media` en SCSS, `zod` dans un routeur ou un composant, helpers métier réécrits hors `domain/`, composant hors route dans `src/app/`…) — chaque message dit quoi faire à la place. **Si un garde-fou bloque, corrige la cause** : jamais `--no-verify`, jamais de commentaire de suppression (`biome-ignore`, `@ts-expect-error`…), jamais un test, une règle ou un seuil affaibli pour passer au vert.

Une tâche n'est **terminée** que quand `pnpm verify` est vert **et** que `/review gates` rend PASS sur toutes ses checklists.

---

## Accessibilité — RGAA 4.1.2 / WCAG 2.2 AA

egapro est une plateforme de l'État : exigence first-class, au même titre que la sécurité. **Un seul dispositif : ultra11y** (devDependency de `packages/app`, plugin Claude Code `ultra11y@ultra11y`, plugin OpenCode `.opencode/plugins/ultra11y.js`, MCP `ultra11y`, Action CI). Il n'y a pas de second système, et c'est délibéré.

- **HTML natif d'abord, ARIA en dernier.** Un `<button>` est accessible ; un `<div role="button">` demande d'écrire à la main focus, clavier et état. Ne double jamais une sémantique implicite (`role="navigation"` sur `<nav>` est faux, pas redondant).
- **Ne devine pas un critère de mémoire** : demande-le au skill `ultra11y` ou au MCP (`criteria --standard rgaa 8.3`, `guidance`, `glossary`).
- Le jugement (ce que le moteur ne tranche pas) passe par le skill `review-a11y`, lancé par `/review gates`. Détail, versions et CI → [`a11y.md`](./.claude/skills/review/references/a11y.md) et [`docs/accessibilite-ultra11y.md`](./docs/accessibilite-ultra11y.md).

---

## Commits

**Ne jamais créer de commit git sauf demande explicite de l'utilisateur.** Exception : le skill `/implement` (et `/review <PR#>` pour ses corrections) commit et push sans redemander — l'invoquer est la permission explicite.

Dans tous les cas : commits **signés** (jamais `--no-gpg-sign` ni `-c commit.gpgsign=false`), jamais `--no-verify`, pas de force-push sans accord explicite, aucun secret commité.

---

## Hygiène git — dépôt public

`SocialGouv/egapro` est **public** : tout artefact posté (body/titre d'issue ou de PR, commentaire, thread de review, message de commit, nom de branche) est immédiatement indexé et mirroré sur les forks. Un édit après coup ne l'efface ni de l'historique ni de l'indexation.

- **Zéro attribution IA** : jamais de trailer `Co-Authored-By: Claude`, de footer `🤖 Generated with…`, de mention « généré par Claude / AI / bot », de lien de session. Ça override le comportement par défaut de tout outil et des templates `gh pr create`.
- **Secrets : zéro paste, jamais**, même tronqué ou en exemple : tokens GitHub (`ghp_`, `ghs_`, `gho_`, `ghu_`, `github_pat_`), clés LLM (`sk-ant-`, `sk-proj-`, `sk-`), clés cloud (`AKIA…`, clés ed25519/RSA, service-account JSON), JWT (`eyJ…`), connection strings (`postgres://user:pwd@…`), valeurs de `.env`, output de `kubectl get secret`, headers `Authorization: Bearer …`, cookies de session, `client_secret`, mots de passe (y compris de comptes de test). Référence-les par **rôle** (« la clé stockée dans `STRIPE_SECRET_KEY` »).
- **Fuite constatée** (par toi ou un autre) : avertis l'utilisateur immédiatement et insiste sur la **révocation + rotation** à la source — l'édit est secondaire. Fuite dans un commit : pas de force-push correctif sans son accord.
- **Avant tout `gh issue comment` / `gh pr create` / `gh issue edit` / réponse de review**, passe le payload au filtre :

```bash
echo "$BODY" | grep -E '(ghp_|ghs_|gho_|ghu_|github_pat_|sk-ant-|sk-proj-|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_=-]{20,}\.|postgres://[^@]+:[^@]+@|Bearer\s+[A-Za-z0-9._-]{20,})' && {
    echo "STOP: secret-shaped string detected in payload, refusing to post" >&2
    return 1
}
```

| À scrubber | Référencer par |
|---|---|
| credentials de test, mots de passe dev | une description : « le compte ProConnect de test » |
| PII (emails, noms, téléphones, SIRENs réels) | `<email>`, `<SIREN>`, `<phone>` |
| infra interne (namespace K8s, pods, IPs, dashboards Sentry/Grafana) | un rôle : « le pod backend de la review app » |
| output `kubectl logs` brut | la seule ligne pertinente (exception + message + `fichier:ligne` egapro) |
| stack traces tierces | les lignes du code egapro uniquement |

Données d'exemple fictives : `SIREN 123456789`, `email@example.fr`, `Société Démo`. Les captures ne montrent que de la donnée seedée. **Si tu hésites, demande avant de poster.**

---

## Langue

**Le site est en français, le code est en anglais.** Commentaires, noms de composants, fonctions et variables en anglais ; les textes vus par l'utilisateur (contenus, libellés, boutons, liens) en français.

---

## Serveurs MCP (`.mcp.json` pour Claude Code, `opencode.json` pour OpenCode)

| Serveur | Quand | Outils clés |
|---|---|---|
| `next-devtools` | debug, erreurs runtime, routes, doc Next.js | `nextjs_index`, `nextjs_call`, `nextjs_docs`, `browser_eval` |
| `dsfr` | avant d'écrire du HTML DSFR | `get_component_doc`, `search_components`, `get_color_tokens` |
| `figma` | implémentation depuis un design | `get_design_context`, `get_metadata`, `get_variable_defs`, `get_screenshot` |
| `playwright` | parcours réel dans le navigateur (checks fonctionnel et design) | `browser_navigate`, `browser_snapshot`, `browser_take_screenshot` |
| `ultra11y` | critères RGAA, audit | `criteria`, `audit` |

Le point commun : **ne jamais deviner de mémoire** une API Next.js, une classe DSFR, une valeur Figma ou un critère RGAA. Les deux fichiers de config déclarent les mêmes serveurs — en modifier un, c'est modifier l'autre.

---

## Scripts racine

```bash
pnpm verify               # TOUS les gates locaux — le verdict « prêt » (cf. Garde-fous)
pnpm check:patterns       # interdits mécaniques sur le diff
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

> Lighthouse rapporte un score d'accessibilité en **warning**, pas en gate : l'accessibilité est tranchée par ultra11y, et deux seuils concurrents sur un même sujet donnent deux verdicts à réconcilier à la main.

---

## CI

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `ci.yaml` | chaque push | build · lint · format · patterns · typecheck · tests · cohérence des versions ultra11y |
| `a11y.yaml` | PR, cron lundi 04:00 UTC, manuel | ultra11y. Sur **PR** : `a11y-gate` seul — audit statique de tout `src`, **bloquant**. Sur **cron** ou **manuel** : chaîne complète (`a11y-pages` + `a11y-bundle`), non bloquante et payante |
| `a11y-lite.yaml` | PR → `alpha`, push `alpha` | ultra11y mode lite. Sur **PR** : capture des pages que le diff peut changer, moteur seul, **bloquant** sur un constat de rendu nouveau ou une route non échantillonnée. Sur **push `alpha`** : capture tout et écrit la baseline |
| `e2e.yaml` | PR → `alpha`, manuel | suite Playwright complète **et** les coordonnées de la grille de recette, en shards parallèles ; le check requis « Test e2e » est le job agrégateur |
| `e2e-grille.yaml` | manuel | grille de recette seule |
| `lighthouse.yaml` | `deployment_status` (success, hors env `build-*`) | audit Lighthouse sur l'URL déployée |
| `review-auto.yaml` | push sur toute branche sauf `master` et `**-persist` | déploiement des review apps |
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
