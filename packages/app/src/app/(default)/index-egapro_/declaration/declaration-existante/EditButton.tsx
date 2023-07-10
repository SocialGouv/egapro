"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { type DeclarationDTO } from "@common/models/generated";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";

import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

export interface EditButtonProps {
  declaration: DeclarationDTO;
  stepName: FunnelKey;
}

export const EditButton = ({ declaration, stepName }: EditButtonProps) => {
  const router = useRouter();
  const { formData, resetFormData, saveFormData, setStatus } = useDeclarationFormManager();

  const declarationForm = DeclarationFormBuilder.buildDeclaration(declaration);

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
            resetFormData();
            saveFormData(declarationForm);
            setStatus("edition");
            router.push(funnelConfig(formData)[stepName].next().url);
          },
        },
      ]}
    />
  );
};
