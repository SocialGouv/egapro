import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurQuatreResultProps {
  indicateurEcartNombreSalarieesAugmentees: number | undefined
  noteIndicateurQuatre: number | undefined
  validateIndicateurQuatre: (valid: FormState) => void
}

const IndicateurQuatreResult: FunctionComponent<IndicateurQuatreResultProps> = ({
  indicateurEcartNombreSalarieesAugmentees,
  noteIndicateurQuatre,
  validateIndicateurQuatre,
}) => {
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
      onEdit={() => validateIndicateurQuatre("None")}
    />
  )
}

export default IndicateurQuatreResult
