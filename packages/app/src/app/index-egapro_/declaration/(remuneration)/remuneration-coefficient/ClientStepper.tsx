"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { ClientOnly } from "@components/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

import { nbSteps } from "../../../constants";

const titleBranche =
  "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application de la classification de branche";

const titleAutre =
  "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes";

export const ClientStepper = () => {
  const { formData } = useDeclarationFormManager();

  const title = formData.rémunérations?.mode === "niveau_branche" ? titleBranche : titleAutre;

  return (
    <ClientOnly fallback={<SkeletonForm fields={2} />}>
      <Stepper
        currentStep={5}
        nextTitle="Résultat final de l’écart de rémunération entre les femmes et les hommes"
        stepCount={nbSteps}
        title={title}
      />
    </ClientOnly>
  );
};
