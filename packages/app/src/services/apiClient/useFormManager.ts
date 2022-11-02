import create from "zustand";
import { persist } from "zustand/middleware";

import type { EntrepriseType } from "./siren";
import type {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";

export type FormState = {
  declarant: {
    accord_rgpd?: boolean | undefined;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  ecartsCadresFemmes?: number;
  ecartsCadresHommes?: number;
  ecartsMembresFemmes?: number;
  ecartsMembresHommes?: number;
  endOfPeriod?: string;
  entreprise?: EntrepriseType;
  hasWebsite: boolean;
  isEcartsCadresCalculable?: boolean;
  isEcartsMembresCalculable?: boolean;
  motifEcartsCadresNonCalculable?: typeof motifNonCalculabiliteCadresOptions[number]["value"];
  motifEcartsMembresNonCalculable?: typeof motifNonCalculabiliteMembresOptions[number]["value"];
  publishingContent?: string;
  publishingDate?: string;
  publishingWebsiteUrl?: string;
  year?: number | undefined;
};

const formDataDefault: FormState = {
  declarant: {
    email: "",
    prenom: "",
    nom: "",
    telephone: "",
    accord_rgpd: undefined,
  },
  ecartsCadresFemmes: undefined,
  ecartsCadresHommes: undefined,
  ecartsMembresFemmes: undefined,
  ecartsMembresHommes: undefined,
  endOfPeriod: "",
  entreprise: {
    adresse: "",
    code_naf: "",
    code_pays: "",
    code_postal: "",
    commune: "",
    département: "",
    raison_sociale: "",
    région: "",
    siren: "",
  },
  hasWebsite: true,
  isEcartsCadresCalculable: undefined,
  isEcartsMembresCalculable: undefined,
  motifEcartsCadresNonCalculable: undefined,
  motifEcartsMembresNonCalculable: undefined,
  publishingContent: undefined,
  publishingDate: undefined,
  publishingWebsiteUrl: undefined,
  year: undefined,
};

type FormActions = {
  resetFormData: () => void;
  saveFormData: (data: Partial<FormState>) => void;
};

export const useFormManager = create<FormActions & { formData: FormState }>()(
  persist(
    (set, get) => ({
      formData: formDataDefault,
      saveFormData: (data: Partial<FormState>) => set({ formData: { ...get().formData, ...data } }),
      resetFormData: () =>
        set({
          formData: formDataDefault,
        }),
    }),
    {
      name: "ega-repeq-form", // name of item in the storage (must be unique)
    },
  ),
);
