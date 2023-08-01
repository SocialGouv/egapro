"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup } from "@design-system";
import { submitDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";

import { RecapDeclaration } from "../declaration-existante/RecapDeclaration";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData } = useDeclarationFormManager();
  const hasMounted = useHasMounted();
  const router = useRouter();

  if (!hasMounted) {
    return <SkeletonForm fields={2} />;
  }

  const declaration = DeclarationFormBuilder.toDeclarationDTO(formData);

  const onSubmit = async () => {
    try {
      await submitDeclaration(declaration);
      router.push(funnelConfig(formData)[stepName].next().url);
    } catch (error: unknown) {
      console.error("Error in API");
    }
  };

  return (
    <>
      <RecapDeclaration déclaration={declaration} />

      <BackNextButtonsGroup
        className={fr.cx("fr-my-8w")}
        backProps={{
          onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
        }}
        nextProps={{
          onClick: onSubmit,
        }}
        nextLabel="Valider et transmettre les résultats"
      />
    </>
  );
};
