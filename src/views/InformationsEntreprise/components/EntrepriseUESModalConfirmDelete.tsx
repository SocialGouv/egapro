/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"

import globalStyles from "../../../utils/globalStyles"

import ActionLink from "../../../components/ActionLink"
import ButtonAction from "../../../components/ButtonAction"

import { IconWarning } from "../../../components/ds/Icons"
import { useColumnsWidth, useLayoutType } from "../../../components/GridContext"

function ModalConfirmDelete({ closeModal, sendChangeEvent }: { closeModal: () => void; sendChangeEvent: () => void }) {
  const layoutType = useLayoutType()
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7)

  return (
    <div css={[styles.modalConfirm, css({ width })]}>
      <div css={[styles.bloc]}>
        <div css={styles.blocIcon}>
          <IconWarning />
        </div>

        <div>
          <p css={styles.blocTitle}>{`Êtes-vous sûr de vouloir réduire le nombre d'entreprises composant l'UES ?`}</p>
          <p css={styles.blocText}>
            toutes les données renseignées pour ces entreprises seront effacées définitivement.
          </p>

          <div css={styles.actionBar}>
            <ButtonAction
              onClick={() => {
                sendChangeEvent()
                closeModal()
              }}
              label="confirmer et supprimer les données"
            />
            <div css={styles.spacerActionBarModal} />
            <ActionLink onClick={closeModal}>annuler</ActionLink>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  modalConfirm: css({
    width: 616,
    padding: "17px 16px 18px",
    backgroundColor: "#F6F7FF",
    borderRadius: 5,
  }),

  bloc: css({
    display: "flex",
  }),
  blocIcon: {
    marginRight: 22,
    color: globalStyles.colors.primary,
  },

  blocTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase",
    color: globalStyles.colors.primary,
  }),
  blocText: css({
    fontSize: 18,
    lineHeight: "22px",
    color: globalStyles.colors.primary,
  }),

  actionBar: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  }),

  spacerActionBarModal: css({
    width: 21,
  }),
}

export default ModalConfirmDelete
