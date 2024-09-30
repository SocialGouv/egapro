"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup } from "@design-system";
import { AlertMessage } from "@design-system/client";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RecapDeclaration } from "../[siren]/[year]/RecapDeclaration";
import { saveDeclaration } from "../actions";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const Recap = () => {
  const { formData, setStatus } = useDeclarationFormManager();

  // TODO redirection with
  //assertOrRedirectCommencerStep(formData);

  const hasMounted = useHasMounted();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!hasMounted) {
    return <SkeletonForm fields={2} />;
  }

  const onSubmit = async () => {
    const result = await saveDeclaration(formData as CreateDeclarationDTO);

    if (result.ok) {
      setStatus("edition");
      router.push(funnelConfig(formData)[stepName].next().url);
    } else {
      console.error(result.error);

      setError(result.error);
    }
  };

  return (
    <>
      <AlertMessage title="Erreur" message={error} />

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
    </>
  );
};
