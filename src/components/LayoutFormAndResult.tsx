/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { ReactNode } from "react"

import globalStyles from "../utils/globalStyles"

import { useColumnsWidth, useLayoutType } from "../components/GridContext"

interface Props {
  childrenForm: ReactNode
  childrenResult: ReactNode
}

function LayoutFormAndResult({ childrenForm, childrenResult }: Props) {
  const layoutType = useLayoutType()
  const width = useColumnsWidth(layoutType === "desktop" ? 4 : 5)
  return (
    <div css={styles.body}>
      <div css={css({ width })}>{childrenForm}</div>
      <div css={styles.result}>{childrenResult}</div>
    </div>
  )
}

const styles = {
  body: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  }),
  result: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    marginLeft: globalStyles.grid.gutterWidth,
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
  }),
}

export default LayoutFormAndResult
