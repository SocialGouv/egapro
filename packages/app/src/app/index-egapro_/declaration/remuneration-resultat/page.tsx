"use client";

import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { ClientOnly } from "@components/ClientOnly";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

import { nbSteps } from "../../constants";
import { RemunerationCSPResultatForm } from "./RemunerationCSPResultatForm";

const title = "Résultat final de l’écart de rémunération entre les femmes et les hommes";

const RemunerationResultatPage = () => {
  const { formData } = useDeclarationFormManager();

  const nextTitle = `Écart de taux d'augmentations individuelles ${
    formData.entreprise?.tranche === "50:250" && "(hors promotion)"
  } entre les femmes et les hommes`;

  return (
    <ClientOnly>
      <Stepper currentStep={5} nextTitle={nextTitle} stepCount={nbSteps} title={title} />

      <RemunerationCSPResultatForm />
    </ClientOnly>
  );
};

export default RemunerationResultatPage;
