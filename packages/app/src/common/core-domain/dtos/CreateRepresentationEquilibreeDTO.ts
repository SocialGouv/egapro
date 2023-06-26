import { Email, Url } from "@common/shared-domain/domain/valueObjects";
import { type ClearObject } from "@common/utils/types";
import { zodValueObjectSuperRefine } from "@common/utils/zod";
import { z } from "zod";

import { NotComputableReasonExecutiveRepEq } from "../domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "../domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { FrenchPhoneNumber } from "../domain/valueObjects/FrenchPhoneNumber";
import { percentageSchema, repeqYearSchema, sirenSchema } from "./helpers/common";

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
    email: z.string().superRefine(zodValueObjectSuperRefine(Email)),
  }),
  periodeReference: z.object({
    endOfPeriod: z.string().nonempty("La date est requise"),
  }),
  ecartsCadres: z
    .object({
      notComputableReasonExecutives: z.nativeEnum(NotComputableReasonExecutiveRepEq.Enum, {
        required_error: "Un motif de non calculabilité est requis",
      }),
    })
    .or(
      z.object({
        executiveWomenPercent: percentageSchema,
        executiveMenPercent: percentageSchema,
      }),
    ),
  ecartsMembres: z
    .object({
      notComputableReasonMembers: z.nativeEnum(NotComputableReasonMemberRepEq.Enum, {
        required_error: "Un motif de non calculabilité est requis",
      }),
    })
    .or(
      z.object({
        memberWomenPercent: percentageSchema,
        memberMenPercent: percentageSchema,
      }),
    ),
  publication: z
    .object({
      publishDate: z.string().nonempty("La date de publication est obligatoire"),
    })
    .and(
      z
        .object({
          publishModalities: z
            .string()
            .nonempty("La description des modalités de communication des écarts est obligatoire"),
        })
        .or(
          z.object({
            publishUrl: z
              .string()
              .nonempty("L'adresse exacte de la page internet est obligatoire")
              // can't use built-in zod url() because we can skip "http*://"
              .superRefine(zodValueObjectSuperRefine(Url, "L'adresse de la page internet est invalide")),
          }),
        ),
    ),
} as const;

export const createRepresentationEquilibreeDTO = createSteps.commencer
  .and(createSteps.declarant)
  .and(createSteps.periodeReference)
  .and(createSteps.ecartsCadres)
  .and(createSteps.ecartsMembres)
  .and(
    z
      .object({
        publishDate: z.never().optional(),
      })
      .or(createSteps.publication),
  );

export type CreateRepresentationEquilibreeDTO = ClearObject<z.infer<typeof createRepresentationEquilibreeDTO>>;
