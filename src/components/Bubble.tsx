/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { ReactNode } from "react"

import globalStyles from "../utils/globalStyles"

export interface Props {
  children: ReactNode
  style?: any
}

function Bubble({ children, style }: Props) {
  return (
    <div css={styles.container}>
      <div css={[styles.bloc, style]}>{children}</div>
    </div>
  )
}

const styles = {
  container: css({
    width: 220,
    position: "relative",
    height: 220,
  }),
  bloc: css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    padding: "26% 8%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",

    color: "white",
    backgroundColor: globalStyles.colors.default,
    borderRadius: "100%",
    "@media print": {
      backgroundColor: "white",
      color: globalStyles.colors.default,
      border: `solid ${globalStyles.colors.default} 1px`,
    },
  }),
}

export default Bubble
