# EgaPro

Index de l'égalité professionnelle femmes-hommes.

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

# Lancer les migrations de la base de données
pnpm db:migrate

# Lancer le serveur de dev
pnpm dev:app
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).