"use client";

import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder } from "@services/form/declaration/DeclarationFormBuilder";

import { BackNextButtons } from "../BackNextButtons";
import { RecapDeclaration } from "../declaration-existante/RecapDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData } = useDeclarationFormManager();
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return <SkeletonForm fields={2} />;
  }

  const declaration = DeclarationFormBuilder.toDeclarationDTO(formData);

  return (
    <>
      <RecapDeclaration déclaration={declaration} />

      <BackNextButtons stepName={stepName} />
    </>
  );
};
