import React, { FunctionComponent } from "react"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"

interface IndicateurTroisResultProps {
  calculsIndicateurTrois: Pick<
    ReturnType<typeof calculIndicateurTrois>,
    "indicateurEcartPromotion" | "indicateurSexeSurRepresente" | "noteIndicateurTrois" | "correctionMeasure"
  >
}

const IndicateurTroisResult: FunctionComponent<IndicateurTroisResultProps> = ({ calculsIndicateurTrois }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const { indicateurEcartPromotion, indicateurSexeSurRepresente, noteIndicateurTrois, correctionMeasure } =
    calculsIndicateurTrois

  if (!state) return null

  return (
    <ResultSummary
      firstLineLabel="votre résultat final est"
      firstLineData={indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => dispatch({ type: "validateIndicateurTrois", valid: "None" })}
    />
  )
}

export default IndicateurTroisResult
