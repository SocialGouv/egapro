import React, { FunctionComponent } from "react"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { FormState } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import { isFormValid } from "../../../utils/formHelpers"
import IndicateurUnResult from "../IndicateurUnResult"
import IndicateurUnCspForm from "./IndicateurUnCspForm"
import InfoBlock from "../../../components/ds/InfoBlock"

type Props = {
  effectifsIndicateurCalculable: boolean
}

const IndicateurUnCsp: FunctionComponent<Props> = ({ effectifsIndicateurCalculable }) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const validateIndicateurUn = (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid })

  const readOnly = isFormValid(state.indicateurUn)

  const {
    effectifEtEcartRemuParTrancheCsp,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculerIndicateurUn(state)

  if (!effectifsIndicateurCalculable)
    return (
      <InfoBlock
        type="warning"
        title="Malheureusement votre indicateur n’est pas calculable"
        text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
      />
    )

  return (
    <LayoutFormAndResult
      form={
        <IndicateurUnCspForm
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCsp}
          readOnly={readOnly}
          validateIndicateurUn={validateIndicateurUn}
        />
      }
      result={
        readOnly && (
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
