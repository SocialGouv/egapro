/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function Header() {
  return (
    <header css={styles.header}>
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
    paddingLeft: 227,
    borderBottom: "1px solid #EFECEF"
  }),
  headerInner: css({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    maxWidth: 1024,
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
