"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { type DeclarationDTO } from "@common/models/generated";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";

import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

export interface EditButtonProps {
  declaration: DeclarationDTO;
  stepName: FunnelKey;
}

export const EditButton = ({ stepName }: EditButtonProps) => {
  const router = useRouter();
  const { formData, setStatus } = useDeclarationFormManager();

  return (
    <ButtonsGroup
      className={fr.cx("fr-mt-2w")}
      inlineLayoutWhen="sm and up"
      buttons={[
        {
          children: "Précédent",
          priority: "secondary",
          onClick() {
            router.push(funnelConfig(formData)[stepName].previous().url);
          },
        },
        {
          children: "Modifier",
          onClick() {
            setStatus("edition");
            router.push(funnelConfig(formData)[stepName].next().url);
          },
        },
      ]}
    />
  );
};
