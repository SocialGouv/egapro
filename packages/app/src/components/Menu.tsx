/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Switch, Route, Link } from "react-router-dom";

import { FormState } from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { useLayoutType } from "../components/GridContext";

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
  const layoutType = useLayoutType();
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      children={({ match }) => (
        <Link
          to={to}
          css={[
            styles.link,
            layoutType === "tablet" && styles.linkTablet,
            match && styles.activeLink
          ]}
        >
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
          {label && layoutType === "desktop" && <span>{label}</span>}
        </Link>
      )}
    />
  );
}

interface Props {
  effectifFormValidated: FormState;
  indicateurUnFormValidated: FormState;
  indicateurDeuxFormValidated: FormState;
  indicateurTroisFormValidated: FormState;
  indicateurQuatreFormValidated: FormState;
  indicateurCinqFormValidated: FormState;
}

function Menu({
  effectifFormValidated,
  indicateurUnFormValidated,
  indicateurDeuxFormValidated,
  indicateurTroisFormValidated,
  indicateurQuatreFormValidated,
  indicateurCinqFormValidated
}: Props) {
  const width = useColumnsWidth(2);
  const layoutType = useLayoutType();

  return (
    <div
      css={[
        layoutType === "desktop" &&
          css({ width, marginLeft: globalStyles.grid.gutterWidth })
      ]}
    >
      <Switch>
        <Route
          path="/simulateur/:code"
          render={({
            match: {
              params: { code }
            }
          }) => (
            <div
              css={[styles.menu, layoutType === "tablet" && styles.menuTablet]}
            >
              <CustomNavLink
                to={`/simulateur/${code}`}
                title="vos informations"
                activeOnlyWhenExact={true}
              />
              <CustomNavLink
                to={`/simulateur/${code}/effectifs`}
                title="effectif"
                valid={effectifFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur1`}
                title="indicateur 1"
                label="écart de rémunérations"
                valid={indicateurUnFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur2`}
                title="indicateur 2"
                label="écart de taux d'augmentations"
                valid={indicateurDeuxFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur3`}
                title="indicateur 3"
                label="écart de taux de promotions"
                valid={indicateurTroisFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur4`}
                title="indicateur 4"
                label="retour congé maternité"
                valid={indicateurQuatreFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur5`}
                title="indicateur 5"
                label="hautes rémunérations"
                valid={indicateurCinqFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/recapitulatif`}
                title="récapitulatif"
              />
            </div>
          )}
        />
      </Switch>
    </div>
  );
}

const styles = {
  menu: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }),
  menuTablet: css({
    flexDirection: "row",
    alignItems: "stretch",
    height: 44,
    borderBottom: "1px solid #EFECEF",
    paddingLeft: globalStyles.grid.gutterWidth
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
  linkTablet: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
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
