/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback } from "react";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnCspData
} from "../../../globals";

import calculIndicateurUn from "../../../utils/calculsEgaProIndicateurUn";

import LayoutFormAndResult from "../../../components/LayoutFormAndResult";
import InfoBloc from "../../../components/InfoBloc";
import ActionBar from "../../../components/ActionBar";
import { ButtonSimulatorLink } from "../../../components/SimulatorLink";

import IndicateurUnCspForm from "./IndicateurUnCspForm";
import IndicateurUnResult from "../IndicateurUnResult";

interface Props {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUnCsp({ state, dispatch }: Props) {
  const updateIndicateurUn = useCallback(
    (data: ActionIndicateurUnCspData) =>
      dispatch({ type: "updateIndicateurUnCsp", data }),
    [dispatch]
  );

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch]
  );

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTrancheCsp,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
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
    );
  }

  return (
    <LayoutFormAndResult
      childrenForm={
        <IndicateurUnCspForm
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCsp}
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
  );
}

export default IndicateurUnCsp;
