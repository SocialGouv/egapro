/** @jsx jsx */
import { jsx, css } from "@emotion/react"
import { useCallback, useState } from "react"

import { AppState, FormState, ActionType, ActionIndicateurUnCoefData } from "../../../globals"

import { useScrollTo } from "../../../components/ScrollContext"

import IndicateurUnCoefMenu, { MenuOption } from "./IndicateurUnCoefMenu"
import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm"
import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm"
import IndicateurUnCoefRemuForm from "./IndicateurUnCoefRemuForm"

function getDefaultMenuSelected(
  coefficientGroupFormValidated: FormState,
  coefficientEffectifFormValidated: FormState,
): MenuOption {
  return coefficientEffectifFormValidated === "Valid"
    ? "remuneration"
    : coefficientGroupFormValidated === "Valid"
    ? "effectif"
    : "groupe"
}

interface Props {
  state: AppState
  dispatch: (action: ActionType) => void
}

function IndicateurUnCoef({ state, dispatch }: Props) {
  const updateIndicateurUnCoefAddGroup = useCallback(
    () => dispatch({ type: "updateIndicateurUnCoefAddGroup" }),
    [dispatch],
  )

  const updateIndicateurUnCoefDeleteGroup = useCallback(
    (index: number) => dispatch({ type: "updateIndicateurUnCoefDeleteGroup", index }),
    [dispatch],
  )

  const updateIndicateurUnCoef = useCallback(
    (data: ActionIndicateurUnCoefData) => dispatch({ type: "updateIndicateurUnCoef", data }),
    [dispatch],
  )

  const validateIndicateurUnCoefGroup = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUnCoefGroup", valid }),
    [dispatch],
  )

  const validateIndicateurUnCoefEffectif = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid }),
    [dispatch],
  )

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch],
  )

  const { coefficientGroupFormValidated, coefficientEffectifFormValidated, formValidated } = state.indicateurUn

  const [menuSelected, setMenuSelected] = useState<MenuOption>(
    getDefaultMenuSelected(coefficientGroupFormValidated, coefficientEffectifFormValidated),
  )

  const scrollTo = useScrollTo()

  const navigateTo = (menu: MenuOption) => {
    scrollTo(0)
    setMenuSelected(menu)
  }

  const navigateToGroupe = () => navigateTo("groupe")
  const navigateToEffectif = () => navigateTo("effectif")
  const navigateToRemuneration = () => navigateTo("remuneration")

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
          state={state}
          updateIndicateurUnCoefAddGroup={updateIndicateurUnCoefAddGroup}
          updateIndicateurUnCoefDeleteGroup={updateIndicateurUnCoefDeleteGroup}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefGroup={validateIndicateurUnCoefGroup}
          navigateToEffectif={navigateToEffectif}
          navigateToRemuneration={navigateToRemuneration}
        />
      ) : menuSelected === "effectif" ? (
        <IndicateurUnCoefEffectifForm
          state={state}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUnCoefEffectif={validateIndicateurUnCoefEffectif}
          navigateToGroupe={navigateToGroupe}
          navigateToRemuneration={navigateToRemuneration}
        />
      ) : (
        <IndicateurUnCoefRemuForm
          state={state}
          updateIndicateurUnCoef={updateIndicateurUnCoef}
          validateIndicateurUn={validateIndicateurUn}
          navigateToEffectif={navigateToEffectif}
        />
      )}
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
}

export default IndicateurUnCoef
