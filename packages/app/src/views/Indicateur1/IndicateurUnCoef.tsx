/** @jsx jsx */
import { jsx, css } from "@emotion/core";
import { useCallback, useState } from "react";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnCoefData
} from "../../globals.d";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";
import globalStyles from "../../utils/globalStyles";

import { useColumnsWidth, useLayoutType } from "../../components/GridContext";
import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm";
import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm";

type MenuOption = "groupe" | "effectif" | "remuneration";

function getDefaultMenuSelected(
  coefficientGroupFormValidated: FormState
): MenuOption {
  return coefficientGroupFormValidated === "Valid" ? "effectif" : "groupe";
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
    formValidated
  } = state.indicateurUn;

  const [menuSelected, setMenuSelected] = useState<MenuOption>(
    getDefaultMenuSelected(coefficientGroupFormValidated)
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
    <div css={styles.container}>
      <MenuCoef menuSelected={menuSelected} setMenuSelected={setMenuSelected} />
      {menuSelected === "groupe" ? (
        <IndicateurUnCoefGroupForm
          coefficient={coefficient}
          readOnly={coefficientGroupFormValidated === "Valid"}
          updateIndicateurUnCoefAddGroup={updateIndicateurUnCoefAddGroup}
          updateIndicateurUnCoefDeleteGroup={updateIndicateurUnCoefDeleteGroup}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefGroup={validateIndicateurUnCoefGroup}
          navigateToEffectif={() => setMenuSelected("effectif")}
        />
      ) : menuSelected === "effectif" ? (
        <IndicateurUnCoefEffectifForm
          coefficient={state.indicateurUn.coefficient}
          readOnly={
            state.indicateurUn.coefficientEffectifFormValidated === "Valid"
          }
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefEffectif={validateIndicateurUnCoefEffectif}
          navigateToRemuneration={() => setMenuSelected("remuneration")}
        />
      ) : (
        <div>remu</div>
      )}
    </div>
  );
}

function MenuCoef({
  menuSelected,
  setMenuSelected
}: {
  menuSelected: MenuOption;
  setMenuSelected: (menu: MenuOption) => void;
}) {
  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);
  return (
    <div css={[styles.menu, { width }]}>
      <ActionLink
        style={[
          styles.menuItem,
          menuSelected === "groupe" && styles.menuItemSelected
        ]}
        onClick={() => setMenuSelected("groupe")}
      >
        étape 1/3 : groupes
      </ActionLink>
      <ActionLink
        style={[
          styles.menuItem,
          menuSelected === "effectif" && styles.menuItemSelected
        ]}
        onClick={() => setMenuSelected("effectif")}
      >
        étape 2/3 : effectifs
      </ActionLink>
      <ActionLink
        style={[
          styles.menuItem,
          menuSelected === "remuneration" && styles.menuItemSelected
        ]}
        onClick={() => setMenuSelected("remuneration")}
      >
        étape 3/3 : rémunérations
      </ActionLink>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),

  menu: css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36
  }),
  menuItem: css({
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 152,
    borderBottom: `solid ${globalStyles.colors.default} 1px`,

    fontSize: 14,
    lineHeight: "17px",
    textDecoration: "none",
    textAlign: "left"
  }),
  menuItemSelected: css({
    color: globalStyles.colors.primary,
    borderColor: globalStyles.colors.primary
  })
};

export default IndicateurUnCoef;
