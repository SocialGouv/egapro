import { type CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { type NotComputableReasonMaternityLeaves } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMaternityLeaves";
import { type NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type NotComputableReasonPromotions } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonPromotions";
import { type NotComputableReasonRemunerations } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonRemunerations";
import { type NotComputableReasonSalaryRaises } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonSalaryRaises";
import { type NotComputableReasonSalaryRaisesAndPromotions } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonSalaryRaisesAndPromotions";
import { type ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import {
  type CodeNaf,
  type CodePays,
  type DeclarationDTO as DeclarationDataRaw,
  type Departement,
  type Region,
  type RepresentationEquilibree,
} from "@common/models/generated";
import { type Enum } from "@common/shared-domain/domain/valueObjects";

export interface RepresentationEquilibreeDataRaw {
  déclarant: Required<DeclarationDataRaw["déclarant"]>;
  déclaration: {
    année_indicateurs: number;
    date: string;
    fin_période_référence: string;
    publication?: {
      date: string;
      modalités?: string;
      url?: string;
    };
  };
  entreprise: {
    adresse?: string;
    code_naf: CodeNaf;
    code_pays?: CodePays;
    code_postal?: string;
    commune?: string;
    département?: Departement;
    raison_sociale: string;
    région?: Region;
    siren: string;
  };
  indicateurs: {
    représentation_équilibrée: RepresentationEquilibree;
  };
  source?: "repeqV2";
}

export interface RepresentationEquilibreeRaw {
  data: RepresentationEquilibreeDataRaw;
  declared_at: Date;
  ft: string;
  modified_at: Date;
  siren: string;
  year: number;
}

export interface DeclarationSearchResultRaw {
  data: Record<number, DeclarationDataRaw>;
  name: string;
  results: Record<
    number,
    {
      highRemunerationsScore: number | null;
      index: number | null;
      maternityLeavesScore: number | null;
      notComputableReasonMaternityLeaves: NotComputableReasonMaternityLeaves.Enum | null;
      notComputableReasonPromotions: NotComputableReasonPromotions.Enum | null;
      notComputableReasonRemunerations: NotComputableReasonRemunerations.Enum | null;
      notComputableReasonSalaryRaises: NotComputableReasonSalaryRaises.Enum | null;
      notComputableReasonSalaryRaisesAndPromotions: NotComputableReasonSalaryRaisesAndPromotions.Enum | null;
      promotionsScore: number | null;
      remunerationsScore: number | null;
      salaryRaisesAndPromotionsScore: number | null;
      salaryRaisesScore: number | null;
    }
  >;
  siren: string;
}

export type AdminDeclarationRaw = {
  created_at: Date;
  declarant_email: string;
  declarant_firstname: string;
  declarant_lastname: string;
  name: string;
  siren: string;
  type: "index" | "repeq";
  year: number;
} & (
  | { index: null; type: "repeq"; ues: null }
  | { index: number; type: "index"; ues: DeclarationDataRaw["entreprise"]["ues"] }
);
export { type DeclarationStatsDTO as DeclarationStatsRaw } from "@common/core-domain/dtos/SearchDeclarationDTO";

export interface RepresentationEquilibreeSearchResultRaw {
  company: RepresentationEquilibreeRaw["data"]["entreprise"];
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

export interface RepresentationEquilibreeSearchRaw {
  declared_at: Date;
  departement: string | null;
  ft: string;
  region: string | null;
  section_naf: string;
  siren: string;
  year: number;
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

type WorkforceRange = Enum.ToString<typeof CompanyWorkforceRange.Enum>;
export interface PublicStatsRaw {
  /** Index moyen */
  "index.average": string;
  /** Index moyen par tranche d'effectifs assujettis */
  "index.averageByWorkforceRange": Partial<Record<WorkforceRange, number | null>>;
  /** Répondants */
  "index.count": string;
  /** Répondants par tranche d'effectifs assujettis */
  "index.countByWorkforceRange": Partial<Record<WorkforceRange, number | null>>;
  /** Index moyen par année (trois dernières années) */
  "index.lastThreeYearsAverage": Record<string, number | null>;
  /** Nombre de répondants */
  "representation_equilibree.count": string;
  /** Répartition des femmes dans les instances dirigeantes */
  "representation_equilibree.countWomen30percentExecutives.gt": string;
  "representation_equilibree.countWomen30percentExecutives.lte": string;
  "representation_equilibree.countWomen30percentExecutives.nc": string;
  /** Répartition des femmes parmi les cadres dirigeants */
  "representation_equilibree.countWomen30percentMembers.gt": string;
  "representation_equilibree.countWomen30percentMembers.lte": string;
  "representation_equilibree.countWomen30percentMembers.nc": string;
  year: number;
}
