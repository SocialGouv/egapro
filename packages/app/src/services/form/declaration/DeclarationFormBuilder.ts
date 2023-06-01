import { type FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { type NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type DeclarationDTO } from "@common/models/generated";
import { type Enum } from "@common/shared-domain/domain/valueObjects";

import { type Entreprise } from "./entreprise";

type MaternityNotComputableReason = NotComputableReason.Enum.ABSAUGPDTCM | NotComputableReason.Enum.ABSRCM;
type MotifNCMaterniteValue = NotComputableReason.Label[MaternityNotComputableReason];

export const TrancheOptions = [
  { label: "De 50 à 250 inclus", value: "50:250" },
  { label: "De 251 à 999 inclus", value: "251:999" },
  { label: "De 1000 ou plus", value: "1000:" },
] as const;

export type TrancheValues = (typeof TrancheOptions)[number]["value"];

type Sexe = Enum.ToString<typeof FavorablePopulation.Enum>;

/**
 * The shape of the state for declaration form.
 */
export type DeclarationFormState = {
  _entrepriseDéclarante?: Entreprise;
  // External or meta data.
  _metadata: {
    date?: string | undefined;
    // entreprise?: EntrepriseType;
    status: "creation" | "edition";
  };
  commencer?: {
    année: number;
    siren: string;
  };
  // Only filled by the backend.
  déclarant?: {
    accordRgpd: boolean;
    email: string;
    nom: string;
    prénom: string;
    téléphone: string;
  };
  entreprise?:
    | { tranche: TrancheValues } & (
        | {
            name: string;
            sirens: string[];

            type: "ues";
          }
        | {
            type: "entreprise";
          }
      );
  hautes_rémunerations?: {
    résultat: number;
    sexeSurRepresente: Sexe;
  };
  informations?:
    | {
        finPériode: string;
        nbSalariés: number;
        périodeSuffisante: true;
      }
    | {
        périodeSuffisante: false;
      };
  maternité?:
    | {
        estCalculable: false;
        motif: MotifNCMaterniteValue;
      }
    | {
        estCalculable: true;
        resultat: number;
      };
  rémunerations?: {
    estCalculable: boolean;
    modalité: "coef autre" | "coef branche" | "csp";
  };
  //   endOfPeriod?: string;
  //   hasWebsite: boolean;
  //   publishingContent?: string;
  //   publishingDate?: string;
  //   publishingWebsiteUrl?: string;
};

export const DeclarationFormBuilder = {
  buildDeclaration: (declaration: DeclarationDTO): DeclarationFormState => {
    return {
      _metadata: {
        date: declaration.déclaration.date,
        status: "edition",
      },
      _entrepriseDéclarante: {
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
      commencer: {
        siren: declaration.entreprise.siren,
        année: declaration.déclaration.année_indicateurs,
      },
    };
  },

  //   toDeclaration: (formState: DeclarationFormState): DeclarationDTO => {},
};
