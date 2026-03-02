---
paths:
  - "src/server/api/**/*.ts"
---

# tRPC API

## Zod schemas in dedicated files

Define Zod input/output schemas in a `schemas.ts` file next to the router, not inline in procedure definitions.
This enables reuse across procedures and in client-side form validation.

```ts
// FORBIDDEN — inline schema
export const myRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ siren: z.string(), year: z.number() }))
    .mutation(...)
});

// CORRECT — schemas.ts
// schemas.ts
export const createInput = z.object({ siren: z.string(), year: z.number() });

// router.ts
import { createInput } from "./schemas";
export const myRouter = createTRPCRouter({
  create: protectedProcedure.input(createInput).mutation(...)
});
```

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
