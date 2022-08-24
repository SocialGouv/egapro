import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurUnResultProps {
  indicateurEcartRemuneration: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurUn: number | undefined
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
      firstLineLabel="votre résultat final est"
      firstLineData={indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40"}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => validateIndicateurUn("None")}
    />
  )
}

export default IndicateurUnResult
