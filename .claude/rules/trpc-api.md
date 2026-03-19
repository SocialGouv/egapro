---
paths:
  - "src/server/api/**/*.ts"
---

# tRPC API

## Zod schemas in module folders (shared frontend/backend)

Zod schemas live in `src/modules/{domain}/schemas.ts` — **never** in `src/server/api/routers/`.
Routers import schemas from modules. Forms use the same schemas via `useZodForm`.

```ts
// FORBIDDEN — inline schema in router
export const myRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ siren: z.string(), year: z.number() }))
    .mutation(...)
});

// FORBIDDEN — schema in src/server/api/routers/schemas.ts
import { createInput } from "./schemas";

// CORRECT — schema in src/modules/{domain}/schemas.ts
import { createInput } from "~/modules/myDomain/schemas";
export const myRouter = createTRPCRouter({
  create: protectedProcedure.input(createInput).mutation(...)
});
```

Router files must **never** `import { z } from "zod"` — all Zod usage is in module schema files.

## TRPCError with proper codes

Always throw `TRPCError` (not plain `Error`) with the appropriate HTTP-semantic code:
- `NOT_FOUND` — resource does not exist
- `BAD_REQUEST` — invalid input that passed Zod
- `FORBIDDEN` — user lacks permission
- `UNAUTHORIZED` — user not authenticated
- `CONFLICT` — duplicate or state conflict
- `INTERNAL_SERVER_ERROR` — unexpected failure

## No raw SQL

Use Drizzle query builder. Raw SQL is a last resort and must be reviewed for injection risks.
