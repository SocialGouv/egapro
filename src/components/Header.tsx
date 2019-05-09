/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth } from "./GridContext";

function Header() {
  const width = useColumnsWidth(2);

  return (
    <header css={styles.header}>
      <div css={[styles.headerLeft, css({ width })]} />
      <div css={styles.headerInner}>
        <p css={styles.title}>Egapro</p>
        <p css={styles.subtitle}>
          L'outil de simulation en ligne de vos indicateurs
        </p>
      </div>
    </header>
  );
}

const styles = {
  header: css({
    backgroundColor: "#FFF",
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #EFECEF"
  }),
  headerLeft: css({
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth
  }),
  headerInner: css({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    alignItems: "baseline"
  }),
  title: css({
    marginRight: 24,
    fontSize: 24
  }),
  subtitle: css({
    fontSize: 12
  })
};

export default Header;
