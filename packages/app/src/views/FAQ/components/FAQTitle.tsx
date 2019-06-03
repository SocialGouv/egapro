/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../../../utils/globalStyles";

function FAQTitle({ children }: { children: ReactNode }) {
  return (
    <div css={styles.container}>
      <span css={styles.title}>{children}</span>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 26
  },
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    color: globalStyles.colors.women,
    textTransform: "uppercase"
  })
};

export default FAQTitle;
