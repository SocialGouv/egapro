import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";

import { CreateReferentModal, createReferentModalButtonProps } from "./CreateReferentModal";
import { ExportReferentsModal, exportReferentsModalButtonProps } from "./ExportReferentsModal";
import { ImportReferentsModal, importReferentsModalButtonProps } from "./ImportReferentsModal";

export const ActionButtons = () => {
  return (
    <>
      <CreateReferentModal />
      <ExportReferentsModal />
      <ImportReferentsModal />
      <ButtonsGroup
        buttonsEquisized
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Ajouter",
            ...createReferentModalButtonProps,
          },
          {
            children: "Exporter",
            priority: "secondary",
            ...exportReferentsModalButtonProps,
          },
          {
            children: "Importer",
            priority: "tertiary",
            ...importReferentsModalButtonProps,
          },
        ]}
      />
    </>
  );
};
