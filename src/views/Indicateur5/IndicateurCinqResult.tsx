import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import { FormState } from "../../globals"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

interface IndicateurCinqResultProps {
  indicateurSexeSousRepresente: "hommes" | "femmes" | "egalite" | undefined
  indicateurNombreSalariesSexeSousRepresente: number | undefined
  noteIndicateurCinq: number | undefined
  validateIndicateurCinq: (valid: FormState) => void
}

const IndicateurCinqResult: FunctionComponent<IndicateurCinqResultProps> = ({
  indicateurSexeSousRepresente,
  indicateurNombreSalariesSexeSousRepresente,
  noteIndicateurCinq,
  validateIndicateurCinq,
}) => {
  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"
  return (
    <Box mt={6}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurNombreSalariesSexeSousRepresente !== undefined
            ? String(indicateurNombreSalariesSexeSousRepresente)
            : "--"
        }
        firstLineInfo={firstLineInfo}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10"}
        indicateurSexeSurRepresente={
          indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
            ? undefined
            : indicateurSexeSousRepresente === "hommes"
            ? "femmes"
            : "hommes"
        }
      />

      <Box textAlign="center" mt={4}>
        <ActionLink onClick={() => validateIndicateurCinq("None")}>Modifier les données saisies</ActionLink>
      </Box>
    </Box>
  )
}

export default IndicateurCinqResult
