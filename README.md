# EgaPro

> Calcul de l'indexe de l'égalité homme / femme dans les entreprises

Ce projet est le frontend qui permet de faire une simulation-déclaration pour Egapro.

## Installer et lancer

Ajouter le fichier `.env` à la racine du projet:

```bash
cp .env.sample .env
```

Y modifier les variables d'environnement nécessaires.

```bash
yarn install
yarn build
yarn start
```

Le site est alors accessible sur http://localhost:3000.

## Tests

```bash
yarn test
```

Pour les tests e2e (à vérifier).

```bash
cd optional/e2e
yarn
yarn test
```