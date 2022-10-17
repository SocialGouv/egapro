import create from "zustand";
import { persist } from "zustand/middleware";

import type { EntrepriseType } from "./siren";

//TODO: add properties for the future pages
type RepartitionEquilibreeForm = {
  declarant: {
    accord_rgpd?: boolean | undefined;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  endOfPeriod?: string;
  entreprise?: EntrepriseType;
  hasWebsite: boolean;
  publishingContent?: string;
  publishingDate?: string;
  publishingWebsiteUrl?: string;
  year?: number | undefined;
};

const formDataDefault: RepartitionEquilibreeForm = {
  declarant: {
    email: "",
    prenom: "",
    nom: "",
    telephone: "",
    accord_rgpd: undefined,
  },
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
  publishingContent: undefined,
  publishingDate: undefined,
  publishingWebsiteUrl: undefined,
  year: undefined,
};

type FormDataStore = {
  formData: RepartitionEquilibreeForm;
  resetFormData: () => void;
  saveFormData: (data: Partial<RepartitionEquilibreeForm>) => void;
};

export const useFormManager = create<FormDataStore>()(
  persist(
    (set, get) => ({
      formData: formDataDefault,
      saveFormData: (data: Partial<RepartitionEquilibreeForm>) => set({ formData: { ...get().formData, ...data } }),
      resetFormData: () =>
        set(
          state => ({
            formData: formDataDefault, // Reset to the form default.
            saveFormData: state.saveFormData, // Preserve these actions in state.
            resetFormData: state.resetFormData, // Preserve these actions in state.
          }),
          true, // We replace the entire state instead of only merging with current state.
        ),
    }),
    {
      name: "ega-repeq-form", // name of item in the storage (must be unique)
    },
  ),
);
