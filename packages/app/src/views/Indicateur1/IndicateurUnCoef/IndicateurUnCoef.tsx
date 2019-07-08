/** @jsx jsx */
import { jsx, css } from "@emotion/core";
import { useCallback, useState } from "react";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnCoefData
} from "../../../globals";

import calculIndicateurUn from "../../../utils/calculsEgaProIndicateurUn";

import IndicateurUnCoefMenu, { MenuOption } from "./IndicateurUnCoefMenu";
import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm";
import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm";
import IndicateurUnCoefRemuForm from "./IndicateurUnCoefRemuForm";

function getDefaultMenuSelected(
  coefficientGroupFormValidated: FormState,
  coefficientEffectifFormValidated: FormState
): MenuOption {
  return coefficientEffectifFormValidated === "Valid"
    ? "remuneration"
    : coefficientGroupFormValidated === "Valid"
    ? "effectif"
    : "groupe";
}

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

  const validateIndicateurUnCoefEffectif = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateIndicateurUnCoefEffectif", valid }),
    [dispatch]
  );

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch]
  );

  const {
    coefficient,
    coefficientGroupFormValidated,
    coefficientEffectifFormValidated,
    formValidated
  } = state.indicateurUn;

  const [menuSelected, setMenuSelected] = useState<MenuOption>(
    getDefaultMenuSelected(
      coefficientGroupFormValidated,
      coefficientEffectifFormValidated
    )
  );

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTrancheCoef,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  const navigateToGroupe = () => setMenuSelected("groupe");
  const navigateToEffectif = () => setMenuSelected("effectif");
  const navigateToRemuneration = () => setMenuSelected("remuneration");

  return (
    <div css={styles.container}>
      <IndicateurUnCoefMenu
        menuSelected={menuSelected}
        setMenuSelected={setMenuSelected}
        coefficientGroupFormValidated={coefficientGroupFormValidated}
        coefficientEffectifFormValidated={coefficientEffectifFormValidated}
        formValidated={formValidated}
      />
      {menuSelected === "groupe" ? (
        <IndicateurUnCoefGroupForm
          coefficient={coefficient}
          readOnly={coefficientGroupFormValidated === "Valid"}
          updateIndicateurUnCoefAddGroup={updateIndicateurUnCoefAddGroup}
          updateIndicateurUnCoefDeleteGroup={updateIndicateurUnCoefDeleteGroup}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefGroup={validateIndicateurUnCoefGroup}
          navigateToEffectif={navigateToEffectif}
        />
      ) : menuSelected === "effectif" ? (
        <IndicateurUnCoefEffectifForm
          coefficient={coefficient}
          readOnly={coefficientEffectifFormValidated === "Valid"}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefEffectif={validateIndicateurUnCoefEffectif}
          coefficientGroupFormValidated={coefficientGroupFormValidated}
          navigateToGroupe={navigateToGroupe}
          navigateToRemuneration={navigateToRemuneration}
        />
      ) : (
        <IndicateurUnCoefRemuForm
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCoef}
          readOnly={formValidated === "Valid"}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUn={validateIndicateurUn}
          coefficientEffectifFormValidated={coefficientEffectifFormValidated}
          effectifsIndicateurCalculable={effectifsIndicateurCalculable}
          indicateurEcartRemuneration={indicateurEcartRemuneration}
          indicateurSexeSurRepresente={indicateurSexeSurRepresente}
          noteIndicateurUn={noteIndicateurUn}
          navigateToEffectif={navigateToEffectif}
        />
      )}
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default IndicateurUnCoef;
