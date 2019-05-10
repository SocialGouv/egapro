/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Route, Link } from "react-router-dom";

import { FormState } from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth } from "./GridContext";

interface CustomNavLinkProps {
  title: string;
  label?: string;
  valid?: FormState;
  to: string;
  activeOnlyWhenExact?: boolean;
}

function CustomNavLink({
  title,
  label,
  valid,
  to,
  activeOnlyWhenExact = false
}: CustomNavLinkProps) {
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      children={({ match }) => (
        <Link to={to} css={[styles.link, match && styles.activeLink]}>
          <span>
            {valid &&
              `${valid === "Valid" ? "✓ " : valid === "Invalid" ? "✕ " : ""}`}
            {title}
          </span>
          <br />
          {label && <span>{label}</span>}
        </Link>
      )}
    />
  );
}

interface Props {
  formEffectifValidated: FormState;
  formIndicateurUnValidated: FormState;
}

function Menu({ formEffectifValidated, formIndicateurUnValidated }: Props) {
  const width = useColumnsWidth(2);

  return (
    <div css={[styles.menu, css({ width })]}>
      <CustomNavLink
        to="/effectifs"
        title="effectif"
        valid={formEffectifValidated}
      />
      <CustomNavLink
        to="/indicateur1"
        title="indicateur 1"
        label="écart de rémunération"
        valid={formIndicateurUnValidated}
      />
      <CustomNavLink
        to="/indicateur2"
        title="indicateur 2"
        label="écart d’augmentation"
      />
      <CustomNavLink
        to="/indicateur3"
        title="indicateur 3"
        label="écart de promotions"
      />
    </div>
  );
}

const styles = {
  menu: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth
  }),
  link: css({
    paddingTop: 7,
    paddingBottom: 7,
    color: globalStyles.colors.default,
    fontSize: 12,
    lineHeight: "15px",
    textDecoration: "none",
    ":hover": {
      color: globalStyles.colors.women
    }
  }),
  activeLink: css({
    color: globalStyles.colors.women
  })
};

export default Menu;
