/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../utils/globalStyles";

interface Props {
  title: string;
  tagline?: string | Array<string>;
  children: ReactNode;
}

function Page({ title, tagline, children }: Props) {
  return (
    <div css={styles.page}>
      <h1 css={styles.title}>{title}</h1>
      {tagline && Array.isArray(tagline) ? (
        tagline.map((tl, index) => (
          <p css={styles.tagline} key={index}>
            {tl}
          </p>
        ))
      ) : (
        <p css={styles.tagline}>{tagline}</p>
      )}
      <div css={styles.spacer} />
      {children}
    </div>
  );
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    marginRight: globalStyles.grid.gutterWidth,
    marginLeft: globalStyles.grid.gutterWidth,
    marginBottom: globalStyles.grid.gutterWidth,
    "@media print": {
      display: "block",
      marginRight: 0
    }
  }),
  title: css({
    marginTop: 36,
    fontSize: 32,
    lineHeight: "39px",
    fontWeight: "normal",
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0
  }),
  tagline: css({
    marginTop: 12,
    fontSize: 14,
    lineHeight: "17px"
  }),
  spacer: css({
    height: 54
  })
};

export default Page;
