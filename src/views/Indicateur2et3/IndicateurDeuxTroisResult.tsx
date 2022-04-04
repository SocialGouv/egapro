import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

import { Result } from "./IndicateurDeuxTrois"

interface IndicateurDeuxTroisResultProps {
  bestResult: Result
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurDeuxTrois: number | undefined
  correctionMeasure: boolean
  validateIndicateurDeuxTrois: (valid: FormState) => void
}

const IndicateurDeuxTroisResult: FunctionComponent<IndicateurDeuxTroisResultProps> = ({
  bestResult,
  indicateurSexeSurRepresente,
  noteIndicateurDeuxTrois,
  correctionMeasure,
  validateIndicateurDeuxTrois,
}) => {
  return (
    <ResultSummary
      firstLineLabel={bestResult.label}
      firstLineData={bestResult.result}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurDeuxTrois !== undefined ? noteIndicateurDeuxTrois : "--") + "/35"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => validateIndicateurDeuxTrois("None")}
    />
  )
}

export default IndicateurDeuxTroisResult
