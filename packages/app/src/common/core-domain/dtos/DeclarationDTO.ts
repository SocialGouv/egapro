import { type CodeDepartement } from "@api/core-domain/infra/db/CodeDepartement";
import { type CodeNaf } from "@api/core-domain/infra/db/CodeNaf";
import { type CodePays } from "@api/core-domain/infra/db/CodePays";
import { type CodeRegion } from "@api/core-domain/infra/db/CodeRegion";
import { type Remunerations } from "@api/core-domain/infra/db/DeclarationRaw";
import { type EmptyObject } from "@common/utils/types";

import { type CSP } from "../domain/valueObjects/CSP";
import { type AgeRange } from "../domain/valueObjects/declaration/AgeRange";
import { type CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CorrectiveMeasures } from "../domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { type FavorablePopulation } from "../domain/valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../domain/valueObjects/declaration/indicators/NotComputableReason";

type OuiNon = "non" | "oui";

type TranchesAge = Record<AgeRange.Enum, number | null>;

export type Catégorie = { nom: string; tranches: TranchesAge };

export type IndicatorKey = keyof Pick<
  DeclarationDTO,
  | "augmentations-et-promotions"
  | "augmentations"
  | "conges-maternite"
  | "hautes-remunerations"
  | "promotions"
  | "remunerations"
>;

export type Entreprise = {
  adresse: string;
  codeNaf: CodeNaf;
  codePays?: CodePays;
  codePostal?: string;
  commune?: string;
  département?: CodeDepartement;
  raisonSociale: string;
  région?: CodeRegion;
  siren: string;
};

export type IndicatorKeyWithNC = Exclude<IndicatorKey, "hautes-remunerations">;

export const motifsNC = {
  augmentations: [NotComputableReason.Enum.EGVI40PCET, NotComputableReason.Enum.ABSAUGI],
  promotions: [NotComputableReason.Enum.EGVI40PCET, NotComputableReason.Enum.ABSPROM],
  "augmentations-et-promotions": [NotComputableReason.Enum.ABSAUGI, NotComputableReason.Enum.ETSNO5F5H],
  remunerations: [NotComputableReason.Enum.EGVI40PCET],
  "conges-maternite": [NotComputableReason.Enum.ABSRCM, NotComputableReason.Enum.ABSAUGPDTCM],
} as const;

type remunerationsRelatedSteps =
  | "remunerations-coefficient-autre"
  | "remunerations-coefficient-branche"
  | "remunerations-csp";

export const remunerationsStateFromMode = (mode: Remunerations["mode"]): remunerationsRelatedSteps =>
  mode === "csp"
    ? "remunerations-csp"
    : mode === "niveau_autre"
    ? "remunerations-coefficient-autre"
    : "remunerations-coefficient-branche";

/**
 * The shape of the state for declaration form.
 */
// export type DeclarationFormState = {
export type DeclarationDTO = {
  augmentations?:
    | {
        catégories: [
          { nom: CSP.Enum.OUVRIERS; écarts: number | null },
          { nom: CSP.Enum.EMPLOYES; écarts: number | null },
          { nom: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES; écarts: number | null },
          { nom: CSP.Enum.INGENIEURS_CADRES; écarts: number | null },
        ];
        estCalculable: "oui";
        note: number;
        populationFavorable: FavorablePopulation.Enum;
        résultat: number;
      }
    | {
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["augmentations"][number];
      };
  "augmentations-et-promotions"?:
    | {
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["augmentations-et-promotions"][number];
      }
    | {
        estCalculable: "oui";
        note: number;
        noteNombreSalaries: number;
        notePourcentage: number;
        populationFavorable: FavorablePopulation.Enum;
        résultat: number;
        résultatEquivalentSalarié: number;
      };
  commencer?: {
    annéeIndicateurs: number;
    siren: string;
  };
  "conges-maternite"?:
    | {
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["conges-maternite"][number];
      }
    | {
        estCalculable: "oui";
        note: number;
        résultat: number;
      };
  declarant?: {
    accordRgpd: boolean;
    email: string;
    nom: string;
    prénom: string;
    téléphone: string;
  };
  "declaration-existante": {
    date?: string | undefined;
    status: "consultation" | "creation" | "edition";
  };
  entreprise?: { entrepriseDéclarante: Entreprise; tranche?: CompanyWorkforceRange.Enum; type?: "entreprise" | "ues" };
  "hautes-remunerations"?: {
    note: number;
    populationFavorable: FavorablePopulation.Enum;
    résultat: number;
  };
  "periode-reference"?:
    | {
        effectifTotal: number;
        finPériodeRéférence: string;
        périodeSuffisante: "oui";
      }
    | {
        périodeSuffisante: "non";
      };
  promotions?:
    | {
        catégories: [
          { nom: "ouv"; écarts: number | null },
          { nom: "emp"; écarts: number | null },
          { nom: "tam"; écarts: number | null },
          { nom: "ic"; écarts: number | null },
        ];
        estCalculable: "oui";
        note: number;
        populationFavorable: FavorablePopulation.Enum;
        résultat: number;
      }
    | {
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["promotions"][number];
      };

  publication?: { date: string; planRelance: OuiNon } & (
    | {
        choixSiteWeb: "non";
        modalités: string;
      }
    | {
        choixSiteWeb: "oui";
        url: string;
      }
  );
  remunerations?:
    | {
        cse?: OuiNon;
        dateConsultationCSE?: string;
        estCalculable: "oui";
        mode: Remunerations["mode"];
      }
    | {
        déclarationCalculCSP: boolean;
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["remunerations"][number];
      };
  "remunerations-coefficient-autre"?: {
    catégories: Catégorie[];
  };

  "remunerations-coefficient-branche"?: {
    catégories: Catégorie[];
  };
  "remunerations-csp"?: {
    catégories: [
      { nom: "ouv"; tranches: TranchesAge },
      { nom: "emp"; tranches: TranchesAge },
      { nom: "tam"; tranches: TranchesAge },
      { nom: "ic"; tranches: TranchesAge },
    ];
  };
  "remunerations-resultat"?: {
    note: number;
    populationFavorable: FavorablePopulation.Enum;
    résultat: number;
  };
  "resultat-global"?: {
    index?: number;
    mesures: CorrectiveMeasures.Enum;
    points: number;
    pointsCalculables: number;
  };
  ues?: {
    entreprises: Array<{
      raisonSociale: string;
      siren: string;
    }>;
    nom: string;
  };
  "validation-transmission"?: EmptyObject;
};

export type EditDeclarationDTO = DeclarationDTO;
export type CreateDeclarationDTO = Omit<EditDeclarationDTO, "id">;
