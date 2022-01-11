import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import { FormState } from "../../globals"
import { displaySexeSurRepresente } from "../../utils/helpers"
import { Result } from "./IndicateurDeuxTrois"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

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
    <Box mt={16}>
      <ResultBubble
        firstLineLabel={bestResult.label}
        firstLineData={bestResult.result}
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurDeuxTrois !== undefined ? noteIndicateurDeuxTrois : "--") + "/35"}
        secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />

      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurDeuxTrois("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurDeuxTroisResult
