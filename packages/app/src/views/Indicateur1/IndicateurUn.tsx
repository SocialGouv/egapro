/** @jsx jsx */
import { jsx } from "@emotion/core";
import { ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import { AppState, ActionType } from "../../globals.d";

import Page from "../../components/Page";

import IndicateurUnTypeForm from "./IndicateurUnTypeForm";
import IndicateurUnCsp from "./IndicateurUnCsp";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch }: Props) {
  const { csp } = state.indicateurUn;
  const readOnly = state.indicateurUn.formValidated === "Valid";
  return (
    <PageIndicateurUn>
      <IndicateurUnTypeForm csp={csp} readOnly={readOnly} dispatch={dispatch} />
      <IndicateurUnCsp state={state} dispatch={dispatch} />
    </PageIndicateurUn>
  );
}

function PageIndicateurUn({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 1, écart de rémunération"
      tagline={[
        "Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par CSP et par tranche d’âge.",
        "La possibilité de répartir les salariés par niveau ou coefficient hiérarchique sera bientôt disponible sur cette page."
      ]}
    >
      {children}
    </Page>
  );
}

export default IndicateurUn;
