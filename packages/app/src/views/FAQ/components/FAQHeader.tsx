/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function FAQHeader() {
  return (
    <div css={styles.container}>
      <span css={styles.title}>Aide</span>
    </div>
  );
}

const styles = {
  container: css({
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #EFECEF",
    marginRight: 29,
    marginLeft: 29
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 18
  })
};

export default FAQHeader;
