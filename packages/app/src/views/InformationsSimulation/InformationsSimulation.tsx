/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionInformationsSimulationData
} from "../../globals";

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsSimulationForm from "./InformationsSimulationForm";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function InformationsSimulation({ state, dispatch }: Props) {
  const updateInformationsSimulation = useCallback(
    (data: ActionInformationsSimulationData) =>
      dispatch({ type: "updateInformationsSimulation", data }),
    [dispatch]
  );

  const validateInformationsSimulation = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateInformationsSimulation", valid }),
    [dispatch]
  );

  return (
    <PageInformationsSimulation>
      <LayoutFormAndResult
        childrenForm={
          <InformationsSimulationForm
            informations={state.informations}
            readOnly={state.informations.formValidated === "Valid"}
            updateInformationsSimulation={updateInformationsSimulation}
            validateInformationsSimulation={validateInformationsSimulation}
          />
        }
        childrenResult={null}
      />

      {state.informations.formValidated === "Valid" &&
        (state.effectif.formValidated === "Invalid" ||
          state.indicateurUn.formValidated === "Invalid" ||
          state.indicateurDeux.formValidated === "Invalid" ||
          state.indicateurTrois.formValidated === "Invalid" ||
          state.indicateurDeuxTrois.formValidated === "Invalid" ||
          state.indicateurQuatre.formValidated === "Invalid" ||
          state.indicateurCinq.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos informations ont été modifiées"
            icon="cross"
            text={
              <span>
                afin de s'assurer de la cohérence de votre index, merci de
                vérifier les données de vos indicateurs.
              </span>
            }
          />
        )}
    </PageInformationsSimulation>
  );
}

function PageInformationsSimulation({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Informations calcul et période de référence"
      tagline="Renseignez la tranche d'effectifs de votre entreprise ou UES, l'année au titre de laquelle les indicateurs sont calculés ainsi que la période de référence."
    >
      {children}
    </Page>
  );
}

export default InformationsSimulation;
