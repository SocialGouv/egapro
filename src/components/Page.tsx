/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../utils/globalStyles";

interface Props {
  title: string;
  tagline: string;
  children: ReactNode;
}

function Page({ title, tagline, children }: Props) {
  return (
    <div css={styles.page}>
      <p css={styles.title}>{title}</p>
      <p css={styles.tagline}>{tagline}</p>
      {children}
    </div>
  );
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    marginRight: globalStyles.grid.gutterWidth,
    marginBottom: globalStyles.grid.gutterWidth
  }),
  title: css({
    marginTop: 36,
    fontSize: 32
  }),
  tagline: css({
    marginTop: 12,
    marginBottom: 54,
    fontSize: 14
  })
};

export default Page;
