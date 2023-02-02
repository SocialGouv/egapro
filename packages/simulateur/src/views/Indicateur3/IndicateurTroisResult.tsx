import React, { FunctionComponent } from "react"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import { isFormValid } from "../../utils/formHelpers"

interface IndicateurTroisResultProps {
  calculsIndicateurTrois: Pick<
    ReturnType<typeof calculerIndicateurTrois>,
    "indicateurEcartPromotion" | "indicateurSexeSurRepresente" | "noteIndicateurTrois" | "correctionMeasure"
  >
}

const IndicateurTroisResult: FunctionComponent<IndicateurTroisResultProps> = ({ calculsIndicateurTrois }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const { indicateurEcartPromotion, indicateurSexeSurRepresente, noteIndicateurTrois, correctionMeasure } =
    calculsIndicateurTrois

  if (!state) return null

  const readOnly = isFormValid(state.indicateurTrois)

  if (readOnly) return null

  return (
    <ResultSummary
      firstLineLabel="Votre résultat final est"
      firstLineData={indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="Votre note obtenue est"
      secondLineData={(noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => dispatch({ type: "validateIndicateurTrois", valid: "None" })}
    />
  )
}

export default IndicateurTroisResult
