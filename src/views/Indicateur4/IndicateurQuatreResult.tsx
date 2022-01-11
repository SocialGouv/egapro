import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import { FormState } from "../../globals"

import { displayPercent } from "../../utils/helpers"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

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
    <Box mt={24}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurEcartNombreSalarieesAugmentees !== undefined
            ? displayPercent(indicateurEcartNombreSalarieesAugmentees, 1)
            : "--"
        }
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") + "/15"}
        indicateurSexeSurRepresente="femmes"
      />

      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurQuatre("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurQuatreResult
