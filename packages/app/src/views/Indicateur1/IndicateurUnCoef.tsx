/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback } from "react";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnCoefData
} from "../../globals.d";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";

import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm";

interface Props {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUnCoef({ state, dispatch }: Props) {
  const updateIndicateurUnCoefAddGroup = useCallback(
    () => dispatch({ type: "updateIndicateurUnCoefAddGroup" }),
    [dispatch]
  );

  const updateIndicateurUnCoefDeleteGroup = useCallback(
    (index: number) =>
      dispatch({ type: "updateIndicateurUnCoefDeleteGroup", index }),
    [dispatch]
  );

  const updateIndicateurUnCoef = useCallback(
    (data: ActionIndicateurUnCoefData) =>
      dispatch({ type: "updateIndicateurUnCoef", data }),
    [dispatch]
  );

  const validateIndicateurUnCoefGroup = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateIndicateurUnCoefGroup", valid }),
    [dispatch]
  );

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch]
  );

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTranche,
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
    <IndicateurUnCoefGroupForm
      coefficient={state.indicateurUn.coefficient}
      readOnly={state.indicateurUn.formValidated === "Valid"}
      updateIndicateurUnCoefAddGroup={updateIndicateurUnCoefAddGroup}
      updateIndicateurUnCoefDeleteGroup={updateIndicateurUnCoefDeleteGroup}
      updateIndicateurUnCoef={updateIndicateurUnCoef}
      validateIndicateurUnCoefGroup={validateIndicateurUnCoefGroup}
    />
  );
}

export default IndicateurUnCoef;
