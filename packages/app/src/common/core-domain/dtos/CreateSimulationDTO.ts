import { type ClearObject } from "@common/utils/types";
import { z } from "zod";

import { CSP } from "../domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { CSPAgeRange } from "../domain/valueObjects/declaration/simulation/CSPAgeRange";

const nonnegativeNanSafe = z
  .number()
  .nonnegative()
  .default(0)
  .transform(v => (isNaN(v) ? 0 : v));
export const createSteps = {
  effectifs: z.object({
    workforceRange: z.nativeEnum(CompanyWorkforceRange.Enum, {
      required_error: "La tranche d'effectif est requise",
      invalid_type_error: "La tranche d'effectif est requise",
    }),
    csp: z.array(
      z.object({
        name: z.nativeEnum(CSP.Enum),
        ageRange: z.record(
          z.nativeEnum(CSPAgeRange.Enum),
          z.object({ women: nonnegativeNanSafe, men: nonnegativeNanSafe }),
        ),
      }),
    ),
  }),
} as const;

export const createSimulationDTO = createSteps.effectifs;
// .and(createSteps.declarant)
// .and(createSteps.periodeReference)
// .and(createSteps.ecartsCadres)
// .and(createSteps.ecartsMembres)
// .and(
//   z
//     .object({
//       publishDate: z.never().optional(),
//     })
//     .or(createSteps.publication),
// );

export type CreateSimulationDTO = ClearObject<z.infer<typeof createSimulationDTO>>;
