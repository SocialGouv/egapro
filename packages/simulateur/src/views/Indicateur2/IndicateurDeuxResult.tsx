import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurDeuxResultProps {
  indicateurEcartAugmentation: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurDeux: number | undefined
  correctionMeasure: boolean
  validateIndicateurDeux: (valid: FormState) => void
}

const IndicateurDeuxResult: FunctionComponent<IndicateurDeuxResultProps> = ({
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  correctionMeasure,
  validateIndicateurDeux,
}) => {
  return (
    <ResultSummary
      firstLineLabel="votre résultat final est"
      firstLineData={indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => validateIndicateurDeux("None")}
    />
  )
}

export default IndicateurDeuxResult
