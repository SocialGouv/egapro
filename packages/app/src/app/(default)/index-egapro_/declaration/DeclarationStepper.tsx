"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type PropsWithChildren } from "react";

import { funnelConfig, type FunnelKey, funnelStaticConfig } from "./declarationFunnelConfiguration";

type Props = {
  stepName: FunnelKey;
};

export const DeclarationStepper = ({ stepName }: PropsWithChildren<Props>) => {
  const { formData } = useDeclarationFormManager();

  return (
    <ClientOnly fallback={<SkeletonForm fields={2} />}>
      <Stepper
        currentStep={funnelConfig(formData)[stepName].indexStep()}
        stepCount={12}
        nextTitle={funnelConfig(formData)[stepName].next().title}
        title={funnelStaticConfig[stepName].title}
      />
    </ClientOnly>
  );
};
