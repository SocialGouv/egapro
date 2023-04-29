import { type ClearObject } from "@common/utils/types";
import { type z } from "zod";

import { type NotComputableReasonExecutiveRepEq } from "../domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { type NotComputableReasonMemberRepEq } from "../domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type PublicCompanyDTO } from "./DeclarationDTO";
import { searchConsultationSchema } from "./helpers/common";

export interface SearchRepresentationEquilibreeResultDTO {
  company: PublicCompanyDTO;
  results: Record<
    number,
    {
      executiveMenPercent: number | null;
      executiveWomenPercent: number | null;
      memberMenPercent: number | null;
      memberWomenPercent: number | null;
      notComputableReasonExecutives: NotComputableReasonExecutiveRepEq.Enum | null;
      notComputableReasonMembers: NotComputableReasonMemberRepEq.Enum | null;
    }
  >;
}

export const searchRepresentationEquilibreeDTOSchema = searchConsultationSchema;
export type SearchRepresentationEquilibreeDTO = ClearObject<z.infer<typeof searchRepresentationEquilibreeDTOSchema>>;
