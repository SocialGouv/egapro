/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../../../../utils/globalStyles";

import ActionLink from "../../../../components/ActionLink";
import ButtonAction from "../../../../components/ButtonAction";
import ActionBar from "../../../../components/ActionBar";
import InfoBloc from "../../../../components/InfoBloc";

function ModalConfirmDelete({
  closeModal,
  deleteGroup
}: {
  closeModal: () => void;
  deleteGroup: () => void;
}) {
  return (
    <div css={styles.modalConfirm}>
      <InfoBloc
        title="Êtes vous sûr de vouloir supprimer ce groupe ?"
        text="toutes les données renseignées pour ce groupes seront effacées définitivement."
      />
      <ActionBar>
        <ButtonAction
          onClick={() => {
            deleteGroup();
            closeModal();
          }}
          label="supprimer"
        />
        <div css={styles.spacerActionBarModal} />
        <ActionLink onClick={closeModal}>annuler</ActionLink>
      </ActionBar>
    </div>
  );
}

const styles = {
  modalConfirm: css({
    width: 616,
    padding: 1,
    backgroundColor: "#F6F7FF",
    borderRadius: 12
  }),
  spacerActionBarModal: css({
    width: 33
  })
};

export default ModalConfirmDelete;
