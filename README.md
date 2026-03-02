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

## Configuration AI (Claude Code)

Le projet est entierement configure pour [Claude Code](https://claude.com/claude-code). Toute la configuration est versionnee dans `.claude/` et `.mcp.json`, ce qui signifie que chaque developpeur qui clone le repo beneficie automatiquement de toute l'intelligence du projet.

### Comment ca fonctionne

Claude Code utilise un systeme de couches qui s'activent automatiquement :

```
.claude/
  settings.json           ← Configuration des hooks (pre/post edit)
  hooks/                  ← Scripts shell executes automatiquement
  rules/                  ← Regles chargees selon le contexte du fichier edite
  agents/                 ← Sous-agents specialises (read-only, delegues automatiquement)
  skills/                 ← Workflows invocables manuellement via /commande

CLAUDE.md (racine)        ← Instructions globales du projet (toujours chargees)
packages/app/CLAUDE.md    ← Conventions specifiques au package app (chargees quand on travaille dans packages/app/)
.mcp.json                 ← Serveurs MCP (DSFR, Figma, GitHub, Next.js)
```

**Principe** : les `CLAUDE.md` donnent le contexte general, les `rules/` ajoutent des regles specifiques au type de fichier edite, les `hooks/` bloquent ou corrigent automatiquement, et les `agents/` fournissent des checklists specialisees pour les audits.

### Serveurs MCP (`.mcp.json`)

Les serveurs MCP ajoutent des outils que Claude peut appeler pendant le dev :

| Serveur | Role | Exemple d'utilisation |
|---|---|---|
| `dsfr` | Documentation DSFR | Verifier la structure HTML d'un composant DSFR avant de l'ecrire |
| `next-devtools` | Dev tools Next.js | Diagnostics, erreurs de compilation, routes disponibles |
| `figma` | Integration Figma | Extraire le design d'un ecran Figma pour le coder |
| `github` | Operations GitHub | Lire les commentaires d'une PR, creer des issues |

### Rules (`.claude/rules/`)

Les rules sont des fichiers markdown charges **automatiquement** par Claude selon le fichier en cours d'edition. Chaque rule a un `paths:` dans son frontmatter qui definit quand elle s'active.

| Fichier | S'active quand on edite... | Contenu |
|---|---|---|
| `code-quality.md` | *(toujours)* | TypeScript strict, naming, imports `~/`, DRY, env vars, taille fichiers |
| `automation.md` | *(toujours)* | Gates auto, hooks, agents, skills — orchestration globale |
| `database-drizzle.md` | `src/server/**/*.ts` | Transactions obligatoires, Drizzle Kit, casing snake_case |
| `react-components.md` | `src/**/*.tsx` | Pas de logique dans le JSX, pas d'inline SVG, granularite |
| `styling-dsfr.md` | `src/**/*.tsx`, `src/**/*.scss` | DSFR first, tokens couleur, breakpoints SASS, runtime DSFR |
| `testing.md` | `src/**/__tests__/**` | Couverture 100%, mocks centralises dans setup.ts |
| `trpc-api.md` | `src/server/api/**/*.ts` | Zod schemas dans schemas.ts, TRPCError avec codes HTTP |

### Hooks (`.claude/hooks/`)

Les hooks sont des scripts shell executes **automatiquement** a chaque action de Claude. Ils ne necessitent aucune intervention.

| Hook | Quand | Ce qu'il fait |
|---|---|---|
| `block-bad-patterns.sh` | **Avant** chaque edit de fichier | Bloque les patterns interdits : `biome-ignore`, `@ts-ignore`, `style={}`, `<svg>` inline. L'edit est rejete, Claude doit trouver une autre approche. |
| `auto-lint.sh` | **Apres** chaque edit ou commande bash | Lance `biome check --write` pour auto-corriger le formatage et le lint. Apres un edit : corrige le fichier edite. Apres `pnpm test/build/typecheck` : corrige tous les fichiers modifies. |

### Agents (`.claude/agents/`)

Les agents sont des sous-processus specialises avec leur propre checklist. Ils tournent sur un modele rapide (Sonnet), sont **read-only** (ils rapportent les problemes mais ne modifient rien), et sont delegues automatiquement par les skills et les quality gates.

| Agent | Checklist | Utilise par |
|---|---|---|
| `code-reviewer` | 15 points : logique JSX, duplication, naming, inline styles, transactions DB, Zod schemas... | `/review-pr`, gate PR |
| `rgaa-auditor` | 13 themes RGAA complets : images, formulaires, navigation, structure, couleurs, modales... | `/audit-rgaa`, gate RGAA |
| `security-auditor` | OWASP Top 10 + RGS : injection, auth, acces, secrets, headers, SSRF... | `/audit-secu`, gate securite |

### Skills (`.claude/skills/`)

Les skills sont des workflows complexes invocables avec `/commande`. Ils orchestrent des agents en parallele pour aller vite.

| Commande | Ce que ca fait |
|---|---|
| `/validate` | Lance **3 agents en parallele** : typecheck + tests + lint. Corrige et relance si echec. |
| `/review-pr` | Detecte la PR de la branche, fetch les commentaires GH, lance le code-reviewer, applique les fixes, valide. |
| `/audit-rgaa` | Decoupe les fichiers en batches, lance des agents rgaa-auditor en parallele, auto-fix les erreurs, genere un rapport. |
| `/audit-secu` | Lance 4 agents paralleles (server, client, config, deps), auto-fix les critiques/high, genere un rapport. |
| `/create-page` | Workflow 4 phases : analyse Figma (//), code partage, pages en parallele (worktrees), qualite (//). |

### Gates automatiques (`.claude/rules/automation.md`)

Les gates sont le coeur de l'automatisation. Elles se declenchent **toutes seules** sans aucune commande :

| Gate | Se declenche quand... | Ce qui se passe |
|---|---|---|
| **Validation** | Claude finit une tache | 3 agents paralleles verifient typecheck + tests + lint avant de reporter "termine" |
| **RGAA** | Claude modifie un `.tsx` | Verification inline de l'accessibilite (labels, alt, aria, landmarks, headings) |
| **Securite** | Claude modifie `server/` ou tRPC | Verification inline OWASP (Drizzle, Zod, ownership, process.env, transactions) |
| **PR review** | La branche a une PR ouverte | Auto-fetch des commentaires non resolus, signalement avant de commencer |

### Workflow type

Quand un developpeur demande "ajoute une page de profil" :

1. Claude charge `CLAUDE.md` + `packages/app/CLAUDE.md` (contexte global)
2. Les rules `react-components.md` et `styling-dsfr.md` s'activent pour les fichiers `.tsx`
3. Le hook `block-bad-patterns` empeche d'ecrire du code interdit
4. Le hook `auto-lint` formate automatiquement chaque fichier edite
5. La gate RGAA verifie l'accessibilite inline
6. La gate Validation lance 3 agents paralleles a la fin
7. Si la branche a une PR, la gate PR review signale les commentaires non resolus

## Specifications completes

Les specifications detaillees sont disponibles sur le [wiki du projet](https://github.com/SocialGouv/egapro/wiki/Spec-V2).
