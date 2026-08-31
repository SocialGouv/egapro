---
paths:
  - "src/server/**/*.ts"
---

# Base de données & Drizzle

> Chargée sur `src/server/**`. Vérifiée par `structural-auditor` et `security-auditor`.

## Transactions

**Règle simple** : si une procédure a plus d'un `await db.` / `await tx.` dont au moins un est une écriture, elle est dans une transaction.

Deux cas, un seul remède.

**Écritures multiples** — 2 insert/update/delete séquentiels ou plus, **même sur la même table**. Sans transaction, un échec au milieu laisse un état partiel.

**Lecture puis écriture conditionnelle** — c'est le cas qu'on oublie, et c'est une vraie course : entre le `select` et l'`insert`, une requête concurrente lit la même donnée périmée et crée le doublon.

```ts
// INTERDIT — course entre la lecture et l'écriture
const existing = await db.select().from(items).where(…);
if (existing.length === 0) await db.insert(items).values(newItem);

// CORRECT
return db.transaction(async (tx) => {
  const existing = await tx.select().from(items).where(…);
  return existing.length === 0
    ? tx.insert(items).values(newItem).returning()
    : existing;
});
```

## Pas de calcul de date au niveau module

Le code au niveau module s'exécute **une fois**, à l'import : la valeur se fige et devient fausse le lendemain. Calculer les dates dans une fonction ou un handler — et pour tout ce qui touche à l'année de campagne, passer par les helpers de `~/modules/domain` (le hook bloque `getFullYear()` hors domaine).

## Casing

Les propriétés du schéma sont **toujours** en camelCase ; `casing: "snake_case"` (déclaré dans `src/server/db/index.ts` **et** `drizzle.config.ts`) fait le mapping vers les colonnes. Ne jamais écrire un nom de colonne explicite.

## Migrations

Elles sont **générées**, jamais écrites à la main.

```bash
pnpm db:generate   # produit la migration SQL + le snapshot dans drizzle/
pnpm db:migrate    # l'applique
```

- **Ne jamais éditer** un fichier de `drizzle/` — SQL, `meta/_journal.json`, snapshots. Une migration fausse se supprime et se régénère.
- **Ne jamais fabriquer d'UUID** dans un snapshot : ils viennent de Drizzle Kit.
- `pnpm db:push` est réservé au dev local (le service `migrate` du docker-compose l'utilise après le healthcheck de la base — local uniquement).
- `pnpm db:generate` peut **prompter** sur un diff ambigu : rediriger stdin depuis `/dev/null` en contexte non interactif, sinon la commande pend indéfiniment.
