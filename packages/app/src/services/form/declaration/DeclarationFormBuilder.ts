import { type NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationDTO, type PopulationFavorable } from "@common/models/generated";

import { type Entreprise } from "./entreprise";

type MaternityNotComputableReason = NotComputableReason.Enum.ABSAUGPDTCM | NotComputableReason.Enum.ABSRCM;
type MotifNCMaterniteValue = NotComputableReason.Label[MaternityNotComputableReason];
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

/**
 * The shape of the state for declaration form.
 */
export type DeclarationFormState = {
  // External or meta data. //TODO: to be move in declaration-existante maybe ?
  _metadata: {
    date?: string | undefined;
    // entreprise?: EntrepriseType;
    status: "creation" | "edition";
  };
  augmentations?: {};
  "augmentations-et-promotions"?: {};
  commencer?: {
    annéeIndicateurs: number;
    entrepriseDéclarante?: Entreprise;
  };
  "conges-maternite"?:
    | {
        estCalculable: false;
        motif: MotifNCMaterniteValue;
      }
    | {
        estCalculable: true;
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
  promotions?: {};
  publication?: {};
  remunerations?: {
    cse?: OuiNon;
    dateConsultationCSE?: string;
    déclarationCalculCSP?: boolean;
    estCalculable: OuiNon;
    // mode?: "csp" | "niveau_autre" | "niveau_branche";
    mode?: RemunerationsMode.Enum;
    motifNonCalculabilité?: "egvi40pcet";
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
  "resultat-global"?: {};
  ues?: {
    name: string;
    sirens: string[];
  };
  "validation-transmission"?: {};
};

export const DeclarationFormBuilder = {
  buildDeclaration: (declaration: DeclarationDTO): DeclarationFormState => {
    return {
      _metadata: {
        date: declaration.déclaration.date,
        status: "edition",
      },
      commencer: {
        annéeIndicateurs: declaration.déclaration.année_indicateurs,
        entrepriseDéclarante: {
          adresse: declaration.entreprise.adresse,
          codeNaf: declaration.entreprise.code_naf,
          codePays: declaration.entreprise.code_pays,
          codePostal: declaration.entreprise.code_postal,
          commune: declaration.entreprise.commune,
          département: declaration.entreprise.département,
          raisonSociale: declaration.entreprise.raison_sociale,
          région: declaration.entreprise.région,
          siren: declaration.entreprise.siren,
        },
      },
    };
  },

  //   toDeclaration: (formState: DeclarationFormState): DeclarationDTO => {},
};
