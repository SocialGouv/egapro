import { fr } from "@codegouvfr/react-dsfr";
import { BackNextButtonsGroup } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";

import { funnelConfig, type FunnelKey } from "./declarationFunnelConfiguration";

type Props = {
  disabled?: boolean;
  stepName: FunnelKey;
};

export const BackNextButtons = ({ stepName, disabled }: PropsWithChildren<Props>) => {
  const router = useRouter();
  const { formData } = useDeclarationFormManager();

  return (
    <BackNextButtonsGroup
      className={fr.cx("fr-mb-3w")}
      backProps={{
        onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
      }}
      nextDisabled={disabled}
    />
  );
};
