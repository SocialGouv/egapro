import { config } from "@common/config";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";

export const nextPageAfterRemuneration = (formData: DeclarationFormState) => {
  if (formData.entreprise?.tranche === "50:250") {
    return `${config.base_declaration_url}/augmentations-et-promotions`;
  } else {
    return `${config.base_declaration_url}/augmentations`;
  }
};
