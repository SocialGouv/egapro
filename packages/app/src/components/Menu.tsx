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
            layoutType === "tablet" && styles.itemTablet,
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
            <span>
              {title}
              {label && layoutType !== "desktop" && ` ${label}`}
            </span>
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
  informationsEntrepriseFormValidated: FormState;
  informationsDeclarantFormValidated: FormState;
  declarationFormValidated: FormState;
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
  indicateurCinqFormValidated,
  informationsEntrepriseFormValidated,
  informationsDeclarantFormValidated,
  declarationFormValidated
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
            <div css={styles.menuWrapper}>
              <div
                css={[
                  styles.menu,
                  layoutType === "tablet" && styles.menuTablet
                ]}
              >
                <CustomNavLink
                  to={`/simulateur/${code}`}
                  title="vos informations"
                  activeOnlyWhenExact={true}
                />
              </div>
              <div
                css={[
                  styles.menu,
                  layoutType === "tablet" && styles.menuTablet
                ]}
              >
                <h5
                  css={[
                    styles.menuTitle,
                    layoutType === "tablet" && styles.itemTablet
                  ]}
                >
                  Calcul de l'index
                </h5>
                <CustomNavLink
                  to={`/simulateur/${code}/informations`}
                  title="informations calcul"
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
                  label="écart de rémunération"
                  valid={indicateurUnFormValidated}
                />
                {(trancheEffectifs !== "50 à 250" && (
                  <Fragment>
                    <CustomNavLink
                      to={`/simulateur/${code}/indicateur2`}
                      title="indicateur"
                      label="écart de taux d'augmentation"
                      valid={indicateurDeuxFormValidated}
                    />
                    <CustomNavLink
                      to={`/simulateur/${code}/indicateur3`}
                      title="indicateur"
                      label="écart de taux de promotion"
                      valid={indicateurTroisFormValidated}
                    />
                  </Fragment>
                )) || (
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur2et3`}
                    title="indicateur"
                    label="écart de taux d'augmentation"
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
              </div>
              <div
                css={[
                  styles.menu,
                  layoutType === "tablet" && styles.menuTablet
                ]}
              >
                <h5
                  css={[
                    styles.menuTitle,
                    layoutType === "tablet" && styles.itemTablet
                  ]}
                >
                  Déclaration
                </h5>
                <CustomNavLink
                  to={`/simulateur/${code}/informations-entreprise`}
                  title="informations entreprise/UES"
                  valid={informationsEntrepriseFormValidated}
                />
                <CustomNavLink
                  to={`/simulateur/${code}/informations-declarant`}
                  title="informations déclarant"
                  valid={informationsDeclarantFormValidated}
                />
                <CustomNavLink
                  to={`/simulateur/${code}/declaration`}
                  title="déclaration"
                  valid={declarationFormValidated}
                />
              </div>
            </div>
          )}
        />
      </Switch>
    </div>
  );
}

const styles = {
  menuWrapper: css({
    display: "flex",
    flexDirection: "column"
  }),
  menu: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }),
  menuTitle: css({
    paddingTop: 7,
    paddingBottom: 7,
    marginBottom: 0
  }),
  menuTablet: css({
    flexDirection: "row",
    alignItems: "stretch",
    paddingLeft: globalStyles.grid.gutterWidth,
    backgroundColor: "white",
    ":last-child": {
      borderBottom: "1px solid #EFECEF"
    }
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
  itemTablet: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    margin: "0 15px 0 0",
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
