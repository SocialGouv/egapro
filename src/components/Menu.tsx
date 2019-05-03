/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";
import { Route, Link } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

interface CustomNavLinkProps {
  children: ReactNode;
  to: string;
  activeOnlyWhenExact?: boolean;
}

function CustomNavLink({
  children,
  to,
  activeOnlyWhenExact = false
}: CustomNavLinkProps) {
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      children={({ match }) => (
        <Link to={to} css={[styles.link, match && styles.activeLink]}>
          {children}
        </Link>
      )}
    />
  );
}

function Menu() {
  return (
    <div css={styles.menu}>
      <CustomNavLink to="/effectifs">effectif</CustomNavLink>
      <CustomNavLink to="/indicateur1">indicateur 1</CustomNavLink>
      <CustomNavLink to="/indicateur2">indicateur 2</CustomNavLink>
      <CustomNavLink to="/indicateur3">indicateur 3</CustomNavLink>
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
  }),
  activeLink: css({
    color: globalStyles.colors.women
  })
};

export default Menu;
