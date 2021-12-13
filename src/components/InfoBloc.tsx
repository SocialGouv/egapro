/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { useState, ReactNode } from "react"

import globalStyles from "../utils/globalStyles"

import { IconWarning, IconCircleCross } from "./ds/Icons"
import { useColumnsWidth, useLayoutType } from "./GridContext"

interface Props {
  title: string
  text?: ReactNode
  icon?: "warning" | "cross" | null
  additionalCss?: any
  closeButton?: boolean
}

function InfoBloc({ title, text, icon = "warning", additionalCss, closeButton = false }: Props) {
  const layoutType = useLayoutType()
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7)
  const [isBlocVisible, setIsBlocVisible] = useState(true)
  const discardBloc = () => setIsBlocVisible(false)

  if (isBlocVisible) {
    return (
      <div css={[styles.bloc, css({ width }), additionalCss]}>
        {icon === null ? null : (
          <div css={styles.blocIcon}>
            {icon === "cross" ? <IconCircleCross boxSize="10" /> : <IconWarning boxSize="10" />}
          </div>
        )}
        <div css={styles.textWrapper}>
          <p css={styles.blocTitle}>{title}</p>
          {text && <p css={styles.blocText}>{text}</p>}
        </div>
        {closeButton && (
          <button css={styles.buttonClose} onClick={discardBloc}>
            x
          </button>
        )}
      </div>
    )
  }
  return null
}

const styles = {
  bloc: css({
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    border: `2px solid ${globalStyles.colors.primary}`,
    borderRadius: 5,
    position: "relative",
  }),
  blocTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    color: globalStyles.colors.primary,
  }),
  blocIcon: {
    marginRight: 22,
    color: globalStyles.colors.primary,
  },
  textWrapper: {
    flexGrow: 1,
  },
  blocText: css({
    marginTop: 4,
    fontSize: 14,
    lineHeight: "17px",
    color: globalStyles.colors.primary,
  }),
  buttonClose: css({
    backgroundColor: "inherit",
    border: 0,
    color: globalStyles.colors.primary,
    cursor: "pointer",
    padding: 10,
  }),
}

export default InfoBloc
