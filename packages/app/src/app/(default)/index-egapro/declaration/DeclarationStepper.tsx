"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type PropsWithChildren, useEffect, useRef } from "react";

import { funnelConfig, type FunnelKey, funnelStaticConfig, nbStepsMax } from "./declarationFunnelConfiguration";

type Props = {
  stepName: FunnelKey;
};

export const DeclarationStepper = ({ stepName }: PropsWithChildren<Props>) => {
  const { formData } = useDeclarationFormManager();
  const currentStep = funnelConfig(formData)[stepName].indexStep();
  const srOnlyRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (srOnlyRef.current) {
      srOnlyRef.current.focus();
    }
  }, [formData]);

  return (
    <ClientOnly fallback={<SkeletonForm fields={2} />}>
      <Stepper
        currentStep={currentStep}
        stepCount={Math.max(nbStepsMax, currentStep)}
        nextTitle={funnelConfig(formData)[stepName].next().title}
        title={funnelStaticConfig[stepName].title}
      />
      <span ref={srOnlyRef} className="sr-only" tabIndex={-1}>
        {funnelStaticConfig[stepName].title}
      </span>
    </ClientOnly>
  );
};
