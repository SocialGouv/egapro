import React, { FunctionComponent } from "react"

import { FormState, SexeType } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurUnResultProps {
  indicateurEcartRemuneration?: number
  indicateurSexeSurRepresente?: SexeType
  noteIndicateurUn?: number
  validateIndicateurUn: (valid: FormState) => void
}

const IndicateurUnResult: FunctionComponent<IndicateurUnResultProps> = ({
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  noteIndicateurUn,
  validateIndicateurUn,
}) => {
  return (
    <ResultSummary
      firstLineLabel="Votre résultat final est"
      firstLineData={indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="Votre note obtenue est"
      secondLineData={(noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40"}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => validateIndicateurUn("None")}
    />
  )
}

export default IndicateurUnResult
