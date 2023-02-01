import React, { FunctionComponent } from "react"

import { displayPercent } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"

interface IndicateurQuatreResultProps {
  calculsIndicateurQuatre: Pick<
    ReturnType<typeof calculerIndicateurQuatre>,
    "indicateurEcartNombreSalarieesAugmentees" | "noteIndicateurQuatre"
  >
}

const IndicateurQuatreResult: FunctionComponent<IndicateurQuatreResultProps> = ({ calculsIndicateurQuatre }) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = state.indicateurQuatre.formValidated === "Valid"

  if (readOnly) return null

  const { indicateurEcartNombreSalarieesAugmentees, noteIndicateurQuatre } = calculsIndicateurQuatre

  return (
    <ResultSummary
      firstLineLabel="votre résultat final est"
      firstLineData={
        indicateurEcartNombreSalarieesAugmentees !== undefined
          ? displayPercent(indicateurEcartNombreSalarieesAugmentees, 1)
          : "--"
      }
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") + "/15"}
      indicateurSexeSurRepresente="femmes"
      onEdit={() => dispatch({ type: "validateIndicateurQuatre", valid: "None" })}
    />
  )
}

export default IndicateurQuatreResult
