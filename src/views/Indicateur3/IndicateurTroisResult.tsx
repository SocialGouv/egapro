import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

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
    <Box mt={16}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--"}
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15"}
        secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />
      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurTrois("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurTroisResult
