/** @jsx jsx */
import { jsx } from "@emotion/react"
import { useCallback } from "react"

import { AppState, FormState, ActionType, ActionIndicateurUnCspData } from "../../../globals"

import calculIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"

import IndicateurUnCspForm from "./IndicateurUnCspForm"
import IndicateurUnResult from "../IndicateurUnResult"

interface Props {
  state: AppState
  dispatch: (action: ActionType) => void
}

function IndicateurUnCsp({ state, dispatch }: Props) {
  const updateIndicateurUn = useCallback(
    (data: ActionIndicateurUnCspData) => dispatch({ type: "updateIndicateurUnCsp", data }),
    [dispatch],
  )

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch],
  )

  const {
    effectifEtEcartRemuParTrancheCsp,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculIndicateurUn(state)

  return (
    <LayoutFormAndResult
      childrenForm={
        <IndicateurUnCspForm
          state={state}
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
  )
}

export default IndicateurUnCsp
