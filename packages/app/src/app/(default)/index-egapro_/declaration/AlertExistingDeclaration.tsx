"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { useHasMounted } from "@components/utils/ClientOnly";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { add, isAfter } from "date-fns";
import { useSelectedLayoutSegment } from "next/navigation";

import { funnelStaticConfig } from "./declarationFunnelConfiguration";

export const AlertExistingDeclaration = () => {
  const { formData } = useDeclarationFormManager();
  const hasMounted = useHasMounted();
  const segment = useSelectedLayoutSegment();

  const declarationDate = formData["declaration-existante"].date;

  if (!hasMounted || !declarationDate) return null;

  const olderThanOneYear = isAfter(new Date(), add(new Date(declarationDate), { years: 1 }));

  return (
    <Alert
      severity="info"
      title="Attention"
      className={fr.cx("fr-mb-4w")}
      description={
        <>
          {olderThanOneYear
            ? "Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé."
            : "Vous êtes en train de modifier une déclaration validée et transmise. Vos modifications ne seront enregistrées que lorsque vous l'aurez à nouveau validée et transmise à la dernière étape."}
          <br />

          {segment !== "declaration-existante" && (
            <ButtonsGroup
              inlineLayoutWhen="sm and up"
              alignment="right"
              buttons={[
                {
                  title: "Revenir au récapitulatif",
                  children: "Revenir au récapitulatif",
                  linkProps: { href: funnelStaticConfig["declaration-existante"].url },
                  iconId: "fr-icon-arrow-right-line",
                  iconPosition: "right",
                  className: fr.cx("fr-mt-2w"),
                  priority: "tertiary",
                },
              ]}
            />
          )}
        </>
      }
    />
  );
};
