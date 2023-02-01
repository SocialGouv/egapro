import React, { FunctionComponent } from "react"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { FormState } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import { isFormValid } from "../../../utils/formHelpers"
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
          readOnly={isFormValid(state.indicateurUn)}
          validateIndicateurUn={validateIndicateurUn}
        />
      }
      result={
        isFormValid(state.indicateurUn) && (
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
