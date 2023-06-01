import { type ClearObject } from "@common/utils/types";
import { zodValueObjectSuperRefine } from "@common/utils/zod";
import { z } from "zod";

import { FrenchPhoneNumber } from "../domain/valueObjects/FrenchPhoneNumber";
import { repeqYearSchema, sirenSchema } from "./helpers/common";

export const createSteps = {
  commencer: z.object({
    year: repeqYearSchema,
    siren: sirenSchema,
  }),
  declarant: z.object({
    lastname: z.string().nonempty("Le nom est requis"),
    firstname: z.string().nonempty("Le prénom est requis"),
    phoneNumber: z
      .string()
      .nonempty("Le numéro de téléphone est requis")
      .superRefine(zodValueObjectSuperRefine(FrenchPhoneNumber, "Le numéro de téléphone est invalide")),
    gdpr: z.boolean().refine(gdpr => gdpr, "L'accord est requis"),
    email: z.string().email(),
  }),
  periodeReference: z.object({
    endOfPeriod: z.string().nonempty("La date est requise"),
  }),
} as const;

export const createRepresentationEquilibreeDTO = createSteps.commencer
  .and(createSteps.declarant)
  .and(createSteps.periodeReference);

export type CreateRepresentationEquilibreeDTO = ClearObject<z.infer<typeof createRepresentationEquilibreeDTO>>;
