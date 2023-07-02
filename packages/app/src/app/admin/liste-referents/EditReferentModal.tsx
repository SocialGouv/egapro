"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { ReferentModal } from "./ReferentModal";

const modal = createModal({
  id: "edit-referent",
  isOpenedByDefault: false,
});

export const editReferentModalButtonProps = modal.buttonProps;

export const EditReferentModal = () => {
  return <ReferentModal mode="edit" modal={modal} />;
};
