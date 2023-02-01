import React, { FunctionComponent } from "react"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"

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

  const readOnly = state.indicateurTrois.formValidated === "Valid"

  if (readOnly) return null

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
