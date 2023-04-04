import type { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import type { NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import type { WORKFORCES } from "@common/dict";
import type { Enum } from "@common/shared-domain/domain/valueObjects";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { EntrepriseType } from "./siren";

type MaternityNotComputableReason = NotComputableReason.Enum.ABSAUGPDTCM | NotComputableReason.Enum.ABSRCM;
type MotifNCMaterniteValue = NotComputableReason.Label[MaternityNotComputableReason];

type TrancheEffectifsLabel = (typeof WORKFORCES)[keyof typeof WORKFORCES];

type Sexe = Enum.ToString<typeof FavorablePopulation.Enum>;

export type DeclarationFormState = {
  // External or meta data.
  _externalData: {
    date?: string | undefined;
    entreprise?: EntrepriseType;
    status: "creation" | "edition";
  };
  commencer?: {
    siren: string;
    year: number;
  };
  // Only filled by the backend.
  declarant?: {
    accord_rgpd: boolean;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
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
  hautes_remunerations?: {
    resultat: number;
    sexeSurRepresente: Sexe;
  };
  informations?:
    | {
        finPeriode: string;
        nbSalaries: number;
        periodeSuffisante: true;
      }
    | {
        periodeSuffisante: false;
      };
  maternite?:
    | {
        estCalculable: false;
        motif: MotifNCMaterniteValue;
      }
    | {
        estCalculable: true;
        resultat: number;
      };
  remunerations?: {
    estCalculable: boolean;
    modalite: "coef autre" | "coef branche" | "csp";
  };
  //   endOfPeriod?: string;
  //   hasWebsite: boolean;
  //   publishingContent?: string;
  //   publishingDate?: string;
  //   publishingWebsiteUrl?: string;
};

const formDataDefault: DeclarationFormState = {
  _externalData: {
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
