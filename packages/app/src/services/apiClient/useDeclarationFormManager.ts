import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = { formData: DeclarationFormState };

type Actions = {
  resetFormData: () => void;
  saveFormData: (data: DeclarationFormState) => void;
  savePageData: <K extends keyof DeclarationFormState>(page: K, data: DeclarationFormState[K]) => void;
  setStatus: (status: DeclarationFormState["declaration-existante"]["status"]) => void;
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
        saveFormData: (data: DeclarationFormState) => set({ formData: data }),
        savePageData: <K extends keyof DeclarationFormState>(page: K, data: DeclarationFormState[K]) =>
          set({ formData: { ...get().formData, [page]: data } }),
        resetFormData: () =>
          set({
            formData: formDataDefault,
          }),
        setStatus: (status: DeclarationFormState["declaration-existante"]["status"]) => {
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
