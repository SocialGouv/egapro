/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../../../utils/globalStyles";

function FAQSectionRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <span css={styles.title}>{title}</span>
        <span css={styles.chevron}>›</span>
      </div>
      <span css={styles.detail}>{detail}</span>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: 14,
    marginBottom: 14
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 6
  }),
  title: css({
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: "15px",
    color: globalStyles.colors.women,
    textTransform: "uppercase"
  }),
  chevron: css({
    marginLeft: 14,
    lineHeight: "15px",
    color: globalStyles.colors.women
  }),
  detail: css({
    fontSize: 14,
    lineHeight: "17px"
  })
};

export default FAQSectionRow;
