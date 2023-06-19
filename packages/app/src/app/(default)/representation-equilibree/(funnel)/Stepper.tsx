"use client";

import { Stepper as BaseStepper, type StepperProps as BaseStepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { useSelectedLayoutSegment } from "next/navigation";

const STEPS = [
  "commencer",
  "declarant",
  "entreprise",
  "periode-reference",
  "ecarts-cadres",
  "ecarts-membres",
  "publication",
  "validation",
];

const STEPS_TITLE = [
  "Commencer",
  "Informations déclarant",
  "Informations entreprise",
  "Période de Référence",
  "Écarts de représentation - Cadres dirigeants",
  "Écarts de représentation - Membres des instances dirigeantes",
  "Publication",
  "Validation de vos écarts",
];

export type StepperProps = BaseStepperProps;

export const Stepper = () => {
  const segment = useSelectedLayoutSegment();
  const currentStep = STEPS.findIndex(step => step === segment);

  return (
    <BaseStepper
      stepCount={STEPS.length}
      currentStep={currentStep + 1}
      title={STEPS_TITLE[currentStep]}
      nextTitle={STEPS_TITLE[currentStep + 1]}
    />
  );
};
