import { type NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { type NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { type DeclarationDTO as DeclarationDataRaw } from "@common/models/generated";
import { type Enum } from "@common/shared-domain/domain/valueObjects";

export interface DeclarationRaw {
  data: DeclarationDataRaw | null;
  declarant: string;
  declared_at: Date;
  draft: DeclarationDataRaw | null;
  ft: string;
  legacy: DeclarationDataRaw | null;
  modified_at: Date;
  siren: string;
  year: number;
}

export interface RepresentationEquilibreeRaw {
  data?: DeclarationDataRaw;
  declared_at: Date;
  ft: string;
  modified_at: Date;
  siren: string;
  year: number;
}

type NotComputableReasonString = Enum.ToString<typeof NotComputableReason.Enum>;
export interface DeclarationSearchResultRaw {
  data: Record<number, DeclarationDataRaw>;
  name: string;
  results: Record<
    number,
    {
      highRemunerationsScore: number | null;
      index: number | null;
      maternityLeavesScore: number | null;
      notComputableReasonMaternityLeaves: NotComputableReasonString | null;
      notComputableReasonPromotions: NotComputableReasonString | null;
      notComputableReasonRemunerations: NotComputableReasonString | null;
      notComputableReasonSalaryRaises: NotComputableReasonString | null;
      notComputableReasonSalaryRaisesAndPromotions: NotComputableReasonString | null;
      promotionsScore: number | null;
      remunerationsScore: number | null;
      salaryRaisesAndPromotionsScore: number | null;
      salaryRaisesScore: number | null;
    }
  >;
  siren: string;
}

export { type DeclarationStatsDTO as DeclarationStatsRaw } from "@common/core-domain/dtos/SearchDeclarationDTO";

export interface RepresentationEquilibreeSearchResultRaw {
  data: DeclarationDataRaw;
  results: Record<
    number,
    {
      executiveMenPercent: number | null;
      executiveWomenPercent: number | null;
      memberMenPercent: number | null;
      memberWomenPercent: number | null;
      notComputableReasonExecutives: Enum.ToString<typeof NotComputableReasonExecutiveRepEq.Enum> | null;
      notComputableReasonMembers: Enum.ToString<typeof NotComputableReasonMemberRepEq.Enum> | null;
    }
  >;
}

export interface OwnershipRequestRaw {
  asker_email: string;
  created_at: string;
  email: string | null;
  error_detail: ErrorDetailTuple | null;
  id: string;
  modified_at: string;
  siren: string | null;
  status: string;
}

export interface OwnershipRaw {
  email: string;
  siren: string;
}

export interface ReferentRaw {
  county: string | null;
  id: string;
  name: string;
  principal: boolean;
  region: string;
  substitute_email: string | null;
  substitute_name: string | null;
  type: string;
  value: string;
}
