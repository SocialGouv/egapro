import React, { FunctionComponent } from "react"

import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"

import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"

interface RecapitulatifIndicateurCinqProps {
  calculsIndicateurCinq: ReturnType<typeof calculerIndicateurCinq>
}

const RecapitulatifIndicateurCinq: FunctionComponent<RecapitulatifIndicateurCinqProps> = ({
  calculsIndicateurCinq,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const indicateurCinqFormValidated = state.indicateurCinq.formValidated

  const { indicateurSexeSousRepresente, indicateurNombreSalariesSexeSousRepresente, noteIndicateurCinq } =
    calculsIndicateurCinq

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
        firstLineLabel: "Votre résultat final est",
        firstLineData:
          indicateurNombreSalariesSexeSousRepresente !== undefined
            ? String(indicateurNombreSalariesSexeSousRepresente)
            : "--",
        firstLineInfo,
        secondLineLabel: "Votre note obtenue est",
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
