import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";

import { type DeclarationDTO } from "./generated";

export const buildDeclarationDTO = (formState: DeclarationFormState): DeclarationDTO => {
  // WIP: this is not complete, but it's a start.

  const dto = {
    id: "",
    source: "formulaire",
    déclaration: {
      date: "",
      publication: {},
    },
    déclarant: {},
    entreprise: {
      effectif: {},
      ues: {},
    },
    indicateurs: {
      rémunérations: {
        mode: formState.rémunérations?.mode,
        population_favorable: formState.rémunérations?.populationFavorable,
        date_consultation_cse: formState.rémunérations?.dateConsultationCSE,
        non_calculable: formState.rémunérations?.motifNonCalculabilité,
        catégories:
          formState.rémunérations?.mode === "csp"
            ? formState.rémunérationsCSP?.catégories
            : formState.rémunérationsCoefficients?.catégories,
      },
      augmentations: {},
      promotions: {},
      augmentations_et_promotions: {},
      congés_maternité: {},
      hautes_rémunérations: {},
      représentation_équilibrée: {},
    },
  } as DeclarationDTO;

  return dto;
};

// export const buildDeclarationFormState = (declaration: DeclarationDTO): DeclarationFormState => {
//   return null;
// };
