"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type PropsWithChildren } from "react";

import { funnelConfig, type FunnelKey, funnelStaticConfig, nbStepsMax } from "./declarationFunnelConfiguration";

type Props = {
  stepName: FunnelKey;
};

export const DeclarationStepper = ({ stepName }: PropsWithChildren<Props>) => {
  const { formData } = useDeclarationFormManager();
  const currentStep = funnelConfig(formData)[stepName].indexStep();

  return (
    <ClientOnly fallback={<SkeletonForm fields={2} />}>
      <Stepper
        currentStep={currentStep}
        stepCount={Math.max(nbStepsMax, currentStep)}
        nextTitle={funnelConfig(formData)[stepName].next().title}
        title={funnelStaticConfig[stepName].title}
      />
    </ClientOnly>
  );
};
