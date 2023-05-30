import { z } from "zod";

import { repeqYearSchema, sirenSchema } from "./helpers/common";

export const createSteps = {
  commencer: z.object({
    year: repeqYearSchema,
    siren: sirenSchema,
  }),
} as const;

export const createRepresentationEquilibreeDTO = createSteps.commencer;

export type CreateRepresentationEquilibreeDTO = z.infer<typeof createRepresentationEquilibreeDTO>;
