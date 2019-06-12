/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Route, Link } from "react-router-dom";

import { FormState } from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { IconValid, IconInvalid } from "./Icons";
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
  valid = "None",
  to,
  activeOnlyWhenExact = false
}: CustomNavLinkProps) {
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      children={({ match }) => (
        <Link to={to} css={[styles.link, match && styles.activeLink]}>
          <div css={styles.linkInner}>
            {valid === "Valid" ? (
              <div css={styles.icon}>
                <IconValid />
              </div>
            ) : valid === "Invalid" ? (
              <div css={styles.icon}>
                <IconInvalid />
              </div>
            ) : null}
            <span>{title}</span>
          </div>
          {label && <span>{label}</span>}
        </Link>
      )}
    />
  );
}

interface Props {
  locationPathname: string;
  effectifFormValidated: FormState;
  indicateurUnFormValidated: FormState;
  indicateurDeuxFormValidated: FormState;
  indicateurTroisFormValidated: FormState;
  indicateurQuatreFormValidated: FormState;
  indicateurCinqFormValidated: FormState;
}

function Menu({
  locationPathname,
  effectifFormValidated,
  indicateurUnFormValidated,
  indicateurDeuxFormValidated,
  indicateurTroisFormValidated,
  indicateurQuatreFormValidated,
  indicateurCinqFormValidated
}: Props) {
  const width = useColumnsWidth(2);

  if (locationPathname === "/") {
    return <div css={[styles.menu, css({ width })]} />;
  }

  return (
    <div css={[styles.menu, css({ width })]}>
      <CustomNavLink to="/simulateur" title="vos informations" />
      <CustomNavLink
        to="/effectifs"
        title="effectif"
        valid={effectifFormValidated}
      />
      <CustomNavLink
        to="/indicateur1"
        title="indicateur 1"
        label="écart de rémunérations"
        valid={indicateurUnFormValidated}
      />
      <CustomNavLink
        to="/indicateur2"
        title="indicateur 2"
        label="écart de taux d'augmentations"
        valid={indicateurDeuxFormValidated}
      />
      <CustomNavLink
        to="/indicateur3"
        title="indicateur 3"
        label="écart de taux de promotions"
        valid={indicateurTroisFormValidated}
      />
      <CustomNavLink
        to="/indicateur4"
        title="indicateur 4"
        label="retour congé maternité"
        valid={indicateurQuatreFormValidated}
      />
      <CustomNavLink
        to="/indicateur5"
        title="indicateur 5"
        label="hautes rémunérations"
        valid={indicateurCinqFormValidated}
      />
      <CustomNavLink to="/recapitulatif" title="récapitulatif" />
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
      color: globalStyles.colors.primary
    }
  }),
  activeLink: css({
    color: globalStyles.colors.primary
  }),
  linkInner: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  }),
  icon: css({
    marginRight: 3
  })
};

export default Menu;
