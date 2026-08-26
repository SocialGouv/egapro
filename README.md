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
| **G** | **Écart par catégories de salariés** | **Écart de rémunération (base + variable) par catégorie d'emploi — calculé par l'entreprise** |

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

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Connexion ProConnect (environnement de test)

En développement local, l'authentification utilise le fournisseur d'identité de test **FIA1V2** de ProConnect. Pour se connecter :

1. Cliquer sur **S'identifier avec ProConnect**
2. Saisir l'email : `test@fia1.fr`
3. Cliquer sur **Se connecter**

## Scripts utiles

| Commande | Description |
|---|---|
| `pnpm dev:app` | Serveur de développement (port 3000) |
| `pnpm build` | Build de tous les packages |
| `pnpm lint:check` | Vérification du lint |
| `pnpm format:check` | Vérification du formatage |
| `pnpm typecheck` | Vérification des types TypeScript |
| `pnpm test` | Tests unitaires |
| `pnpm test:e2e` | Tests E2E Playwright (nécessite le serveur sur le port 3000) |
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

## Configuration AI (Claude Code)

Le projet est entierement configure pour [Claude Code](https://claude.com/claude-code). Toute la configuration est versionnee dans `.claude/` et `.mcp.json` : chaque developpeur qui clone le repo beneficie automatiquement de toute l'intelligence du projet.

### Comment ca fonctionne

```
.claude/
  settings.json           <- hooks + plugins
  hooks/                  <- scripts shell executes automatiquement
  rules/                  <- socle produit et code, charge selon le fichier edite
  pipeline/               <- mecanique d'orchestration, JAMAIS charge automatiquement
  agents/                 <- sous-agents specialises
  skills/                 <- workflows invocables via /commande

CLAUDE.md (racine)        <- contexte projet (toujours charge)
packages/app/CLAUDE.md    <- architecture du package app (charge quand on y travaille)
.mcp.json                 <- serveurs MCP (DSFR, Figma, GitHub, Next.js)
```

**Le principe qui structure tout** : une regle vit a **un seul endroit**, et ce qu'une machine decide n'est pas re-enonce en prose. Les hooks bloquent mecaniquement, les `rules/` portent ce qui demande du jugement, les `agents/` rapportent, et `pipeline/` decrit l'orchestration — jamais chargee automatiquement, ouverte a la demande.

### Rules (`.claude/rules/`)

Chargees **automatiquement** selon le `paths:` de leur frontmatter. Trois n'en ont pas et sont donc toujours en contexte, parce qu'elles s'appliquent a toute action.

| Fichier | S'active sur | Contenu |
|---|---|---|
| `automation.md` | *(toujours)* | les 22 patterns bloques par le hook, les 4 gates, la verif avant push |
| `rgaa.md` | *(toujours)* | accessibilite RGAA 4.1.2 / WCAG 2.2 AA — le dispositif ultra11y |
| `git-artefact-hygiene.md` | *(toujours)* | depot public : zero secret, scrubbing du PII et de l'infra |
| `code-quality.md` | `src/**/*.{ts,tsx,js,jsx}` | source unique d'une regle metier, DRY, nommage, pas de commentaire |
| `react-components.md` | `src/**/*.tsx` | pas de logique dans le JSX, granularite, `useEffect`, `useId` |
| `styling-dsfr.md` | `src/**/*.{tsx,scss}` | cascade DSFR, tokens de couleur, breakpoints, runtime DSFR |
| `figma-workflow.md` | `src/**/*.{tsx,scss}` | construire depuis un node Figma : traduction des tokens, les pieges |
| `visual-quality-validation.md` | `src/**/*.{tsx,scss}` | verifier le rendu : mesure DOM, overlay, contrats de fidelite |
| `bug-fix-workflow.md` | `src/**/*.{ts,tsx}` | reproduire, cause racine, revert-verify, consigner |
| `database-drizzle.md` | `src/server/**/*.ts` | transactions obligatoires, casing, migrations generees |
| `trpc-api.md` | `src/server/api/**/*.ts` | schemas Zod hors routeurs, ownership, codes `TRPCError` |
| `audit-logging.md` | routeurs, route handlers, auth, audit | les 3 points de cablage d'une action auditee |
| `demarche-state-machine.md` | parcours de declaration, Mon espace, regles serveur, E2E | l'autorite unique du graphe d'etats |
| `testing.md` | `src/**/__tests__/**` | couverture, frontieres de mock, pieges rencontres |
| `e2e.md` | `src/e2e/**` | peu de scenarios riches, couverture des pages, port 3000 |

### Pipeline (`.claude/pipeline/`)

**Jamais charge automatiquement** — lu a la demande par les skills, les agents pipeline et `scripts/orchestration/`. Une session de travail directe n'a aucun usage du board GitHub ni du format de spec des tickets.

| Fichier | Contenu |
|---|---|
| `orchestration.md` | la pipeline de bout en bout : agents, skills, scripts, modele de branches |
| `board.md` | les IDs du board **EGAPRO V2** (non devinables) et les pieges GraphQL |
| `ticket-spec-format.md` | ce qu'un spec de ticket porte, et ou il vit selon le type d'issue |
| `complexity-estimation.md` | la rubrique de sizing t-shirt et ses anchors |

### Hooks (`.claude/hooks/`)

Executes **automatiquement**, sans intervention.

| Hook | Quand | Ce qu'il fait |
|---|---|---|
| `block-bad-patterns.sh` | **avant** chaque edit | bloque **22 patterns** : suppressions de lint, `: any`, `process.env`, `../../`, `dangerouslySetInnerHTML`, `style={}`, `<svg>`, `<img>`, couleurs en dur et `@media` en SCSS, `zod` dans un routeur ou un composant, helpers `domain` re-inlines, composant sur mesure dans `src/app/`. L'edit est rejete |
| `auto-lint.sh` | **apres** chaque edit ou commande bash | `biome check --write` sur le fichier edite, ou sur tous les fichiers modifies apres un `pnpm test/build/typecheck` |
| `check-pr-reviews.sh` | au premier message d'une session | signale les commentaires de review non resolus sur la PR de la branche courante |

### Agents (`.claude/agents/`)

Chaque agent porte son couple `model:` / `effort:` en frontmatter, et les invocations CLI headless repassent les memes valeurs en `--model` / `--effort` : la redondance est volontaire, aucune precedence ne peut produire de divergence.

| Agent | Role | Modele | Effort |
|---|---|---|---|
| `validator` | typecheck + tests + lint + format en parallele | sonnet | low |
| `structural-auditor` | greps mecaniques, fuites du domaine, affaiblissement de test | sonnet | high |
| `rgaa-auditor` | lance le skill ultra11y `review-a11y` sur le code modifie | sonnet | high |
| `security-auditor` | OWASP Top 10 + RGS, cible sur les mecanismes du projet | sonnet | high |
| `code-dev` | implemente un ticket end-to-end **et ecrit ses tests vitest** | passe en `--model` : sonnet, opus si `complexe` | xhigh |
| `e2e-dev` | ecrit tous les tests Playwright, en fin de pipeline | opus | xhigh |
| `functional-validator` | rejoue les scenarios PO sur le dev server | sonnet | medium |
| `design-validator` | mesure la fidelite visuelle contre le Figma | sonnet | xhigh |
| `product-owner`, `bug-analyst`, `architect-rework` | conception : besoin, diagnostic, rework | opus | xhigh |
| `architect` | decoupage et redaction des specs | fable | xhigh |
| `review-fixer` | adresse les commentaires de revue | sonnet | high |
| `doc-writer` | regenere `docs/` depuis le code | sonnet | medium |

Les quatre premiers sont **read-only** : ils rapportent, l'agent principal corrige.

### Skills (`.claude/skills/`)

| Commande | Ce que ca fait |
|---|---|
| `/analyse [#N] [description]` | phase conception — detecte epic / task / bug et invoque les agents adaptes |
| `/implement #N` | phase execution — loop background pour un epic, `code-dev` synchrone pour une task ou un bug |
| `/review [#N \| #PR]` | adresse les commentaires de review (humains + bots) |
| `/report [#N]` | dashboard des agents actifs et de l'etat des sous-tickets |
| `/doc [#N]` | regenere `docs/features.md`, `architecture.md`, `parcours-utilisateurs.md` |
| `/open #PR` | recree un worktree local pour tester une PR |
| `/velocity [sprint]` | velocite des sprints termines + capacite conseillee |
| `/plan-sprint [sprint]` | planifie le prochain sprint (capacite, report, backlog) |

### Gates automatiques

Elles se declenchent **toutes seules**, sans commande.

| Gate | Se declenche quand... | Ce qui se passe |
|---|---|---|
| **Validation** | une tache se termine | 4 agents paralleles (typecheck/tests/lint, structure, RGAA, securite) avant de reporter « termine » |
| **RGAA** | un `.tsx` est modifie | `rgaa-auditor` lance le moteur ultra11y sur le diff. Pas de checklist ecrite a la main : deux jeux de regles sur un meme sujet divergent |
| **Securite** | `server/` ou tRPC est modifie | `security-auditor` sur les mecanismes du projet (ownership, `~/env.js`, Drizzle, audit) |
| **Patterns interdits** | a chaque edit | le hook bloque avant l'ecriture — rien a lancer |
| **PR review** | la branche a une PR ouverte | les commentaires non resolus sont signales en debut de session |

### Workflow type

« Ajoute une page de profil » :

1. `CLAUDE.md` + `packages/app/CLAUDE.md` donnent le contexte
2. `code-quality.md`, `react-components.md`, `styling-dsfr.md`, `figma-workflow.md` s'activent sur les `.tsx`
3. `block-bad-patterns` empeche d'ecrire du code interdit, `auto-lint` formate
4. les 4 gates tournent en parallele avant que la tache soit declaree finie
5. si la branche a une PR, les commentaires non resolus sont signales

## Specifications completes

Les specifications detaillees sont disponibles sur le [wiki du projet](https://github.com/SocialGouv/egapro/wiki/Spec-V2).
