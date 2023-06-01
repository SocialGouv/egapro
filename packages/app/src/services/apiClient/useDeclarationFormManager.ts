import { type DeclarationFormState } from "@services/form/declaration/declarationFormBuilder";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
