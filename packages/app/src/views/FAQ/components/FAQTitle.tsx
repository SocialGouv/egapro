/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../../../utils/globalStyles";

function FAQTitle({ children }: { children: ReactNode }) {
  return <span css={styles.title}>{children}</span>;
}

const styles = {
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    color: globalStyles.colors.women,
    textTransform: "uppercase"
  })
};

export default FAQTitle;
