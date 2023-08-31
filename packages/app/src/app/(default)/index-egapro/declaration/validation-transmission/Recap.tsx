"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { AlertMessage } from "@design-system/client";
import { submitDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RecapDeclaration } from "../declaration-existante/RecapDeclaration";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData, setStatus } = useDeclarationFormManager();

  funnelConfig(formData)[stepName].validateStep?.();

  const hasMounted = useHasMounted();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!hasMounted) {
    return <SkeletonForm fields={2} />;
  }

  const declaration = DeclarationFormBuilder.toDeclarationDTO(formData);

  const onSubmit = async () => {
    try {
      await submitDeclaration(declaration);
      setStatus("edition");
      router.push(funnelConfig(formData)[stepName].next().url);
    } catch (error: unknown) {
      console.error("Error in API", error);

      setError("Une erreur est survenue, veuillez réessayer.");
    }
  };

  return (
    <>
      <AlertMessage title="Erreur" message={error} />

      <FormLayout>
        <RecapDeclaration edit déclaration={declaration} />

        <BackNextButtonsGroup
          className={fr.cx("fr-my-4w")}
          backProps={{
            onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
          }}
          nextProps={{
            onClick: onSubmit,
          }}
          nextLabel="Valider et transmettre les résultats"
        />
      </FormLayout>
    </>
  );
};
