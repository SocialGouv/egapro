"use client";

import { Stepper as BaseStepper, type StepperProps as BaseStepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { useSelectedLayoutSegment } from "next/navigation";

import { TITLES } from "./titles";

const STEPS = Object.keys(TITLES);
const STEPS_TITLE = Object.values(TITLES);

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
