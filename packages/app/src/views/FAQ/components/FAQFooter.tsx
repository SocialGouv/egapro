/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import TextLink from "../../../components/TextLink";

function FAQFooter() {
  return (
    <div css={styles.container}>
      <span css={styles.text}>
        Vous n’avez pas trouvé l’aide que vous cherchiez ?<br />
        <TextLink
          to={{ state: { faq: "/contact" } }}
          label="Contactez votre référent égapro"
        />
      </span>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: "auto",
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
