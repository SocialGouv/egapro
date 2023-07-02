"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { ReferentModal } from "../ReferentModal";

const modal = createModal({
  id: "create-referent",
  isOpenedByDefault: false,
});

export const createReferentModalButtonProps = modal.buttonProps;

export const CreateReferentModal = () => {
  return <ReferentModal mode="create" modal={modal} />;
};
