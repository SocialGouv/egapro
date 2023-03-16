import type { MotifNCMaterniteValue, Sexe, Siren, TrancheEffectifsLabel } from "@common/models/declaration";
import create from "zustand";
import { persist } from "zustand/middleware";

import type { EntrepriseType } from "./siren";

export type DeclarationFormState = {
  // External or meta data.
  _externalData: {
    date?: string | undefined;
    entreprise?: EntrepriseType;
    status: "creation" | "edition";
  };
  commencer?: {
    siren: Siren;
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
        sirens: Siren[];
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
      name: "ega-declaration-form", // name of item in the storage (must be unique)
      getStorage: () => sessionStorage, // formData are removed when user is disconnected
    },
  ),
);
