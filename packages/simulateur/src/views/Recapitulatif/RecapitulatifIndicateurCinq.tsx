import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"

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
  if (indicateurCinqFormValidated === "None") {
    return <MessageWhenInvalid indicateur="indicateur5" />
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
      indicateur="indicateur5"
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
