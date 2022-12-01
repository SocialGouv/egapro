import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";
import styles from "./Stepper.module.css";

export type StepperProps = PropsWithChildren<Omit<MarginProps, "ml" | "mr" | "mx">>;

export const Stepper = ({ children, ...rest }: StepperProps) => {
  return (
    <Box className="fr-stepper" {...rest}>
      {children}
    </Box>
  );
};

export type StepperTitleProps = PropsWithChildren<{
  currentStep: number;
  numberOfSteps: number;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const StepperTitle = ({ currentStep, numberOfSteps, children, titleAs: HtmlTag = "h1" }: StepperTitleProps) => {
  return (
    <>
      <HtmlTag className="fr-stepper__title">
        <span className="fr-stepper__state">
          Étape {currentStep} sur {numberOfSteps}
        </span>
        {children}
      </HtmlTag>
      <div
        className={clsx("fr-stepper__steps", styles.stepperSteps)}
        data-fr-current-step={currentStep}
        data-fr-steps={numberOfSteps}
      ></div>
    </>
  );
};

export const StepperDetails = ({ children }: PropsWithChildren) => {
  return (
    <p className="fr-stepper__details">
      <span className="fr-text--bold">Étape suivante&nbsp;:</span> {children}
    </p>
  );
};
