"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { config } from "@common/config";
import { useHasMounted } from "@components/utils/ClientOnly";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

export const AlertExistingDeclaration = () => {
  const { formData } = useDeclarationFormManager();
  const hasMounted = useHasMounted();

  if (!hasMounted) return null;

  return (
    <Alert
      severity="info"
      title="Vous êtes en train de modifier une déclaration validée et transmise."
      className={fr.cx("fr-mb-4w")}
      description={
        <>
          Vos modifications ne seront enregistrées que lorsque vous l'aurez à nouveau validée et transmise à la dernière
          étape.
          <br />
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            alignment="right"
            buttons={[
              {
                title: "Revenir au récapitulatif",
                children: "Revenir au récapitulatif",
                linkProps: {
                  href: `${config.base_declaration_url}/${formData.commencer?.siren}/${formData.commencer?.annéeIndicateurs}`,
                },
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                className: fr.cx("fr-mt-2w"),
                priority: "tertiary",
              },
            ]}
          />
        </>
      }
    />
  );
};
