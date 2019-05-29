# KINTO

## Environnement de développement

ajouter le fichier `.env`

```bash
cp .env.sample .env
```

lancer `kinto`

```bash
yarn db:start

// la première fois, initialiser kinto
yarn db:init
```

pour arrêter `kinto`

```bash
yarn db:stop

```

