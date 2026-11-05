# AGENTS.md — Monorepo egapro

> Référence pour tout agent (Claude Code, OpenCode, Codex…) ou développeur travaillant sur ce dépôt. Source unique : `CLAUDE.md` ne fait que l'importer (Claude Code ne lit pas `AGENTS.md` quand un `CLAUDE.md` existe, et les versions anciennes ne le lisent pas du tout).

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

Les skills vivent dans `.agents/skills/<nom>/`, l'emplacement standard lu par Codex et OpenCode ; Claude Code y accède par le symlink `.claude/skills` ; chacun charge ses références à la demande. `review-a11y` et `ultra11y` y sont aussi, en symlinks vers la devDependency (lancer `pnpm install` s'ils sont introuvables). Pas d'orchestrateur en tâche de fond : pour paralléliser un epic, ouvre une session par sous-ticket. Sous-agents : seulement sur demande explicite, `--subagents` ([`subagents.md`](./.agents/skills/review/references/subagents.md) : checklists de revue et exploration du code, jamais l'écriture).

En début de session sur une branche (hors `alpha`) qui a une PR ouverte : si elle porte des threads de revue non résolus, signale-le et propose `/review <PR#>`.

---

## Décisions métier : l'humain tranche

egapro applique une obligation légale : une règle métier fausse, c'est une entreprise mal déclarée. **Tu ne prends aucune décision métier seul** — tu la prépares, l'utilisateur la tranche.

Est une décision métier : un seuil ou une tranche d'effectif, un calcul d'indicateur ou d'écart, une obligation déclenchée (seconde déclaration, avis du CSE…), une date ou un délai de campagne, un parcours ou une condition d'accès, un libellé à portée juridique, une durée de conservation, ce qu'on montre ou cache à un déclarant.

- **Le spec ou la spec V2 tranche** → applique, et cite la source (`packages/app/src/modules/domain/`, section du spec, lien wiki).
- **Ils sont muets, ambigus ou se contredisent** → **STOP** : pose **la** question, avec les options et leur conséquence concrète, et attends. Sans utilisateur présent (`/implement` lancé seul) : commente l'issue (`question métier : …`) et arrête-toi.
- Le code existant **n'est pas** une réponse à une question métier nouvelle : il dit ce qui est, pas ce qui doit être. Un modèle « qui a l'habitude » non plus.
- Une hypothèse métier que tu as dû faire pour avancer (même minime) s'écrit **en clair** dans le spec ou le body de PR, section « Hypothèses à valider ».

`/analyze` est le lieu de cette discussion : un spec n'est posté qu'une fois validé par l'utilisateur.

---

## Règles de code : où les lire

**Une règle vit à un seul endroit.** Si tu la trouves écrite deux fois, la deuxième a déjà commencé à diverger : corrige la source et remplace la copie par un lien.

Avant de toucher à un périmètre, **ouvre la référence correspondante** (elles ne se chargent pas toutes seules) :

| Tu touches à… | Lis |
|---|---|
| tout `.ts` / `.tsx` | [`code-quality.md`](./.agents/skills/implement/references/conventions/code-quality.md) — source unique d'une règle métier, DRY, nommage, pas de commentaire |
| tout `.tsx` | [`react-components.md`](./.agents/skills/implement/references/conventions/react-components.md) |
| `.tsx` / `.scss` | [`styling-dsfr.md`](./.agents/skills/implement/references/conventions/styling-dsfr.md) |
| un node Figma | [`figma.md`](./.agents/skills/implement/references/conventions/figma.md) |
| `src/server/api/**` | [`trpc-api.md`](./.agents/skills/implement/references/conventions/trpc-api.md) |
| `src/server/**` | [`database-drizzle.md`](./.agents/skills/implement/references/conventions/database-drizzle.md) |
| mutation, query sensible, route handler, auth | [`audit-logging.md`](./.agents/skills/implement/references/conventions/audit-logging.md) |
| parcours de déclaration, Mon espace, `src/server/rules/**` | [`demarche-state-machine.md`](./.agents/skills/implement/references/conventions/demarche-state-machine.md) |
| `src/**/__tests__/**` | [`testing.md`](./.agents/skills/implement/references/conventions/testing.md) |
| `src/e2e/**` | [`e2e.md`](./.agents/skills/implement/references/e2e.md) |
| la correction d'un bug | [`bug-fix.md`](./.agents/skills/implement/references/bug-fix.md) |
| l'accessibilité, ultra11y | [`a11y.md`](./.agents/skills/review/references/a11y.md) |

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

egapro est une plateforme de l'État : exigence first-class, au même titre que la sécurité. **Un seul dispositif : ultra11y**, à une seule version — la devDependency de `packages/app`, tenue égale à l'Action CI. Tout en découle : pre-commit, `pnpm verify`, les skills `review-a11y` et `ultra11y` (symlinks dans `.agents/skills/`, lus par chaque outil), le gate commit / push / PR côté agent (hook dans `.claude/settings.json`, plugin dans `opencode.json`), le MCP `ultra11y`. Il n'y a pas de second système, et c'est délibéré.

- **HTML natif d'abord, ARIA en dernier.** Un `<button>` est accessible ; un `<div role="button">` demande d'écrire à la main focus, clavier et état. Ne double jamais une sémantique implicite (`role="navigation"` sur `<nav>` est faux, pas redondant).
- **Ne devine pas un critère de mémoire** : demande-le au skill `ultra11y` ou au MCP (`criteria --standard rgaa 8.3`, `guidance`, `glossary`).
- Le jugement (ce que le moteur ne tranche pas) passe par le skill `review-a11y`, lancé par `/review gates`. Détail, versions et CI → [`a11y.md`](./.agents/skills/review/references/a11y.md) et [`docs/accessibilite-ultra11y.md`](./docs/accessibilite-ultra11y.md).

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

## Outils : MCP, scripts, CI

- **MCP** (`next-devtools`, `dsfr`, `figma`, `playwright`, `ultra11y`) : **ne devine jamais de mémoire** une API Next.js, une classe DSFR, une valeur Figma ou un critère RGAA — demande au serveur.
- **Config générée** : `.mcp.json` et la `POLICY` de `scripts/ai/sync-agent-config.mjs` sont les sources ; `node scripts/ai/sync-agent-config.mjs` régénère les blocs `mcp` / `permission` d'`opencode.json`, les `permissions` de `.claude/settings.json` et `.codex/`. Jamais à la main : la CI refuse une copie désynchronisée.
- **Scripts** : `pnpm verify` (le verdict « prêt » ; instantané si ce code exact est déjà vert, `--force` pour rejouer), `pnpm check:patterns`, `pnpm dev:app` (port 3000), `pnpm test:e2e` (exige un dev server). Le reste : `package.json`.
- **CI** : un check rouge → lis son workflow dans `.github/workflows/`. Bloquants sur PR : `ci.yaml`, `a11y.yaml` (`a11y-gate`), `a11y-lite.yaml`, `e2e.yaml` (check requis « Test e2e »).

Tableaux complets (même config par outil, CI, scripts) : [README.md](./README.md).
