"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

const titleBranche =
  "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application de la classification de branche";

const titleAutre =
  "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes";

export const ClientStepper = () => {
  const { formData } = useDeclarationFormManager();

  const title = formData.rémunérations?.modalité === "niveau_branche" ? titleBranche : titleAutre;

  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle="Résultat final de l’écart de rémunération entre les femmes et les hommes"
        stepCount={3}
        title={title}
      />
    </>
  );
};
