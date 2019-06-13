/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnData
} from "../../globals.d";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import {
  ButtonSimulatorLink,
  TextSimulatorLink
} from "../../components/SimulatorLink";

import IndicateurUnForm from "./IndicateurUnForm";
import IndicateurUnResult from "./IndicateurUnResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch }: Props) {
  const updateIndicateurUn = useCallback(
    (data: ActionIndicateurUnData) =>
      dispatch({ type: "updateIndicateurUn", data }),
    [dispatch]
  );

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch]
  );

  const {
    effectifsIndicateurCalculable,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

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

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurUn>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car l’ensemble des groupes valables (c’est-à-dire comptant au
              moins 3 femmes et 3 hommes), représentent moins de 40% des
              effectifs."
          />
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur2" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurUn>
    );
  }

  return (
    <PageIndicateurUn>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurUnForm
            data={state.data}
            readOnly={state.indicateurUn.formValidated === "Valid"}
            updateIndicateurUn={updateIndicateurUn}
            validateIndicateurUn={validateIndicateurUn}
          />
        }
        childrenResult={
          state.indicateurUn.formValidated === "Valid" && (
            <IndicateurUnResult
              indicateurEcartRemuneration={indicateurEcartRemuneration}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurUn={noteIndicateurUn}
              validateIndicateurUn={validateIndicateurUn}
            />
          )
        }
      />
    </PageIndicateurUn>
  );
}

function PageIndicateurUn({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 1, écart de rémunération"
      tagline="Renseignez la rémunération annuelle moyenne des femmes et
        des hommes par CSP et par tranche d’âge."
    >
      {children}
    </Page>
  );
}

export default IndicateurUn;
