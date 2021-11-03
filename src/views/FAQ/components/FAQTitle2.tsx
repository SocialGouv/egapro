/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { ReactNode } from "react"

import globalStyles from "../../../utils/globalStyles"

function FAQTitle2({ children }: { children: ReactNode }) {
  return (
    <div css={styles.container}>
      <span css={styles.title}>{children}</span>
    </div>
  )
}

const styles = {
  container: css({
    marginBottom: 12,
  }),
  title: css({
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: "15px",
    color: globalStyles.colors.primary,
    textTransform: "uppercase",
  }),
}

export default FAQTitle2
