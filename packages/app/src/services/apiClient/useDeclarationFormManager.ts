import { type FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { type NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type WORKFORCES } from "@common/dict";
import {
  type CodeNaf,
  type CodePays,
  type DeclarationDTO,
  type Departement,
  type Region,
} from "@common/models/generated";
import { type Enum } from "@common/shared-domain/domain/valueObjects";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type EntrepriseType } from "./siren";

type MaternityNotComputableReason = NotComputableReason.Enum.ABSAUGPDTCM | NotComputableReason.Enum.ABSRCM;
type MotifNCMaterniteValue = NotComputableReason.Label[MaternityNotComputableReason];

type TrancheEffectifsLabel = (typeof WORKFORCES)[keyof typeof WORKFORCES];

type Sexe = Enum.ToString<typeof FavorablePopulation.Enum>;

export const DeclarationBuilder = {
  toFormState: (declaration: DeclarationDTO): DeclarationFormState => {
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

export type DeclarationFormState = {
  _entrepriseDéclarante?: {
    adresse?: string;
    codeNaf?: CodeNaf;
    codePays?: CodePays;
    codePostal?: string;
    commune?: string;
    département?: Departement;
    raisonSociale?: string;
    région?: Region;
    siren: string;
  };
  // External or meta data.
  _metadata: {
    date?: string | undefined;
    entreprise?: EntrepriseType;
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
    | {
        name: string;
        sirens: string[];
        tranche: TrancheEffectifsLabel;
        type: "ues";
      }
    | {
        tranche: TrancheEffectifsLabel;
        type: "entreprise";
      };
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

const formDataDefault: DeclarationFormState = {
  _metadata: {
    status: "creation",
  },
};

type FormActions = {
  resetFormData: () => void;
  saveFormData: (data: Partial<DeclarationFormState>) => void;
};

/**
 * Hook to get and handle the state of the form.
 *
 * @example
 * ```ts
 * const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
 * ```
 */
export const useDeclarationFormManager = create<FormActions & { formData: DeclarationFormState }>()(
  persist(
    (set, get) => ({
      formData: formDataDefault,
      saveFormData: (data: Partial<DeclarationFormState>) => set({ formData: { ...get().formData, ...data } }),
      resetFormData: () =>
        set({
          formData: formDataDefault,
        }),
    }),
    {
      name: "ega-declaration-form",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
