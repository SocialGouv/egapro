/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Switch, Route, Link } from "react-router-dom";

import { FormState, TrancheEffectifs } from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { useLayoutType } from "../components/GridContext";

import { IconValid, IconInvalid } from "./Icons";
import { useColumnsWidth } from "./GridContext";
import { Fragment } from "react";

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
  trancheEffectifs: TrancheEffectifs;
  informationsFormValidated: FormState;
  effectifFormValidated: FormState;
  indicateurUnFormValidated: FormState;
  indicateurDeuxFormValidated: FormState;
  indicateurTroisFormValidated: FormState;
  indicateurDeuxTroisFormValidated: FormState;
  indicateurQuatreFormValidated: FormState;
  indicateurCinqFormValidated: FormState;
}

function Menu({
  trancheEffectifs,
  informationsFormValidated,
  effectifFormValidated,
  indicateurUnFormValidated,
  indicateurDeuxFormValidated,
  indicateurDeuxTroisFormValidated,
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
              <h5 css={styles.menuTitle}>Calcul de l'index</h5>
              <CustomNavLink
                to={`/simulateur/${code}/informations`}
                title="informations simulation"
                label="et période de référence"
                valid={informationsFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/effectifs`}
                title="effectifs"
                label="pris en compte"
                valid={effectifFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur1`}
                title="indicateur"
                label="écart de rémunérations"
                valid={indicateurUnFormValidated}
              />
              {(trancheEffectifs !== "50 à 250" && (
                <Fragment>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur2`}
                    title="indicateur"
                    label="écart de taux d'augmentations"
                    valid={indicateurDeuxFormValidated}
                  />
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur3`}
                    title="indicateur"
                    label="écart de taux de promotions"
                    valid={indicateurTroisFormValidated}
                  />
                </Fragment>
              )) || (
                <CustomNavLink
                  to={`/simulateur/${code}/indicateur2et3`}
                  title="indicateur"
                  label="écart de taux d'augmentations"
                  valid={indicateurDeuxTroisFormValidated}
                />
              )}
              <CustomNavLink
                to={`/simulateur/${code}/indicateur4`}
                title="indicateur"
                label="retour congé maternité"
                valid={indicateurQuatreFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/indicateur5`}
                title="indicateur"
                label="hautes rémunérations"
                valid={indicateurCinqFormValidated}
              />
              <CustomNavLink
                to={`/simulateur/${code}/recapitulatif`}
                title="récapitulatif"
              />
              <h5 css={styles.menuTitle}>Déclaration</h5>
              <CustomNavLink
                to={`/simulateur/${code}/informations-entreprise`}
                title="informations Entreprise"
              />
              <CustomNavLink
                to={`/simulateur/${code}/informations-declarant`}
                title="informations Déclarant"
              />
              <CustomNavLink
                to={`/simulateur/${code}/informations-complementaires`}
                title="informations complémentaires"
              />
              <CustomNavLink
                to={`/simulateur/${code}/declaration`}
                title="déclaration"
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
  menuTitle: css({
    marginBottom: 0
  }),
  menuTablet: css({
    flexDirection: "row",
    alignItems: "stretch",
    height: 44,
    borderBottom: "1px solid #EFECEF",
    paddingLeft: globalStyles.grid.gutterWidth,
    backgroundColor: "white"
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
