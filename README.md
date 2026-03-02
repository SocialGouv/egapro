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

Le projet est configuré pour fonctionner avec [Claude Code](https://claude.com/claude-code). Les fichiers de configuration sont versionnés dans `.claude/` et `.mcp.json`.

### Serveurs MCP

Configurés dans `.mcp.json` :

| Serveur | Rôle |
|---|---|
| `dsfr` | Documentation DSFR (composants, icones, couleurs) |
| `next-devtools` | Outils de développement Next.js |
| `figma` | Intégration Figma (design-to-code) |
| `github` | Opérations GitHub (PRs, issues, reviews) |

### Rules (`.claude/rules/`)

Les rules sont chargées automatiquement selon le contexte du fichier édité :

| Fichier | Scope | Contenu |
|---|---|---|
| `code-quality.md` | Global | Imports `~/`, DRY, taille des fichiers |
| `automation.md` | Global | Hooks (lint auto, blocage inline styles/SVG) |
| `database-drizzle.md` | `src/server/**` | Transactions, Drizzle Kit, snake_case |
| `react-components.md` | `src/**/*.tsx` | Composants, JSX, accessibilite |
| `styling-dsfr.md` | `src/**/*.tsx` | Classes DSFR, SCSS modules |
| `testing.md` | `__tests__/**` | Couverture, mocks, bonnes pratiques |
| `trpc-api.md` | `src/server/api/**` | TRPCError, validation Zod |

### Commandes slash (`.claude/commands/`)

| Commande | Description |
|---|---|
| `/review-pr <PR>` | Analyse les commentaires d'une PR et applique les corrections |
| `/validate` | Lance lint, typecheck et tests |

### Hooks (`.claude/hooks/`)

| Hook | Declencheur | Action |
|---|---|---|
| `block-biome-ignore.sh` | Avant edit | Bloque les commentaires de suppression |
| `block-inline-style.sh` | Avant edit | Bloque `style={}` et `<svg>` inline |
| `post-edit-lint.sh` | Apres edit | Lance `biome check --write` automatiquement |

## Specifications completes

Les specifications detaillees sont disponibles sur le [wiki du projet](https://github.com/SocialGouv/egapro/wiki/Spec-V2).
