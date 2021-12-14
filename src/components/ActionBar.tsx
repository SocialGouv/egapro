/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
}

function ActionBar({ children }: Props) {
  return <div css={styles.actionBar}>{children}</div>
}

const styles = {
  actionBar: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 46,
    marginBottom: 36,
    "@media print": {
      display: "none",
    },
  }),
}

export default ActionBar
