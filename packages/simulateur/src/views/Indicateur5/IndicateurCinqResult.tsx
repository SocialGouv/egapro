import React, { FunctionComponent } from "react"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"

const IndicateurCinqResult: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = state.indicateurCinq.formValidated === "Valid"

  if (readOnly) return null

  const { indicateurSexeSousRepresente, indicateurNombreSalariesSexeSousRepresente, noteIndicateurCinq } =
    calculerIndicateurCinq(state)

  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"
  return (
    <ResultSummary
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
      onEdit={() => dispatch({ type: "validateIndicateurCinq", valid: "None" })}
    />
  )
}

export default IndicateurCinqResult
