"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { config } from "@common/config";

const modal = createModal({
  id: "export-referents",
  isOpenedByDefault: false,
});

export const exportReferentsModalButtonProps = modal.buttonProps;

export const ExportReferentsModal = () => {
  return (
    <modal.Component
      title="Exporter les référents"
      concealingBackdrop
      buttons={[
        {
          children: "Fermer",
        },
      ]}
    >
      <p>
        Veuillez choisir le format d'export souhaité. Les données exportées sont les mêmes que celles affichées dans le
        tableau.
      </p>
      <ButtonsGroup
        buttonsEquisized
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "XLSX",
            priority: "tertiary no outline",
            linkProps: {
              href: `${config.apiv2_url}/public/referents_egalite_professionnelle.xlsx`,
              target: "_blank",
            },
          },
          {
            children: "CSV",
            priority: "tertiary no outline",
            linkProps: {
              href: `${config.apiv2_url}/public/referents_egalite_professionnelle.csv`,
              target: "_blank",
            },
          },
          {
            children: "JSON",
            priority: "tertiary no outline",
            linkProps: {
              href: `${config.apiv2_url}/public/referents_egalite_professionnelle.json`,
              target: "_blank",
            },
          },
        ]}
      />
    </modal.Component>
  );
};
