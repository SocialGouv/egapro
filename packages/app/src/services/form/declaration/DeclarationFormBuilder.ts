import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationDTO, type PopulationFavorable } from "@common/models/generated";
import { type EmptyObject } from "@common/utils/types";

import { buildEntreprise, type Entreprise } from "./entreprise";

type OuiNon = "non" | "oui";

export const TrancheOptions = [
  { label: "De 50 à 250 inclus", value: "50:250" },
  { label: "De 251 à 999 inclus", value: "251:999" },
  { label: "De 1000 ou plus", value: "1000:" },
] as const;

export type TrancheValues = (typeof TrancheOptions)[number]["value"];

type TranchesAge = {
  "30:39": number;
  "40:49": number;
  "50:": number;
  ":29": number;
};

export type Catégorie = { nom: string; tranches: TranchesAge };

export const labelsMotifNC = {
  egvi40pcet: "Effectif des groupes valides inférieur à 40% de l'effectif total",
  absaugi: "Absence d'augmentations individuelles",
  etsno5f5h: "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes",
  absprom: "Absence de promotions",
  absaugpdtcm: "Absence d'augmentations pendant ce congé",
  absrcm: "Absence de retours de congé maternité",
} as const;

export const motifsNC = {
  augmentations: ["egvi40pcet", "absaugi"],
  promotions: ["egvi40pcet", "absprom"],
  "augmentations-et-promotions": ["absaugi", "egvi40pcet", "etsno5f5h"],
  remunerations: ["egvi40pcet"],
  "conges-maternite": ["absrcm", "absaugpdtcm"],
} as const;

/**
 * The shape of the state for declaration form.
 */
export type DeclarationFormState = {
  augmentations?: EmptyObject;
  "augmentations-et-promotions"?: {
    estCalculable: OuiNon;
    motifNonCalculabilité?: (typeof motifsNC)["augmentations-et-promotions"][number];
    note: number;
    populationFavorable: PopulationFavorable;
    résultat: number;
    résultatEquivalentSalarié: number;
  };
  commencer?: {
    annéeIndicateurs: number;
    entrepriseDéclarante?: Entreprise;
  };
  "conges-maternite"?:
    | {
        estCalculable: OuiNon;
        motifNonCalculabilité: (typeof motifsNC)["conges-maternite"][number];
      }
    | {
        estCalculable: OuiNon;
        resultat: number;
      };
  // Only filled by the backend.
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
  entreprise?: { tranche: TrancheValues; type: "entreprise" | "ues" };
  "hautes-remunerations"?: {
    populationFavorable: PopulationFavorable;
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
  promotions?: EmptyObject;
  publication?: EmptyObject;
  remunerations?: {
    cse?: OuiNon;
    dateConsultationCSE?: string;
    déclarationCalculCSP?: boolean;
    estCalculable: OuiNon;
    // mode?: "csp" | "niveau_autre" | "niveau_branche";
    mode?: RemunerationsMode.Enum;
    motifNonCalculabilité?: (typeof motifsNC)["remunerations"][number];
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
    populationFavorable: PopulationFavorable;
    résultat: number;
  };
  "resultat-global"?: EmptyObject;
  ues?: {
    entreprises: Array<{
      raisonSociale: string;
      siren: string;
    }>;
    nom: string;
  };
  "validation-transmission"?: EmptyObject;
};

export const DeclarationFormBuilder = {
  buildDeclaration: (declaration: DeclarationDTO): DeclarationFormState => {
    return {
      commencer: {
        annéeIndicateurs: declaration.déclaration.année_indicateurs,
        entrepriseDéclarante: buildEntreprise(declaration.entreprise),
      },
      "declaration-existante": {
        date: declaration.déclaration.date,
        status: "edition",
      },
      remunerations: {
        estCalculable: declaration.indicateurs?.rémunérations?.non_calculable ? "non" : "oui",
        motifNonCalculabilité: declaration.indicateurs?.rémunérations?.non_calculable,
        cse: declaration.indicateurs?.rémunérations?.date_consultation_cse ? "oui" : undefined,
        dateConsultationCSE: declaration.indicateurs?.rémunérations?.date_consultation_cse,
        déclarationCalculCSP: true, // Always true for an existing declaration.
        mode: declaration.indicateurs?.rémunérations?.mode as RemunerationsMode.Enum, // Always present for an existing declaration.
      },
      entreprise: {
        tranche: declaration.entreprise.effectif!.tranche!, // Always present for an existing declaration.
        type: declaration.entreprise.ues?.nom ? "ues" : "entreprise",
      },
      ues: {
        nom: declaration.entreprise.ues?.nom ?? "",
        entreprises:
          declaration.entreprise.ues?.entreprises?.map(entreprise => ({
            siren: entreprise.siren,
            raisonSociale: entreprise.raison_sociale,
          })) ?? [],
      },
      "periode-reference": {
        périodeSuffisante: declaration.déclaration.période_suffisante ? "oui" : "oui",
        effectifTotal: declaration.entreprise.effectif?.total ?? 0,
        finPériodeRéférence: declaration.déclaration.fin_période_référence ?? "",
      },
      // TODO: les autres indicateurs et autres informations
    };
  },

  //   toDeclaration: (formState: DeclarationFormState): DeclarationDTO => {},
};
