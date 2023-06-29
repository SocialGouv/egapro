import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";

import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

type Props = {
  disabled?: boolean;
  stepName: FunnelKey;
};

export const BackNextButtons = ({ stepName, disabled }: PropsWithChildren<Props>) => {
  const router = useRouter();
  const { formData } = useDeclarationFormManager();

  return (
    <>
      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
            type: "button",
          },
          {
            children: "Suivant",
            type: "submit",
            nativeButtonProps: {
              disabled,
            },
          },
        ]}
      />
    </>
  );
};
