/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function FAQFooter() {
  return (
    <div css={styles.container}>
      <span css={styles.text}>
        Vous n’avez pas trouveé l’aide que vous cherchiez ?<br />
        Contactez les Direcctes
      </span>
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
    borderTop: "1px solid #EFECEF"
  }),
  text: css({
    fontSize: 12,
    lineHeight: "15px"
  })
};

export default FAQFooter;
