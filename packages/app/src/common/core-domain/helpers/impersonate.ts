import { z } from "zod";

import { sirenSchema } from "../dtos/helpers/common";

export const impersonatedSessionSchema = z.object({
  user: z.object({
    staff: z.literal(false),
    companies: z
      .array(
        z.object({
          label: z.string(),
          siren: sirenSchema,
        }),
      )
      .length(1),
  }),
  staff: z.object({
    impersonating: z.literal(true),
  }),
});

export type ImpersonatedSession = z.infer<typeof impersonatedSessionSchema>;

export function assertImpersonatedSession(data: unknown): asserts data is ImpersonatedSession {
  impersonatedSessionSchema.parse(data);
}
