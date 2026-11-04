# EgaPro

Plateforme gouvernementale de déclaration de l'**index de l'égalité professionnelle femmes-hommes**, en application de la [directive européenne sur la transparence salariale (UE) 2023/970](https://eur-lex.europa.eu/eli/dir/2023/970/oj).

## Contexte

La loi impose aux entreprises de mesurer et déclarer les écarts de rémunération entre les femmes et les hommes. EgaPro est l'outil mis à disposition par le ministère du Travail pour effectuer cette déclaration.

Le système repose sur **7 indicateurs** d'égalité. Les 6 premiers sont calculés automatiquement par le GIP-MDS à partir des données DSN (déclaration sociale nominative), rendues disponibles chaque année en mars. Le 7e indicateur est calculé par l'entreprise elle-même.

## Les 7 indicateurs

| ID | Indicateur | Description |
|---|---|---|
| A | Écart de rémunération | Écart moyen de salaire entre femmes et hommes |
| B | Écart de rémunération variable | Écart sur les compléments et suppléments de salaire |
| C | Écart médian de rémunération | Écart médian de salaire |
| D | Écart médian de rémunération variable | Écart médian sur la rémunération variable |
| E | Proportion de bénéficiaires de rémunération variable | Part des salariés percevant une rémunération variable, par sexe |
| F | Répartition par quartile | Distribution des effectifs dans les quartiles de rémunération |
| **G** | **Écart par catégorie de salariés** | **Écart de rémunération (base + variable) par catégorie d'emploi — calculé par l'entreprise** |

### Le 7e indicateur (indicateur G)

L'entreprise définit ses propres catégories d'emploi (par accord collectif ou décision unilatérale). Pour chaque catégorie, elle renseigne :

- Les effectifs par sexe
- La rémunération brute annuelle et horaire (base + variable)

Un **seuil d'alerte à 5%** d'écart déclenche des obligations supplémentaires : les entreprises de 100 salariés et plus dont l'écart dépasse 5% peuvent effectuer une **seconde déclaration** dans les 6 mois suivants.

## Obligations par taille d'entreprise

| Taille | 6 indicateurs | 7e indicateur | Avis CSE | Entrée en vigueur |
|---|---|---|---|---|
| < 50 salariés | Volontaire | Volontaire | Interdit | 2027 |
| 50–99 | Annuel | Triennal | Interdit | 2030 |
| 100–149 | Annuel | Triennal | Obligatoire | 2030 |
| 150–249 | Annuel | Triennal | Obligatoire | 2027 |
| 250 et + | Annuel | Annuel | Obligatoire | 2027 |

## Fonctionnalités

### Déclaration des indicateurs

- Connexion via **ProConnect**
- Consultation des 6 indicateurs pré-calculés par le GIP-MDS
- Saisie du 7e indicateur par catégories d'emploi
- Gestion des brouillons (expiration automatique après 2 mois)
- Validation avec contrôles bloquants (cohérence des périodes, plafond de déclarations)

### Seconde déclaration (indicateur G)

- Accessible aux entreprises de 100+ salariés dont l'écart initial est >= 5%
- Période de référence flexible (entre la date de première déclaration et le 31 décembre)
- Maximum 2 déclarations par année civile

### Avis du CSE

- Réservé aux entreprises de 100 salariés et plus
- Dépôt de PDF (jusqu'à 3 avis par an)
- Disponible après la déclaration des indicateurs, avant le 31 décembre

### Consultation publique

- Publication des indicateurs A à F (l'indicateur G reste confidentiel)
- Recherche par SIREN, nom d'entreprise, région ou secteur d'activité
- Export Excel

## Parcours types

| Scénario | Taille | Résultat | Actions sur la plateforme | Suites |
|---|---|---|---|---|
| Écarts < 5% | 280 sal. | Conforme | 1 déclaration + avis CSE | Aucune obligation supplémentaire |
| Écarts corrigés | 150 sal. | Résolu après 6 mois | 2 déclarations + 2 avis CSE | Mesures correctives internes |
| Petite entreprise | 75 sal. | Écart persistant | 1 déclaration uniquement | Négociation obligatoire hors plateforme |
| Écart persistant | 120 sal. | Non résolu | 2 déclarations + évaluation conjointe | Accord collectif sur 3 ans |

## Architecture

### Monorepo

```
egapro/
  packages/
    app/        ← Application Next.js (tout le code actif)
    api/        ← Placeholder vide
  .github/
    workflows/  ← CI/CD GitHub Actions
```

### Stack technique

- **Framework** : Next.js (App Router)
- **Langage** : TypeScript
- **UI** : [DSFR](https://www.systeme-de-design.gouv.fr/) (Système de Design de l'État)
- **Base de données** : PostgreSQL + Drizzle ORM
- **Authentification** : ProConnect
- **Package manager** : pnpm workspaces (pnpm@10)

### Dépendances externes

| Système | Rôle |
|---|---|
| **GIP-MDS** | Calcul des indicateurs A–F à partir des données DSN |
| **ProConnect** | Authentification des déclarants |
| **INSEE Sirene** | Données d'identification des entreprises |
| **SUIT / Delphes** | Intégration inspection du travail |
| **D@ccords** | Dépôt des accords collectifs |

## Installation

```bash
# Installer les dépendances
pnpm install

# Copier le fichier d'environnement
cp packages/app/.env.example packages/app/.env
```

## Lancer l'application

```bash
# Démarrer la base de données (avec migration automatique)
docker compose up -d

# Lancer le serveur de dev
pnpm dev:app
```

> `docker-compose.yml` est réservé au développement local : ses services portent des identifiants par défaut publics (ceux écrits dans le fichier) et ne publient leurs ports que sur `127.0.0.1`. Ne jamais l'utiliser tel quel sur une machine exposée.

Les deux bases locales (`db` et `db-notifications`) utilisent PostgreSQL 17.11. Un volume créé par PostgreSQL 14 ne peut pas être ouvert directement par PostgreSQL 17 : avant de redémarrer ces services avec une nouvelle version majeure, sauvegarder puis restaurer les données locales à conserver, ou supprimer volontairement **le volume concerné** si ses données sont jetables. Vérifier séparément les volumes `pgdata` et `notifpgdata`. La configuration ne supprime aucun volume automatiquement.

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Connexion ProConnect (environnement de test)

En développement local, l'authentification utilise le fournisseur d'identité de test **FIA1V2** de ProConnect. Pour se connecter :

1. Cliquer sur **S'identifier avec ProConnect**
2. Saisir l'email : `test@fia1.fr`
3. Cliquer sur **Se connecter**

#### Ports locaux autorisés par ProConnect

L'application ne parle pas à ProConnect directement : elle passe par **Charon**, le proxy OAuth de la Fabrique (fournisseur `proconnecttest`). C'est l'URL renseignée dans `EGAPRO_PROCONNECT_ISSUER`, identique à celle des environnements déployés (`.kontinuous/env/*/templates/proconnect.configmap.yaml`).

La configuration egapro de Charon, dans `SocialGouv/infra-apps/charon/projects/charon-egapro/config-map.yaml`, autorise les callbacks locaux sur les ports 3000 à 3010 après son déploiement. Les worktrees applicatifs utilisent 3001 à 3005. Les gates E2E de fin d'epic réservent un index libre parmi 5 à 9, soit les ports 3006 à 3010, et peuvent ainsi tourner en parallèle. Si ces cinq créneaux sont occupés, le lancement échoue clairement. Le serveur, `NEXTAUTH_URL` et `PLAYWRIGHT_BASE_URL` doivent désigner le même port ; changer uniquement le port du serveur casse le callback OAuth.

La suite locale sur un worktree peut être lancée avec `PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm test:e2e`. La commande racine respecte cette variable ; sans elle, elle utilise `SITE_URL`, puis le port 3000. Le déploiement de la configuration Charon est nécessaire avant de tester la connexion réelle sur les nouveaux ports.

Les identifiants (`EGAPRO_PROCONNECT_CLIENT_ID`, `EGAPRO_PROCONNECT_CLIENT_SECRET`) sont fournis par l'équipe et ne sont jamais commités.

## Scripts utiles

| Commande | Description |
|---|---|
| `pnpm dev:app` | Serveur de développement (port 3000) |
| `pnpm build` | Build de tous les packages |
| `pnpm lint:check` | Vérification du lint |
| `pnpm format:check` | Vérification du formatage |
| `pnpm typecheck` | Vérification des types TypeScript |
| `pnpm test` | Tests unitaires |
| `pnpm test:e2e` | Tests E2E Playwright (port du serveur via `PLAYWRIGHT_BASE_URL`) |
| `pnpm test:lighthouse` | Audit Lighthouse (nécessite le serveur sur le port 3000) |
| `pnpm db:migrate` | Migrations Drizzle |
| `pnpm db:studio` | Drizzle Studio |

## Sécurisation de l'API SUIT (via passerelle APISIX)

L'API privée consommée par SUIT (`GET /api/v1/*`) est sécurisée par une **passerelle APISIX standalone**, déployée en amont de l'application dans le même cluster Kubernetes (manifests Kubernetes générés via Kontinuous, dans `.kontinuous/templates/apisix-suit.*.yaml`).

### Fonctionnement

```
SUIT ──HTTPS──▶ Ingress Kubernetes (api-suit.<host>)
                │
                ▼
             Service apisix-suit-gateway
                │  plugins actifs :
                │   - key-auth        → valide le Bearer
                │   - limit-req       → rate-limit par IP (~10 req/s, burst 5)
                │   - proxy-rewrite   → injecte X-Gateway-Forwarded
                ▼
             Service app (ClusterIP)
                │
                ▼  Edge middleware (src/middleware.ts)
                │   vérifie X-Gateway-Forwarded en constant-time
                │   (défense en profondeur : un pod compromis du cluster
                │    ne peut pas appeler /api/v1/* sans passer par APISIX)
                ▼
             Route handler → withAuditedRoute → business logic
```

- **Authentification** : clé `EGAPRO_SUIT_API_KEY` connue de la passerelle uniquement (plus dans l'app).
- **Shared secret** : `EGAPRO_GATEWAY_SHARED_SECRET` monté à la fois dans le pod APISIX (pour injecter le header) et dans le pod app (pour le vérifier).
- **Côté client SUIT** : un seul en-tête `Authorization: Bearer <clé>`. Plus de signature RSA ni de timestamp à gérer (cf. [docs/SUIT-API.md](docs/SUIT-API.md)).

### Rotation des secrets

1. Rotation de la clé API SUIT :
   - Générer une nouvelle valeur (≥ 32 caractères).
   - Mettre à jour le sealed-secret `suit` (clé `EGAPRO_SUIT_API_KEY`) — la valeur est consommée par le consumer APISIX dans `.kontinuous/templates/apisix-suit.configmap.yaml`.
   - Déployer, transmettre la nouvelle valeur à SUIT.
2. Rotation du shared secret (APISIX↔app) : idem sur la clé `EGAPRO_GATEWAY_SHARED_SECRET`. Pas d'impact SUIT (interne au cluster).

### Démantèlement

Quand l'infra fournira une API Gateway native :
- retirer la dépendance `apisix-suit` dans `.kontinuous/Chart.yaml`
- supprimer les fichiers `.kontinuous/templates/apisix-suit.*.yaml`
- selon la nouvelle gateway, adapter ou supprimer `src/middleware.ts` + la var `EGAPRO_GATEWAY_SHARED_SECRET`

## Configuration AI (Claude Code, OpenCode)

Le projet est configure pour tout agent de code qui lit `AGENTS.md` — [Claude Code](https://claude.com/claude-code) et [OpenCode](https://opencode.ai) en tete. Toute la configuration est versionnee : chaque developpeur qui clone le repo beneficie de la meme intelligence, quel que soit l'outil ou le modele.

### Comment ca fonctionne

```
AGENTS.md                 <- contexte projet, source unique (toujours charge)
packages/app/AGENTS.md    <- architecture du package app
CLAUDE.md, packages/app/CLAUDE.md   <- "@AGENTS.md" : Claude Code importe AGENTS.md
.claude/skills/           <- les 3 workflows, lus par Claude Code ET OpenCode
  analyze/   SKILL.md + references/     (spec, board, sizing, PO, architecte, bug, rework)
  implement/ SKILL.md + references/     (workflow, epic, e2e, bug-fix, conventions/ = regles de code)
  review/    SKILL.md + references/     (checklists structure, securite, a11y, design, fonctionnel, PR)
.claude/settings.json     <- plugin ultra11y (Claude Code)
opencode.json             <- instructions, MCP, permissions (OpenCode)
.opencode/commands/       <- /analyze, /implement, /review cote OpenCode
.opencode/plugins/        <- plugin ultra11y (OpenCode), charge depuis la devDependency
.mcp.json                 <- serveurs MCP (Claude Code) — memes serveurs que opencode.json
lefthook.yml              <- git hooks pre-commit / pre-push
scripts/quality/          <- check-patterns.sh, verify.sh
```

**Le principe qui structure tout** : ce qu'une machine peut trancher n'est pas laisse a la lecture d'un modele. Les interdits mecaniques, le lint, les types, les tests et l'audit statique RGAA tournent dans le **git pre-commit**, dans **`pnpm verify`** et dans la **CI** — identiques pour un humain, un modele frontier ou un petit modele. Le texte (skills et references, charges a la demande) ne porte que ce qui demande du jugement, et une regle vit a **un seul endroit**.

### Les 3 skills

| Commande | Ce que ca fait |
|---|---|
| `/analyze [#N] [description]` | conception — detecte epic / task / bug / rework, produit une spec validee par l'utilisateur et la poste sur l'issue |
| `/implement #N` | execution — worktree, code + tests, `pnpm verify`, `/review gates`, E2E, PR draft. Un epic se traite sous-ticket par sous-ticket (une session par sous-ticket pour paralleliser) |
| `/review [gates] \| /review #PR` | gates qualite sur le diff courant (verdict, sans rien modifier), ou traitement des threads de revue non resolus d'une PR |

### Garde-fous

| Couche | Quand | Ce qui tourne |
|---|---|---|
| **git pre-commit** (`lefthook.yml`, installe par `pnpm install`) | chaque commit | `biome check --write`, `check-patterns.sh --staged`, audit statique ultra11y |
| **git pre-push** | chaque push | typecheck |
| **`pnpm verify`** | avant de declarer une tache terminee | patterns, a11y, lint, format, typecheck, tests |
| **CI** | chaque push / PR | les memes, plus e2e, `a11y-gate`, `a11y-lite` |

`scripts/quality/check-patterns.sh` porte les interdits mecaniques sur les lignes ajoutees : suppressions de lint, `: any`, `process.env`, `../../`, `dangerouslySetInnerHTML`, `style={}`, `<svg>`, `<img>`, couleurs en dur et `@media` en SCSS, `zod` dans un routeur ou un composant, helpers `domain` re-inlines, composant sur mesure dans `src/app/`. `--self-test` verifie chaque regle.

### Accessibilite

ultra11y est le dispositif unique, a chaque etage : devDependency (moteur, pre-commit, `pnpm verify`), plugin Claude Code `ultra11y@ultra11y`, plugin OpenCode `.opencode/plugins/ultra11y.js` (gate commit / push / PR + skills `review-a11y` et `ultra11y`), serveur MCP `ultra11y`, Action CI. Detail : [`docs/accessibilite-ultra11y.md`](docs/accessibilite-ultra11y.md).

> Hooks git : si `core.hooksPath` pointe vers un repertoire inexistant dans ta config git locale, `pnpm install` le signale — lance `git config --unset core.hooksPath` puis `pnpm install`.

## Specifications completes

Les specifications detaillees sont disponibles sur le [wiki du projet](https://github.com/SocialGouv/egapro/wiki/Spec-V2).
