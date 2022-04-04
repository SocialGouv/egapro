import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurTroisResultProps {
  indicateurEcartPromotion: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurTrois: number | undefined
  correctionMeasure: boolean
  validateIndicateurTrois: (valid: FormState) => void
}

const IndicateurTroisResult: FunctionComponent<IndicateurTroisResultProps> = ({
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
  correctionMeasure,
  validateIndicateurTrois,
}) => {
  return (
    <ResultSummary
      firstLineLabel="votre résultat final est"
      firstLineData={indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => validateIndicateurTrois("None")}
    />
  )
}

export default IndicateurTroisResult
