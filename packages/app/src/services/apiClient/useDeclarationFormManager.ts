import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = { formData: DeclarationDTO };

type Actions = {
  resetFormData: () => void;
  saveFormData: (data: DeclarationDTO) => void;
  savePageData: <K extends keyof DeclarationDTO>(page: K, data: DeclarationDTO[K]) => void;
  setStatus: (status: DeclarationDTO["declaration-existante"]["status"]) => void;
};

const formDataDefault: State["formData"] = {
  "declaration-existante": {
    status: "creation",
  },
};

/**
 * Hook to get and handle the state of the form.
 *
 * @example
 * ```ts
 * const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
 * const commencer = useDeclarationFormManager(state => state.formData.commencer);
 * ```
 */
export const useDeclarationFormManager = create<Actions & State>()(
  persist(
    immer(
      devtools((set, get) => ({
        formData: formDataDefault,
        saveFormData: (data: DeclarationDTO) => set({ formData: data }),
        savePageData: <K extends keyof DeclarationDTO>(page: K, data: DeclarationDTO[K]) =>
          set(state => {
            state.formData[page] = data;
          }),
        resetFormData: () =>
          set({
            formData: formDataDefault,
          }),
        setStatus: (status: DeclarationDTO["declaration-existante"]["status"]) => {
          set(state => {
            state.formData["declaration-existante"].status = status;
          });
        },
      })),
    ),
    {
      name: "ega-declaration-form",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("useDeclarationFormManager", useDeclarationFormManager);
}
