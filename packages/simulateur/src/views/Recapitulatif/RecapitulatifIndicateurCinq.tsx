import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { Text } from "@chakra-ui/react"

interface RecapitulatifIndicateurCinqProps {
  indicateurCinqFormValidated: FormState
  indicateurSexeSousRepresente: "hommes" | "femmes" | "egalite" | undefined
  indicateurNombreSalariesSexeSousRepresente: number | undefined
  noteIndicateurCinq: number | undefined
}

const RecapitulatifIndicateurCinq: FunctionComponent<RecapitulatifIndicateurCinqProps> = ({
  indicateurCinqFormValidated,
  indicateurSexeSousRepresente,
  indicateurNombreSalariesSexeSousRepresente,
  noteIndicateurCinq,
}) => {
  if (indicateurCinqFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations."
        text={
          <>
            <Text>
              L’indicateur ne peut être calculé car vous n’avez pas validé les informations nécessaires à son calcul.
            </Text>
            <Text mt={1}>
              <TextSimulatorLink to="/indicateur5" label="Valider les informations" />
            </Text>
          </>
        }
      />
    )
  }

  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"

  return (
    <RecapBloc
      title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations."
      resultSummary={{
        firstLineLabel: "votre résultat final est",
        firstLineData:
          indicateurNombreSalariesSexeSousRepresente !== undefined
            ? String(indicateurNombreSalariesSexeSousRepresente)
            : "--",
        firstLineInfo,
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10",
        indicateurSexeSurRepresente:
          indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
            ? undefined
            : indicateurSexeSousRepresente === "hommes"
            ? "femmes"
            : "hommes",
      }}
    />
  )
}

export default RecapitulatifIndicateurCinq
