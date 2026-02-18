# EgaPro

Index de l'égalité professionnelle femmes-hommes.

## Prérequis

- Node.js >= 20.9 (voir [`.nvmrc`](.nvmrc))
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) & Docker Compose

## Installation

```bash
# Installer les dépendances
pnpm install

# Copier le fichier d'environnement
cp packages/app/.env.example packages/app/.env
```

## Lancer l'application

```bash
# Démarrer la base de données
docker compose up -d

# Lancer le serveur de dev
pnpm dev:app
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Autres commandes

```bash
pnpm build:app   # Build de production
pnpm lint:app    # Linter
pnpm test:app    # Tests
pnpm test:e2e    # Tests end-to-end (Cypress)
```
