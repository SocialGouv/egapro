import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"
import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

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
    <Box mt={28}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--"}
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"}
        secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />

      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurDeux("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurDeuxResult
