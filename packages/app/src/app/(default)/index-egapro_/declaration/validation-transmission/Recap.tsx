"use client";

import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder } from "@services/form/declaration/DeclarationFormBuilder";

import { BackNextButtons } from "../BackNextButtons";
import { RecapDeclaration } from "../declaration-existante/RecapDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData } = useDeclarationFormManager();

  const declaration = DeclarationFormBuilder.toDeclarationDTO(formData);

  return (
    <ClientOnly fallback={<SkeletonForm fields={2} />}>
      <RecapDeclaration déclaration={declaration} />

      <BackNextButtons stepName={stepName} />
    </ClientOnly>
  );
};
