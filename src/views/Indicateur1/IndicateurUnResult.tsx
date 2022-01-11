import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import { FormState } from "../../globals"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

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
    <Box mt={16}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--"}
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40"}
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />

      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurUn("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurUnResult
