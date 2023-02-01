import React, { FunctionComponent } from "react"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { FormState } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import IndicateurUnResult from "../IndicateurUnResult"
import IndicateurUnCspForm from "./IndicateurUnCspForm"

const IndicateurUnCsp: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const validateIndicateurUn = (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid })

  const {
    effectifEtEcartRemuParTrancheCsp,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculerIndicateurUn(state)

  return (
    <LayoutFormAndResult
      form={
        <IndicateurUnCspForm
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCsp}
          readOnly={state.indicateurUn.formValidated === "Valid"}
          validateIndicateurUn={validateIndicateurUn}
        />
      }
      result={
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
