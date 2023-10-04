"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { AlertMessage } from "@design-system/client";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RecapDeclaration } from "../[siren]/[year]/RecapDeclaration";
import { saveDeclaration } from "../actions";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData, setStatus } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const hasMounted = useHasMounted();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!hasMounted) {
    return <SkeletonForm fields={2} />;
  }

  const onSubmit = async () => {
    try {
      await saveDeclaration(formData as CreateDeclarationDTO);
      setStatus("edition");
      router.push(funnelConfig(formData)[stepName].next().url);
    } catch (error: unknown) {
      console.error(error);

      setError("Une erreur est survenue, veuillez réessayer.");
    }
  };

  return (
    <>
      <AlertMessage title="Erreur" message={error} />

      <FormLayout>
        <RecapDeclaration edit déclaration={formData} />

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
