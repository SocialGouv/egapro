/** @jsx jsx */
import { jsx } from "@emotion/core";
import { ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import { AppState, ActionType } from "../../globals.d";

import Page from "../../components/Page";
import InfoBloc from "../../components/InfoBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";

import IndicateurUnTypeForm from "./IndicateurUnTypeForm";
import IndicateurUnCsp from "./IndicateurUnCsp/IndicateurUnCsp";
import IndicateurUnCoef from "./IndicateurUnCoef/IndicateurUnCoef";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch }: Props) {
  const { csp } = state.indicateurUn;
  const readOnly = state.indicateurUn.formValidated === "Valid";

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurUn>
        <InfoBloc
          title="vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
          text={
            <TextSimulatorLink
              to="/effectifs"
              label="renseigner les effectifs"
            />
          }
        />
      </PageIndicateurUn>
    );
  }

  return (
    <PageIndicateurUn>
      <IndicateurUnTypeForm csp={csp} readOnly={readOnly} dispatch={dispatch} />
      {csp ? (
        <IndicateurUnCsp state={state} dispatch={dispatch} />
      ) : (
        <IndicateurUnCoef state={state} dispatch={dispatch} />
      )}
    </PageIndicateurUn>
  );
}

function PageIndicateurUn({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 1, écart de rémunération"
      tagline={[
        "Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de branche ou d’une autre méthode de cotation des postes après consultation du CSE ) et par tranche d’âge."
      ]}
    >
      {children}
    </Page>
  );
}

export default IndicateurUn;
