/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Link } from "react-router-dom"

import globalStyles from "../../../utils/globalStyles"

interface Props {
  section: string
  title: string
  detail: string
}

function FAQSectionRow({ section, title, detail }: Props) {
  return (
    <Link to={{ state: { faq: `/section/${section}` } }} css={styles.link}>
      <div css={styles.container}>
        <div css={styles.row}>
          <span css={styles.title}>{title}</span>
          <span css={styles.chevron}>›</span>
        </div>
        <span css={styles.detail}>{detail}</span>
      </div>
    </Link>
  )
}

const styles = {
  container: css({
    marginTop: 14,
    marginBottom: 14,
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 6,
  }),
  title: css({
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: "15px",
    color: globalStyles.colors.primary,
    textTransform: "uppercase",
  }),
  chevron: css({
    marginLeft: 14,
    lineHeight: "15px",
    color: globalStyles.colors.primary,
  }),
  detail: css({
    fontSize: 14,
    lineHeight: "17px",
  }),

  link: css({
    color: globalStyles.colors.default,
    textDecoration: "none",
  }),
}

export default FAQSectionRow
