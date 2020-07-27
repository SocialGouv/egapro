/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../../../utils/globalStyles";

function FAQTitle3({ children }: { children: ReactNode }) {
  return (
    <div css={styles.container}>
      <span css={styles.title}>{children}</span>
    </div>
  );
}

const styles = {
  container: css({
    marginBottom: 8,
    paddingTop: 8
  }),
  title: css({
    fontSize: 14,
    lineHeight: "17px",
    color: globalStyles.colors.default
  })
};

export default FAQTitle3;
