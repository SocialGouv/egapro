---
paths:
  - "src/server/api/**/*.ts"
---

# API tRPC

> Chargée sur `src/server/api/**`. Vérifiée par `structural-auditor` et `security-auditor`.

## Schémas

Les schémas Zod vivent dans `src/modules/{domaine}/schemas.ts`, **jamais** dans `src/server/api/routers/`. Le routeur les importe, le formulaire importe les mêmes via `useZodForm` — un seul schéma valide les deux côtés. Un fichier de routeur ne fait donc **jamais** `import { z } from "zod"` (bloqué par le hook).

## Accès

- Toute procédure non publique est un `protectedProcedure`, pas un `publicProcedure`.
- **Toute mutation vérifie la propriété** : le `userId` vient de la session, jamais de l'input client. Un identifiant fourni par le client ne sert qu'à désigner la ressource, jamais à autoriser l'accès.
- Écriture multiple ou lecture-puis-écriture → `db.transaction()` (`rules/database-drizzle.md`).
- Toute mutation, et toute query exposant des données sensibles, se câble à l'audit (`rules/audit-logging.md`).

## Erreurs

Toujours `TRPCError`, jamais un `Error` nu, avec le code qui porte la sémantique HTTP :

`NOT_FOUND` (n'existe pas) · `BAD_REQUEST` (entrée invalide passée à travers Zod) · `FORBIDDEN` (droits insuffisants) · `UNAUTHORIZED` (non authentifié) · `CONFLICT` (doublon ou conflit d'état) · `INTERNAL_SERVER_ERROR` (échec inattendu).

## Requêtes

Query builder Drizzle uniquement. Le SQL brut est un dernier recours, et il passe alors par une revue d'injection explicite.
