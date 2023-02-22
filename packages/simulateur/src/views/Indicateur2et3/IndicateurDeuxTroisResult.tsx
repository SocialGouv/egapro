import React, { FunctionComponent } from "react"

import { displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { Results } from "./IndicateurDeuxTrois"
import calculerIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import { isFormValid } from "../../utils/formHelpers"

interface IndicateurDeuxTroisResultProps {
  results: Results
  calculsIndicateurDeuxTrois: Pick<
    ReturnType<typeof calculerIndicateurDeuxTrois>,
    "indicateurSexeSurRepresente" | "noteIndicateurDeuxTrois" | "correctionMeasure"
  >
}

const IndicateurDeuxTroisResult: FunctionComponent<IndicateurDeuxTroisResultProps> = ({
  results,
  calculsIndicateurDeuxTrois,
}) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = isFormValid(state.indicateurDeuxTrois)

  if (!readOnly) return null

  const { indicateurSexeSurRepresente, noteIndicateurDeuxTrois, correctionMeasure } = calculsIndicateurDeuxTrois

  return (
    <ResultSummary
      firstLineLabel={results.best.label}
      firstLineData={results.best.result}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="Votre note obtenue est"
      secondLineData={(noteIndicateurDeuxTrois !== undefined ? noteIndicateurDeuxTrois : "--") + "/35"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => dispatch({ type: "validateIndicateurDeuxTrois", valid: "None" })}
    />
  )
}

export default IndicateurDeuxTroisResult
