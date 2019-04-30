/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

function Menu() {
  return (
    <div css={styles.menu}>
      <Link to="/effectifs" css={styles.link}>
        effectif
      </Link>
      <Link to="/indicateur1" css={styles.link}>
        indicateur 1
      </Link>
      <Link to="/indicateur2" css={styles.link}>
        indicateur 2
      </Link>
      <Link to="/indicateur3" css={styles.link}>
        indicateur 3
      </Link>
    </div>
  );
}

const styles = {
  menu: css({
    display: "flex",
    flexDirection: "column",
    paddingLeft: 16
  }),
  link: css({
    marginTop: 7,
    marginBottom: 7,
    color: globalStyles.colors.default,
    fontSize: 12,
    lineHeight: "15px",
    textDecoration: "none"
  })
};

export default Menu;
